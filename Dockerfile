# Dockerfile for LevCode Backend
# Build context: ./backend
#   docker build -f ../Dockerfile -t levcode-backend:latest .

FROM node:20-alpine

WORKDIR /app

# Toolchains de los tres lenguajes, curl para el healthcheck, y prlimit
# (util-linux) para los limites de recursos por proceso. El JDK es el que pesa
# (~300MB): hace falta javac, no basta el JRE.
# En Alpine prlimit vive en util-linux-misc segun la version; se intentan ambos.
# El `prlimit --version` final es a proposito: si no quedo instalado, el build
# falla aqui en vez de desplegar un servidor que ejecuta codigo sin limites.
RUN apk add --no-cache python3 curl g++ openjdk17-jdk \
 && (apk add --no-cache util-linux-misc || apk add --no-cache util-linux) \
 && prlimit --version && g++ --version | head -1 && javac -version

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
