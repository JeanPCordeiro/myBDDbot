const SessionService = require('./SessionService');
const BotEngine = require('./BotEngine');
const { Message } = require('../models');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // socketId -> { userId, sessionId, userInfo }
    this.sessionRooms = new Map(); // sessionId -> Set of socketIds
    this.typingUsers = new Map(); // sessionId -> Set of userIds
  }

  initialize(io) {
    this.io = io;
    console.log('✅ Socket service initialized');
  }

  async handleJoinSession(socket, data) {
    try {
      const { sessionId, userId, userInfo } = data;

      if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required');
      }

      // Rejoindre la session via le service
      const sessionDetails = await SessionService.joinSession(sessionId, userId, {
        socketId: socket.id,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

      // Ajouter le socket à la room de la session
      socket.join(`session_${sessionId}`);

      // Enregistrer la connexion
      this.connectedUsers.set(socket.id, {
        userId,
        sessionId,
        userInfo: userInfo || { name: 'Unknown User' }
      });

      // Ajouter à la liste des utilisateurs de la session
      if (!this.sessionRooms.has(sessionId)) {
        this.sessionRooms.set(sessionId, new Set());
      }
      this.sessionRooms.get(sessionId).add(socket.id);

      // Notifier les autres participants
      socket.to(`session_${sessionId}`).emit('user_joined', {
        userId,
        userInfo,
        timestamp: new Date().toISOString()
      });

      // Envoyer les détails de la session au client
      socket.emit('session_joined', {
        session: sessionDetails,
        connectedUsers: this.getSessionUsers(sessionId)
      });

      // Mettre à jour l'activité du participant
      await SessionService.updateParticipantActivity(sessionId, userId);

      console.log(`User ${userId} joined session ${sessionId}`);
    } catch (error) {
      console.error('Error handling join session:', error);
      socket.emit('join_session_error', { message: error.message });
    }
  }

  async handleLeaveSession(socket, data) {
    try {
      const { sessionId, userId } = data;
      const connectionInfo = this.connectedUsers.get(socket.id);

      if (connectionInfo) {
        // Quitter la session via le service
        await SessionService.leaveSession(sessionId || connectionInfo.sessionId, userId || connectionInfo.userId);

        // Retirer de la room
        socket.leave(`session_${connectionInfo.sessionId}`);

        // Notifier les autres participants
        socket.to(`session_${connectionInfo.sessionId}`).emit('user_left', {
          userId: connectionInfo.userId,
          userInfo: connectionInfo.userInfo,
          timestamp: new Date().toISOString()
        });

        // Nettoyer les données de connexion
        this.cleanupConnection(socket.id);

        console.log(`User ${connectionInfo.userId} left session ${connectionInfo.sessionId}`);
      }
    } catch (error) {
      console.error('Error handling leave session:', error);
      socket.emit('leave_session_error', { message: error.message });
    }
  }

  async handleMessage(socket, data) {
    try {
      const { message, messageType = 'text' } = data;
      const connectionInfo = this.connectedUsers.get(socket.id);

      if (!connectionInfo) {
        throw new Error('User not connected to any session');
      }

      const { userId, sessionId, userInfo } = connectionInfo;

      // Sauvegarder le message utilisateur
      const userMessage = await Message.create({
        session_id: sessionId,
        sender_id: userId,
        sender_type: 'user',
        message_type: messageType,
        content: message
      });

      // Diffuser le message aux autres participants
      socket.to(`session_${sessionId}`).emit('new_message', {
        id: userMessage.id,
        sender: {
          id: userId,
          type: 'user',
          name: userInfo.name
        },
        content: message,
        type: messageType,
        timestamp: userMessage.created_at
      });

      // Traiter le message avec le bot si c'est un message texte
      if (messageType === 'text') {
        this.handleBotResponse(sessionId, message, { userId, userInfo });
      }

      // Mettre à jour l'activité du participant
      await SessionService.updateParticipantActivity(sessionId, userId);

    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message_error', { message: error.message });
    }
  }

  async handleBotResponse(sessionId, userMessage, context) {
    try {
      // Indiquer que le bot est en train de taper
      this.io.to(`session_${sessionId}`).emit('bot_typing', { typing: true });

      // Générer la réponse du bot
      const botResponse = await BotEngine.processMessage(sessionId, userMessage, context);

      // Arrêter l'indicateur de frappe
      this.io.to(`session_${sessionId}`).emit('bot_typing', { typing: false });

      // Diffuser la réponse du bot
      this.io.to(`session_${sessionId}`).emit('new_message', {
        sender: {
          id: 'bot',
          type: 'bot',
          name: 'Assistant Testeur'
        },
        content: botResponse.content,
        type: botResponse.type,
        metadata: botResponse.metadata,
        timestamp: new Date().toISOString()
      });

      // Si des scénarios ont été générés, les diffuser séparément
      if (botResponse.scenarios && botResponse.scenarios.length > 0) {
        this.io.to(`session_${sessionId}`).emit('scenarios_generated', {
          scenarios: botResponse.scenarios.map(scenario => ({
            id: scenario.id,
            title: scenario.title,
            content: scenario.gherkin_content,
            status: scenario.status,
            category: scenario.category
          }))
        });
      }

    } catch (error) {
      console.error('Error handling bot response:', error);
      
      // Arrêter l'indicateur de frappe en cas d'erreur
      this.io.to(`session_${sessionId}`).emit('bot_typing', { typing: false });
      
      // Envoyer un message d'erreur
      this.io.to(`session_${sessionId}`).emit('new_message', {
        sender: {
          id: 'bot',
          type: 'bot',
          name: 'Assistant Testeur'
        },
        content: 'Désolé, je rencontre des difficultés techniques. Pouvez-vous reformuler votre question ?',
        type: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleTypingStart(socket, data) {
    const connectionInfo = this.connectedUsers.get(socket.id);
    if (!connectionInfo) return;

    const { sessionId, userId, userInfo } = connectionInfo;

    // Ajouter l'utilisateur à la liste des utilisateurs en train de taper
    if (!this.typingUsers.has(sessionId)) {
      this.typingUsers.set(sessionId, new Set());
    }
    this.typingUsers.get(sessionId).add(userId);

    // Notifier les autres participants
    socket.to(`session_${sessionId}`).emit('user_typing', {
      userId,
      userInfo,
      typing: true
    });
  }

  handleTypingStop(socket, data) {
    const connectionInfo = this.connectedUsers.get(socket.id);
    if (!connectionInfo) return;

    const { sessionId, userId, userInfo } = connectionInfo;

    // Retirer l'utilisateur de la liste des utilisateurs en train de taper
    if (this.typingUsers.has(sessionId)) {
      this.typingUsers.get(sessionId).delete(userId);
    }

    // Notifier les autres participants
    socket.to(`session_${sessionId}`).emit('user_typing', {
      userId,
      userInfo,
      typing: false
    });
  }

  handleDisconnect(socket) {
    const connectionInfo = this.connectedUsers.get(socket.id);
    
    if (connectionInfo) {
      const { sessionId, userId, userInfo } = connectionInfo;

      // Notifier les autres participants de la déconnexion
      socket.to(`session_${sessionId}`).emit('user_disconnected', {
        userId,
        userInfo,
        timestamp: new Date().toISOString()
      });

      // Nettoyer les données de connexion
      this.cleanupConnection(socket.id);

      // Marquer le participant comme inactif après un délai
      setTimeout(async () => {
        try {
          await SessionService.leaveSession(sessionId, userId);
        } catch (error) {
          console.error('Error updating participant status on disconnect:', error);
        }
      }, 30000); // 30 secondes de délai

      console.log(`User ${userId} disconnected from session ${sessionId}`);
    }
  }

  cleanupConnection(socketId) {
    const connectionInfo = this.connectedUsers.get(socketId);
    
    if (connectionInfo) {
      const { sessionId, userId } = connectionInfo;

      // Retirer de la room de session
      if (this.sessionRooms.has(sessionId)) {
        this.sessionRooms.get(sessionId).delete(socketId);
        
        // Supprimer la room si elle est vide
        if (this.sessionRooms.get(sessionId).size === 0) {
          this.sessionRooms.delete(sessionId);
        }
      }

      // Retirer de la liste des utilisateurs en train de taper
      if (this.typingUsers.has(sessionId)) {
        this.typingUsers.get(sessionId).delete(userId);
      }

      // Retirer de la liste des utilisateurs connectés
      this.connectedUsers.delete(socketId);
    }
  }

  getSessionUsers(sessionId) {
    const sessionSockets = this.sessionRooms.get(sessionId) || new Set();
    const users = [];

    for (const socketId of sessionSockets) {
      const connectionInfo = this.connectedUsers.get(socketId);
      if (connectionInfo) {
        users.push({
          userId: connectionInfo.userId,
          userInfo: connectionInfo.userInfo,
          socketId
        });
      }
    }

    return users;
  }

  broadcastToSession(sessionId, event, data) {
    this.io.to(`session_${sessionId}`).emit(event, data);
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getActiveSessionsCount() {
    return this.sessionRooms.size;
  }

  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeSessions: this.sessionRooms.size,
      totalRooms: this.io.sockets.adapter.rooms.size
    };
  }
}

module.exports = new SocketService();

