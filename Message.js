const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: true // null pour les messages du bot
  },
  sender_type: {
    type: DataTypes.ENUM('user', 'bot'),
    allowNull: false,
    defaultValue: 'user'
  },
  message_type: {
    type: DataTypes.ENUM('text', 'scenario', 'question', 'system', 'file'),
    allowNull: false,
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  formatted_content: {
    type: DataTypes.TEXT, // HTML ou Markdown formaté
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {
      openai_model: null,
      tokens_used: null,
      processing_time: null,
      confidence_score: null,
      references: []
    }
  },
  reply_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  thread_id: {
    type: DataTypes.UUID,
    allowNull: true // Pour grouper les messages liés
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'edited', 'deleted'),
    defaultValue: 'sent',
    allowNull: false
  },
  reactions: {
    type: DataTypes.JSON,
    defaultValue: {} // { emoji: [user_ids] }
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['message_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['thread_id']
    }
  ]
});

// Méthodes d'instance
Message.prototype.isFromBot = function() {
  return this.sender_type === 'bot';
};

Message.prototype.isFromUser = function() {
  return this.sender_type === 'user';
};

Message.prototype.isScenario = function() {
  return this.message_type === 'scenario';
};

Message.prototype.isQuestion = function() {
  return this.message_type === 'question';
};

Message.prototype.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

Message.prototype.edit = function(newContent) {
  this.content = newContent;
  this.status = 'edited';
  this.edited_at = new Date();
  return this.save();
};

Message.prototype.addReaction = function(emoji, userId) {
  if (!this.reactions[emoji]) {
    this.reactions[emoji] = [];
  }
  if (!this.reactions[emoji].includes(userId)) {
    this.reactions[emoji].push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

Message.prototype.removeReaction = function(emoji, userId) {
  if (this.reactions[emoji]) {
    this.reactions[emoji] = this.reactions[emoji].filter(id => id !== userId);
    if (this.reactions[emoji].length === 0) {
      delete this.reactions[emoji];
    }
    return this.save();
  }
  return Promise.resolve(this);
};

// Méthodes de classe
Message.findBySession = function(sessionId, limit = 50, offset = 0) {
  return this.findAll({
    where: { session_id: sessionId },
    order: [['created_at', 'ASC']],
    limit,
    offset
  });
};

Message.findBotMessages = function(sessionId) {
  return this.findAll({
    where: {
      session_id: sessionId,
      sender_type: 'bot'
    },
    order: [['created_at', 'ASC']]
  });
};

Message.findScenarios = function(sessionId) {
  return this.findAll({
    where: {
      session_id: sessionId,
      message_type: 'scenario'
    },
    order: [['created_at', 'ASC']]
  });
};

Message.findByThread = function(threadId) {
  return this.findAll({
    where: { thread_id: threadId },
    order: [['created_at', 'ASC']]
  });
};

Message.searchInSession = function(sessionId, searchTerm) {
  return this.findAll({
    where: {
      session_id: sessionId,
      content: {
        [sequelize.Op.like]: `%${searchTerm}%`
      }
    },
    order: [['created_at', 'DESC']]
  });
};

Message.getSessionStats = function(sessionId) {
  return this.findAll({
    where: { session_id: sessionId },
    attributes: [
      'sender_type',
      'message_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['sender_type', 'message_type']
  });
};

module.exports = Message;

