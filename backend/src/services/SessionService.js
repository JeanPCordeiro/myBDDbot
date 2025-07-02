const { Session, Participant, Message, Scenario } = require('../models');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/config');

class SessionService {
  async createSession(sessionData, creatorInfo) {
    try {
      // Valider les données d'entrée
      this.validateSessionData(sessionData);

      // Créer la session
      const session = await Session.create({
        title: sessionData.title,
        description: sessionData.description,
        business_context: sessionData.business_context || 'generic',
        creator_id: creatorInfo.userId,
        estimated_duration: sessionData.estimated_duration,
        settings: {
          ...sessionData.settings,
          bot_style: sessionData.settings?.bot_style || 'professional',
          detail_level: sessionData.settings?.detail_level || 'intermediate',
          language: sessionData.settings?.language || 'fr',
          auto_save_interval: sessionData.settings?.auto_save_interval || 30
        }
      });

      // Ajouter le créateur comme participant avec des permissions de modérateur
      await this.addParticipant(session.id, {
        user_id: creatorInfo.userId,
        name: creatorInfo.name,
        email: creatorInfo.email,
        role: creatorInfo.role || 'business_analyst'
      }, {
        can_edit_scenarios: true,
        can_invite_others: true,
        can_moderate: true,
        can_export: true
      });

      // Ajouter les autres participants invités
      if (sessionData.participants && sessionData.participants.length > 0) {
        for (const participant of sessionData.participants) {
          await this.addParticipant(session.id, participant);
        }
      }

      // Créer le message de bienvenue du bot
      await this.createWelcomeMessage(session.id);

      return await this.getSessionDetails(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  async getSessionDetails(sessionId) {
    try {
      const session = await Session.findByPk(sessionId, {
        include: [
          {
            model: Participant,
            as: 'participants',
            attributes: ['id', 'user_id', 'name', 'email', 'role', 'status', 'joined_at', 'last_activity']
          },
          {
            model: Message,
            as: 'messages',
            limit: 50,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'sender_type', 'message_type', 'content', 'created_at', 'metadata']
          },
          {
            model: Scenario,
            as: 'scenarios',
            attributes: ['id', 'title', 'status', 'category', 'priority', 'created_at']
          }
        ]
      });

      if (!session) {
        throw new Error('Session not found');
      }

      return {
        ...session.toJSON(),
        messages: session.messages.reverse(), // Remettre dans l'ordre chronologique
        stats: await this.getSessionStats(sessionId)
      };
    } catch (error) {
      console.error('Error getting session details:', error);
      throw new Error(`Failed to get session details: ${error.message}`);
    }
  }

  async addParticipant(sessionId, participantData, permissions = null) {
    try {
      // Vérifier que la session existe et peut accueillir de nouveaux participants
      const session = await Session.findByPk(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.canJoin()) {
        throw new Error('Session is not accepting new participants');
      }

      // Vérifier le nombre maximum de participants
      const currentParticipants = await Participant.countActiveBySession(sessionId);
      if (currentParticipants >= config.limits.sessionMaxParticipants) {
        throw new Error('Session has reached maximum number of participants');
      }

      // Vérifier si l'utilisateur n'est pas déjà participant
      const existingParticipant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: participantData.user_id
        }
      });

      if (existingParticipant) {
        throw new Error('User is already a participant in this session');
      }

      // Créer le participant
      const participant = await Participant.create({
        session_id: sessionId,
        user_id: participantData.user_id,
        name: participantData.name,
        email: participantData.email,
        role: participantData.role || 'observer',
        permissions: permissions || {
          can_edit_scenarios: true,
          can_invite_others: false,
          can_moderate: false,
          can_export: true
        }
      });

      return participant;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw new Error(`Failed to add participant: ${error.message}`);
    }
  }

  async joinSession(sessionId, userId, connectionInfo = {}) {
    try {
      const participant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: userId
        }
      });

      if (!participant) {
        throw new Error('User is not invited to this session');
      }

      // Marquer le participant comme ayant rejoint
      await participant.join(
        connectionInfo.socketId,
        connectionInfo.ipAddress,
        connectionInfo.userAgent
      );

      // Démarrer la session si c'est le premier participant à rejoindre
      const session = await Session.findByPk(sessionId);
      if (session.status === 'waiting') {
        await session.start();
      }

      return await this.getSessionDetails(sessionId);
    } catch (error) {
      console.error('Error joining session:', error);
      throw new Error(`Failed to join session: ${error.message}`);
    }
  }

  async leaveSession(sessionId, userId) {
    try {
      const participant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: userId
        }
      });

      if (participant) {
        await participant.leave();
      }

      // Vérifier s'il reste des participants actifs
      const activeParticipants = await Participant.countActiveBySession(sessionId);
      if (activeParticipants === 0) {
        const session = await Session.findByPk(sessionId);
        await session.pause();
      }

      return { success: true };
    } catch (error) {
      console.error('Error leaving session:', error);
      throw new Error(`Failed to leave session: ${error.message}`);
    }
  }

  async updateParticipantActivity(sessionId, userId) {
    try {
      const participant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: userId
        }
      });

      if (participant) {
        await participant.updateActivity();
      }
    } catch (error) {
      console.error('Error updating participant activity:', error);
    }
  }

  async getUserSessions(userId, status = null) {
    try {
      const whereClause = {
        user_id: userId
      };

      const sessions = await Session.findAll({
        include: [
          {
            model: Participant,
            as: 'participants',
            where: whereClause,
            attributes: ['role', 'status', 'joined_at']
          }
        ],
        where: status ? { status } : {},
        order: [['updated_at', 'DESC']],
        attributes: ['id', 'title', 'description', 'status', 'created_at', 'updated_at']
      });

      return sessions.map(session => ({
        ...session.toJSON(),
        user_role: session.participants[0]?.role,
        user_status: session.participants[0]?.status
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  async completeSession(sessionId, userId) {
    try {
      const session = await Session.findByPk(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Vérifier que l'utilisateur a les permissions pour terminer la session
      const participant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: userId
        }
      });

      if (!participant || !participant.canModerate()) {
        throw new Error('Insufficient permissions to complete session');
      }

      await session.complete();
      return await this.getSessionDetails(sessionId);
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error(`Failed to complete session: ${error.message}`);
    }
  }

  async archiveSession(sessionId, userId) {
    try {
      const session = await Session.findByPk(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Vérifier les permissions
      const participant = await Participant.findOne({
        where: {
          session_id: sessionId,
          user_id: userId
        }
      });

      if (!participant || !participant.canModerate()) {
        throw new Error('Insufficient permissions to archive session');
      }

      await session.archive();
      return { success: true };
    } catch (error) {
      console.error('Error archiving session:', error);
      throw new Error(`Failed to archive session: ${error.message}`);
    }
  }

  async getSessionStats(sessionId) {
    try {
      const [messageStats, scenarioStats, participantCount] = await Promise.all([
        Message.getSessionStats(sessionId),
        Scenario.getSessionStats(sessionId),
        Participant.countActiveBySession(sessionId)
      ]);

      return {
        participants: participantCount,
        messages: messageStats,
        scenarios: scenarioStats
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        participants: 0,
        messages: [],
        scenarios: []
      };
    }
  }

  async searchSessions(query, userId) {
    try {
      const sessions = await Session.findAll({
        include: [
          {
            model: Participant,
            as: 'participants',
            where: { user_id: userId },
            attributes: ['role', 'status']
          }
        ],
        where: {
          [Session.sequelize.Op.or]: [
            { title: { [Session.sequelize.Op.like]: `%${query}%` } },
            { description: { [Session.sequelize.Op.like]: `%${query}%` } }
          ]
        },
        order: [['updated_at', 'DESC']],
        limit: 20
      });

      return sessions.map(session => ({
        ...session.toJSON(),
        user_role: session.participants[0]?.role
      }));
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw new Error(`Failed to search sessions: ${error.message}`);
    }
  }

  async createWelcomeMessage(sessionId) {
    try {
      const welcomeMessage = `Bonjour ! Je suis votre assistant testeur pour cette session BDD. 

Je suis là pour vous aider à :
• Clarifier vos exigences avec des questions pertinentes
• Générer des scénarios de test Gherkin complets
• Valider la qualité et la complétude de vos critères d'acceptation
• Faciliter la collaboration entre tous les participants

N'hésitez pas à me décrire la fonctionnalité que vous souhaitez spécifier, et je vous guiderai dans le processus !`;

      await Message.create({
        session_id: sessionId,
        sender_id: null,
        sender_type: 'bot',
        message_type: 'system',
        content: welcomeMessage
      });
    } catch (error) {
      console.error('Error creating welcome message:', error);
    }
  }

  validateSessionData(sessionData) {
    if (!sessionData.title || sessionData.title.trim().length === 0) {
      throw new Error('Session title is required');
    }

    if (sessionData.title.length > 100) {
      throw new Error('Session title must be 100 characters or less');
    }

    if (!sessionData.description || sessionData.description.trim().length === 0) {
      throw new Error('Session description is required');
    }

    if (sessionData.description.length > 1000) {
      throw new Error('Session description must be 1000 characters or less');
    }

    if (sessionData.estimated_duration && (sessionData.estimated_duration < 15 || sessionData.estimated_duration > 480)) {
      throw new Error('Estimated duration must be between 15 and 480 minutes');
    }
  }

  async cleanupInactiveSessions() {
    try {
      const timeoutHours = config.limits.sessionTimeoutHours;
      const cutoffDate = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

      const inactiveSessions = await Session.findAll({
        where: {
          status: ['waiting', 'active'],
          updated_at: {
            [Session.sequelize.Op.lt]: cutoffDate
          }
        }
      });

      for (const session of inactiveSessions) {
        await session.pause();
        console.log(`Session ${session.id} paused due to inactivity`);
      }

      return inactiveSessions.length;
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
      return 0;
    }
  }
}

module.exports = new SessionService();

