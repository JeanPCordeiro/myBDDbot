const OpenAIService = require('./OpenAIService');
const { Message, Scenario } = require('../models');
const { v4: uuidv4 } = require('uuid');

class BotEngine {
  constructor() {
    this.sessionContexts = new Map(); // Cache des contextes de session
  }

  async processMessage(sessionId, userMessage, context = {}) {
    try {
      // Récupérer ou créer le contexte de session
      const sessionContext = await this.getSessionContext(sessionId);
      
      // Analyser le type de message et l'intention
      const messageAnalysis = this.analyzeMessage(userMessage);
      
      // Générer la réponse appropriée
      let response;
      switch (messageAnalysis.intent) {
        case 'scenario_generation':
          response = await this.handleScenarioGeneration(sessionId, userMessage, sessionContext);
          break;
        case 'clarification_request':
          response = await this.handleClarificationRequest(sessionId, userMessage, sessionContext);
          break;
        case 'validation_request':
          response = await this.handleValidationRequest(sessionId, userMessage, sessionContext);
          break;
        case 'general_question':
          response = await this.handleGeneralQuestion(sessionId, userMessage, sessionContext);
          break;
        default:
          response = await this.handleDefaultResponse(sessionId, userMessage, sessionContext);
      }

      // Sauvegarder le message et la réponse
      await this.saveInteraction(sessionId, userMessage, response, context);
      
      // Mettre à jour le contexte de session
      this.updateSessionContext(sessionId, userMessage, response);

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return this.createErrorResponse(error);
    }
  }

  async getSessionContext(sessionId) {
    if (this.sessionContexts.has(sessionId)) {
      return this.sessionContexts.get(sessionId);
    }

    // Charger le contexte depuis la base de données
    const messages = await Message.findBySession(sessionId, 20); // Derniers 20 messages
    const scenarios = await Scenario.findBySession(sessionId);

    const context = {
      sessionId,
      messages: messages.map(msg => ({
        sender_type: msg.sender_type,
        content: msg.content,
        created_at: msg.created_at
      })),
      scenarios: scenarios.map(scenario => ({
        title: scenario.title,
        gherkin_content: scenario.gherkin_content,
        status: scenario.status
      })),
      businessContext: 'generic', // À récupérer depuis la session
      currentTopic: null,
      userPreferences: {
        language: 'fr',
        detail_level: 'intermediate',
        style: 'professional'
      }
    };

    this.sessionContexts.set(sessionId, context);
    return context;
  }

  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Mots-clés pour identifier l'intention
    const keywords = {
      scenario_generation: [
        'génère', 'générer', 'crée', 'créer', 'scénario', 'scénarios', 
        'test', 'tests', 'gherkin', 'cas de test'
      ],
      clarification_request: [
        'question', 'questions', 'clarification', 'précise', 'préciser',
        'qu\'est-ce que', 'comment', 'pourquoi', 'quand', 'où'
      ],
      validation_request: [
        'valide', 'valider', 'vérifie', 'vérifier', 'contrôle', 'contrôler',
        'qualité', 'correct', 'erreur', 'problème'
      ]
    };

