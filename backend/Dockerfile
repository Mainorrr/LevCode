FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 curl

COPY package*.json ./

RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
