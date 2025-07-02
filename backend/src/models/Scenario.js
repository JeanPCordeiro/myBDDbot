const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Scenario = sequelize.define('Scenario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gherkin_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  scenario_type: {
    type: DataTypes.ENUM('scenario', 'scenario_outline', 'background'),
    allowNull: false,
    defaultValue: 'scenario'
  },
  category: {
    type: DataTypes.ENUM('nominal', 'error', 'edge_case', 'performance', 'security', 'accessibility'),
    allowNull: false,
    defaultValue: 'nominal'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('draft', 'review', 'approved', 'implemented', 'tested', 'archived'),
    defaultValue: 'draft',
    allowNull: false
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true // null si créé par le bot
  },
  created_by_type: {
    type: DataTypes.ENUM('user', 'bot'),
    allowNull: false,
    defaultValue: 'bot'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  validation_results: {
    type: DataTypes.JSON,
    defaultValue: {
      syntax_valid: true,
      syntax_errors: [],
      completeness_score: 0,
      quality_score: 0,
      suggestions: []
    }
  },
  test_data: {
    type: DataTypes.JSON,
    defaultValue: {
      examples: [],
      fixtures: [],
      mocks: []
    }
  },
  automation_info: {
    type: DataTypes.JSON,
    defaultValue: {
      automatable: true,
      complexity: 'medium',
      estimated_effort: null,
      dependencies: []
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  parent_scenario_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'scenarios',
      key: 'id'
    }
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'scenarios',
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['category']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['parent_scenario_id']
    }
  ]
});

// Méthodes d'instance
Scenario.prototype.isGeneratedByBot = function() {
  return this.created_by_type === 'bot';
};

Scenario.prototype.isDraft = function() {
  return this.status === 'draft';
};

Scenario.prototype.isApproved = function() {
  return this.status === 'approved';
};

Scenario.prototype.approve = function(approvedBy) {
  this.status = 'approved';
  this.approved_by = approvedBy;
  this.approved_at = new Date();
  return this.save();
};

Scenario.prototype.reject = function() {
  this.status = 'draft';
  this.approved_by = null;
  this.approved_at = null;
  return this.save();
};

Scenario.prototype.createNewVersion = function(newContent, modifiedBy) {
  const newScenario = {
    session_id: this.session_id,
    title: this.title,
    description: this.description,
    gherkin_content: newContent,
    scenario_type: this.scenario_type,
    category: this.category,
    priority: this.priority,
    status: 'draft',
    created_by: modifiedBy,
    created_by_type: 'user',
    tags: this.tags,
    version: this.version + 1,
    parent_scenario_id: this.id
  };
  
  return Scenario.create(newScenario);
};

Scenario.prototype.validateGherkin = function() {
  const content = this.gherkin_content;
  const errors = [];
  let isValid = true;

  // Validation basique de la syntaxe Gherkin
  if (!content.includes('Scénario:') && !content.includes('Scenario:')) {
    errors.push('Le scénario doit commencer par "Scénario:" ou "Scenario:"');
    isValid = false;
  }

  const hasGiven = content.includes('Étant donné') || content.includes('Given');
  const hasWhen = content.includes('Quand') || content.includes('When');
  const hasThen = content.includes('Alors') || content.includes('Then');

  if (!hasGiven) {
    errors.push('Le scénario doit contenir au moins un "Étant donné" (Given)');
    isValid = false;
  }

  if (!hasWhen) {
    errors.push('Le scénario doit contenir au moins un "Quand" (When)');
    isValid = false;
  }

  if (!hasThen) {
    errors.push('Le scénario doit contenir au moins un "Alors" (Then)');
    isValid = false;
  }

  this.validation_results = {
    syntax_valid: isValid,
    syntax_errors: errors,
    completeness_score: isValid ? 85 : 50,
    quality_score: this.calculateQualityScore(),
    suggestions: this.generateSuggestions()
  };

  return this.save();
};

Scenario.prototype.calculateQualityScore = function() {
  let score = 0;
  const content = this.gherkin_content;

  // Critères de qualité
  if (this.title && this.title.length > 10) score += 10;
  if (this.description && this.description.length > 20) score += 10;
  if (content.length > 100) score += 20;
  if (content.includes('Examples:') || content.includes('Exemples:')) score += 20;
  if (this.tags && this.tags.length > 0) score += 10;
  if (content.split('\n').length > 5) score += 15;
  if (!/TODO|FIXME|XXX/.test(content)) score += 15;

  return Math.min(score, 100);
};

Scenario.prototype.generateSuggestions = function() {
  const suggestions = [];
  const content = this.gherkin_content;

  if (!this.description) {
    suggestions.push('Ajouter une description pour clarifier l\'objectif du scénario');
  }

  if (!content.includes('Examples:') && !content.includes('Exemples:')) {
    suggestions.push('Considérer l\'ajout d\'exemples pour illustrer le scénario');
  }

  if (this.tags.length === 0) {
    suggestions.push('Ajouter des tags pour faciliter l\'organisation et l\'exécution');
  }

  if (content.length < 100) {
    suggestions.push('Le scénario semble trop court, considérer l\'ajout de détails');
  }

  return suggestions;
};

// Méthodes de classe
Scenario.findBySession = function(sessionId) {
  return this.findAll({
    where: { session_id: sessionId },
    order: [['created_at', 'ASC']]
  });
};

Scenario.findByStatus = function(sessionId, status) {
  return this.findAll({
    where: {
      session_id: sessionId,
      status: status
    },
    order: [['created_at', 'ASC']]
  });
};

Scenario.findByCategory = function(sessionId, category) {
  return this.findAll({
    where: {
      session_id: sessionId,
      category: category
    },
    order: [['priority', 'DESC'], ['created_at', 'ASC']]
  });
};

Scenario.findApproved = function(sessionId) {
  return this.findAll({
    where: {
      session_id: sessionId,
      status: 'approved'
    },
    order: [['approved_at', 'DESC']]
  });
};

Scenario.getSessionStats = function(sessionId) {
  return this.findAll({
    where: { session_id: sessionId },
    attributes: [
      'status',
      'category',
      'priority',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status', 'category', 'priority']
  });
};

Scenario.searchInSession = function(sessionId, searchTerm) {
  return this.findAll({
    where: {
      session_id: sessionId,
      [sequelize.Op.or]: [
        { title: { [sequelize.Op.like]: `%${searchTerm}%` } },
        { description: { [sequelize.Op.like]: `%${searchTerm}%` } },
        { gherkin_content: { [sequelize.Op.like]: `%${searchTerm}%` } }
      ]
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = Scenario;

