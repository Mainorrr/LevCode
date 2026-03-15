# LevCode — Backend

Node.js + Express. Ejecuta código Java en un sandbox Docker, guarda sesiones en PostgreSQL y expone un endpoint para exportar datos de investigación.

## Variables de entorno

Archivo: `backend/.env.development`

```env
PORT=3000
NODE_ENV=development
API_PASSWORD=levcode123

DOCKER_IMAGE=levcode-java:latest
JAVA_TIMEOUT=5000
JAVA_MEMORY=128m
JAVA_OUTPUT_MAX=10485760

DATABASE_URL=postgresql://levcode:levcode@localhost:5432/levcode

FRONTEND_URL=http://localhost:3001
```

`API_PASSWORD` protege el endpoint de exportación. Cámbiala en producción.

## Endpoints

### POST /api/submissions
Ejecuta código Java y retorna el output. Llamado por el frontend por cada caso de prueba.

```json
// Request
{ "code": "...", "userId": "A12345", "problemId": "suma-enteros", "input": "2 3" }

// Response
{ "success": true, "output": "5\n", "error": "", "executionTime": 312 }
```

### POST /api/sessions
Registra o actualiza el intento de un estudiante en un ejercicio. Llamado por el frontend después de cada submit.

```json
// Request
{ "carnet": "A12345", "grupo": "01", "semestre": 3, "problemId": "suma-enteros", "solved": false }

// Response
{ "success": true, "attempts": 3, "solved": false }
```

La columna `solved` solo pasa a `true`; nunca revierte a `false`.

### GET /api/export/csv
Descarga todos los registros de `exercise_sessions` como CSV. Requiere autenticación.

```
Header: X-API-Password: <API_PASSWORD>
```

### GET /health
```json
{ "status": "ok", "timestamp": "..." }
```

## Exportar datos

### Con curl

**Local:**
```bash
curl -H "X-API-Password: levcode123" \
  http://localhost:3000/api/export/csv \
  -o datos.csv
```

**Railway:**
```bash
curl -H "X-API-Password: tu_password_produccion" \
  https://tu-backend.railway.app/api/export/csv \
  -o datos.csv
```

### Con Insomnia

1. Crear request `GET`
2. URL: `http://localhost:3000/api/export/csv` (local) o la URL de Railway
3. En la pestaña **Headers** agregar:
   - Name: `X-API-Password`
   - Value: `levcode123` (o la password de producción)
4. Click **Send** — Insomnia descarga el archivo automáticamente

El archivo descargado tiene el nombre `levcode_sessions_YYYY-MM-DD.csv` con las columnas:
`id, carnet, grupo, semestre, problem_id, attempts, solved, created_at, updated_at`

## Schema de base de datos

```sql
CREATE TABLE exercise_sessions (
  id         SERIAL PRIMARY KEY,
  carnet     VARCHAR(6)   NOT NULL,
  grupo      VARCHAR(255) NOT NULL,
  semestre   INTEGER      NOT NULL,
  problem_id VARCHAR(100) NOT NULL,
  attempts   INTEGER      NOT NULL DEFAULT 0,
  solved     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
);
```

La migración corre automáticamente al iniciar el backend.

## Conectar a la base de datos con TablePlus o DBeaver

| Campo    | Valor     |
|----------|-----------|
| Host     | localhost |
| Port     | 5432      |
| Database | levcode   |
| User     | levcode   |
| Password | levcode   |

## Deploy

### Railway

1. Crear proyecto en Railway
2. Agregar servicio desde el repositorio (Railway detecta el `Dockerfile` automáticamente)
3. Agregar el plugin **PostgreSQL** de Railway — inyecta `DATABASE_URL` automáticamente
4. Configurar variables de entorno en Railway:

```
NODE_ENV=production
API_PASSWORD=password_segura_aqui
DOCKER_IMAGE=levcode-java:latest
JAVA_TIMEOUT=5000
JAVA_MEMORY=128m
FRONTEND_URL=https://tu-frontend.vercel.app
```

`DATABASE_URL` la provee Railway automáticamente, no la pongas manualmente.

### Vercel (frontend)

1. Conectar el repo a Vercel
2. Root directory: `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
