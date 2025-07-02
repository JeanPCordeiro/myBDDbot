# Structure BDD et stratégie de tests

* Status: accepted
* Deciders: Équipe de développement
* Date: 2025-01-07

## Context and Problem Statement

L'application BDD Bot doit suivre une approche Test-First rigoureuse avec BDD puis TDD. Nous devons définir :
- La structure des tests BDD (features, scenarios, steps)
- L'organisation des tests unitaires et d'intégration
- Les outils et frameworks de test
- La stratégie d'automatisation des tests
- L'intégration avec le processus de développement

L'objectif est d'assurer une couverture de test complète tout en maintenant la productivité de développement.

## Decision Drivers

* Approche Test-First obligatoire
* Couverture de test maximale
* Facilité de maintenance des tests
* Intégration avec le workflow de développement
* Performance des tests
* Lisibilité et documentation vivante
* Support des tests end-to-end

## Considered Options

### Frameworks BDD JavaScript
* Cucumber.js (standard de facto)
* Jest avec extensions BDD
* Mocha avec Chai BDD
* Jasmine BDD

### Frameworks de test
* Jest (tests unitaires et intégration)
* Mocha + Chai (flexibilité)
* Vitest (performance)
* Cypress (E2E)
* Playwright (E2E moderne)

### Structure des tests
* Tests par couche (unit, integration, e2e)
* Tests par fonctionnalité
* Tests par composant

## Decision Outcome

Chosen option: **Cucumber.js pour BDD + Jest pour tests unitaires + Playwright pour E2E**

### Positive Consequences

* Séparation claire entre tests métier (BDD) et tests techniques
* Documentation vivante avec les features Gherkin
* Écosystème JavaScript unifié
* Excellent support pour les tests asynchrones
* Performance optimale avec Jest
* Tests E2E robustes avec Playwright

### Negative Consequences

* Complexité initiale de setup
* Maintenance de plusieurs frameworks
* Courbe d'apprentissage pour Cucumber.js

## BDD Structure and Organization

### Structure des répertoires
```
tests/
├── features/                 # Features BDD en Gherkin
│   ├── session-management.feature
│   ├── bot-interaction.feature
│   └── scenario-generation.feature
├── step-definitions/         # Implémentation des steps
│   ├── session-steps.js
│   ├── bot-steps.js
│   └── scenario-steps.js
├── support/                  # Utilitaires et configuration
│   ├── world.js             # Contexte partagé
│   ├── hooks.js             # Before/After hooks
│   └── helpers.js           # Fonctions utilitaires
├── unit/                    # Tests unitaires Jest
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/             # Tests d'intégration
│   ├── api/
│   └── database/
└── e2e/                     # Tests end-to-end Playwright
    ├── specs/
    └── fixtures/
```

### Exemple de feature BDD
```gherkin
# features/session-management.feature
Feature: Gestion des sessions BDD
  En tant qu'utilisateur de l'application BDD Bot
  Je veux pouvoir créer et gérer des sessions collaboratives
  Afin de faciliter les sessions Trois Amigos

  Background:
    Given l'application BDD Bot est démarrée
    And l'API OpenAI est configurée avec une clé valide

  Scenario: Création d'une nouvelle session
    Given je suis sur la page d'accueil
    When je clique sur "Nouvelle session"
    And je renseigne le titre "Session Product Backlog"
    And je sélectionne les participants "BA, Dev, Testeur"
    And je clique sur "Créer la session"
    Then la session est créée avec succès
    And je suis redirigé vers l'interface de session
    And le bot affiche un message de bienvenue

  Scenario: Interaction avec le bot testeur
    Given une session active "Session Product Backlog"
    And je suis dans l'interface de session
    When je tape "Nous voulons ajouter une fonctionnalité de recherche"
    And j'envoie le message
    Then le bot répond dans les 5 secondes
    And la réponse contient des questions de clarification
    And la réponse est pertinente au contexte BDD
```

