# LevCode -- Backend

Node.js + Express. Ejecuta codigo Python 3 via child_process, guarda sesiones en PostgreSQL y expone endpoints para exportar datos de investigacion.

## Variables de entorno

Archivo: `backend/.env.development`

```env
PORT=3000
NODE_ENV=development
API_PASSWORD=levcode123
ADMIN_PASSWORD=++invccadmin++

PYTHON_TIMEOUT=5000
PYTHON_OUTPUT_MAX=10485760

DATABASE_URL=postgresql://levcode:levcode@localhost:5432/levcode

FRONTEND_URL=http://localhost:3001
```

`API_PASSWORD` protege el endpoint de exportacion. `ADMIN_PASSWORD` protege el panel de administracion. Cambiar ambas en produccion.

## Endpoints

### POST /api/submissions
Ejecuta codigo Python 3 y retorna el output.

```json
// Request
{ "code": "...", "userId": "A12345", "problemId": "suma-enteros", "input": "2 3" }

// Response
{ "success": true, "output": "5\n", "error": "", "executionTime": 312 }
```

### POST /api/submissions/batch
Ejecuta codigo contra multiples inputs en secuencia.

```json
// Request
{ "code": "...", "userId": "A12345", "problemId": "suma-enteros", "inputs": ["2 3", "10 -4"] }

// Response
{ "success": true, "results": [{ "output": "5\n", "error": "", "exitCode": 0 }, ...], "executionTime": 523 }
```

### POST /api/sessions
Registra o actualiza la sesion de un estudiante en un ejercicio. Genera tratamientos aleatorios la primera vez.

```json
// Request
{ "carnet": "A12345", "grupo": "01", "problemId": "suma-enteros", "solved": false }

// Response
{ "success": true, "attempts": 3, "solved": false, "showTests": true, "showTries": false, "tryTimer": true }
```

### GET /api/sessions/:carnet/:problemId
Lee los datos de una sesion especifica sin modificarla.

### GET /api/sessions/status/:carnet
Estado de todos los ejercicios del estudiante.

### GET /api/sessions/treatments/:carnet
Tratamientos asignados por ejercicio.

### GET /api/export/csv
Descarga todos los registros como CSV. Requiere `X-API-Password` header.

### GET /health
```json
{ "status": "ok", "timestamp": "..." }
```

## Exportar datos

```bash
# Local
curl -H "X-API-Password: levcode123" http://localhost:3000/api/export/csv -o datos.csv

# Produccion
curl -H "X-API-Password: tu_password" https://tu-backend.railway.app/api/export/csv -o datos.csv
```

Columnas CSV: `id, carnet, grupo, problem_id, attempts, solved, hide_tests, show_tries, try_timer, created_at, updated_at`

## Schema de base de datos

```sql
CREATE TABLE exercise_sessions (
  id           SERIAL PRIMARY KEY,
  carnet       VARCHAR(6)   NOT NULL,
  grupo        VARCHAR(255) NOT NULL,
  problem_id   VARCHAR(100) NOT NULL,
  attempts     INTEGER      NOT NULL DEFAULT 0,
  solved       BOOLEAN      NOT NULL DEFAULT FALSE,
  hide_tests   BOOLEAN,
  show_tries   BOOLEAN,
  try_timer    BOOLEAN,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
);

CREATE TABLE access_passwords (
  id            SERIAL PRIMARY KEY,
  password_hash VARCHAR(64) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

La migracion corre automaticamente al iniciar el backend.

## Deploy en Railway

1. Crear proyecto en Railway
2. Agregar servicio desde el repositorio (Railway detecta el Dockerfile)
3. Agregar plugin **PostgreSQL** -- inyecta `DATABASE_URL` automaticamente
4. Configurar variables de entorno:

```
NODE_ENV=production
API_PASSWORD=password_segura
ADMIN_PASSWORD=password_admin_segura
PYTHON_TIMEOUT=5000
PYTHON_OUTPUT_MAX=10485760
FRONTEND_URL=https://tu-frontend.vercel.app
```

`DATABASE_URL` la provee Railway automaticamente.
