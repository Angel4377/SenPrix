# ────────────────────────────────────────────────
# Stage 1 : Build avec Node.js
# ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json en premier pour le cache
COPY package*.json ./
RUN npm ci --silent

# Copier le code source et construire
COPY . .
RUN npm run build

# ────────────────────────────────────────────────
# Stage 2 : Serveur nginx léger
# ────────────────────────────────────────────────
FROM nginx:1.27-alpine

LABEL maintainer="DCI Sénégal <marketwatch@dci.sn>"
LABEL app="marketwatch-frontend"
LABEL version="1.0.0"

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port du frontend
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
