# LevCode Backend - Setup & Execution Guide

## 📋 Overview

Backend para **LevCode Online Judge** construido con:

- **Node.js 20 + Express** — REST API
- **Docker** — Java sandbox para código seguro
- **JavaScript** — Sin TypeScript

---

## 🚀 Quick Start (Mac Silicon Recomendado)

### ✨ OPCIÓN 2: Híbrido (RECOMENDADO - Backend en Docker, Frontend local)

**Mejor para Mac Silicon** — Evita overhead de Docker en Node.js

```bash
# 1️⃣ Desde la raíz del proyecto
npm ci

# 2️⃣ Instalar dependencias del Frontend
cd frontend && npm install && cd ..

# 3️⃣ Levantar Backend + Java Sandbox con Docker Compose
docker-compose up --build

# 4️⃣ En otra terminal, iniciar el Frontend (Vite en puerto 5173)
npm run frontend
```

**URLs:**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Java Sandbox: interno (en Docker)

---

## 🔧 Opciones de Ejecución Alternativas

### Alternativa 1: Todo Local (Sin Docker - Requiere Java 17+)

Solo si tienes **Java JDK 17+ instalado** y Docker corriendo:

```bash
npm ci && cd frontend && npm install && cd ..

# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run frontend
```

✅ Más rápido en desarrollo  
❌ Requiere Java 17+ en tu Mac  
⚠️ Java aún corre en Docker para sandbox

---

### Alternativa 3: Todo en Docker (Sin requerimientos locales)

```bash
# Desde raíz del proyecto
docker-compose up --build

# Accede a http://localhost:3000
```

✅ Sin dependencias locales  
❌ Más lento en Mac Silicon (Docker en ARM64)

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.js              ← Punto de entrada
│   ├── server.js             ← Configuración Express
│   ├── config/
│   │   ├── env.js            ← Variables de entorno
│   │   └── docker.js         ← Límites del container
│   ├── routes/
│   │   └── submissions.js    ← POST /api/submissions
│   ├── services/
│   │   ├── javaExecutor.js   ← Lógica de compilación/ejecución
│   │   └── dockerManager.js  ← Gestión de containers Docker
│   └── utils/
│       ├── logger.js         ← Logging
│       └── validators.js     ← Validación de seguridad
├── package.json
├── .env.development          ← Config local (crear)
└── Dockerfile                ← Para docker-compose
```

---

## 🔐 Configuración de Entorno

Crea `backend/.env.development` en la raíz del backend:

```dotenv
# Server
PORT=3000
NODE_ENV=development

# Docker & Java Sandbox
DOCKER_IMAGE=levcode-java:latest
JAVA_TIMEOUT=5000              # milliseconds
JAVA_MEMORY=128m               # memory limit
JAVA_OUTPUT_MAX=10485760       # 10MB max output

# Database (para después)
DATABASE_URL=postgresql://localhost:5432/levcode

# CORS
FRONTEND_URL=http://localhost:5173  # ← Vite en 5173, NO 3000
```

---

## 🐳 Arquitectura Docker

### Containers en docker-compose.yml:

1. **`java-sandbox`** (OpenJDK 17)
   - Lee código Java vía stdin
   - Compila con `javac`
   - Ejecuta con `java`
   - Límite: 128MB RAM, 5s timeout
   - **NO expone puertos** (interno)

2. **`backend`** (Node.js 20)
   - API REST en puerto 3000
   - Se comunica con java-sandbox via Docker API
   - Monta `/var/run/docker.sock` para control de containers

---

## 📡 API Endpoints

### POST `/api/submissions`

Envía código Java para compilar y ejecutar.

**Headers (Requerido):**

```
X-API-Password: levcode123
Content-Type: application/json
```

**Request:**

```json
{
  "code": "public class Solution { public static void main(String[] args) { System.out.println(\"Hello\"); } }",
  "userId": "user123", // opcional, para tracking
  "problemId": "problem_001" // opcional
}
```

**Response (Éxito):**

```json
{
  "success": true,
  "output": "Hello\n",
  "error": "",
  "exitCode": 0,
  "executionTime": 234
}
```

**Response (Error de Compilación):**

```json
{
  "success": false,
  "output": "",
  "error": "Solution.java:1: error: illegal start of type ...",
  "exitCode": 1,
  "executionTime": 45
}
```

### GET `/api/submissions/limits`

Obtiene límites de ejecución.

**Response:**

```json
{
  "limits": {
    "timeout": 5000,
    "memory": "128m",
    "maxOutput": 10485760
  }
}
```

### GET `/health`

Endpoint de health check.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-11T10:30:45.123Z"
}
```

