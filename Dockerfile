# Development & Production Dockerfile for Backend
FROM node:20-alpine

WORKDIR /app

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/src ./src
COPY backend/.env* ./

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/index.js"]
