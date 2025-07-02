const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  business_context: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'generic',
    validate: {
      isIn: [['ecommerce', 'finance', 'healthcare', 'education', 'generic']]
    }
  },
  status: {
    type: DataTypes.ENUM('waiting', 'active', 'paused', 'completed', 'archived'),
    defaultValue: 'waiting',
    allowNull: false
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  estimated_duration: {
    type: DataTypes.INTEGER, // en minutes
    allowNull: true,
    validate: {
      min: 15,
      max: 480 // 8 heures max
    }
  },
  actual_duration: {
    type: DataTypes.INTEGER, // en minutes
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      bot_style: 'professional',
      detail_level: 'intermediate',
      language: 'fr',
      auto_save_interval: 30
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'sessions',
  indexes: [
    {
      fields: ['creator_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Méthodes d'instance
Session.prototype.isActive = function() {
  return this.status === 'active';
};

Session.prototype.canJoin = function() {
  return ['waiting', 'active'].includes(this.status);
};

Session.prototype.start = function() {
  this.status = 'active';
  this.started_at = new Date();
  return this.save();
};

Session.prototype.complete = function() {
  this.status = 'completed';
  this.completed_at = new Date();
  if (this.started_at) {
    this.actual_duration = Math.floor((this.completed_at - this.started_at) / (1000 * 60));
  }
  return this.save();
};

Session.prototype.pause = function() {
  this.status = 'paused';
  return this.save();
};

Session.prototype.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Méthodes de classe
Session.findActiveByUser = function(userId) {
  return this.findAll({
    where: {
      creator_id: userId,
      status: ['waiting', 'active', 'paused']
    },
    order: [['updated_at', 'DESC']]
  });
};

Session.findByStatus = function(status) {
  return this.findAll({
    where: { status },
    order: [['updated_at', 'DESC']]
  });
};

module.exports = Session;

