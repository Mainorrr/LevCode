# LevCode

Juez en línea para investigación académica sobre programación introductoria en Python. Permite a estudiantes resolver ejercicios y registra sus intentos en una base de datos para análisis estadístico.

## Requisitos

- Node.js 20+
- Docker Desktop (corriendo)

## Correr en local

Se necesitan tres terminales. Docker corre PostgreSQL; el backend y el frontend corren directamente con Node.

La imagen del sandbox Python se construye una sola vez (no levanta ningún contenedor permanente):

```bash
docker build -t levcode-python:latest ./docker/python
```

**Terminal 1 — base de datos** (desde la raíz del proyecto)

```bash
docker-compose up postgres
```

**Terminal 2 — backend** (desde `backend/`)

```bash
cd backend
npm install
npm run dev
```

**Terminal 3 — frontend** (desde `frontend/`)

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
├── docker-compose.yml      PostgreSQL (desarrollo local)
└── Dockerfile              Imagen del backend para producción
```

## Exportar datos de investigación

Ver sección en [backend/README.md](backend/README.md#exportar-datos).

## Deploy en Railway + Vercel

Ver sección en [backend/README.md](backend/README.md#deploy).
