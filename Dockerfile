# =========================================
# OPTIMIZED DISCORD BOT DOCKERFILE
# =========================================
# Node.js 20 - Debian Slim (Railway optimiert)
# Minimalistischer Ansatz für bessere Performance
# =========================================

FROM node:20-slim

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production \
    && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r discordbot && useradd -r -g discordbot discordbot
RUN chown -R discordbot:discordbot /app
USER discordbot

# Expose port
EXPOSE 3000

# Start command (direct node instead of npm)
CMD ["node", "index.js"] 