# Dockerfile for LevCode Backend
# Build context: ./backend
#   docker build -f ../Dockerfile -t levcode-backend:latest .

FROM node:20-alpine

WORKDIR /app

# Instalar Python 3 y curl (Python para ejecutar código de estudiantes)
RUN apk add --no-cache python3 curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
