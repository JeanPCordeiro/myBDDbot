# Guide de Déploiement - BDD Bot Application

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Déploiement Local](#déploiement-local)
4. [Déploiement Staging](#déploiement-staging)
5. [Déploiement Production](#déploiement-production)
6. [Configuration AWS](#configuration-aws)
7. [Monitoring et Logs](#monitoring-et-logs)
8. [Maintenance](#maintenance)
9. [Dépannage](#dépannage)
10. [Sécurité](#sécurité)

## Vue d'Ensemble

BDD Bot Application est une application web moderne composée de :
- **Frontend** : React + Vite (port 8080)
- **Backend** : Express.js + Socket.IO (port 3001)
- **Base de données** : SQLite (fichier local)
- **Reverse Proxy** : Nginx (optionnel, port 80/443)

### Architecture de Déploiement

```
Internet
    ↓
[Load Balancer]
    ↓
[Nginx Proxy] (optionnel)
    ↓
[Frontend Container] ← WebSocket → [Backend Container + SQLite]
```

## Prérequis

### Environnement Local
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Node.js 18+ (pour le développement)

### Environnement Cloud (AWS)
- Compte AWS avec permissions appropriées
- AWS CLI configuré
- Docker
- Terraform (optionnel, pour l'infrastructure)

### Clés et Secrets
- Clé API OpenAI
- Secrets JWT
- Certificats SSL (pour la production)

## Déploiement Local

### Méthode 1 : Script de Déploiement (Recommandée)

```bash
# Cloner le repository
git clone <repository-url>
cd bdd-bot-app

# Exécuter le script de déploiement
./deploy.sh local
```

### Méthode 2 : Manuel avec Docker Compose

```bash
# 1. Préparer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 2. Construire et démarrer
docker-compose build
docker-compose up -d

# 3. Vérifier les services
docker-compose ps
docker-compose logs -f
```

### Configuration Locale

Éditez le fichier `.env` :

```env
# Base de données SQLite (aucune configuration nécessaire)
# Le fichier SQLite sera créé automatiquement

# JWT
JWT_SECRET=votre_secret_jwt_très_fort_et_aléatoire

# OpenAI (optionnel pour les tests)
OPENAI_API_KEY=sk-votre-clé-openai
```

### Vérification du Déploiement Local

```bash
# Tests de santé
curl http://localhost:8080/health  # Frontend
curl http://localhost:3001/health  # Backend

# Accès à l'application
open http://localhost:8080
```

## Déploiement Staging

### Prérequis AWS

1. **ECR Repositories**
```bash
aws ecr create-repository --repository-name bdd-bot-backend
aws ecr create-repository --repository-name bdd-bot-frontend
```

2. **Volumes EFS (optionnel)**
```bash
# Créer un système de fichiers EFS pour la persistance SQLite
aws efs create-file-system \
  --creation-token bdd-bot-sqlite-storage \
  --performance-mode generalPurpose \
  --throughput-mode provisioned \
  --provisioned-throughput-in-mibps 100
```

3. **ECS Cluster**
```bash
aws ecs create-cluster --cluster-name bdd-bot-staging
```

### Variables d'Environnement Staging

Configurez les variables dans GitHub Secrets ou AWS Systems Manager :

```env
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ECS_CLUSTER_STAGING=bdd-bot-staging
ECS_SERVICE_BACKEND_STAGING=bdd-bot-backend-staging
ECS_SERVICE_FRONTEND_STAGING=bdd-bot-frontend-staging
```

### Déploiement Automatique

Le déploiement staging se fait automatiquement via GitHub Actions lors d'un push sur la branche `develop`.

### Déploiement Manuel Staging

```bash
# Configurer les variables d'environnement
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export ECS_CLUSTER_STAGING=bdd-bot-staging

# Exécuter le déploiement
./deploy.sh staging
```

## Déploiement Production

### Infrastructure Production

1. **Haute Disponibilité**
   - Multi-AZ RDS
   - Load Balancer Application
   - Auto Scaling Groups
   - CloudFront CDN

2. **Sécurité**
   - WAF (Web Application Firewall)
   - Certificats SSL/TLS
   - VPC avec subnets privés
   - Security Groups restrictifs

### Processus de Déploiement Production

1. **Validation Préalable**
```bash
# Tests complets en staging
# Validation par l'équipe
# Backup de la base de données
```

2. **Déploiement**
```bash
# Via GitHub Actions (recommandé)
git tag v1.0.0
git push origin v1.0.0

# Ou manuel
./deploy.sh production
```

3. **Vérification Post-Déploiement**
```bash
# Tests de santé
curl https://bdd-bot.example.com/health

# Tests fonctionnels
# Monitoring des métriques
```

## Configuration AWS

### 1. Infrastructure as Code (Terraform)

Créez un fichier `infrastructure/main.tf` :

```hcl
# VPC et Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "bdd-bot-vpc"
  }
}

# EFS pour persistance SQLite
resource "aws_efs_file_system" "sqlite_storage" {
  creation_token = "bdd-bot-sqlite"
  
  performance_mode = "generalPurpose"
  throughput_mode  = "provisioned"
  provisioned_throughput_in_mibps = 100
  
  encrypted = true
  
  tags = {
    Name = "bdd-bot-sqlite-storage"
  }
}

resource "aws_efs_mount_target" "sqlite_storage" {
  count           = length(aws_subnet.private)
  file_system_id  = aws_efs_file_system.sqlite_storage.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "bdd-bot-prod"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "bdd-bot-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = true
}
```

### 2. Secrets Manager

```bash
# Créer les secrets (plus besoin de secrets de base de données avec SQLite)
aws secretsmanager create-secret \
  --name "bdd-bot/jwt" \
  --description "JWT secret for BDD Bot" \
  --secret-string '{"secret":"your-jwt-secret"}'

aws secretsmanager create-secret \
  --name "bdd-bot/openai" \
  --description "OpenAI API credentials" \
  --secret-string '{"api_key":"sk-...","org_id":"org-..."}'
```

### 3. ECS Task Definitions

Utilisez les fichiers dans `aws/fargate/` :

```bash
# Enregistrer les définitions de tâches
aws ecs register-task-definition \
  --cli-input-json file://aws/fargate/backend-task-definition.json

aws ecs register-task-definition \
  --cli-input-json file://aws/fargate/frontend-task-definition.json
```

### 4. ECS Services

```bash
# Créer les services ECS
aws ecs create-service \
  --cluster bdd-bot-prod \
  --service-name bdd-bot-backend \
  --task-definition bdd-bot-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

aws ecs create-service \
  --cluster bdd-bot-prod \
  --service-name bdd-bot-frontend \
  --task-definition bdd-bot-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Monitoring et Logs

### 1. CloudWatch Logs

Les logs sont automatiquement envoyés vers CloudWatch :
- `/ecs/bdd-bot-backend` : Logs du backend
- `/ecs/bdd-bot-frontend` : Logs du frontend

### 2. Métriques CloudWatch

Surveillez ces métriques clés :
- CPU et mémoire des containers
- Nombre de connexions actives
- Temps de réponse des APIs
- Erreurs 4xx/5xx

### 3. Alertes

```bash
# Créer une alerte pour les erreurs
aws cloudwatch put-metric-alarm \
  --alarm-name "BDD-Bot-High-Error-Rate" \
  --alarm-description "High error rate detected" \
  --metric-name "4XXError" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

### 4. Dashboard

Créez un dashboard CloudWatch pour surveiller :
- Santé des services
- Performance de l'application
- Utilisation des ressources
- Métriques métier (sessions actives, etc.)

## Maintenance

### 1. Mises à Jour

```bash
# Mise à jour rolling via ECS
aws ecs update-service \
  --cluster bdd-bot-prod \
  --service bdd-bot-backend \
  --force-new-deployment

# Surveillance du déploiement
aws ecs wait services-stable \
  --cluster bdd-bot-prod \
  --services bdd-bot-backend
```

### 2. Sauvegardes

```bash
# Sauvegarde du fichier SQLite
aws efs put-backup-policy \
  --file-system-id fs-xxxxxxxxx \
  --backup-policy Status=ENABLED

# Sauvegarde manuelle via snapshot EFS
aws efs create-backup \
  --file-system-id fs-xxxxxxxxx \
  --creation-token backup-$(date +%Y%m%d-%H%M%S)

# Sauvegarde des configurations
aws ecs describe-task-definition \
  --task-definition bdd-bot-backend \
  --output json > backup/task-definition-backend.json
```

### 3. Scaling

```bash
# Scaling horizontal
aws ecs update-service \
  --cluster bdd-bot-prod \
  --service bdd-bot-backend \
  --desired-count 4

# Scaling vertical (modifier la task definition)
# Puis redéployer avec la nouvelle définition
```

## Dépannage

### Problèmes Courants

1. **Service ne démarre pas**
```bash
# Vérifier les logs
aws logs tail /ecs/bdd-bot-backend --follow

# Vérifier la task definition
aws ecs describe-task-definition --task-definition bdd-bot-backend

# Vérifier les secrets
aws secretsmanager get-secret-value --secret-id bdd-bot/database
```

2. **Problèmes de connectivité**
```bash
# Vérifier les security groups
aws ec2 describe-security-groups --group-ids sg-xxx

# Tester la connectivité réseau
aws ecs execute-command \
  --cluster bdd-bot-prod \
  --task task-id \
  --container bdd-bot-backend \
  --interactive \
  --command "/bin/bash"
```

3. **Performance dégradée**
```bash
# Vérifier les métriques
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=bdd-bot-backend \
  --start-time 2025-07-02T00:00:00Z \
  --end-time 2025-07-02T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Rollback

```bash
# Rollback vers la version précédente
aws ecs update-service \
  --cluster bdd-bot-prod \
  --service bdd-bot-backend \
  --task-definition bdd-bot-backend:previous-revision

# Vérifier le rollback
aws ecs wait services-stable \
  --cluster bdd-bot-prod \
  --services bdd-bot-backend
```

## Sécurité

### 1. Bonnes Pratiques

- **Chiffrement** : Toutes les données en transit et au repos
- **Authentification** : IAM roles avec permissions minimales
- **Réseau** : VPC avec subnets privés, Security Groups restrictifs
- **Secrets** : AWS Secrets Manager pour toutes les informations sensibles
- **Monitoring** : CloudTrail pour l'audit, GuardDuty pour la détection

### 2. Checklist Sécurité

- [ ] Certificats SSL/TLS configurés
- [ ] WAF activé avec règles appropriées
- [ ] Security Groups avec règles minimales
- [ ] Secrets stockés dans Secrets Manager
- [ ] Chiffrement RDS activé
- [ ] CloudTrail activé
- [ ] Backup automatique configuré
- [ ] Monitoring et alertes en place

### 3. Conformité

- Logs d'audit complets
- Chiffrement des données sensibles
- Contrôle d'accès basé sur les rôles
- Sauvegarde et récupération testées

---

## Support et Contact

Pour toute question sur le déploiement :
- Documentation technique : `/docs`
- Issues GitHub : Repository issues
- Support infrastructure : Équipe DevOps

**Version du Guide :** 1.0.0  
**Dernière Mise à Jour :** 2 juillet 2025

