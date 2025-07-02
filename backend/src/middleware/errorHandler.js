const config = require('../../config/config');

// Gestionnaire d'erreurs global
const errorHandler = (error, req, res, next) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Erreurs de validation Sequelize
  if (error.name === 'SequelizeValidationError') {
    const validationErrors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: validationErrors
    });
  }

  // Erreurs de contrainte unique Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'unknown';
    return res.status(409).json({
      error: 'Conflict',
      message: `${field} already exists`,
      field: field
    });
  }

  // Erreurs de clé étrangère Sequelize
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid Reference',
      message: 'Referenced resource does not exist'
    });
  }

  // Erreurs de base de données Sequelize
  if (error.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      error: 'Database Error',
      message: config.server.nodeEnv === 'development' ? error.message : 'Internal database error'
    });
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired'
    });
  }

  // Erreurs de syntaxe JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Erreurs de limite de taille
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'Uploaded file exceeds size limit'
    });
  }

  // Erreurs OpenAI
  if (error.message && error.message.includes('OpenAI')) {
    return res.status(503).json({
      error: 'AI Service Unavailable',
      message: 'The AI service is temporarily unavailable. Please try again later.'
    });
  }

  // Erreurs de validation personnalisées
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }

  // Erreurs d'autorisation personnalisées
  if (error.name === 'AuthorizationError') {
    return res.status(403).json({
      error: 'Authorization Error',
      message: error.message
    });
  }

  // Erreurs de ressource non trouvée
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }

  // Erreurs de conflit
  if (error.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflict',
      message: error.message
    });
  }

  // Erreurs de rate limiting
  if (error.status === 429) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }

  // Erreur par défaut (500)
  const statusCode = error.statusCode || error.status || 500;
  const message = config.server.nodeEnv === 'development' 
    ? error.message 
    : 'Internal server error';

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: message,
    ...(config.server.nodeEnv === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

// Gestionnaire pour les routes non trouvées
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api/sessions',
      'POST /api/sessions',
      'GET /api/bot/test',
      'POST /api/bot/message'
    ]
  });
};

// Classes d'erreurs personnalisées
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Wrapper pour les fonctions async
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};

