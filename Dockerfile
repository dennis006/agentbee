# Production-ready Dockerfile für Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for Discord.js, Canvas, and Audio processing
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++ \
    pkgconfig \
    libsodium-dev \
    openssl-dev \
    curl \
    ffmpeg \
    ffmpeg-dev

# Copy package files
COPY package*.json ./

# Install dependencies with better error handling
RUN npm ci --only=production --no-audit --no-fund --unsafe-perm || \
    (echo "npm ci failed, trying with legacy peer deps..." && \
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