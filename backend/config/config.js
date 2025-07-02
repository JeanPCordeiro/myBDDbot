const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const config = {
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Configuration OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Configuration CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },

  // Configuration de la base de données SQLite
  database: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/bdd_bot.sqlite'
  },

  // Configuration des logs
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Configuration des limites
  limits: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    sessionMaxParticipants: parseInt(process.env.SESSION_MAX_PARTICIPANTS) || 10,
    sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS) || 24
  }
};

// Validation de la configuration critique
function validateConfig() {
  const errors = [];

  if (!config.openai.apiKey && config.server.nodeEnv === 'production') {
    errors.push('OPENAI_API_KEY est requis en production');
  }

  if (!config.jwt.secret || config.jwt.secret === 'default-secret-change-in-production') {
    if (config.server.nodeEnv === 'production') {
      errors.push('JWT_SECRET doit être défini en production');
    }
  }

  if (errors.length > 0) {
    console.error('Erreurs de configuration:');
    errors.forEach(error => console.error(`- ${error}`));
    if (config.server.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

// Valider la configuration au chargement
validateConfig();

module.exports = config;

