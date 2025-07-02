const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const config = require('../config/config');
const { testConnection, syncDatabase } = require('../config/database');

// Import des routes
const sessionRoutes = require('./routes/sessions');
const botRoutes = require('./routes/bot');
const configRoutes = require('./routes/config');

// Import des middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import des services
const SocketService = require('./services/SocketService');

class App {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials
      }
    });
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Sécurité
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // CORS
    this.app.use(cors(config.cors));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.limits.rateLimitWindowMs,
      max: config.limits.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Logging
    if (config.server.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint (avant l'authentification)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.server.nodeEnv
      });
    });

    // Authentification (pour les routes API)
    this.app.use('/api', authMiddleware);
  }

  setupRoutes() {
    // Routes API
    this.app.use('/api/sessions', sessionRoutes);
    this.app.use('/api/bot', botRoutes);
    this.app.use('/api/config', configRoutes);

    // Route par défaut
    this.app.get('/', (req, res) => {
      res.json({
        message: 'BDD Bot API Server',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
      });
    });

    // Route 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  setupSocketIO() {
    // Initialiser le service WebSocket
    SocketService.initialize(this.io);

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join_session', async (data) => {
        try {
          await SocketService.handleJoinSession(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('leave_session', async (data) => {
        try {
          await SocketService.handleLeaveSession(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('send_message', async (data) => {
        try {
          await SocketService.handleMessage(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('typing_start', (data) => {
        SocketService.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        SocketService.handleTypingStop(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        SocketService.handleDisconnect(socket);
      });
    });
  }

  setupErrorHandling() {
    // Gestionnaire d'erreurs global
    this.app.use(errorHandler);

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Gestion de l'arrêt propre
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  async start() {
    try {
      // Tester la connexion à la base de données
      await testConnection();

      // Synchroniser les modèles avec la base de données
      await syncDatabase(config.server.nodeEnv === 'development');

      // Démarrer le serveur
      this.server.listen(config.server.port, config.server.host, () => {
        console.log(`
🚀 BDD Bot API Server started successfully!

📍 Server: http://${config.server.host}:${config.server.port}
🌍 Environment: ${config.server.nodeEnv}
📊 Health Check: http://${config.server.host}:${config.server.port}/health
🔌 WebSocket: ws://${config.server.host}:${config.server.port}

🤖 OpenAI: ${config.openai.apiKey ? '✅ Configured' : '❌ Not configured'}
🗄️  Database: ✅ Connected (SQLite)
        `);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log('Shutting down server...');
    
    try {
      // Fermer les connexions WebSocket
      this.io.close();
      
      // Fermer le serveur HTTP
      this.server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        console.log('❌ Forced shutdown');
        process.exit(1);
      }, 10000);

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Créer et démarrer l'application
const app = new App();

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  app.start();
}

module.exports = app;

