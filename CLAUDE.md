# CLAUDE.md -- LevCode Online Judge

## Proposito del Proyecto

LevCode es un **juez en linea de investigacion** para estudiantes principiantes de programacion en Python 3. Su objetivo es estudiar que configuraciones reducen el comportamiento de prueba y error (trial-and-error) en los estudiantes. NO es una plataforma de produccion general -- es una herramienta de investigacion academica.

---

## Objetivo de Investigacion

Comparar el efecto de distintos **metodos de retroalimentacion** sobre la conducta de prueba y error de los estudiantes:

| Tipo | Metodo | Descripcion |
|------|--------|-------------|
| Positivo | Mostrar casos de prueba fallidos | El estudiante ve que entradas/salidas esperadas fallo, para que analice en lugar de adivinar |
| Negativo | Ocultar casos de prueba | El estudiante no sabe que fallo, mayor presion para pensar |
| Positivo (futuro) | Ranking / puntos extra | Top 3 reciben bonificacion en la nota |
| Negativo (futuro) | Penalizacion por intento fallido | Cada intento fallido descuenta puntos del resultado final |

> **IMPORTANTE:** El sistema NO implementa rankings ni calculos de puntos. Solo registra los datos en la base de datos para que el investigador los analice externamente con pruebas estadisticas (Tukey, ANOVA, etc.).

---

## Arquitectura General

```
LevCode/ (monorepo)
├── frontend/        -> React + Vite + CodeMirror (logica de ejercicios vive aqui)
├── backend/         -> Node.js + Express (ejecuta codigo Python y guarda datos)
├── docker-compose.yml   (PostgreSQL + Backend)
└── Dockerfile           (Backend: Node.js + Python 3)
```

**Principio de separacion de responsabilidades:**
- **Frontend:** Carga ejercicios desde archivos de configuracion locales, muestra/oculta casos de prueba segun tratamientos, maneja el menu de ejercicios
- **Backend:** Ejecuta codigo Python 3 via child_process, guarda sessions en DB, retorna resultados. Lo mas simple posible.

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 18 + Vite + CodeMirror 6 + tema Nord |
| Backend | Node.js 20 + Express 4 |
| Ejecucion Python 3 | `child_process` (spawn python3 directamente) |
| Base de datos | PostgreSQL 16 |
| Hosting | Frontend: Vercel / Backend: Railway / DB: Railway PostgreSQL |

---

## Sistema de Ejercicios (Frontend)

Los ejercicios se almacenan como **archivos de configuracion en el frontend** (no en el backend). El backend no conoce nada sobre los ejercicios.

### Estructura de un ejercicio

```
frontend/src/exercises/
├── hello-world/
│   ├── config.json
│   └── testcases.json
├── suma-enteros/
│   ├── config.json
│   └── testcases.json
└── index.js            <- exporta todos los ejercicios
```

### config.json

```json
{
  "id": "hello-world",
  "title": "Hola Mundo",
  "description": "Imprime 'Hello World' en la consola.",
  "starterCode": "# Tu codigo aqui\nprint('Hello World')"
}
```

### testcases.json

```json
[
  { "input": "", "expectedOutput": "Hello World", "showInfo": true, "showInfoHidden": false }
]
```

- `showInfo`: si se muestra info del caso cuando `show_tests = true`
- `showInfoHidden`: si se muestra info del caso cuando `show_tests = false`

---

## Sistema de Tratamientos (Investigacion)

Cada combinacion estudiante + ejercicio recibe 3 tratamientos booleanos aleatorios al crear el primer registro en la DB (`random() < 0.5` de PostgreSQL):

| Tratamiento  | Efecto cuando `true` |
| ------------ | -------------------- |
| `show_tests` | Usa `showInfo` de testcases.json para decidir que info mostrar en casos fallidos |
| `show_tries` | Muestra contador de intentos con escala de color verde (0) a rojo (5+) |
| `try_timer`  | Cooldown global de 30 segundos entre intentos fallidos (persiste en localStorage) |

Cuando `show_tests = false`, se usa `showInfoHidden` de testcases.json.

---

## Flujo de Ejecucion

1. Usuario selecciona un ejercicio del menu (frontend carga config.json)
2. Usuario ingresa datos: carnet, grupo, curso
3. Frontend registra sesion via `POST /api/sessions` (crea registro con tratamientos aleatorios)
4. Usuario escribe codigo Python 3 y hace submit
5. Frontend envia al backend: `{ code, userId, problemId, inputs }`
6. Backend ejecuta Python via `child_process`, retorna resultados por caso
7. Frontend valida output contra `testcases.json` localmente
8. Frontend muestra resultado segun tratamientos asignados
9. `POST /api/sessions` incrementa `attempts` y registra si resolvio

