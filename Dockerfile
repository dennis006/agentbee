# Production-ready Dockerfile für Railway mit Ubuntu
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Discord.js, Canvas, and Audio processing
RUN apt-get update && apt-get install -y \
    build-essential \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm-dev \
    libxkbcommon-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libxss-dev \
    libasound2-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libsodium-dev \
    python3 \
    make \
    g++ \
    pkg-config \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with better error handling
RUN npm ci --only=production --no-audit --no-fund --unsafe-perm || \
    (echo "npm ci failed, trying alternative approach..." && \
     npm install --only=production --no-audit --no-fund --legacy-peer-deps --unsafe-perm)

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p dashboard/public/images/welcome
RUN mkdir -p music

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will provide PORT environment variable)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application
CMD ["npm", "start"] 