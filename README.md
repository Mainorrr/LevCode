# LevCode - Online Judge for Java

Un sistema de juez en línea para programación beginner en Java. Desarrollado para investigación académica.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│    Frontend (React + Vite)          │
│    Port: 5173                       │
│    No containers                    │
└────────────────┬────────────────────┘
                 │ HTTP
┌────────────────▼────────────────────┐
│    Backend (Node.js + Express)      │
│    Port: 3000                       │
│    Docker Container (Optional)      │
└────────────────┬────────────────────┘
                 │ Docker API
┌────────────────▼────────────────────┐
│  Java Sandbox (OpenJDK 17)          │
│  - Compilation + Execution          │
│  - Limits: 128MB RAM, 5s timeout    │
│  - Internal (no port exposed)       │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Start - Mac Silicon

### ✨ OPCIÓN RECOMENDADA: Híbrido

Backend en Docker, Frontend local (mejor rendimiento en Mac)

```bash
# 1️⃣ Instala dependencias
npm ci
cd frontend && npm install && cd ..

# 2️⃣ Inicia Backend + Java Sandbox
docker-compose up --build

# 3️⃣ En otra terminal, inicia Frontend
npm run frontend
```

**URLs:**

- 🎨 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000
- ☕ Java Sandbox: Interno (en Docker)

---

## 📚 Estructura del Proyecto

```
levcode/
├── frontend/                ← React App (Vite)
│   ├── src/
│   ├── package.json
│   └── README.md
├── backend/                 ← Node.js + Express
│   ├── src/
│   ├── config/
│   ├── services/
│   ├── routes/
│   ├── package.json
│   ├── .env.development  ← ⚠️ Importante: FRONTEND_URL=http://localhost:5173
│   └── README.md
├── docker/java/             ← Java Sandbox Dockerfile
│   └── Dockerfile
├── docker-compose.yml       ← Orquestación (Backend + Java)
├── Dockerfile              ← Backend container
└── README.md              ← Este archivo
```

---

## 📖 Instrucciones Detalladas

### Backend Setup

Ver [`backend/README.md`](backend/README.md) para:

- Alternativas de ejecución (Local, Docker, Hybrid)
- Configuración de entorno
- API endpoints
- Troubleshooting

### Frontend Setup

Ver [`frontend/README.md`](frontend/README.md) para:

- Instalación de dependencias
- Desarrollo con Vite
- Build para producción

---

## ✅ Requisitos Previos

**Opción Hybrid (RECOMENDADA):**

- Node.js 20+
- Docker Desktop (instalado y corriendo)
- npm o yarn

**Opción Local (sin Docker):**

- Node.js 20+
- Java JDK 17+
- Docker Desktop (para sandbox Java)

**Opción Full Docker:**

- Docker Desktop

---

## 🐳 Componentes Docker

### `java-sandbox` (OpenJDK 17)

- **Propósito:** Ejecutar código Java de forma segura
- **Red:** levcode-network (interna)
- **No expone puertos** (se comunica solo via Docker API)
- **Límites:** 128MB RAM, 5 segundos timeout

### `backend` (Node.js 20)

- **Propósito:** API REST + orquestación
- **Puerto:** 3000
- **Red:** levcode-network
- **Método de comunicación:** `/var/run/docker.sock` (Docker API)

---

## ⚙️ Configuración importante para Mac Silicon

### No necesitas hacer nada especial

El proyecto ya está optimizado para ARM64 (Apple Silicon):

```bash
# Verificar tu arquitectura
arch
# Si dice 'arm64' ← Tienes Apple Silicon ✅
```

### Si tienes problemas con Docker

```bash
# 1. Reconstruir images (limpia cache)
docker-compose down
docker system prune -a
docker-compose up --build

# 2. Verificar que Docker está corriendo
docker ps

# 3. Si no funciona, reinicia Docker Desktop
```

---

## 🧪 Testing de la API

Una vez que todo está corriendo:

```bash
# Test archivo example.java
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "public class Solution { public static void main(String[] args) { System.out.println(\"Hello, LevCode!\"); } }"
  }'
```

Respuesta esperada:

```json
{
  "success": true,
  "output": "Hello, LevCode!\n",
  "error": "",
  "exitCode": 0,
  "executionTime": 234
}
```

---

## 📝 Scripts Disponibles (desde raíz)

```bash
# Instalar deps (raíz + backend)
npm ci

# Frontend
npm run frontend          # Inicia Vite en 5173
npm run frontend:install  # npm install en frontend/

# Docker Compose
docker-compose up --build     # Inicia Back + Java
docker-compose up             # Sin rebuild
docker-compose down           # Detiene containers
docker-compose down -v        # Detiene + elimina volumes
```

---

## 🛠️ Troubleshooting General

### Port already in use

```bash
lsof -i :3000  # encuentra qué usa puerto 3000
kill -9 <PID>  # mata el proceso
```

### Docker daemon error

```bash
# Abre Docker Desktop y verifica que está corriendo
docker ps
```

### Containers no se construyen

```bash
# Limpia todo y reconstruye
docker-compose down -v
docker-compose up --build
```

---

## 🔗 Links útiles

- [Node.js 20 LTS](https://nodejs.org/)
- [Docker Documentation](https://docs.docker.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

## 📄 Licencia

ISC

---

**Última actualización:** March 2026  
**Desarrollado para:** Investigación académica  
**Arquitectura:** Monorepo con 2 containers (Backend + Java Sandbox)
