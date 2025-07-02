const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const SessionService = require('../services/SessionService');
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

// GET /api/sessions - Récupérer les sessions de l'utilisateur
router.get('/', [
  query('status').optional().isIn(['waiting', 'active', 'paused', 'completed', 'archived']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const userId = req.user.userId;

  let sessions;
  if (search) {
    sessions = await SessionService.searchSessions(search, userId);
  } else {
    sessions = await SessionService.getUserSessions(userId, status);
  }

  res.json({
    success: true,
    data: sessions,
    count: sessions.length
  });
}));

// POST /api/sessions - Créer une nouvelle session
router.post('/', [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('business_context')
    .optional()
    .isIn(['ecommerce', 'finance', 'healthcare', 'education', 'generic'])
    .withMessage('Invalid business context'),
  body('estimated_duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Estimated duration must be between 15 and 480 minutes'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array'),
  body('participants.*.name')
    .optional()
    .notEmpty()
    .withMessage('Participant name is required'),
  body('participants.*.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required for participants'),
  body('participants.*.role')
    .optional()
    .isIn(['business_analyst', 'developer', 'tester', 'observer'])
    .withMessage('Invalid participant role'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionData = req.body;
  const creatorInfo = {
    userId: req.user.userId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  };

  const session = await SessionService.createSession(sessionData, creatorInfo);

  res.status(201).json({
    success: true,
    data: session,
    message: 'Session created successfully'
  });
}));

// GET /api/sessions/:id - Récupérer les détails d'une session
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid session ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const session = await SessionService.getSessionDetails(sessionId);

  // Vérifier que l'utilisateur a accès à cette session
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  if (!userParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You are not a participant in this session'
    });
  }

  res.json({
    success: true,
    data: session
  });
}));

// PUT /api/sessions/:id/join - Rejoindre une session
router.put('/:id/join', [
  param('id').isUUID().withMessage('Invalid session ID'),
  body('connection_info').optional().isObject(),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.userId;
  const connectionInfo = req.body.connection_info || {};

  const session = await SessionService.joinSession(sessionId, userId, connectionInfo);

  res.json({
    success: true,
    data: session,
    message: 'Successfully joined session'
  });
}));

// PUT /api/sessions/:id/leave - Quitter une session
router.put('/:id/leave', [
  param('id').isUUID().withMessage('Invalid session ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.userId;

  await SessionService.leaveSession(sessionId, userId);

  res.json({
    success: true,
    message: 'Successfully left session'
  });
}));

// PUT /api/sessions/:id/complete - Terminer une session
router.put('/:id/complete', [
  param('id').isUUID().withMessage('Invalid session ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.userId;

  const session = await SessionService.completeSession(sessionId, userId);

  res.json({
    success: true,
    data: session,
    message: 'Session completed successfully'
  });
}));

// PUT /api/sessions/:id/archive - Archiver une session
router.put('/:id/archive', [
  param('id').isUUID().withMessage('Invalid session ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.userId;

  await SessionService.archiveSession(sessionId, userId);

  res.json({
    success: true,
    message: 'Session archived successfully'
  });
}));

// GET /api/sessions/:id/stats - Statistiques d'une session
router.get('/:id/stats', [
  param('id').isUUID().withMessage('Invalid session ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  
  // Vérifier l'accès à la session
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  if (!userParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const stats = await SessionService.getSessionStats(sessionId);

  res.json({
    success: true,
    data: stats
  });
}));

// POST /api/sessions/:id/participants - Ajouter un participant
router.post('/:id/participants', [
  param('id').isUUID().withMessage('Invalid session ID'),
  body('name').notEmpty().withMessage('Participant name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['business_analyst', 'developer', 'tester', 'observer'])
    .withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const participantData = {
    user_id: req.body.user_id || `temp_${Date.now()}`, // ID temporaire si pas fourni
    name: req.body.name,
    email: req.body.email,
    role: req.body.role || 'observer'
  };

  // Vérifier que l'utilisateur peut inviter (permissions)
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  
  if (!userParticipant || !userParticipant.permissions?.can_invite_others) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to invite participants'
    });
  }

  const participant = await SessionService.addParticipant(sessionId, participantData);

  res.status(201).json({
    success: true,
    data: participant,
    message: 'Participant added successfully'
  });
}));

// GET /api/sessions/:id/messages - Récupérer les messages d'une session
router.get('/:id/messages', [
  param('id').isUUID().withMessage('Invalid session ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Vérifier l'accès à la session
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  if (!userParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const { Message } = require('../models');
  const messages = await Message.findBySession(sessionId, limit, offset);

  res.json({
    success: true,
    data: messages,
    pagination: {
      limit,
      offset,
      count: messages.length
    }
  });
}));

// GET /api/sessions/:id/scenarios - Récupérer les scénarios d'une session
router.get('/:id/scenarios', [
  param('id').isUUID().withMessage('Invalid session ID'),
  query('status').optional().isIn(['draft', 'review', 'approved', 'implemented', 'tested', 'archived']),
  query('category').optional().isIn(['nominal', 'error', 'edge_case', 'performance', 'security', 'accessibility']),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const { status, category } = req.query;

  // Vérifier l'accès à la session
  const session = await SessionService.getSessionDetails(sessionId);
  const userParticipant = session.participants.find(p => p.user_id === req.user.userId);
  if (!userParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const { Scenario } = require('../models');
  let scenarios;

  if (status) {
    scenarios = await Scenario.findByStatus(sessionId, status);
  } else if (category) {
    scenarios = await Scenario.findByCategory(sessionId, category);
  } else {
    scenarios = await Scenario.findBySession(sessionId);
  }

  res.json({
    success: true,
    data: scenarios,
    count: scenarios.length
  });
}));

module.exports = router;