### Configuration Cucumber.js
```javascript
// cucumber.config.js
module.exports = {
  default: {
    require: [
      'tests/step-definitions/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    publishQuiet: true,
    parallel: 2
  }
};
```

## Test Strategy by Layer

### 1. Tests BDD (Acceptance Tests)
**Objectif**: Valider les comportements métier selon les spécifications

**Scope**: 
- Fonctionnalités complètes end-to-end
- Scénarios utilisateur réels
- Intégration avec l'API OpenAI

**Exemples**:
- Création et gestion de sessions
- Interaction avec le bot LLM
- Génération de scénarios Gherkin
- Configuration de l'API OpenAI

### 2. Tests unitaires (Jest)
**Objectif**: Valider la logique métier isolée

**Scope**:
- Services et utilitaires
- Fonctions pures
- Logique de validation
- Transformations de données

**Configuration Jest**:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'backend/src/**/*.js',
    'frontend/src/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### 3. Tests d'intégration
**Objectif**: Valider l'interaction entre composants

**Scope**:
- API endpoints avec base de données
- Intégration OpenAI (avec mocks)
- WebSocket communication
- Middleware et authentification

### 4. Tests E2E (Playwright)
**Objectif**: Valider l'application complète dans un navigateur

**Scope**:
- Parcours utilisateur complets
- Interface utilisateur responsive
- Performance et accessibilité
- Tests cross-browser

**Configuration Playwright**:
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
};
```

## Test Data Management

### Fixtures et données de test
- Données de test isolées par environnement
- Factory pattern pour la génération de données
- Cleanup automatique après chaque test
- Données réalistes pour les tests BDD

### Mocking Strategy
- **OpenAI API**: Mocks pour les tests unitaires et d'intégration
- **Base de données**: Base de test isolée
- **WebSocket**: Mocks pour les tests unitaires
- **Services externes**: Stubs configurables

## Continuous Testing

### Pre-commit hooks
```javascript
// .husky/pre-commit
#!/bin/sh
npm run lint
npm run test:unit
npm run test:bdd:quick
```

### Pipeline CI/CD
1. **Lint et format**: ESLint + Prettier
2. **Tests unitaires**: Jest avec couverture
3. **Tests BDD**: Cucumber.js (scénarios critiques)
4. **Tests d'intégration**: API et base de données
5. **Tests E2E**: Playwright (navigateurs principaux)
6. **Analyse de qualité**: SonarQube

### Stratégie de parallélisation
- Tests unitaires: Parallélisation automatique Jest
- Tests BDD: Parallélisation par feature
- Tests E2E: Parallélisation par navigateur
- Tests d'intégration: Séquentiel pour éviter les conflits

## Quality Gates

### Critères de passage
- **Couverture de code**: Minimum 80%
- **Tests BDD**: 100% des scénarios critiques passent
- **Tests E2E**: 100% des parcours principaux passent
- **Performance**: Temps de réponse < 2s
- **Accessibilité**: Score WCAG AA

### Métriques de qualité
- Temps d'exécution des tests
- Taux de flakiness des tests
- Couverture fonctionnelle
- Feedback time du pipeline

## Documentation and Reporting

### Rapports automatisés
- Rapport de couverture Jest
- Rapport HTML Cucumber
- Rapport Playwright avec screenshots
- Dashboard de métriques de test

### Documentation vivante
- Features Gherkin comme documentation métier
- Tests comme exemples d'utilisation
- Génération automatique de documentation API

## Maintenance and Evolution

### Refactoring des tests
- Révision régulière des tests obsolètes
- Factorisation des steps communes
- Optimisation des performances de test

### Évolution de la stratégie
- Ajout de nouveaux types de tests selon les besoins
- Adaptation aux nouvelles fonctionnalités
- Amélioration continue basée sur les métriques

## Links

* [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
* [Jest Documentation](https://jestjs.io/docs/getting-started)
* [Playwright Documentation](https://playwright.dev/)
* [BDD Best Practices](https://cucumber.io/docs/bdd/)
* [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

