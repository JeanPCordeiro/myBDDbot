const { Sequelize } = require('sequelize');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Créer le répertoire database s'il n'existe pas
const dbDir = path.dirname(config.database.storage);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configuration Sequelize pour SQLite
const sequelize = new Sequelize({
  dialect: config.database.dialect,
  storage: config.database.storage,
  logging: config.server.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test de connexion
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion SQLite établie avec succès');
  } catch (error) {
    console.error('❌ Impossible de se connecter à SQLite:', error);
    throw error;
  }
}

// Synchronisation de la base de données
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('✅ Base de données SQLite synchronisée');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation SQLite:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};

