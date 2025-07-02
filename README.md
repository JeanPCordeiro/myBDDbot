# BDD Bot Application

## Vue d'ensemble

Application de bot LLM pour faciliter les sessions BDD (Behavior-Driven Development) avec la méthode des Trois Amigos. Cette application collaborative permet au business analyst, développeur et testeur de définir ensemble les critères d'acceptation et scénarios de test.

## Fonctionnalités principales

- Interface web pour les sessions BDD collaboratives
- Bot LLM intégré jouant le rôle du testeur
- Facilitation automatisée des sessions Trois Amigos
- Génération de scénarios de test
- Configuration flexible de l'API OpenAI

## Architecture

- **Backend**: Express.js avec intégration OpenAI API
- **Frontend**: React.js avec interface responsive
- **Base de données**: À définir selon les besoins
- **Déploiement**: Containers Docker sur AWS Fargate
- **CI/CD**: GitHub Actions

## Principes de développement

1. Architecture Decision Records (ADR) en syntaxe MADR
2. Modélisation C4 Model en syntaxe C4-PlantUML
3. Approche Test-First avec BDD puis TDD
4. JavaScript exclusivement (Express + React)
5. Gestion de code avec GitHub
6. CI/CD avec GitHub Actions
7. Déploiement containerisé sur AWS Fargate

## Structure du projet

```
bdd-bot-app/
├── adr/                 # Architecture Decision Records
├── docs/                # Documentation et diagrammes
├── backend/             # API Express.js
├── frontend/            # Application React
├── tests/               # Tests d'intégration et E2E
├── docker/              # Fichiers Docker
├── ci-cd/               # Configuration CI/CD
└── README.md
```

## Démarrage rapide

[À compléter lors du développement]

## Documentation

- [ADR](./adr/) - Décisions d'architecture
- [Documentation technique](./docs/) - Diagrammes et spécifications
- [Guide de déploiement](./docs/deployment.md)

## Contribution

[À compléter]

## Licence

MIT
