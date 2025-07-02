# Guide Utilisateur - BDD Bot Application

## Table des Matières

1. [Introduction](#introduction)
2. [Premiers Pas](#premiers-pas)
3. [Configuration](#configuration)
4. [Utilisation des Sessions BDD](#utilisation-des-sessions-bdd)
5. [Interaction avec le Bot](#interaction-avec-le-bot)
6. [Génération de Scénarios](#génération-de-scénarios)
7. [Collaboration en Équipe](#collaboration-en-équipe)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [Dépannage](#dépannage)
10. [FAQ](#faq)

## Introduction

BDD Bot est une application web intelligente conçue pour faciliter les sessions de développement dirigé par le comportement (BDD) selon la méthode des Trois Amigos. L'application utilise l'intelligence artificielle pour guider votre équipe dans la création de scénarios de test de qualité.

### Qu'est-ce que la Méthode des Trois Amigos ?

La méthode des Trois Amigos est une pratique collaborative qui réunit :
- **Business Analyst** : Définit les exigences métier
- **Développeur** : Comprend les aspects techniques
- **Testeur** : Identifie les cas de test et scénarios

### Fonctionnalités Principales

- 🤖 **Assistant IA Intelligent** : Guide les discussions et pose les bonnes questions
- 👥 **Collaboration Temps Réel** : Travaillez ensemble en temps réel
- 📝 **Génération de Scénarios** : Création automatique de scénarios Gherkin
- ✅ **Validation Automatique** : Vérification de la syntaxe et complétude
- 🎯 **Contextes Métier** : Support de différents domaines d'activité

## Premiers Pas

### Accès à l'Application

1. Ouvrez votre navigateur web
2. Naviguez vers l'URL de l'application BDD Bot
3. Vous arrivez sur la page d'accueil

### Interface Principale

L'interface se compose de :
- **Barre de Navigation** : Accès aux différentes sections
- **Indicateur de Statut** : Affiche l'état de la configuration OpenAI
- **Zone Principale** : Contenu de la page active
- **Bouton de Thème** : Basculer entre mode clair et sombre

## Configuration

### Configuration OpenAI (Obligatoire)

Avant d'utiliser BDD Bot, vous devez configurer votre clé API OpenAI :

1. **Accéder à la Configuration**
   - Cliquez sur "Configuration" dans la navigation
   - Sélectionnez l'onglet "OpenAI"

2. **Obtenir une Clé API**
   - Visitez [platform.openai.com](https://platform.openai.com/api-keys)
   - Créez un compte ou connectez-vous
   - Générez une nouvelle clé API

3. **Configurer la Clé**
   - Saisissez votre clé API dans le champ prévu
   - (Optionnel) Ajoutez votre ID d'organisation
   - Cliquez sur "Tester" pour vérifier la connexion
   - Cliquez sur "Sauvegarder" pour enregistrer

4. **Vérification**
   - L'indicateur de statut devient vert
   - Le badge affiche "Configuré"

### Configuration du Bot Assistant

Personnalisez le comportement de votre assistant :

1. **Style de Communication**
   - **Professionnel** : Ton formel et structuré
   - **Décontracté** : Ton amical et accessible
   - **Technique** : Vocabulaire spécialisé et précis

2. **Langue**
   - Français (par défaut)
   - English

3. **Niveau de Détail**
   - **Basique** : Explications simples
   - **Intermédiaire** : Équilibre entre simplicité et détail
   - **Expert** : Informations techniques approfondies

## Utilisation des Sessions BDD

### Créer une Nouvelle Session

1. **Accéder aux Sessions**
   - Cliquez sur "Sessions" dans la navigation
   - Cliquez sur "Nouvelle Session"

2. **Configurer la Session**
   - **Titre** : Nom descriptif de la session
   - **Description** : Objectif et contexte
   - **Contexte Métier** : Sélectionnez le domaine approprié
   - **Durée Estimée** : Temps prévu en minutes

3. **Lancer la Session**
   - Cliquez sur "Créer la Session"
   - Vous êtes automatiquement redirigé vers la session

### Interface de Session

La page de session comprend :

1. **Zone de Chat** : Interaction avec le bot et l'équipe
2. **Zone de Scénarios** : Affichage des scénarios générés
3. **Panneau Participants** : Liste des membres connectés
4. **Informations Session** : Détails et statistiques

### Rejoindre une Session Existante

1. Accédez à la liste des sessions
2. Cliquez sur "Ouvrir" pour la session souhaitée
3. Vous rejoignez automatiquement la session

## Interaction avec le Bot

### Démarrer une Conversation

Le bot vous accueille automatiquement et vous guide :

```
Bonjour ! Je suis votre assistant testeur pour cette session BDD.
Je vais vous aider à définir des critères d'acceptation clairs et 
à générer des scénarios de test de qualité.

Pour commencer, pouvez-vous me décrire la fonctionnalité que 
vous souhaitez développer ?
```

### Types de Messages

1. **Questions du Bot**
   - Le bot pose des questions pour clarifier les exigences
   - Répondez de manière détaillée pour de meilleurs résultats

2. **Suggestions du Bot**
   - Propositions d'améliorations
   - Identification de cas de test manquants

3. **Validation du Bot**
   - Vérification de la cohérence
   - Signalement d'ambiguïtés

### Commandes Utiles

- **"Génère des scénarios"** : Demande la création de scénarios
- **"Résume la session"** : Obtient un récapitulatif
- **"Valide les exigences"** : Vérifie la complétude
- **"Pose des questions"** : Demande des clarifications

## Génération de Scénarios

### Processus de Génération

1. **Préparation**
   - Assurez-vous d'avoir défini les exigences clairement
   - Le bot doit avoir suffisamment de contexte

2. **Lancement**
   - Cliquez sur "Générer des Scénarios" dans le chat
   - Ou demandez directement au bot

3. **Révision**
   - Les scénarios apparaissent dans l'onglet "Scénarios"
   - Chaque scénario est au format Gherkin standard

### Format des Scénarios

Les scénarios générés suivent la syntaxe Gherkin :

```gherkin
Fonctionnalité: Connexion utilisateur
  En tant qu'utilisateur
  Je veux me connecter à l'application
  Afin d'accéder à mes données personnelles

Scénario: Connexion réussie avec identifiants valides
  Étant donné que je suis sur la page de connexion
  Et que j'ai un compte utilisateur valide
  Quand je saisis mon email "user@example.com"
  Et que je saisis mon mot de passe "motdepasse123"
  Et que je clique sur "Se connecter"
  Alors je suis redirigé vers le tableau de bord
  Et je vois le message "Bienvenue, Utilisateur"
```

### Actions sur les Scénarios

- **Copier** : Copie le scénario dans le presse-papiers
- **Exporter** : Télécharge tous les scénarios en fichier texte
- **Modifier** : Demandez au bot d'ajuster un scénario

## Collaboration en Équipe

### Rôles des Participants

1. **Business Analyst**
   - Définit les exigences métier
   - Valide les scénarios du point de vue utilisateur
   - Clarifie les règles métier

2. **Développeur**
   - Évalue la faisabilité technique
   - Identifie les contraintes d'implémentation
   - Propose des alternatives techniques

3. **Testeur**
   - Identifie les cas de test manquants
   - Valide la couverture de test
   - Propose des scénarios d'erreur

### Bonnes Pratiques de Collaboration

1. **Communication Claire**
   - Utilisez un langage métier compréhensible
   - Évitez le jargon technique excessif
   - Posez des questions ouvertes

2. **Participation Active**
   - Chaque rôle doit contribuer
   - Challengez les hypothèses
   - Proposez des améliorations

3. **Documentation Continue**
   - Notez les décisions importantes
   - Gardez une trace des discussions
   - Exportez les résultats

## Bonnes Pratiques

### Préparation de Session

1. **Avant la Session**
   - Préparez un brief de la fonctionnalité
   - Identifiez les parties prenantes
   - Définissez les objectifs de la session

2. **Pendant la Session**
   - Restez focalisé sur l'objectif
   - Utilisez le bot pour guider les discussions
   - Documentez les décisions

3. **Après la Session**
   - Exportez les scénarios générés
   - Partagez les résultats avec l'équipe
   - Planifiez les prochaines étapes

### Optimisation des Résultats

1. **Contexte Détaillé**
   - Fournissez un maximum de contexte au bot
   - Décrivez les contraintes et règles métier
   - Mentionnez les cas particuliers

2. **Itération**
   - N'hésitez pas à affiner les scénarios
   - Demandez des variantes au bot
   - Testez différentes approches

3. **Validation Croisée**
   - Faites valider par tous les rôles
   - Vérifiez la cohérence globale
   - Assurez-vous de la complétude

## Dépannage

### Problèmes de Configuration

**Erreur de clé API OpenAI**
- Vérifiez que la clé est correcte
- Assurez-vous d'avoir des crédits OpenAI
- Testez la connexion

**Bot ne répond pas**
- Vérifiez la configuration OpenAI
- Rechargez la page
- Contactez l'administrateur

### Problèmes de Session

**Impossible de créer une session**
- Vérifiez la configuration OpenAI
- Assurez-vous que tous les champs sont remplis
- Essayez de recharger la page

**Déconnexion fréquente**
- Vérifiez votre connexion internet
- Évitez les onglets multiples
- Contactez le support technique

### Problèmes de Performance

**Application lente**
- Fermez les onglets inutiles
- Videz le cache du navigateur
- Vérifiez votre connexion internet

**Scénarios non générés**
- Fournissez plus de contexte au bot
- Vérifiez les limites de l'API OpenAI
- Réessayez après quelques minutes

## FAQ

### Questions Générales

**Q: Combien coûte l'utilisation de BDD Bot ?**
R: BDD Bot utilise votre propre clé API OpenAI. Les coûts dépendent de votre utilisation de l'API OpenAI.

**Q: Mes données sont-elles sécurisées ?**
R: Oui, toutes les communications sont chiffrées et les données de session ne sont pas stockées de manière permanente.

**Q: Puis-je utiliser BDD Bot hors ligne ?**
R: Non, BDD Bot nécessite une connexion internet pour fonctionner avec l'API OpenAI.

### Questions Techniques

**Q: Quels navigateurs sont supportés ?**
R: BDD Bot fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge).

**Q: Puis-je intégrer BDD Bot avec d'autres outils ?**
R: L'application propose des exports de scénarios compatibles avec la plupart des outils de test.

**Q: Y a-t-il une limite au nombre de participants ?**
R: Par défaut, jusqu'à 10 participants peuvent rejoindre une session simultanément.

### Questions sur l'IA

**Q: Le bot peut-il comprendre des domaines métier spécifiques ?**
R: Oui, vous pouvez sélectionner un contexte métier et fournir des détails spécifiques à votre domaine.

**Q: Comment améliorer la qualité des scénarios générés ?**
R: Fournissez un contexte détaillé, utilisez un vocabulaire métier précis, et itérez avec le bot.

**Q: Le bot peut-il apprendre de nos sessions précédentes ?**
R: Actuellement, chaque session est indépendante, mais cette fonctionnalité est prévue pour les futures versions.

---

## Support

Pour toute question ou problème :
- Consultez cette documentation
- Contactez votre administrateur système
- Ouvrez un ticket de support

**Version du Guide :** 1.0.0  
**Dernière Mise à Jour :** 2 juillet 2025

