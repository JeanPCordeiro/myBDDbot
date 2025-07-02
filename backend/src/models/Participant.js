const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Participant = sequelize.define('Participant', {
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('business_analyst', 'developer', 'tester', 'observer'),
    allowNull: false,
    defaultValue: 'observer'
  },
  status: {
    type: DataTypes.ENUM('invited', 'joined', 'active', 'inactive', 'left'),
    defaultValue: 'invited',
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      can_edit_scenarios: true,
      can_invite_others: false,
      can_moderate: false,
      can_export: true
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  connection_info: {
    type: DataTypes.JSON,
    defaultValue: {
      socket_id: null,
      ip_address: null,
      user_agent: null
    }
  }
}, {
  tableName: 'participants',
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['session_id', 'user_id']
    }
  ]
});

// Méthodes d'instance
Participant.prototype.join = function(socketId = null, ipAddress = null, userAgent = null) {
  this.status = 'joined';
  this.joined_at = new Date();
  this.last_activity = new Date();
  this.connection_info = {
    socket_id: socketId,
    ip_address: ipAddress,
    user_agent: userAgent
  };
  return this.save();
};

Participant.prototype.setActive = function() {
  this.status = 'active';
  this.last_activity = new Date();
  return this.save();
};

Participant.prototype.setInactive = function() {
  this.status = 'inactive';
  return this.save();
};

Participant.prototype.leave = function() {
  this.status = 'left';
  this.connection_info.socket_id = null;
  return this.save();
};

Participant.prototype.updateActivity = function() {
  this.last_activity = new Date();
  return this.save();
};

Participant.prototype.canEdit = function() {
  return this.permissions.can_edit_scenarios && ['joined', 'active'].includes(this.status);
};

Participant.prototype.canModerate = function() {
  return this.permissions.can_moderate && ['joined', 'active'].includes(this.status);
};

Participant.prototype.isOnline = function() {
  return ['joined', 'active'].includes(this.status) && this.connection_info.socket_id;
};

// Méthodes de classe
Participant.findBySession = function(sessionId) {
  return this.findAll({
    where: { session_id: sessionId },
    order: [['joined_at', 'ASC']]
  });
};

Participant.findActiveBySession = function(sessionId) {
  return this.findAll({
    where: {
      session_id: sessionId,
      status: ['joined', 'active']
    },
    order: [['joined_at', 'ASC']]
  });
};

Participant.findByUser = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });
};

Participant.countActiveBySession = function(sessionId) {
  return this.count({
    where: {
      session_id: sessionId,
      status: ['joined', 'active']
    }
  });
};

module.exports = Participant;

