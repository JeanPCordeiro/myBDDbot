const jwt = require('jsonwebtoken');
const config = require('../../config/config');

// Middleware d'authentification simple pour le développement
// En production, ceci devrait être remplacé par une authentification plus robuste
const authMiddleware = (req, res, next) => {
  // Exclure certaines routes de l'authentification
  const publicRoutes = ['/health', '/api/config/test'];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // En mode développement, créer un utilisateur fictif si pas d'authentification valide
  if (config.server.nodeEnv === 'development') {
    // Vérifier s'il y a un token dans les headers
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Vérifier que le token n'est pas vide ou malformé
      if (token && token !== 'undefined' && token !== 'null' && token.length > 10) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret);
          req.user = decoded;
          return next();
        } catch (error) {
          console.warn('Invalid token in development mode, using default user:', error.message);
          // En développement, continuer avec l'utilisateur par défaut même si le token est invalide
        }
      }
    }
    
    // Créer un utilisateur de développement par défaut
    req.user = {
      userId: 'dev-user-001',
      name: 'Développeur Test',
      email: 'dev@example.com',
      role: 'business_analyst'
    };
    return next();
  }

  // En production, exiger une authentification valide
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is empty or malformed'
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

// Fonction utilitaire pour générer un token (pour les tests)
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Middleware pour vérifier les permissions spécifiques
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}, current role: ${userRole}`
      });
    }

    next();
  };
};

// Middleware pour vérifier la propriété d'une ressource
const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (req.user.userId !== resourceOwnerId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Error checking resource ownership',
        message: error.message
      });
    }
  };
};

module.exports = {
  authMiddleware,
  generateToken,
  requireRole,
  requireOwnership
};

