# language: fr
Fonctionnalité: Gestion des sessions BDD
  En tant qu'utilisateur de l'application BDD Bot
  Je veux pouvoir créer et gérer des sessions collaboratives
  Afin de faciliter les sessions Trois Amigos avec mon équipe

  Contexte:
    Étant donné que l'application BDD Bot est démarrée
    Et que l'API OpenAI est configurée avec une clé valide
    Et que je suis un utilisateur authentifié

  Scénario: Création d'une nouvelle session BDD réussie
    Étant donné que je suis sur la page d'accueil de l'application
    Quand je clique sur le bouton "Nouvelle session"
    Et que je renseigne le titre "Fonctionnalité de recherche produits"
    Et que je renseigne la description "Permettre aux utilisateurs de rechercher des produits par nom et catégorie"
    Et que je sélectionne les participants "Business Analyst, Développeur, Testeur"
    Et que je définis le contexte métier "E-commerce - Catalogue produits"
    Et que je clique sur "Créer la session"
    Alors la session est créée avec succès
    Et je suis redirigé vers l'interface de session
    Et je vois le titre "Fonctionnalité de recherche produits" affiché
    Et le bot testeur affiche un message de bienvenue
    Et les participants sélectionnés sont listés
    Et l'URL de la session est générée et copiable

  Scénario: Échec de création de session avec titre manquant
    Étant donné que je suis sur la page d'accueil de l'application
    Quand je clique sur le bouton "Nouvelle session"
    Et que je laisse le champ titre vide
    Et que je clique sur "Créer la session"
    Alors je vois un message d'erreur "Le titre de la session est obligatoire"
    Et la session n'est pas créée
    Et je reste sur le formulaire de création

  Scénario: Rejoindre une session existante avec lien valide
    Étant donné qu'une session "Fonctionnalité de recherche produits" existe
    Et que j'ai reçu le lien de la session
    Quand je clique sur le lien de la session
    Alors je suis redirigé vers l'interface de session
    Et je vois l'historique des échanges précédents
    Et je peux identifier les autres participants connectés
    Et mon statut "En ligne" est visible pour les autres participants
    Et je reçois une notification de bienvenue du bot

  Scénario: Tentative de rejoindre une session inexistante
    Étant donné que j'ai un lien vers une session qui n'existe pas
    Quand je clique sur le lien de la session
    Alors je vois une page d'erreur "Session non trouvée"
    Et je suis redirigé vers la page d'accueil après 3 secondes
    Et je vois un message "La session demandée n'existe pas ou a été supprimée"

  Scénario: Consultation de l'historique des sessions
    Étant donné que j'ai participé à plusieurs sessions dans le passé
    Et que je suis sur la page d'accueil
    Quand je clique sur "Mes sessions"
    Alors je vois la liste de mes sessions triée par date décroissante
    Et chaque session affiche le titre, la date et les participants
    Et je peux rechercher une session par titre
    Et je peux filtrer par statut (active, terminée, archivée)

  Scénario: Recherche dans l'historique des sessions
    Étant donné que j'ai participé à 10 sessions différentes
    Et que je suis sur la page "Mes sessions"
    Quand je tape "recherche" dans le champ de recherche
    Alors seules les sessions contenant "recherche" dans le titre sont affichées
    Et le nombre de résultats est indiqué
    Et je peux effacer la recherche pour voir toutes les sessions

  Scénario: Export des scénarios d'une session terminée
    Étant donné qu'une session "Fonctionnalité de recherche produits" est terminée
    Et que des scénarios Gherkin ont été générés
    Et que je consulte les détails de cette session
    Quand je clique sur "Exporter les scénarios"
    Alors je peux choisir le format d'export (Gherkin, Cucumber, JSON)
    Et le fichier est téléchargé avec un nom descriptif
    Et le contenu du fichier contient tous les scénarios validés

  Scénario: Archivage d'une session terminée
    Étant donné qu'une session "Fonctionnalité de recherche produits" est terminée depuis plus de 30 jours
    Et que je consulte mes sessions
    Quand je clique sur "Archiver" pour cette session
    Alors la session est déplacée vers les archives
    Et elle n'apparaît plus dans la liste principale
    Et je peux la retrouver dans la section "Sessions archivées"
    Et les données de la session sont conservées

  Scénario: Gestion des participants en cours de session
    Étant donné qu'une session "Fonctionnalité de recherche produits" est active
    Et que je suis le créateur de la session
    Et que 2 participants sont connectés
    Quand un nouveau participant rejoint la session
    Alors tous les participants voient une notification "X a rejoint la session"
    Et la liste des participants est mise à jour en temps réel
    Et le nouveau participant voit l'historique complet de la session

  Scénario: Déconnexion d'un participant
    Étant donné qu'une session "Fonctionnalité de recherche produits" est active
    Et que 3 participants sont connectés
    Quand un participant ferme son navigateur
    Alors les autres participants voient "X s'est déconnecté" après 30 secondes
    Et son statut passe à "Hors ligne"
    Et la session continue normalement pour les autres participants

  Scénario: Sauvegarde automatique de la session
    Étant donné qu'une session "Fonctionnalité de recherche produits" est active
    Et que des échanges ont lieu depuis 5 minutes
    Quand de nouveaux messages sont envoyés
    Alors le contenu de la session est sauvegardé automatiquement
    Et un indicateur "Sauvegardé" apparaît brièvement
    Et en cas de déconnexion, aucune donnée n'est perdue

