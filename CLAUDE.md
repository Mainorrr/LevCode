# CLAUDE.md — LevCode Online Judge

## Propósito del Proyecto

LevCode es un **juez en línea de investigación** para estudiantes principiantes de programación en Python 3. Su objetivo es estudiar qué configuraciones reducen el comportamiento de prueba y error (trial-and-error) en los estudiantes. NO es una plataforma de producción general — es una herramienta de investigación académica.

---

## Objetivo de Investigación

Comparar el efecto de distintos **métodos de retroalimentación** sobre la conducta de prueba y error de los estudiantes:

| Tipo | Método | Descripción |
|------|--------|-------------|
| Positivo | Mostrar casos de prueba fallidos | El estudiante ve qué entradas/salidas esperadas falló, para que analice en lugar de adivinar |
| Negativo | Ocultar casos de prueba | El estudiante no sabe qué falló, mayor presión para pensar |
| Positivo (futuro) | Ranking / puntos extra | Top 3 reciben bonificación en la nota |
| Negativo (futuro) | Penalización por intento fallido | Cada intento fallido descuenta puntos del resultado final |

> **IMPORTANTE:** El sistema NO implementa rankings ni cálculos de puntos. Solo registra los datos en la base de datos para que el investigador los analice externamente con pruebas estadísticas (Tukey, ANOVA, etc.).

---

## Arquitectura General

```
LevCode/ (monorepo)
├── frontend/        → React + Vite + CodeMirror (lógica de ejercicios vive aquí)
├── backend/         → Node.js + Express (solo ejecuta código y guarda datos)
├── docker/          → Sandbox Python 3 (Python 3.11)
├── docker-compose.yml
└── Dockerfile       (backend container)
```

**Principio de separación de responsabilidades:**
- **Frontend:** Carga ejercicios desde archivos de configuración locales, muestra/oculta casos de prueba según config del ejercicio, maneja el menú de ejercicios
- **Backend:** Ejecuta código Python 3 en Docker, guarda submissions en DB, retorna resultados. Lo más simple posible.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + CodeMirror 6 + tema Nord |
| Backend | Node.js 20 + Express 4 |
| Ejecución Python 3 | Docker (python:3.11-slim) vía `child_process` |
| Base de datos | PostgreSQL (aún no implementada) |
| Hosting (plan) | Frontend: Vercel / Backend + Docker: Railway |

---

## Sistema de Ejercicios (Frontend)

Los ejercicios se almacenan como **archivos de configuración en el frontend** (no en el backend). El backend no conoce nada sobre los ejercicios.

### Estructura de un ejercicio

Cada ejercicio tendrá su propia carpeta dentro de `frontend/src/exercises/`:

```
frontend/src/exercises/
├── hello-world/
│   ├── config.json       ← configuración del ejercicio
│   └── testcases.json    ← casos de prueba (input/output esperado)
├── suma-dos-numeros/
│   ├── config.json
│   └── testcases.json
└── ...
```

### config.json de un ejercicio

```json
{
  "id": "hello-world",
  "title": "Hola Mundo",
  "description": "Imprime 'Hello World' en la consola.",
  "showTestCases": true,
  "penalizeFailures": false,
  "starterCode": "# Tu código aquí\nprint('Hello World')"
}
```

**Campo clave: `showTestCases`** — controla si se muestran los casos de prueba fallidos al estudiante. Este es el parámetro de investigación principal actualmente implementable.

### testcases.json de un ejercicio

```json
[
  { "input": "", "expectedOutput": "Hello World" },
  { "input": "2 3", "expectedOutput": "5" }
]
```

---

## Flujo de Ejecución

1. Usuario selecciona un ejercicio del menú (frontend carga el config.json correspondiente)
2. Usuario ingresa datos personales: carnet, grupo, semestre
3. Usuario escribe código Python 3 y hace submit
4. Frontend envía al backend: `{ code, userId, problemId, group, semester }`
5. Backend ejecuta en Docker, retorna resultado
6. Frontend valida output contra `testcases.json` localmente
7. Frontend muestra resultado y, si `showTestCases: true`, muestra los casos que fallaron
8. Backend guarda la submission completa en PostgreSQL (incluyendo pass/fail por caso de prueba)

