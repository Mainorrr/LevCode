FROM node:20-alpine

WORKDIR /app

# Python 3 para ejecutar codigo de estudiantes, curl para el healthcheck, y
# prlimit (util-linux) para los limites de recursos por proceso.
# En Alpine prlimit vive en util-linux-misc segun la version; se intentan ambos.
# El `prlimit --version` final es a proposito: si no quedo instalado, el build
# falla aqui en vez de desplegar un servidor que ejecuta codigo sin limites.
RUN apk add --no-cache python3 curl \
 && (apk add --no-cache util-linux-misc || apk add --no-cache util-linux) \
 && prlimit --version

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
