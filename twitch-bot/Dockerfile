# 🎮 AgentBee Twitch Bot - Dockerfile
FROM node:18-alpine

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production && npm cache clean --force

# App Code kopieren
COPY . .

# Port exposieren
EXPOSE 3002

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# User für Security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S twitchbot -u 1001
USER twitchbot

# App starten
CMD ["npm", "start"] 