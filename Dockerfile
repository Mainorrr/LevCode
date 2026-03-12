# Development & Production Dockerfile for Backend
# Build context: ./backend (NOT root)
# Para usar este Dockerfile con contexto en backend/:
#   docker build -f ../Dockerfile -t levcode-backend:latest .

FROM node:20-alpine

WORKDIR /app

# Install Docker CLI (necesario para ejecutar java-sandbox)
RUN apk add --no-cache docker-cli curl

# Copy package files (desde backend/)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code (ya estamos dentro de backend/)
# src/ contiene: config/, middleware/, routes/, services/, utils/
COPY src ./src

# Copy environment file if it exists (set via docker-compose env vars instead)
# Omitido: los valores vienen de docker-compose.yml environment section

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "src/index.js"]
