# language: fr
Fonctionnalité: Configuration et administration de l'application
  En tant qu'administrateur ou utilisateur avancé
  Je veux configurer les paramètres de l'application et de l'API OpenAI
  Afin de personnaliser le comportement du bot selon nos besoins spécifiques

  Contexte:
    Étant donné que je suis connecté en tant qu'administrateur
    Et que j'ai accès aux paramètres de configuration
    Et que l'application est démarrée

  Scénario: Configuration initiale de l'API OpenAI
    Étant donné que l'API OpenAI n'est pas encore configurée
    Quand j'accède aux paramètres de configuration
    Alors je vois un formulaire de configuration OpenAI
    Et je peux saisir ma clé API OpenAI
    Et je peux sélectionner le modèle (GPT-4, GPT-3.5-turbo)
    Et je peux définir les paramètres avancés :
      | Paramètre | Valeur par défaut | Description |
      | Temperature | 0.7 | Créativité des réponses |
      | Max tokens | 2000 | Longueur maximale des réponses |
      | Timeout | 30s | Délai d'attente des requêtes |

  Scénario: Test de connectivité à l'API OpenAI
    Étant donné que j'ai saisi une clé API OpenAI
    Quand je clique sur "Tester la connexion"
    Alors l'application envoie une requête de test à OpenAI
    Et je vois un message "Connexion réussie" si la clé est valide
    Et les informations du compte sont affichées (quota, usage)
    Et la configuration est automatiquement sauvegardée

  Scénario: Gestion d'une clé API invalide
    Étant donné que je saisis une clé API OpenAI incorrecte
    Quand je clique sur "Tester la connexion"
    Alors je vois un message d'erreur "Clé API invalide"
    Et les détails de l'erreur sont affichés
    Et la configuration n'est pas sauvegardée
    Et je peux corriger la clé et retester

  Scénario: Configuration des paramètres du bot testeur
    Étant donné que l'API OpenAI est configurée
    Quand j'accède aux paramètres du bot
    Alors je peux personnaliser :
      | Paramètre | Options disponibles |
      | Style de communication | Formel, Décontracté, Technique |
      | Niveau de détail | Basique, Intermédiaire, Expert |
      | Domaine métier | E-commerce, Finance, Santé, Générique |
      | Langue | Français, Anglais, Espagnol |
    Et je peux prévisualiser les changements
    Et les paramètres sont appliqués immédiatement

  Scénario: Gestion des templates de prompts
    Étant donné que je veux personnaliser les prompts du bot
    Quand j'accède à la section "Templates de prompts"
    Alors je vois les templates existants :
      | Template | Usage |
      | Prompt système | Définition du rôle du bot |
      | Génération de scénarios | Création de tests Gherkin |
      | Questions de clarification | Analyse des exigences |
      | Validation de qualité | Vérification des scénarios |
    Et je peux modifier chaque template
    Et je peux créer de nouveaux templates

  Scénario: Sauvegarde et restauration de configuration
    Étant donné que j'ai personnalisé la configuration
    Quand je clique sur "Exporter la configuration"
    Alors un fichier JSON est téléchargé
    Et il contient tous les paramètres (sauf les clés sensibles)
    Et je peux importer cette configuration sur une autre instance
    Et la configuration importée est validée avant application

  Scénario: Gestion des quotas et limites OpenAI
    Étant donné que l'API OpenAI est configurée
    Quand j'accède au monitoring des quotas
    Alors je vois l'usage actuel :
      | Métrique | Valeur |
      | Requêtes aujourd'hui | 150/1000 |
      | Tokens consommés | 45000/100000 |
      | Coût estimé | 12.50€/50.00€ |
    Et je peux définir des alertes de seuil
    Et je reçois des notifications avant d'atteindre les limites

  Scénario: Configuration des notifications
    Étant donné que je veux être alerté des événements importants
    Quand j'accède aux paramètres de notification
    Alors je peux configurer :
      | Type de notification | Canal | Seuil |
      | Quota OpenAI atteint | Email | 80% |
      | Erreur API critique | Email + SMS | Immédiat |
      | Session longue inactive | Email | 2 heures |
    Et je peux tester chaque type de notification

  Scénario: Gestion des utilisateurs et rôles
    Étant donné que je suis super-administrateur
    Quand j'accède à la gestion des utilisateurs
    Alors je peux créer de nouveaux comptes utilisateur
    Et je peux assigner des rôles :
      | Rôle | Permissions |
      | Administrateur | Configuration complète |
      | Utilisateur avancé | Paramètres du bot |
      | Utilisateur standard | Sessions uniquement |
    Et je peux désactiver ou supprimer des comptes

  Scénario: Audit et logs de configuration
    Étant donné que des modifications de configuration ont été effectuées
    Quand j'accède aux logs d'audit
    Alors je vois l'historique des changements :
      | Date | Utilisateur | Action | Détails |
      | 2025-01-07 14:30 | admin@company.com | Modification API | Changement de modèle GPT-4 |
      | 2025-01-07 14:25 | admin@company.com | Création utilisateur | Nouveau compte dev@company.com |
    Et je peux filtrer par utilisateur, date ou type d'action
    Et je peux exporter les logs pour audit externe

  Scénario: Configuration de la base de données
    Étant donné que je veux configurer la persistance des données
    Quand j'accède aux paramètres de base de données
    Alors je peux configurer :
      | Paramètre | Options |
      | Type de base | PostgreSQL, SQLite |
      | Rétention des sessions | 30, 90, 365 jours |
      | Sauvegarde automatique | Quotidienne, Hebdomadaire |
      | Chiffrement | Activé/Désactivé |
    Et je peux tester la connexion à la base
    Et je peux lancer une sauvegarde manuelle

  Scénario: Configuration des intégrations externes
    Étant donné que je veux intégrer avec d'autres outils
    Quand j'accède aux paramètres d'intégration
    Alors je peux configurer :
      | Intégration | Paramètres requis |
      | GitHub | Token, Repository, Branch |
      | Slack | Webhook URL, Canal |
      | Jira | URL, Credentials, Projet |
    Et je peux tester chaque intégration
    Et je peux activer/désactiver les intégrations

  Scénario: Mise à jour de la configuration en production
    Étant donné que l'application est en production
    Et que je veux modifier la configuration
    Quand j'applique de nouveaux paramètres
    Alors les changements sont appliqués sans redémarrage
    Et les sessions en cours ne sont pas interrompues
    Et un backup de l'ancienne configuration est créé
    Et je peux revenir en arrière si nécessaire

  Scénario: Configuration de la sécurité
    Étant donné que je veux sécuriser l'application
    Quand j'accède aux paramètres de sécurité
    Alors je peux configurer :
      | Paramètre de sécurité | Options |
      | Authentification | Local, LDAP, OAuth |
      | Session timeout | 30min, 1h, 4h, 8h |
      | Chiffrement des données | AES-256 |
      | Logs de sécurité | Activés/Désactivés |
    Et je peux forcer la reconnexion de tous les utilisateurs
    Et je peux voir les tentatives de connexion échouées

  Scénario: Monitoring des performances
    Étant donné que l'application est en fonctionnement
    Quand j'accède au dashboard de monitoring
    Alors je vois les métriques en temps réel :
      | Métrique | Valeur actuelle |
      | Sessions actives | 5 |
      | Temps de réponse moyen | 1.2s |
      | Utilisation mémoire | 65% |
      | Requêtes OpenAI/min | 12 |
    Et je peux configurer des alertes sur ces métriques
    Et je peux voir l'historique sur 24h/7j/30j