    // Analyser l'intention basée sur les mots-clés
    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some(word => lowerMessage.includes(word))) {
        return {
          intent,
          confidence: 0.8,
          keywords_found: words.filter(word => lowerMessage.includes(word))
        };
      }
    }

    return {
      intent: 'general_question',
      confidence: 0.5,
      keywords_found: []
    };
  }

  async handleScenarioGeneration(sessionId, userMessage, context) {
    try {
      const result = await OpenAIService.generateScenarios(userMessage, {
        businessContext: context.businessContext,
        previousMessages: context.messages.slice(-5)
      });

      // Créer les scénarios dans la base de données
      const createdScenarios = [];
      for (const scenario of result.scenarios) {
        const newScenario = await Scenario.create({
          session_id: sessionId,
          title: scenario.title,
          gherkin_content: scenario.content,
          created_by_type: 'bot',
          status: 'draft',
          category: this.categorizeScenario(scenario.content),
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

      return {
        type: 'scenario_generation',
        content: this.formatScenarioResponse(result.scenarios),
        scenarios: createdScenarios,
        metadata: result.metadata
      };
    } catch (error) {
      return this.createErrorResponse(error, 'scenario_generation');
    }
  }

  async handleClarificationRequest(sessionId, userMessage, context) {
    try {
      const result = await OpenAIService.askClarificationQuestions(userMessage, {
        businessContext: context.businessContext,
        previousMessages: context.messages.slice(-5)
      });

      return {
        type: 'clarification',
        content: this.formatQuestionsResponse(result.questions),
        questions: result.questions,
        metadata: result.metadata
      };
    } catch (error) {
      return this.createErrorResponse(error, 'clarification');
    }
  }

  async handleValidationRequest(sessionId, userMessage, context) {
    try {
      // Récupérer les scénarios à valider
      const scenarios = context.scenarios.map(s => s.gherkin_content).join('\n\n');
      
      const result = await OpenAIService.validateScenarios(scenarios, {
        businessContext: context.businessContext
      });

      return {
        type: 'validation',
        content: this.formatValidationResponse(result.validation),
        validation: result.validation,
        metadata: result.metadata
      };
    } catch (error) {
      return this.createErrorResponse(error, 'validation');
    }
  }

  async handleGeneralQuestion(sessionId, userMessage, context) {
    try {
      const response = await OpenAIService.generateResponse(userMessage, {
        businessContext: context.businessContext,
        previousMessages: context.messages.slice(-5),
        role: 'tester'
      });

      return {
        type: 'general',
        content: response.content,
        metadata: response.metadata
      };
    } catch (error) {
      return this.createErrorResponse(error, 'general');
    }
  }

  async handleDefaultResponse(sessionId, userMessage, context) {
    const defaultResponses = [
      "Je suis là pour vous aider avec vos sessions BDD. Vous pouvez me demander de générer des scénarios, poser des questions de clarification, ou valider des tests existants.",
      "Comment puis-je vous assister dans cette session BDD ? Je peux vous aider à créer des scénarios Gherkin ou analyser vos exigences.",
      "N'hésitez pas à me poser des questions sur vos exigences ou à me demander de générer des scénarios de test."
    ];

    const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

    return {
      type: 'default',
      content: randomResponse,
      metadata: {
        processing_time: 10,
        confidence_score: 0.9
      }
    };
  }

  async saveInteraction(sessionId, userMessage, botResponse, context) {
    try {
      // Sauvegarder le message utilisateur
      await Message.create({
        session_id: sessionId,
        sender_id: context.userId || null,
        sender_type: 'user',
        message_type: 'text',
        content: userMessage
      });

      // Sauvegarder la réponse du bot
      await Message.create({
        session_id: sessionId,
        sender_id: null,
        sender_type: 'bot',
        message_type: botResponse.type === 'scenario_generation' ? 'scenario' : 'text',
        content: botResponse.content,
        metadata: botResponse.metadata || {}
      });
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  }

  updateSessionContext(sessionId, userMessage, botResponse) {
    const context = this.sessionContexts.get(sessionId);
    if (context) {
      // Ajouter les nouveaux messages au contexte
      context.messages.push(
        {
          sender_type: 'user',
          content: userMessage,
          created_at: new Date()
        },
        {
          sender_type: 'bot',
          content: botResponse.content,
          created_at: new Date()
        }
      );

      // Garder seulement les 20 derniers messages
      if (context.messages.length > 20) {
        context.messages = context.messages.slice(-20);
      }

      // Ajouter les nouveaux scénarios si applicable
      if (botResponse.scenarios) {
        context.scenarios.push(...botResponse.scenarios.map(s => ({
          title: s.title,
          gherkin_content: s.gherkin_content,
          status: s.status
        })));
      }
    }
  }

  categorizeScenario(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('erreur') || lowerContent.includes('échec') || lowerContent.includes('invalide')) {
      return 'error';
    } else if (lowerContent.includes('performance') || lowerContent.includes('charge') || lowerContent.includes('rapidité')) {
      return 'performance';
    } else if (lowerContent.includes('sécurité') || lowerContent.includes('authentification') || lowerContent.includes('autorisation')) {
      return 'security';
    } else if (lowerContent.includes('accessibilité') || lowerContent.includes('handicap') || lowerContent.includes('lecteur d\'écran')) {
      return 'accessibility';
    } else if (lowerContent.includes('limite') || lowerContent.includes('maximum') || lowerContent.includes('minimum')) {
      return 'edge_case';
    } else {
      return 'nominal';
    }
  }

  formatScenarioResponse(scenarios) {
    let response = "J'ai généré les scénarios de test suivants :\n\n";
    
    scenarios.forEach((scenario, index) => {
      response += `**${index + 1}. ${scenario.title}**\n\n`;
      response += "```gherkin\n";
      response += scenario.content;
      response += "\n```\n\n";
    });

    response += "Ces scénarios couvrent les cas principaux. Souhaitez-vous que je génère des scénarios additionnels ou que je modifie certains aspects ?";
    
    return response;
  }

  formatQuestionsResponse(questions) {
    let response = "Pour mieux comprendre vos exigences, j'ai quelques questions de clarification :\n\n";
    
    questions.forEach(question => {
      response += `${question.number}. ${question.question}\n\n`;
    });

    response += "Ces questions m'aideront à générer des scénarios plus précis et complets.";
    
    return response;
  }

  formatValidationResponse(validation) {
    let response = `**Analyse de qualité des scénarios (Score: ${validation.score}/100)**\n\n`;
    response += validation.feedback;
    
    if (validation.suggestions && validation.suggestions.length > 0) {
      response += "\n\n**Suggestions d'amélioration :**\n";
      validation.suggestions.forEach((suggestion, index) => {
        response += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return response;
  }

  createErrorResponse(error, type = 'general') {
    console.error(`Bot error (${type}):`, error);
    
    const errorMessages = {
      scenario_generation: "Désolé, je rencontre des difficultés pour générer les scénarios. Pouvez-vous reformuler votre demande ou être plus spécifique ?",
      clarification: "Je ne peux pas poser de questions de clarification pour le moment. Essayez de reformuler votre demande.",
      validation: "Je ne peux pas valider les scénarios actuellement. Veuillez réessayer plus tard.",
      general: "Je rencontre des difficultés techniques. Pouvez-vous reformuler votre question ?"
    };

    return {
      type: 'error',
      content: errorMessages[type] || errorMessages.general,
      error: error.message,
      metadata: {
        processing_time: 0,
        confidence_score: 0
      }
    };
  }

  clearSessionContext(sessionId) {
    this.sessionContexts.delete(sessionId);
  }

  getSessionStats(sessionId) {
    const context = this.sessionContexts.get(sessionId);
    if (!context) {
      return null;
    }

    return {
      messages_count: context.messages.length,
      scenarios_count: context.scenarios.length,
      last_activity: context.messages[context.messages.length - 1]?.created_at
    };
  }
}

module.exports = new BotEngine();

