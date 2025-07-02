#!/bin/bash

# Script de déploiement BDD Bot Application
# Usage: ./deploy.sh [environment]
# Environments: local, staging, production

set -e

ENVIRONMENT=${1:-local}
PROJECT_NAME="bdd-bot-app"

echo "🚀 Déploiement de $PROJECT_NAME en environnement: $ENVIRONMENT"

case $ENVIRONMENT in
  "local")
    echo "📦 Déploiement local avec Docker Compose..."
    
    # Vérifier que Docker est installé
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker n'est pas installé"
      exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
      echo "❌ Docker Compose n'est pas installé"
      exit 1
    fi
    
    # Copier le fichier d'environnement
    if [ ! -f .env ]; then
      echo "📝 Création du fichier .env depuis .env.example"
      cp .env.example .env
      echo "⚠️  Veuillez configurer les variables dans .env avant de continuer"
      echo "   Notamment: DB_ROOT_PASSWORD, DB_PASSWORD, JWT_SECRET"
      read -p "Appuyez sur Entrée pour continuer..."
    fi
    
    # Construire et démarrer les services
    echo "🔨 Construction des images Docker..."
    docker-compose build
    
    echo "🚀 Démarrage des services..."
    docker-compose up -d
    
    echo "⏳ Attente du démarrage des services..."
    sleep 30
    
    # Vérifier que les services sont en cours d'exécution
    echo "🔍 Vérification des services..."
    docker-compose ps
    
    # Tests de santé
    echo "🏥 Tests de santé..."
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
      echo "✅ Frontend: OK"
    else
      echo "❌ Frontend: KO"
    fi
    
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
      echo "✅ Backend: OK"
    else
      echo "❌ Backend: KO"
    fi
    
    echo ""
    echo "🎉 Déploiement local terminé!"
    echo "📱 Frontend: http://localhost:8080"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🗄️  Base de données: localhost:3306"
    echo ""
    echo "📋 Commandes utiles:"
    echo "   docker-compose logs -f          # Voir les logs"
    echo "   docker-compose down             # Arrêter les services"
    echo "   docker-compose down -v          # Arrêter et supprimer les volumes"
    ;;
    
  "staging")
    echo "🏗️  Déploiement staging sur AWS..."
    
    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
      echo "❌ AWS CLI n'est pas installé"
      exit 1
    fi
    
    # Vérifier les credentials AWS
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
      echo "❌ Credentials AWS non configurés"
      exit 1
    fi
    
    echo "🔨 Construction et push des images..."
    
    # Tag et push backend
    docker build -t $PROJECT_NAME-backend:staging ./backend
    docker tag $PROJECT_NAME-backend:staging $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:staging
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:staging
    
    # Tag et push frontend
    docker build -t $PROJECT_NAME-frontend:staging ./frontend
    docker tag $PROJECT_NAME-frontend:staging $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend:staging
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend:staging
    
    echo "🚀 Mise à jour des services ECS..."
    aws ecs update-service --cluster $ECS_CLUSTER_STAGING --service $ECS_SERVICE_BACKEND_STAGING --force-new-deployment
    aws ecs update-service --cluster $ECS_CLUSTER_STAGING --service $ECS_SERVICE_FRONTEND_STAGING --force-new-deployment
    
    echo "⏳ Attente de la stabilisation..."
    aws ecs wait services-stable --cluster $ECS_CLUSTER_STAGING --services $ECS_SERVICE_BACKEND_STAGING $ECS_SERVICE_FRONTEND_STAGING
    
    echo "✅ Déploiement staging terminé!"
    ;;
    
  "production")
    echo "🏭 Déploiement production sur AWS..."
    
    # Confirmation de sécurité
    read -p "⚠️  Êtes-vous sûr de vouloir déployer en production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Déploiement annulé"
      exit 1
    fi
    
    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
      echo "❌ AWS CLI n'est pas installé"
      exit 1
    fi
    
    # Vérifier les credentials AWS
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
      echo "❌ Credentials AWS non configurés"
      exit 1
    fi
    
    echo "🔨 Construction et push des images..."
    
    # Tag et push backend
    docker build -t $PROJECT_NAME-backend:latest ./backend
    docker tag $PROJECT_NAME-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    
    # Tag et push frontend
    docker build -t $PROJECT_NAME-frontend:latest ./frontend
    docker tag $PROJECT_NAME-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend:latest
    
    echo "🚀 Mise à jour des services ECS..."
    aws ecs update-service --cluster $ECS_CLUSTER_PROD --service $ECS_SERVICE_BACKEND_PROD --force-new-deployment
    aws ecs update-service --cluster $ECS_CLUSTER_PROD --service $ECS_SERVICE_FRONTEND_PROD --force-new-deployment
    
    echo "⏳ Attente de la stabilisation..."
    aws ecs wait services-stable --cluster $ECS_CLUSTER_PROD --services $ECS_SERVICE_BACKEND_PROD $ECS_SERVICE_FRONTEND_PROD
    
    echo "✅ Déploiement production terminé!"
    ;;
    
  *)
    echo "❌ Environnement non supporté: $ENVIRONMENT"
    echo "Environnements disponibles: local, staging, production"
    exit 1
    ;;
esac

echo ""
echo "🎯 Déploiement terminé avec succès!"

