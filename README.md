npm instal# BDD Bot Application

## Vue d'Ensemble

BDD Bot est une application web intelligente qui facilite les sessions de développement dirigé par le comportement (BDD) selon la méthode des Trois Amigos. L'application utilise l'intelligence artificielle OpenAI pour guider les équipes dans la création de scénarios de test de qualité.

## 🚀 Fonctionnalités Principales

- 🤖 **Assistant IA Intelligent** : Bot testeur qui guide les discussions BDD
- 👥 **Collaboration Temps Réel** : Sessions collaboratives avec WebSocket
- 📝 **Génération de Scénarios** : Création automatique de scénarios Gherkin
- ✅ **Validation Automatique** : Vérification de la syntaxe et complétude
- 🎯 **Interface Moderne** : React avec design responsive et mode sombre
- 🔧 **Configuration Flexible** : Paramètres personnalisables pour le bot
- 📊 **Gestion de Sessions** : Historique et suivi des sessions BDD

## 🏗️ Architecture

### Stack Technologique
- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Express.js + Socket.IO + Sequelize ORM
- **Base de données** : SQLite
- **IA** : OpenAI GPT-4 Turbo
- **Déploiement** : Docker + AWS Fargate
- **CI/CD** : GitHub Actions

### Architecture C4
- **Contexte** : Application web pour équipes de développement
- **Containers** : Frontend React, Backend Express, Base SQLite
- **Composants** : Services métier, contrôleurs API, gestion WebSocket

## 📋 Prérequis

- Node.js 18+
- Docker et Docker Compose
- Clé API OpenAI
- Git

## 🚀 Installation et Démarrage

### Déploiement Local Rapide

```bash
# Cloner le repository
git clone <repository-url>
cd bdd-bot-app

# Déploiement automatique
./deploy.sh local
```

### Installation Manuelle

```bash
# 1. Configuration
cp .env.example .env
# Éditer .env avec vos valeurs

# 2. Backend
cd backend
npm install
npm run dev

# 3. Frontend (nouveau terminal)
cd frontend
npm install
npm run dev

# 4. Base de données SQLite (créée automatiquement)
# Aucune configuration nécessaire
```

### Accès à l'Application

- **Frontend** : http://localhost:5173 (dev) ou http://localhost:8080 (prod)
- **Backend API** : http://localhost:3001
- **Base de données** : SQLite (fichier local)

## 📖 Documentation

### Guides Utilisateur
- [Guide Utilisateur Complet](docs/guide-utilisateur.md)
- [Guide de Déploiement](docs/guide-deploiement.md)
- [Architecture Générale](docs/architecture-generale.md)

### Documentation Technique
- [Spécifications Fonctionnelles](docs/specifications-fonctionnelles.md)
- [User Stories](docs/user-stories.md)
- [ADR (Architecture Decision Records)](adr/)

### Diagrammes
- [Diagramme de Contexte C4](docs/c4-context-diagram.png)
- [Diagramme de Containers C4](docs/c4-container-diagram.png)
- [Diagramme de Composants C4](docs/c4-component-diagram.png)

## 🔧 Configuration

### Configuration OpenAI (Obligatoire)

1. Obtenez une clé API sur [platform.openai.com](https://platform.openai.com/api-keys)
2. Accédez à Configuration > OpenAI dans l'application
3. Saisissez votre clé API et testez la connexion

### Variables d'Environnement

```env
# Backend
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# Base de données SQLite
DB_DIALECT=sqlite
DB_STORAGE=./database/bdd_bot.sqlite

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo
```

## 🧪 Tests

### Tests Backend
```bash
cd backend
npm test                # Tests unitaires
npm run test:integration # Tests d'intégration
```

### Tests Frontend
```bash
cd frontend
npm test                # Tests unitaires
npm run test:e2e        # Tests end-to-end
```

### Tests Complets
```bash
# Via Docker Compose
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 🚀 Déploiement

### Environnements Disponibles

- **Local** : `./deploy.sh local`
- **Staging** : `./deploy.sh staging`
- **Production** : `./deploy.sh production`

### CI/CD

Le pipeline GitHub Actions inclut :
- Tests automatiques (Jest, Playwright)
- Analyse de sécurité (Trivy)
- Build et push des images Docker
- Déploiement automatique sur AWS Fargate

### AWS Fargate

Configuration pour déploiement en production :
- ECS Cluster avec Auto Scaling
- Volumes persistants pour SQLite
- Application Load Balancer
- CloudFront CDN
- WAF et certificats SSL

## 📊 Monitoring

### Métriques Surveillées
- Performance des APIs
- Utilisation des ressources
- Sessions actives
- Erreurs et exceptions

### Logs
- CloudWatch Logs pour AWS
- Logs structurés JSON
- Niveaux : error, warn, info, debug

## 🤝 Contribution

### Workflow de Développement

1. Fork du repository
2. Créer une branche feature : `git checkout -b feature/nouvelle-fonctionnalite`
3. Développer et tester
4. Commit avec messages conventionnels
5. Push et créer une Pull Request

### Standards de Code

- **Backend** : ESLint + Prettier
- **Frontend** : ESLint + Prettier + TypeScript strict
- **Tests** : Couverture minimale 80%
- **Documentation** : JSDoc pour les fonctions publiques

## 📝 Changelog

### Version 1.0.0 (2025-07-02)

#### ✨ Nouvelles Fonctionnalités
- Interface utilisateur complète avec React
- Backend Express avec API REST et WebSocket
- Intégration OpenAI GPT-4 Turbo
- Gestion de sessions BDD collaboratives
- Génération automatique de scénarios Gherkin
- Configuration flexible du bot assistant
- Support multi-thème (clair/sombre)
- Déploiement containerisé avec Docker

#### 🏗️ Architecture
- Architecture C4 documentée
- ADR pour les décisions techniques
- Tests complets (unitaires, intégration, E2E)
- CI/CD avec GitHub Actions
- Déploiement AWS Fargate

#### 📚 Documentation
- Guide utilisateur complet
- Guide de déploiement détaillé
- Spécifications fonctionnelles
- User stories et scénarios Gherkin

## 🔒 Sécurité

- Chiffrement des communications (HTTPS/WSS)
- Authentification JWT
- Validation des entrées
- Protection CORS
- Rate limiting
- Secrets gérés via AWS Secrets Manager

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Architecture** : Conception C4 et ADR
- **Backend** : Express.js + OpenAI + WebSocket
- **Frontend** : React + TypeScript + shadcn/ui
- **DevOps** : Docker + AWS + GitHub Actions
- **Documentation** : Guides utilisateur et technique

## 📞 Support

- **Documentation** : Consultez les guides dans `/docs`
- **Issues** : Ouvrez un ticket GitHub
- **Discussions** : GitHub Discussions pour les questions

---

**BDD Bot Application v1.0.0** - Facilitez vos sessions BDD avec l'intelligence artificielle

