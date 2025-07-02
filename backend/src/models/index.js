const Session = require('./Session');
const Participant = require('./Participant');
const Message = require('../../../Message');
const Scenario = require('./Scenario');

// Définition des associations

// Session associations
Session.hasMany(Participant, {
  foreignKey: 'session_id',
  as: 'participants',
  onDelete: 'CASCADE'
});

Session.hasMany(Message, {
  foreignKey: 'session_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Session.hasMany(Scenario, {
  foreignKey: 'session_id',
  as: 'scenarios',
  onDelete: 'CASCADE'
});

// Participant associations
Participant.belongsTo(Session, {
  foreignKey: 'session_id',
  as: 'session'
});

Participant.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'messages'
});

Participant.hasMany(Scenario, {
  foreignKey: 'created_by',
  as: 'created_scenarios'
});

// Message associations
Message.belongsTo(Session, {
  foreignKey: 'session_id',
  as: 'session'
});

Message.belongsTo(Participant, {
  foreignKey: 'sender_id',
  as: 'sender'
});

Message.belongsTo(Message, {
  foreignKey: 'reply_to',
  as: 'parent_message'
});

Message.hasMany(Message, {
  foreignKey: 'reply_to',
  as: 'replies'
});

// Scenario associations
Scenario.belongsTo(Session, {
  foreignKey: 'session_id',
  as: 'session'
});

Scenario.belongsTo(Participant, {
  foreignKey: 'created_by',
  as: 'creator'
});

Scenario.belongsTo(Participant, {
  foreignKey: 'approved_by',
  as: 'approver'
});

Scenario.belongsTo(Scenario, {
  foreignKey: 'parent_scenario_id',
  as: 'parent_scenario'
});

Scenario.hasMany(Scenario, {
  foreignKey: 'parent_scenario_id',
  as: 'versions'
});

// Export des modèles
module.exports = {
  Session,
  Participant,
  Message,
  Scenario
};

