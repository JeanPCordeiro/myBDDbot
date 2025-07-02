# Dockerfile pour le Frontend React - BDD Bot Application

# Stage 1: Build
FROM node:20-alpine AS builder

# Métadonnées
LABEL maintainer="BDD Bot Team"
LABEL description="Frontend React pour l'application BDD Bot"
LABEL version="1.0.0"

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci && npm cache clean --force

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=http://localhost:3001/api

# Construire l'application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un utilisateur non-root pour nginx
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Ajuster les permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Créer les répertoires nécessaires
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Changer vers l'utilisateur non-root
USER nginx

# Exposer le port
EXPOSE 8080

# Commande de santé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]