---

## Base de Datos (PostgreSQL)

### Tabla: exercise_sessions

```sql
CREATE TABLE exercise_sessions (
  id           SERIAL PRIMARY KEY,
  carnet       VARCHAR(6)   NOT NULL,
  grupo        VARCHAR(255) NOT NULL,
  curso        VARCHAR(255) NOT NULL DEFAULT '',
  problem_id   VARCHAR(100) NOT NULL,
  attempts     INTEGER      NOT NULL DEFAULT 0,
  solved       BOOLEAN      NOT NULL DEFAULT FALSE,
  show_tests   BOOLEAN,
  show_tries   BOOLEAN,
  try_timer    BOOLEAN,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
);
```

### Tabla: access_passwords

```sql
CREATE TABLE access_passwords (
  id            SERIAL PRIMARY KEY,
  password_hash VARCHAR(64) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Proposito de los datos

- Calcular numero de intentos antes de pasar (trial-and-error score)
- Agrupar por `grupo` o `curso` para comparativas estadisticas
- Comparar tratamientos (show_tests, show_tries, try_timer) con pruebas estadisticas
- El investigador exporta los datos via CSV y hace el analisis externamente

> **NUNCA implementar:** rankings visibles para el usuario, calculos de nota, ni dashboards estadisticos. Solo registrar datos crudos.

---

## Informacion del Usuario

Sin autenticacion. El usuario provee al inicio:

| Campo | Descripcion | Validacion |
|-------|-------------|-----------|
| `carnet` | ID estudiantil | `/^[A-Za-z\d]{6}$/` |
| `grupo` | Numero de grupo del curso | Seleccion de lista |
| `curso` | Nombre del curso | Seleccion de lista |

Estos datos se almacenan con cada session para analisis estadistico.

---

## Limites de Ejecucion

| Limite | Valor |
|--------|-------|
| Timeout | 5 segundos por caso |
| Output maximo | 10 MB |
| Usuarios simultaneos max. | ~60 |

---

## Seguridad -- Patrones Python Bloqueados

El backend bloquea codigo que contiene:
- `import subprocess`
- `subprocess.`
- `os.system(`, `os.popen(`, `os.execv(`, `os.execve(`
- `__import__(`

---

## Reglas de Desarrollo

1. **La logica de ejercicios va en el frontend.** El backend no sabe que ejercicio se esta resolviendo.
2. **El backend es minimalista.** No agregar features al backend que puedan vivir en el frontend.
3. **Guardar TODO en la base de datos.** Incluso submissions fallidas -- son datos de investigacion.
4. **No implementar rankings ni calculos de nota.** Solo persistir datos crudos.
5. **No agregar autenticacion.** Herramienta de investigacion simple.
6. **Monorepo:** Respetar separacion `frontend/`, `backend/`.
7. **Sin Docker-in-Docker:** Python se ejecuta via `child_process` directamente en el backend.

---

## Endpoints API

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/submissions` | Access PW | Ejecutar codigo Python (un input) |
| POST | `/api/submissions/batch` | Access PW | Ejecutar codigo contra multiples inputs |
| GET | `/api/submissions/limits` | -- | Limites de ejecucion |
| POST | `/api/sessions` | Access PW | Registrar/actualizar sesion de ejercicio |
| GET | `/api/sessions/status/:carnet` | Access PW | Estado de ejercicios del estudiante |
| GET | `/api/sessions/:carnet/:problemId` | Access PW | Datos de una sesion especifica |
| GET | `/api/sessions/treatments/:carnet` | Access PW | Tratamientos por ejercicio |
| POST | `/api/admin/sessions` | Admin PW | Todos los registros (panel admin) |
| GET | `/api/export/csv` | API PW | Exportar datos como CSV |
| POST | `/api/access/passwords` | Admin PW | Crear contrasena de acceso |
| GET | `/api/access/passwords` | Admin PW | Listar contrasenas |
| DELETE | `/api/access/passwords/:id` | Admin PW | Eliminar contrasena |
| POST | `/api/access/validate` | -- | Validar contrasena de acceso |
| GET | `/health` | -- | Health check |

---

## Estado Actual del Proyecto

| Componente | Estado |
|-----------|--------|
| Ejecucion Python 3 (child_process) | Funcionando |
| Frontend React + CodeMirror | Funcionando |
| API REST | Funcionando |
| Sistema de ejercicios (menu + config) | Funcionando |
| Validacion de casos de prueba (frontend) | Funcionando |
| Base de datos PostgreSQL | Funcionando |
| Tratamientos aleatorios (show_tests, show_tries, try_timer) | Funcionando |
| Panel de administracion (/admin) | Funcionando |
| Contrasenas de acceso | Funcionando |
| Export CSV | Funcionando |