---

## 🛠️ Troubleshooting - Mac Silicon

### ❌ "docker: command not found" en backend container

**Solución:** Asegúrate que `docker-cli` está en el Dockerfile

```dockerfile
RUN apk add --no-cache docker-cli
```

### ❌ Error de arquitectura (arm64 vs amd64)

```bash
# Verificar tu arquitectura
arch
# Si dice `arm64` → tienes Apple Silicon ✅
```

### ❌ "Cannot connect to Docker daemon"

```bash
# Asegurar que Docker está corriendo
docker ps

# Si no funciona:
# 1. Abre Docker Desktop
# 2. Settings → Resources → Make sure it's enabled
```

### ❌ Puerto 3000 ya en uso

```bash
# Encontrar qué usa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

---

## 📚 Recursos

- [Docker Docs](https://docs.docker.com/)
- [Express.js](https://expressjs.com/)
- [Java Docker Best Practices](https://docs.docker.com/language/java/)

---

**Last Updated:** March 2026  
**Author:** LevCode Development Team

---

## 🔒 Security Features

1. **Password Authentication** — All submissions require an API password (set in `.env`)
   - Default (development): `levcode123`
   - Header: `X-API-Password` or body field `password`
   - Returns 401 if incorrect

2. **Input Validation** — Blocks dangerous Java patterns:
   - `Runtime.getRuntime().exec()`
   - `ProcessBuilder`
   - File I/O operations
   - `System.setSecurityManager()`

3. **Resource Limits**:
   - **Timeout**: 5 seconds
   - **Memory**: 128MB
   - **Network**: Disabled (`--network=none`)
   - **Output**: Max 10MB

4. **CORS** — Restricted to `FRONTEND_URL`

5. **Size Limits**:
   - Code: Max 1MB
   - Request body: Max 1MB

---

## 🧪 Testing Locally

### Test with cURL

```bash
# Simple Hello World (with password header)
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -H "X-API-Password: levcode123" \
  -d '{
    "code":"public class Solution { public static void main(String[] args) { System.out.println(\"Hello!\"); } }"
  }'

# Wrong password
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -H "X-API-Password: wrong_password" \
  -d '{
    "code":"public class Solution { public static void main(String[] args) { System.out.println(\"Hello!\"); } }"
  }'

# With loop
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -H "X-API-Password: levcode123" \
  -d '{
    "code":"public class Solution { public static void main(String[] args) { for(int i=1;i<=5;i++) System.out.println(i); } }"
  }'

# Check limits
curl http://localhost:3000/api/submissions/limits

# Health check
curl http://localhost:3000/health
```

### Test with Node.js Script

```javascript
// test-backend.js
const http = require("http");

function submitCode(code) {
  const data = JSON.stringify({ code });

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/submissions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Test
const code = `
public class Solution {
  public static void main(String[] args) {
    System.out.println("Testing LevCode!");
  }
}
`;

submitCode(code).then(console.log).catch(console.error);
```

---

## 🚢 Deployment to Railway

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway automatically detects `Dockerfile` and deploys
4. Backend + Docker sandbox run in same container
5. Frontend (Vercel) communicates via `https://your-railway-domain.com`

---

## 📝 Logs

Logs are printed to `stdout`:

```
[2026-03-11T10:30:45.123Z] INFO: Server running on port 3000
[2026-03-11T10:30:46.456Z] INFO: Submission received
[2026-03-11T10:30:46.789Z] INFO: Java code executed
```

For production, integrate with a logging service (e.g., Datadog, LogRocket).

---

## ⚠️ Known Limitations

1. **No authentication** — Users self-identify (research tool only)
2. **No database persistence yet** — Will be added in Phase 2
3. **Synchronous execution** — One submission per request (scale with queue later)
4. **Docker socket mount required** — Backend needs `/var/run/docker.sock` access

---

## 🔄 Next Steps

1. ✅ Backend API operational
2. ⏳ Database schema (PostgreSQL) + submission storage
3. ⏳ React frontend (Monaco Editor)
4. ⏳ Research analytics dashboard

---

## 💡 Development Tips

- Use `docker logs levcode-backend` to debug
- Use `docker exec -it levcode-java-sandbox bash` to debug sandbox
- Always run `npm ci` (not `npm install`) for reproducible dependencies
- Add `nodemon` for auto-reload: `npm install -D nodemon`, then `nodemon src/index.js`
