# Architecture de l'application BDD Bot

* Status: accepted
* Deciders: Équipe de développement
* Date: 2025-01-07

## Context and Problem Statement

L'application BDD Bot doit faciliter les sessions collaboratives selon la méthode des Trois Amigos. Le bot LLM joue le rôle du testeur et doit pouvoir :
- Guider les participants dans la session
- Poser les bonnes questions pour clarifier les exigences
- Générer des scénarios de test en format Gherkin
- Identifier les cas de test manquants
- Faciliter la communication entre les rôles

Nous devons définir une architecture qui supporte ces fonctionnalités tout en restant extensible et maintenable.

## Decision Drivers

* Séparation claire des responsabilités
* Facilité d'intégration avec l'API OpenAI
* Interface utilisateur intuitive
* Gestion des sessions collaboratives
* Persistance des données de session
* Scalabilité pour plusieurs sessions simultanées
* Sécurité des clés API

## Considered Options

### Architecture générale
* Architecture monolithique avec frontend et backend séparés
* Architecture microservices
* Architecture serverless

### Gestion des sessions
* Sessions en mémoire (stateless)
* Persistance en base de données
* Stockage en session browser

### Interface utilisateur
* Single Page Application (SPA)
* Multi-page avec server-side rendering
* Progressive Web App (PWA)

## Decision Outcome

Chosen option: **Architecture monolithique avec frontend SPA et backend API, sessions persistées**

### Positive Consequences

* Simplicité de développement et déploiement
* Facilité de debugging et maintenance
* Performance optimale pour les besoins actuels
* Coût d'infrastructure réduit
* Facilité de tests end-to-end

### Negative Consequences

* Scaling horizontal plus complexe (acceptable pour le scope actuel)
* Couplage plus fort entre composants

## Architecture Components

### Backend (Express.js)

#### Core Modules
- **Session Manager**: Gestion des sessions BDD collaboratives
- **OpenAI Service**: Interface avec l'API OpenAI
- **Bot Engine**: Logique métier du bot testeur
- **API Routes**: Endpoints REST pour le frontend
- **Configuration Manager**: Gestion des paramètres (clés API, etc.)

#### Data Models
- **Session**: Représente une session BDD avec participants
- **Scenario**: Scénarios Gherkin générés ou modifiés
- **Participant**: Rôles des participants (BA, Dev, Testeur)
- **Message**: Historique des échanges dans la session

### Frontend (React.js)

#### Core Components
- **SessionDashboard**: Vue d'ensemble des sessions
- **SessionRoom**: Interface de session collaborative
- **ConfigurationPanel**: Configuration des paramètres
- **ScenarioEditor**: Éditeur de scénarios Gherkin
- **ChatInterface**: Interface de communication avec le bot

#### State Management
- Context API React pour l'état global
- Local state pour les composants spécifiques
- WebSocket pour la synchronisation temps réel

### Data Flow

1. **Initialisation de session**
   - Création de session via API
   - Configuration des participants
   - Initialisation du contexte métier

2. **Session collaborative**
   - Échanges via WebSocket
   - Bot LLM analyse et répond
   - Génération de scénarios en temps réel

3. **Persistance**
   - Sauvegarde automatique des sessions
   - Export des scénarios générés
   - Historique des sessions

## Implementation Strategy

### Phase 1: Core Backend
```javascript
// Structure des modules backend
backend/
├── src/
│   ├── controllers/     // API endpoints
│   ├── services/        // Business logic
│   ├── models/          // Data models
│   ├── middleware/      // Express middleware
│   └── utils/           // Utilities
├── tests/
└── package.json
```

### Phase 2: Frontend Foundation
```javascript
// Structure des composants React
frontend/
├── src/
│   ├── components/      // React components
│   ├── pages/           // Page components
│   ├── services/        // API calls
│   ├── hooks/           // Custom hooks
│   └── utils/           // Utilities
├── public/
└── package.json
```

### Phase 3: Integration
- WebSocket pour communication temps réel
- Intégration OpenAI dans le backend
- Tests d'intégration complets

## Security Considerations

* Clés API OpenAI stockées côté serveur uniquement
* Validation des inputs utilisateur
* Rate limiting sur les appels API
* Sessions sécurisées avec tokens

## Performance Considerations

* Cache des réponses OpenAI fréquentes
* Optimisation des re-renders React
* Compression des réponses API
* Lazy loading des composants

## Links

* [Méthode des Trois Amigos](https://www.agilealliance.org/glossary/three-amigos/)
* [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
* [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

