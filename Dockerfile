# Minimalistic Dockerfile - Node 20 Debian
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install only essential system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy application source
COPY . .

# Create directories
RUN mkdir -p public/images/welcome

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "index.js"] 
