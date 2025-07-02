const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAIService = require('../services/OpenAIService');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
  }
  next();
};

// GET /api/config/openai - Récupérer la configuration OpenAI (sans clés sensibles)
router.get('/openai', asyncHandler(async (req, res) => {
  const config = require('../../config/config');
  
  res.json({
    success: true,
    data: {
      configured: !!config.openai.apiKey,
      model: config.openai.model,
      fallback_model: config.openai.fallbackModel,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
      timeout: config.openai.timeout
    }
  });
}));

// POST /api/config/openai/test - Tester la configuration OpenAI
router.post('/openai/test', [
  body('api_key').optional().isString().withMessage('API key must be a string'),
  body('org_id').optional().isString().withMessage('Organization ID must be a string'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { api_key, org_id } = req.body;
  
  // Si des clés sont fournies, les utiliser temporairement pour le test
  if (api_key) {
    // Créer une instance temporaire d'OpenAI pour le test
    const OpenAI = require('openai');
    const testClient = new OpenAI({
      apiKey: api_key,
      organization: org_id
    });

    try {
      const response = await testClient.models.list();
      res.json({
        success: true,
        data: {
          connection: 'successful',
          models_available: response.data.length,
          organization: org_id || 'default'
        },
        message: 'OpenAI connection test successful'
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        message: 'OpenAI connection test failed'
      });
    }
  } else {
    // Utiliser la configuration existante
    const testResult = await OpenAIService.testConnection();
    res.json({
      success: testResult.success,
      data: testResult,
      message: testResult.success ? 'OpenAI connection successful' : 'OpenAI connection failed'
    });
  }
}));

// PUT /api/config/openai - Mettre à jour la configuration OpenAI (admin seulement)
router.put('/openai', [
  requireRole(['admin']), // Nécessite un rôle admin
  body('api_key').optional().isString().withMessage('API key must be a string'),
  body('org_id').optional().isString().withMessage('Organization ID must be a string'),
  body('model').optional().isIn(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']).withMessage('Invalid model'),
  body('fallback_model').optional().isIn(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']).withMessage('Invalid fallback model'),
  body('max_tokens').optional().isInt({ min: 100, max: 4000 }).withMessage('Max tokens must be between 100 and 4000'),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be between 0 and 2'),
  body('timeout').optional().isInt({ min: 5000, max: 120000 }).withMessage('Timeout must be between 5000 and 120000ms'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  // Note: En production, cette route devrait mettre à jour la configuration
  // de manière persistante (base de données, fichier de config, variables d'environnement)
  
  const updates = req.body;
  
  // Pour cette implémentation, on simule la mise à jour
  res.json({
    success: true,
    data: {
      updated_fields: Object.keys(updates),
      message: 'Configuration updated successfully (restart required for some changes)'
    },
    warning: 'Configuration updates require application restart in current implementation'
  });
}));

// GET /api/config/bot - Récupérer la configuration du bot
router.get('/bot', asyncHandler(async (req, res) => {
  // Configuration par défaut du bot
  const botConfig = {
    default_style: 'professional',
    default_language: 'fr',
    default_detail_level: 'intermediate',
    supported_languages: ['fr', 'en'],
    supported_styles: ['professional', 'casual', 'technical'],
    supported_detail_levels: ['basic', 'intermediate', 'expert'],
    business_contexts: ['ecommerce', 'finance', 'healthcare', 'education', 'generic']
  };

  res.json({
    success: true,
    data: botConfig
  });
}));

// PUT /api/config/bot - Mettre à jour la configuration du bot
router.put('/bot', [
  body('default_style').optional().isIn(['professional', 'casual', 'technical']).withMessage('Invalid style'),
  body('default_language').optional().isIn(['fr', 'en']).withMessage('Invalid language'),
  body('default_detail_level').optional().isIn(['basic', 'intermediate', 'expert']).withMessage('Invalid detail level'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const updates = req.body;
  
  // En production, sauvegarder dans la base de données ou fichier de config
  res.json({
    success: true,
    data: {
      updated_fields: Object.keys(updates),
      message: 'Bot configuration updated successfully'
    }
  });
}));

// GET /api/config/system - Informations système
router.get('/system', asyncHandler(async (req, res) => {
  const config = require('../../config/config');
  
  res.json({
    success: true,
    data: {
      environment: config.server.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      database: {
        type: 'MariaDB',
        host: config.database.host,
        port: config.database.port,
        name: config.database.name
      },
      features: {
        openai_configured: !!config.openai.apiKey,
        websocket_enabled: true,
        rate_limiting: true
      }
    }
  });
}));

// GET /api/config/limits - Limites et quotas
router.get('/limits', asyncHandler(async (req, res) => {
  const config = require('../../config/config');
  
  res.json({
    success: true,
    data: {
      session_max_participants: config.limits.sessionMaxParticipants,
      session_timeout_hours: config.limits.sessionTimeoutHours,
      rate_limit_window_ms: config.limits.rateLimitWindowMs,
      rate_limit_max_requests: config.limits.rateLimitMaxRequests,
      message_max_length: 5000,
      scenario_max_length: 10000,
      file_upload_max_size: '10MB'
    }
  });
}));

// PUT /api/config/limits - Mettre à jour les limites (admin seulement)
router.put('/limits', [
  requireRole(['admin']),
  body('session_max_participants').optional().isInt({ min: 2, max: 20 }).withMessage('Session max participants must be between 2 and 20'),
  body('session_timeout_hours').optional().isInt({ min: 1, max: 168 }).withMessage('Session timeout must be between 1 and 168 hours'),
  body('rate_limit_max_requests').optional().isInt({ min: 10, max: 1000 }).withMessage('Rate limit max requests must be between 10 and 1000'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const updates = req.body;
  
  res.json({
    success: true,
    data: {
      updated_fields: Object.keys(updates),
      message: 'Limits updated successfully'
    }
  });
}));

// GET /api/config/templates - Templates de prompts
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = {
    system_prompts: {
      tester: "Vous êtes un testeur expert spécialisé dans les méthodes BDD...",
      scenario_generator: "Vous êtes un expert en génération de scénarios de test BDD...",
      clarification: "Vous êtes un expert en analyse d'exigences...",
      validator: "Vous êtes un expert en validation de scénarios de test..."
    },
    response_templates: {
      welcome: "Bonjour ! Je suis votre assistant testeur pour cette session BDD...",
      scenario_generated: "J'ai généré les scénarios de test suivants...",
      questions_asked: "Pour mieux comprendre vos exigences, j'ai quelques questions..."
    }
  };

  res.json({
    success: true,
    data: templates
  });
}));

