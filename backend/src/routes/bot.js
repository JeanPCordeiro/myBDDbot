const express = require('express');
const { body, param, validationResult } = require('express-validator');
const BotEngine = require('../services/BotEngine');
const OpenAIService = require('../services/OpenAIService');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
  }
  next();
};

// POST /api/bot/message - Envoyer un message au bot
router.post('/message', [
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { session_id, message, context = {} } = req.body;
  
  // Ajouter les informations utilisateur au contexte
  const enrichedContext = {
    ...context,
    userId: req.user.userId,
    userInfo: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  };

  const response = await BotEngine.processMessage(session_id, message, enrichedContext);

  res.json({
    success: true,
    data: {
      response: response.content,
      type: response.type,
      metadata: response.metadata,
      scenarios: response.scenarios || [],
      questions: response.questions || [],
      validation: response.validation || null
    }
  });
}));

// POST /api/bot/generate-scenarios - Générer des scénarios spécifiquement
router.post('/generate-scenarios', [
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('requirements')
    .notEmpty()
    .withMessage('Requirements are required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Requirements must be between 10 and 2000 characters'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { session_id, requirements, context = {} } = req.body;

  const result = await OpenAIService.generateScenarios(requirements, {
    businessContext: context.businessContext || 'generic',
    previousMessages: context.previousMessages || []
  });

  // Sauvegarder les scénarios générés
  const { Scenario } = require('../models');
  const createdScenarios = [];

  for (const scenario of result.scenarios) {
    const newScenario = await Scenario.create({
      session_id: session_id,
      title: scenario.title,
      gherkin_content: scenario.content,
      created_by_type: 'bot',
      status: 'draft',
      category: 'nominal', // Catégorisation basique
      validation_results: {
        syntax_valid: true,
        syntax_errors: [],
        completeness_score: 85,
        quality_score: 80,
        suggestions: []
      }
    });
    createdScenarios.push(newScenario);
  }

  res.json({
    success: true,
    data: {
      scenarios: createdScenarios,
      metadata: result.metadata,
      message: `${createdScenarios.length} scénarios générés avec succès`
    }
  });
}));

// POST /api/bot/ask-questions - Demander des questions de clarification
router.post('/ask-questions', [
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('requirements')
    .notEmpty()
    .withMessage('Requirements are required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Requirements must be between 10 and 2000 characters'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { session_id, requirements, context = {} } = req.body;

  const result = await OpenAIService.askClarificationQuestions(requirements, {
    businessContext: context.businessContext || 'generic',
    previousMessages: context.previousMessages || []
  });

  res.json({
    success: true,
    data: {
      questions: result.questions,
      metadata: result.metadata,
      message: `${result.questions.length} questions de clarification générées`
    }
  });
}));

// POST /api/bot/validate-scenarios - Valider des scénarios
router.post('/validate-scenarios', [
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('scenarios')
    .isArray({ min: 1 })
    .withMessage('At least one scenario is required'),
  body('scenarios.*.id').optional().isUUID().withMessage('Invalid scenario ID'),
  body('scenarios.*.content')
    .notEmpty()
    .withMessage('Scenario content is required'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { session_id, scenarios, context = {} } = req.body;

  // Combiner tous les scénarios en un seul texte pour validation
  const scenariosText = scenarios.map(s => s.content).join('\n\n');

  const result = await OpenAIService.validateScenarios(scenariosText, {
    businessContext: context.businessContext || 'generic'
  });

  // Mettre à jour les résultats de validation dans la base de données
  const { Scenario } = require('../models');
  const updatedScenarios = [];

  for (const scenario of scenarios) {
    if (scenario.id) {
      const dbScenario = await Scenario.findByPk(scenario.id);
      if (dbScenario) {
        dbScenario.validation_results = {
          ...dbScenario.validation_results,
          ...result.validation,
          validated_at: new Date()
        };
        await dbScenario.save();
        updatedScenarios.push(dbScenario);
      }
    }
  }

  res.json({
    success: true,
    data: {
      validation: result.validation,
      updated_scenarios: updatedScenarios,
      metadata: result.metadata,
      message: 'Validation des scénarios terminée'
    }
  });
}));

// GET /api/bot/test - Tester la connexion avec OpenAI
router.get('/test', asyncHandler(async (req, res) => {
  const testResult = await OpenAIService.testConnection();

  res.json({
    success: testResult.success,
    data: testResult,
    message: testResult.success ? 'OpenAI connection successful' : 'OpenAI connection failed'
  });
}));

// GET /api/bot/stats/:sessionId - Statistiques du bot pour une session
router.get('/stats/:sessionId', [
  param('sessionId').isUUID().withMessage('Valid session ID is required'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Vérifier l'accès à la session
  const SessionService = require('../services/SessionService');
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  
  if (!userParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const stats = BotEngine.getSessionStats(sessionId);

  res.json({
    success: true,
    data: stats || {
      messages_count: 0,
      scenarios_count: 0,
      last_activity: null
    }
  });
}));

// POST /api/bot/custom-prompt - Envoyer un prompt personnalisé
router.post('/custom-prompt', [
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ min: 1, max: 3000 })
    .withMessage('Prompt must be between 1 and 3000 characters'),
  body('system_prompt').optional().isString().withMessage('System prompt must be a string'),
  body('options').optional().isObject().withMessage('Options must be an object'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { session_id, prompt, system_prompt, options = {} } = req.body;

  // Récupérer le contexte de session
  const sessionContext = await BotEngine.getSessionContext(session_id);

  const response = await OpenAIService.generateResponse(prompt, sessionContext, {
    systemPrompt: system_prompt,
    ...options
  });

  res.json({
    success: true,
    data: {
      response: response.content,
      metadata: response.metadata
    }
  });
}));

// DELETE /api/bot/context/:sessionId - Effacer le contexte de session
router.delete('/context/:sessionId', [
  param('sessionId').isUUID().withMessage('Valid session ID is required'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Vérifier l'accès à la session
  const SessionService = require('../services/SessionService');
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  
  if (!userParticipant || !userParticipant.permissions?.can_moderate) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  BotEngine.clearSessionContext(sessionId);

  res.json({
    success: true,
    message: 'Session context cleared successfully'
  });
}));

// GET /api/bot/usage - Statistiques d'utilisation OpenAI
router.get('/usage', asyncHandler(async (req, res) => {
  const usage = await OpenAIService.getUsageStats();

  res.json({
    success: true,
    data: usage
  });
}));

module.exports = router;

