# Dockerfile pour le Backend Express - BDD Bot Application
FROM node:20-alpine

# Métadonnées
LABEL maintainer="BDD Bot Team"
LABEL description="Backend Express pour l'application BDD Bot"
LABEL version="1.0.0"

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Créer les répertoires nécessaires pour SQLite et logs
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app/data /app/logs

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Commande de santé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Commande de démarrage
CMD ["node", "src/app.js"]