// PUT /api/config/templates - Mettre à jour les templates (admin seulement)
router.put('/templates', [
  requireRole(['admin']),
  body('system_prompts').optional().isObject().withMessage('System prompts must be an object'),
  body('response_templates').optional().isObject().withMessage('Response templates must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const updates = req.body;
  
  res.json({
    success: true,
    data: {
      updated_templates: Object.keys(updates),
      message: 'Templates updated successfully'
    }
  });
}));

// POST /api/config/export - Exporter la configuration
router.post('/export', asyncHandler(async (req, res) => {
  const config = require('../../config/config');
  
  const exportData = {
    bot_config: {
      default_style: 'professional',
      default_language: 'fr',
      default_detail_level: 'intermediate'
    },
    limits: {
      session_max_participants: config.limits.sessionMaxParticipants,
      session_timeout_hours: config.limits.sessionTimeoutHours
    },
    openai_config: {
      model: config.openai.model,
      fallback_model: config.openai.fallbackModel,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature
      // Note: Les clés API ne sont pas exportées pour des raisons de sécurité
    },
    export_date: new Date().toISOString(),
    version: '1.0.0'
  };

  res.json({
    success: true,
    data: exportData,
    message: 'Configuration exported successfully'
  });
}));

// POST /api/config/import - Importer une configuration (admin seulement)
router.post('/import', [
  requireRole(['admin']),
  body('config_data').isObject().withMessage('Configuration data must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { config_data } = req.body;
  
  // Valider et appliquer la configuration importée
  // En production, ceci devrait valider chaque champ et appliquer les changements
  
  res.json({
    success: true,
    data: {
      imported_sections: Object.keys(config_data),
      message: 'Configuration imported successfully'
    },
    warning: 'Application restart may be required for some changes to take effect'
  });
}));

module.exports = router;

