# Migration de MariaDB vers SQLite

* Status: accepted
* Deciders: Équipe de développement
* Date: 2025-07-02

## Context and Problem Statement

L'application BDD Bot était initialement conçue avec MariaDB comme base de données. Cependant, pour simplifier le déploiement et réduire la complexité de l'infrastructure, une migration vers SQLite a été demandée.

## Decision Drivers

* Simplification du déploiement
* Réduction de la complexité infrastructure
* Élimination des dépendances externes
* Facilitation du développement local
* Réduction des coûts d'hébergement

## Considered Options

* Garder MariaDB
* Migrer vers SQLite
* Migrer vers PostgreSQL

## Decision Outcome

Chosen option: "Migrer vers SQLite", because:

* **Simplicité de déploiement** : Aucun serveur de base de données externe requis
* **Développement local facilité** : Pas de configuration de base de données nécessaire
* **Réduction des coûts** : Élimination des coûts RDS en production
* **Performance suffisante** : SQLite convient parfaitement pour les volumes de données attendus
* **Fiabilité** : SQLite est très stable et largement utilisé
* **Portabilité** : Base de données embarquée dans l'application

### Positive Consequences

* Déploiement simplifié (un seul container au lieu de deux)
* Pas de configuration de base de données requise
* Développement local plus rapide
* Réduction des coûts d'infrastructure
* Sauvegarde simplifiée (fichier unique)
* Pas de problèmes de connectivité réseau avec la base

### Negative Consequences

* Limitation de la scalabilité horizontale
* Pas de réplication native
* Accès concurrent limité (mais suffisant pour l'usage prévu)
* Sauvegarde liée au cycle de vie du container

## Pros and Cons of the Options

### Garder MariaDB

* Good, because réplication et haute disponibilité natives
* Good, because accès concurrent illimité
* Good, because séparation claire des responsabilités
* Bad, because complexité de déploiement
* Bad, because coûts d'infrastructure supplémentaires
* Bad, because configuration requise pour le développement

### Migrer vers SQLite

* Good, because simplicité de déploiement
* Good, because pas de configuration requise
* Good, because performance excellente pour les lectures
* Good, because fiabilité prouvée
* Bad, because limitation de la scalabilité
* Bad, because pas de réplication native

### Migrer vers PostgreSQL

* Good, because fonctionnalités avancées
* Good, because performance et scalabilité
* Bad, because même complexité que MariaDB
* Bad, because coûts similaires à MariaDB

## Implementation

### Changements Techniques

1. **Dépendances**
   - Suppression : `mysql2`, `mariadb`
   - Ajout : `sqlite3`

2. **Configuration**
   - Mise à jour de `config/database.js` pour SQLite
   - Simplification des variables d'environnement
   - Création automatique du répertoire de base de données

3. **Docker**
   - Suppression du service MariaDB dans `docker-compose.yml`
   - Ajout d'un volume pour la persistance SQLite
   - Mise à jour du Dockerfile backend

4. **AWS/Production**
   - Remplacement de RDS par EFS pour la persistance
   - Mise à jour des task definitions ECS
   - Simplification des secrets (plus de credentials DB)

### Migration des Données

Pour les déploiements existants :
1. Export des données MariaDB vers SQL
2. Adaptation du schéma pour SQLite
3. Import dans la nouvelle base SQLite

### Tests

- Validation du fonctionnement avec SQLite
- Tests de performance
- Vérification de la persistance des données
- Tests de déploiement Docker

## Links

* [SQLite Documentation](https://sqlite.org/docs.html)
* [Sequelize SQLite Guide](https://sequelize.org/docs/v6/other-topics/dialect-specific-things/#sqlite)
* [Docker Volumes](https://docs.docker.com/storage/volumes/)
* [AWS EFS](https://docs.aws.amazon.com/efs/)

## Notes

Cette migration maintient la compatibilité avec Sequelize ORM, donc aucun changement n'est requis dans les modèles de données ou la logique métier. Seule la configuration de connexion change.

