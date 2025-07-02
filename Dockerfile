# =========================================
# OPTIMIZED DISCORD BOT DOCKERFILE
# =========================================
# Node.js 20 - Debian Slim (Railway optimiert)
# Mit Python & Build-Tools für @discordjs/opus
# =========================================

FROM node:20-slim

# Set working directory
WORKDIR /app

# Install system dependencies (Discord Bot essentials)
RUN apt-get update && apt-get install -y \
    # Basic tools
    ca-certificates \
    # Python & Build tools für @discordjs/opus
    python3 \
    python3-pip \
    build-essential \
    # Audio libraries für Discord
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # Clean up
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Python as python (für node-gyp)
RUN ln -sf /usr/bin/python3 /usr/bin/python

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