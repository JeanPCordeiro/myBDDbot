const OpenAI = require('openai');
const config = require('../../config/config');

class OpenAIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    if (!config.openai.apiKey) {
      console.warn('⚠️ OpenAI API key not configured');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
        organization: config.openai.orgId,
        timeout: config.openai.timeout
      });
      this.isConfigured = true;
      console.log('✅ OpenAI service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI service:', error.message);
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured');
    }

    try {
      const response = await this.client.models.list();
      return {
        success: true,
        models: response.data.map(model => model.id),
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Connection failed'
      };
    }
  }

  async generateResponse(prompt, context = {}, options = {}) {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured');
    }

    const {
      model = config.openai.model,
      maxTokens = config.openai.maxTokens,
      temperature = config.openai.temperature,
      systemPrompt = this.getSystemPrompt(context.role || 'tester')
    } = options;

    try {
      const startTime = Date.now();
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.buildContextMessages(context),
        { role: 'user', content: prompt }
      ];

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false
      });

      const processingTime = Date.now() - startTime;
      const choice = response.choices[0];

      return {
        content: choice.message.content,
        metadata: {
          model: response.model,
          tokens_used: response.usage.total_tokens,
          processing_time: processingTime,
          finish_reason: choice.finish_reason,
          confidence_score: this.calculateConfidenceScore(choice)
        }
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Tentative avec le modèle de fallback
      if (model !== config.openai.fallbackModel) {
        console.log('Retrying with fallback model...');
        return this.generateResponse(prompt, context, {
          ...options,
          model: config.openai.fallbackModel
        });
      }
      
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateScenarios(requirements, context = {}) {
    const prompt = this.buildScenarioPrompt(requirements, context);
    
    const response = await this.generateResponse(prompt, context, {
      systemPrompt: this.getSystemPrompt('scenario_generator'),
      temperature: 0.7
    });

    return {
      scenarios: this.parseScenarios(response.content),
      metadata: response.metadata
    };
  }

  async askClarificationQuestions(requirements, context = {}) {
    const prompt = this.buildClarificationPrompt(requirements, context);
    
    const response = await this.generateResponse(prompt, context, {
      systemPrompt: this.getSystemPrompt('clarification'),
      temperature: 0.8
    });

    return {
      questions: this.parseQuestions(response.content),
      metadata: response.metadata
    };
  }

  async validateScenarios(scenarios, context = {}) {
    const prompt = this.buildValidationPrompt(scenarios, context);
    
    const response = await this.generateResponse(prompt, context, {
      systemPrompt: this.getSystemPrompt('validator'),
      temperature: 0.3
    });

    return {
      validation: this.parseValidation(response.content),
      metadata: response.metadata
    };
  }

  getSystemPrompt(role) {
    const prompts = {
      tester: `Vous êtes un testeur expert spécialisé dans les méthodes BDD et la méthode des Trois Amigos.
Votre rôle est de :
1. Poser des questions pertinentes pour clarifier les exigences
2. Identifier les cas de test manquants ou ambigus
3. Générer des scénarios Gherkin complets et cohérents
4. Faciliter la communication entre Business Analyst et Développeur
5. Assurer la qualité et la complétude des critères d'acceptation

Utilisez un ton professionnel mais accessible, et structurez vos réponses de manière claire.
Répondez toujours en français sauf indication contraire.`,

      scenario_generator: `Vous êtes un expert en génération de scénarios de test BDD.
Générez des scénarios Gherkin complets, syntaxiquement corrects et couvrant :
- Les cas nominaux (happy path)
- Les cas d'erreur et de validation
- Les cas limites et edge cases
- Les cas de performance si pertinents

Utilisez la syntaxe Gherkin française avec "Étant donné", "Quand", "Alors".
Incluez des exemples concrets et des données de test réalistes.`,

      clarification: `Vous êtes un expert en analyse d'exigences.
Analysez les exigences fournies et posez des questions pertinentes pour :
- Clarifier les ambiguïtés
- Identifier les cas non couverts
- Préciser les critères d'acceptation
- Valider la faisabilité technique

Posez des questions ouvertes et structurées, numérotées pour faciliter les réponses.`,

      validator: `Vous êtes un expert en validation de scénarios de test.
Analysez les scénarios fournis et évaluez :
- La syntaxe Gherkin
- La complétude de la couverture
- La clarté et la testabilité
- La cohérence avec les bonnes pratiques BDD

Fournissez des suggestions d'amélioration concrètes et constructives.`
    };

    return prompts[role] || prompts.tester;
  }

  buildContextMessages(context) {
    const messages = [];

    if (context.businessContext) {
      messages.push({
        role: 'user',
        content: `Contexte métier : ${context.businessContext}`
      });
    }

    if (context.previousMessages && context.previousMessages.length > 0) {
      // Inclure les derniers messages pour le contexte
      const recentMessages = context.previousMessages.slice(-5);
      messages.push(...recentMessages.map(msg => ({
        role: msg.sender_type === 'bot' ? 'assistant' : 'user',
        content: msg.content
      })));
    }

    return messages;
  }

  buildScenarioPrompt(requirements, context) {
    return `Générez des scénarios de test BDD pour les exigences suivantes :

${requirements}

Contexte métier : ${context.businessContext || 'Générique'}

Générez au minimum :
- 1 scénario nominal (cas de succès)
- 1 scénario d'erreur
- 1 scénario de cas limite

Format attendu : Scénarios Gherkin complets avec titre, description et étapes.`;
  }

  buildClarificationPrompt(requirements, context) {
    return `Analysez les exigences suivantes et posez des questions de clarification :

${requirements}

Contexte métier : ${context.businessContext || 'Générique'}

Posez 3-5 questions pertinentes pour :
- Clarifier les ambiguïtés
- Identifier les cas non spécifiés
- Préciser les critères d'acceptation
- Valider les contraintes techniques

Numérotez vos questions et expliquez brièvement pourquoi chaque question est importante.`;
  }

  buildValidationPrompt(scenarios, context) {
    return `Validez les scénarios de test suivants :

${scenarios}

Évaluez :
1. La syntaxe Gherkin
2. La complétude de la couverture
3. La clarté et la testabilité
4. La cohérence avec les bonnes pratiques BDD

Fournissez un score de qualité (0-100) et des suggestions d'amélioration.`;
  }

  parseScenarios(content) {
    // Parser simple pour extraire les scénarios du contenu généré
    const scenarios = [];
    const lines = content.split('\n');
    let currentScenario = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Scénario:') || trimmedLine.startsWith('Scenario:')) {
        if (currentScenario) {
          scenarios.push(currentScenario);
        }
        currentScenario = {
          title: trimmedLine.replace(/^Scénario:\s*|^Scenario:\s*/, ''),
          content: line + '\n'
        };
      } else if (currentScenario) {
        currentScenario.content += line + '\n';
      }
    }

    if (currentScenario) {
      scenarios.push(currentScenario);
    }

    return scenarios;
  }

  parseQuestions(content) {
    // Parser pour extraire les questions numérotées
    const questions = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\.?\s*(.+)/);
      if (match) {
        questions.push({
          number: parseInt(match[1]),
          question: match[2].trim()
        });
      }
    }

    return questions;
  }

  parseValidation(content) {
    // Parser pour extraire les résultats de validation
    const scoreMatch = content.match(/score.*?(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    return {
      score,
      feedback: content,
      suggestions: this.extractSuggestions(content)
    };
  }

  extractSuggestions(content) {
    // Extraire les suggestions du contenu
    const suggestions = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('suggestion') || line.includes('amélioration') || line.includes('recommandation')) {
        suggestions.push(line.trim());
      }
    }

    return suggestions;
  }

  calculateConfidenceScore(choice) {
    // Calcul simple du score de confiance basé sur la réponse
    if (choice.finish_reason === 'stop') {
      return 0.9;
    } else if (choice.finish_reason === 'length') {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  async getUsageStats() {
    // Cette méthode pourrait être étendue pour récupérer les stats d'usage
    return {
      requests_today: 0,
      tokens_used_today: 0,
      estimated_cost: 0
    };
  }
}

module.exports = new OpenAIService();