---

## Base de Datos (PostgreSQL — pendiente de implementar)

### Datos a guardar por submission

```sql
-- tabla submissions
id, user_id, carnet, grupo, semestre,
problem_id, code, output, expected_output,
passed (bool), failed_cases (json), execution_time_ms,
attempt_number (por usuario+problema), created_at
```

### Propósito de los datos

- Calcular número de intentos antes de pasar (trial-and-error score)
- Agrupar por `grupo` o `semestre` para comparativas estadísticas
- Pruebas de Tukey para comparar métodos positivos vs negativos
- El investigador exporta los datos y hace el análisis externamente

> **NUNCA implementar:** rankings visibles para el usuario, cálculos de nota, ni dashboards estadísticos. Solo registrar datos crudos.

---

## Información del Usuario

Sin autenticación. El usuario provee al inicio:

| Campo | Descripción | Validación |
|-------|-------------|-----------|
| `carnet` | ID estudiantil (1 letra + 5 dígitos) | `/^[A-Za-z\d]{6}$/` |
| `grupo` | Número de grupo del curso | Texto libre |
| `semestre` | Semestre en el que está de la carrera | Número entero |

Estos datos se almacenan con cada submission para análisis estadístico.

---

## Límites de Ejecución Docker

| Límite | Valor |
|--------|-------|
| Timeout | 5 segundos |
| Memoria | 128MB |
| Red | Deshabilitada (`--network=none`) |
| Output máximo | 10MB |
| Usuarios simultáneos máx. | ~60 |

---

## Seguridad — Patrones Python Bloqueados

El backend bloquea código que contiene:
- `import os`
- `import subprocess`
- `import sys`
- `open(`
- `__import__`
- `exec(`
- `eval(`

---

## Inconsistencias Conocidas

- **Puerto Vite:** `vite.config.js` configura puerto 3001, pero `.env.development` usa `FRONTEND_URL=http://localhost:5173`. El puerto correcto activo es el que Vite use al iniciar.
- **Auth middleware:** `backend/src/middleware/auth.js` existe pero NO está aplicado a las rutas. Ignorar por ahora.

---

## Reglas de Desarrollo

1. **La lógica de ejercicios va en el frontend.** El backend no sabe qué ejercicio se está resolviendo, solo ejecuta código y guarda datos.
2. **El backend es minimalista.** No agregar features al backend que puedan vivir en el frontend.
3. **Guardar TODO en la base de datos.** Incluso submissions fallidas, incompletas o con errores de sintaxis — son datos de investigación.
4. **No implementar rankings ni cálculos de nota.** Solo persistir datos crudos.
5. **`showTestCases`** es el único parámetro de configuración de investigación actualmente activo. Configurado por ejercicio en `config.json`.
6. **No agregar autenticación.** Es una herramienta de investigación deliberadamente simple.
7. **Monorepo:** Respetar separación `frontend/`, `backend/`, `docker/`.

---

## Endpoints API Actuales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/submissions` | Enviar código para ejecución |
| GET | `/api/submissions/limits` | Ver límites de ejecución |
| GET | `/health` | Health check |

### Request body de `/api/submissions`

```json
{
  "code": "<python 3 source code>",
  "userId": "A12345",
  "problemId": "hello-world"
}
```

> Próximamente agregar: `group`, `semester`, `passedCases`, `failedCases`, `attemptNumber`

---

## Estado Actual del Proyecto

| Componente | Estado |
|-----------|--------|
| Ejecución Docker Python 3 | ✅ Funcionando |
| Frontend React + CodeMirror | ✅ Funcionando |
| API REST básica | ✅ Funcionando |
| Sistema de ejercicios | ⬜ Por implementar |
| Menú de ejercicios | ⬜ Por implementar |
| Validación de casos de prueba (frontend) | ⬜ Por implementar |
| `showTestCases` configurable | ⬜ Por implementar |
| Base de datos PostgreSQL | ⬜ Por implementar |
| Campos usuario (grupo, semestre) | ⬜ Por implementar |
| Guardar submissions en DB | ⬜ Por implementar |
