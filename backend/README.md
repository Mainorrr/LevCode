# LevCode Backend - Setup & Execution Guide

## 📋 Overview

Backend for **LevCode Online Judge** built with:
- **Node.js + Express** — REST API
- **Docker** — Java code execution sandbox
- **JavaScript** — No TypeScript complexity

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** (for local development)
- **Docker** installed and running
- **Docker Compose** (optional, recommended)

### Option 1: Local Development (No Docker Compilation)

```bash
# Install dependencies
npm ci

# Copy environment file
cp backend/.env.example backend/.env.development

# Run backend
npm run dev
```

**Note:** This mode expects Docker to be available for executing submissions (it spawns `docker run` commands).

### Option 2: Full Docker Setup (Recommended for Production-like Testing)

```bash
# Build and run everything
npm run dev:docker

# In another terminal, test:
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"code":"public class Solution { public static void main(String[] args) { System.out.println(\"Hello, LevCode!\"); } }"}'
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.js              ← Entry point (starts server)
│   ├── server.js             ← Express app configuration
│   ├── config/
│   │   ├── env.js            ← Environment variables
│   │   └── docker.js         ← Docker container limits
│   ├── routes/
│   │   └── submissions.js    ← POST /api/submissions
│   ├── services/
│   │   ├── javaExecutor.js   ← Compilation + execution logic
│   │   └── dockerManager.js  ← Docker container management
│   └── utils/
│       ├── logger.js         ← Logging
│       └── validators.js     ← Input validation (security)
├── .env.example
├── .env.development
└── Dockerfile (for Railway deployment)
```

---

## 🔧 Configuration

Environment variables (`.env.development`):

```dotenv
PORT=3000
NODE_ENV=development

# Docker & Java Execution
DOCKER_IMAGE=levcode-java:latest
JAVA_TIMEOUT=5000              # milliseconds
JAVA_MEMORY=128m               # memory limit
JAVA_OUTPUT_MAX=10485760       # 10MB max output

# Database (future)
DATABASE_URL=postgresql://localhost:5432/levcode

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🐳 Docker Setup

### Build Java Sandbox Image (Standalone)

```bash
docker build -t levcode-java:latest -f docker/java/Dockerfile docker/java/
```

### Using Docker Compose (Development)

```bash
docker-compose up --build
```

This will:
1. Build the Java sandbox image (`levcode-java:latest`)
2. Build the backend image (`levcode-backend:latest`)
3. Start both containers on the same network
4. Backend listens on `http://localhost:3000`

---

## 📡 API Endpoints

### POST `/api/submissions`

Submit Java code for execution.

**Headers (Required):**
```
X-API-Password: levcode123
Content-Type: application/json
```

**Request:**
```json
{
  "code": "public class Solution { ... }",
  "userId": "user123",        // optional, for research tracking
  "problemId": "problem_001"  // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "output": "Hello, World!\n",
  "error": "",
  "executionTime": 234,
  "limits": {
    "timeout": 5000,
    "memory": "128m",
    "maxOutput": 10485760
  }
}
```

**Response (Wrong Password):**
```json
{
  "success": false,
  "error": "Invalid password",
  "code": "AUTH_FAILED"
}
```

**Response (Compilation Error):**
```json
{
  "success": false,
  "output": "",
  "error": "Solution.java:1: error: illegal start of type ...",
  "executionTime": 45,
  "limits": { ... }
}
```

### GET `/api/submissions/limits`

Get execution limits.

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

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T10:30:45.123Z"
}
```

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
const http = require('http');

function submitCode(code) {
  const data = JSON.stringify({ code });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/submissions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', reject);
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

