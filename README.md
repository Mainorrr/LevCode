# LevCode

Juez en línea para investigación académica sobre programación introductoria en Python. Permite a estudiantes resolver ejercicios y registra sus intentos en una base de datos para análisis estadístico.

## Requisitos

- Node.js 20+
- Docker Desktop (corriendo)

## Correr en local

Se necesitan dos terminales. Docker levanta PostgreSQL, el backend y el sandbox Python con un solo comando.

**Terminal 1 — backend + base de datos + sandbox** (desde la raíz del proyecto)

```bash
docker-compose up --build
```

Esto levanta en orden:
1. **python-sandbox** — construye la imagen `levcode-python:latest` y sale
2. **postgres** — base de datos PostgreSQL
3. **backend** — API Node.js + Express (espera a que postgres esté listo y la imagen Python esté construida)

**Terminal 2 — frontend** (desde `frontend/`)

```bash
cd frontend
npm install
npm run dev
```

| Servicio   | URL                      |
| ---------- | ------------------------ |
| Frontend   | http://localhost:3001    |
| Backend    | http://localhost:3000    |
| PostgreSQL | localhost:5432 (interno) |

## Estructura

```
LevCode/
├── frontend/               React + Vite + CodeMirror
│   └── src/
│       ├── components/     App, CodeEditor, ResultDisplay, UserForm, ExerciseMenu
│       └── exercises/      Configuracion y casos de prueba por ejercicio
├── backend/                Node.js + Express
│   └── src/
│       ├── routes/         submissions, sessions, export
│       ├── services/       pythonExecutor, dockerManager
│       ├── config/         env, docker, db
│       └── db/             migrate.js
├── docker/python/          Dockerfile del sandbox Python 3.11
├── docker-compose.yml      PostgreSQL + Backend + Python sandbox
└── Dockerfile              Imagen del backend para producción
```

## Exportar datos de investigación

Ver sección en [backend/README.md](backend/README.md#exportar-datos).

## Deploy en Railway + Vercel

Ver sección en [backend/README.md](backend/README.md#deploy).
