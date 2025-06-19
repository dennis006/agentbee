# Production-ready Dockerfile für Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for Discord.js and Canvas
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
    g++

# Copy package files
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p dashboard/public/images/welcome

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will provide PORT environment variable)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application
CMD ["npm", "start"] 