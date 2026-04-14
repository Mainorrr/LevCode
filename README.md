# LevCode

Juez en linea para investigacion academica sobre programacion introductoria en Python. Permite a estudiantes resolver ejercicios y registra sus intentos en una base de datos para analisis estadistico.

## Requisitos

- Node.js 20+
- Python 3.11+ (instalado en el sistema)
- PostgreSQL 16+ (local o via Docker)

## Correr en local

### Opcion 1: Docker Compose (recomendada)

Se necesitan dos terminales. Docker levanta PostgreSQL y el backend (que incluye Python).

**Terminal 1 -- backend + base de datos** (desde la raiz del proyecto)

```bash
docker-compose up --build
```

Esto levanta:
1. **postgres** -- base de datos PostgreSQL
2. **backend** -- API Node.js + Express con Python 3 incluido en el contenedor

**Terminal 2 -- frontend** (desde `frontend/`)

```bash
cd frontend
npm install
npm run dev
```

### URLs

| Servicio   | URL                      |
| ---------- | ------------------------ |
| Frontend   | http://localhost:3001     |
| Backend    | http://localhost:3000     |
| Admin      | http://localhost:3001/admin |
| PostgreSQL | localhost:5432 (interno) |

## Estructura

```
LevCode/
├── frontend/               React + Vite + CodeMirror
│   └── src/
│       ├── components/     App, CodeEditor, ResultDisplay, UserForm, ExerciseMenu, AdminPanel
│       └── exercises/      Configuracion y casos de prueba por ejercicio
├── backend/                Node.js + Express
│   └── src/
│       ├── routes/         submissions, sessions, admin, export, accessPasswords
│       ├── services/       pythonExecutor, pythonRunner
│       ├── config/         env, db
│       └── db/             migrate.js
├── docker-compose.yml      PostgreSQL + Backend
└── Dockerfile              Imagen del backend (Node.js + Python 3)
```

## Ejecucion de codigo Python

El codigo de los estudiantes se ejecuta directamente con `child_process` (Node.js) invocando `python3` en el mismo servidor. No se requiere Docker-in-Docker.

Limites de ejecucion:
- **Timeout:** 5 segundos por caso de prueba
- **Output maximo:** 10 MB
- **Patrones bloqueados:** `import subprocess`, `os.system`, `__import__`, etc.

## Sistema de tratamientos (investigacion)

Cada combinacion estudiante + ejercicio recibe aleatoriamente 3 tratamientos booleanos:

| Tratamiento  | Efecto cuando `true`                                         |
| ------------ | ------------------------------------------------------------ |
| `show_tests` | Usa `showInfo` de testcases.json para mostrar detalles       |
| `show_tries` | Muestra contador de intentos con escala verde-rojo           |
| `try_timer`  | Cooldown global de 30s entre intentos fallidos               |

Cuando `show_tests` es `false`, se usa `showInfoHidden` de testcases.json en su lugar.

## Exportar datos

```bash
curl -H "X-API-Password: tu_password" https://tu-backend/api/export/csv -o datos.csv
```

## Deploy

- **Frontend:** Vercel (root directory: `frontend`, build: `npm run build`, output: `dist`)
- **Backend:** Railway (usa el Dockerfile de la raiz, incluye Python 3)
- **Base de datos:** PostgreSQL plugin en Railway
