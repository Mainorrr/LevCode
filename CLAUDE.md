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

El enunciado comun va en `description`; lo que cambia entre lenguajes vive bajo
`languages`. El andamiaje obligatorio (el `public class Main` de Java, el
`int main()` de C++) va en `starterCodeTop`/`starterCodeBottom`, que el editor
muestra como regiones bloqueadas.

```json
{
  "id": "suma-dos-numeros",
  "title": "Suma de dos numeros",
  "description": "Lea dos numeros e imprima la suma.",
  "languages": {
    "python": { "initialEditable": "# Tu codigo aqui.", "note": "Use input() sin argumentos." },
    "cpp": {
      "starterCodeTop": "#include <iostream>\nusing namespace std;\n\nint main() {",
      "initialEditable": "    // Tu codigo aqui.",
      "starterCodeBottom": "    return 0;\n}",
      "note": "No use printf: <cstdio> esta bloqueado."
    }
  }
}
```

Un ejercicio sin `languages` usa los campos de primer nivel (`starterCode`,
`initialEditable`) y solo ofrece Python.

Los lenguajes que ve el estudiante salen de las claves de `languages`; que el
backend los acepte depende ademas de `ENABLED_LANGUAGES`. Si se desincronizan,
el estudiante ve un lenguaje que el backend rechaza.

El borrador en localStorage es **por lenguaje**; el lenguaje elegido se recuerda
por estudiante, no por ejercicio.

### testcases.json

```json
[
  { "input": "3\n500", "expectedOutput": "TOTAL: 1500" }
]
```

La visibilidad de los casos es todo o nada y la decide el tratamiento
`hide_tests`, no el caso: con el tratamiento activo el estudiante ve todos los
casos bloqueados, y sin el tratamiento puede desplegarlos todos.

> Las salidas esperadas deben ser **iguales en los tres lenguajes**: sin
> decimales (C++ imprime `490` donde Python imprime `490.0`), solo ASCII, y sin
> division ni modulo de negativos (Python redondea hacia abajo, C++ y Java
> truncan hacia cero).

---

## Sistema de Tratamientos (Investigacion)

Cada combinacion estudiante + ejercicio recibe 3 tratamientos booleanos aleatorios al crear el primer registro en la DB (`random() < 0.5` de PostgreSQL):

| Tratamiento  | Efecto cuando `true` |
| ------------ | -------------------- |
| `hide_tests` | Oculta la informacion de los casos de prueba fallidos; usa `showInfoHidden` de testcases.json |
| `show_tries` | Muestra contador de intentos con escala de color verde (0) a rojo (5+) |
| `try_timer`  | Cooldown global de 30 segundos entre intentos fallidos (persiste en localStorage) |

Cuando `hide_tests = false`, se usa `showInfo` de testcases.json (comportamiento por defecto, muestra info).

---

## Flujo de Ejecucion

1. Usuario selecciona un ejercicio del menu (frontend carga config.json)
2. Usuario ingresa datos: carnet, grupo
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
  problem_id   VARCHAR(100) NOT NULL,
  attempts     INTEGER      NOT NULL DEFAULT 0,
  solved       BOOLEAN      NOT NULL DEFAULT FALSE,
  language     VARCHAR(20)  NOT NULL DEFAULT 'python',
  hide_tests   BOOLEAN,
  show_tries   BOOLEAN,
  try_timer    BOOLEAN,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
);
```

### Tabla: attempt_code

```sql
CREATE TABLE attempt_code (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER     NOT NULL REFERENCES exercise_sessions(id) ON DELETE CASCADE,
  attempt_number  INTEGER     NOT NULL,
  code            TEXT        NOT NULL,
  language        VARCHAR(20) NOT NULL DEFAULT 'python',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_attempt UNIQUE (session_id, attempt_number)
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
- Agrupar por `grupo` para comparativas estadisticas
- Comparar tratamientos (hide_tests, show_tries, try_timer) con pruebas estadisticas
- `language` es covariable, NO tratamiento: se registra para controlarlo en el analisis
- El investigador exporta los datos via CSV y hace el analisis externamente

> **NUNCA implementar:** rankings visibles para el usuario, calculos de nota, ni dashboards estadisticos. Solo registrar datos crudos.

---

## Informacion del Usuario

Sin autenticacion. El usuario provee al inicio:

| Campo | Descripcion | Validacion |
|-------|-------------|-----------|
| `carnet` | ID estudiantil | `/^[A-Za-z\d]{6}$/` |
| `grupo` | Numero de grupo | Seleccion de lista |

Estos datos se almacenan con cada session para analisis estadistico.

---

## Limites de Ejecucion

| Limite | Valor |
|--------|-------|
| Timeout de ejecucion | 5 segundos por caso (`RUN_TIMEOUT`) |
| Timeout de compilacion | 10 segundos por submission (`COMPILE_TIMEOUT`) |
| Output maximo | 10 MB (`OUTPUT_MAX`) |
| Usuarios simultaneos max. | ~60 |

---

## Ejecucion Multi-lenguaje

`backend/src/services/languages.js` es el registro de lenguajes. Cada spec dice
como llevar el codigo del estudiante a un proceso: nombre de archivo, comando de
compilacion (null si es interpretado) y comando de ejecucion.

El contrato es **compilar una vez, ejecutar N veces**: cada submission crea un
directorio temporal, compila una sola vez y reutiliza el artefacto para todos los
casos de prueba. Un fallo de compilacion aborta la corrida y devuelve el stderr
del compilador.

`ENABLED_LANGUAGES` (env, default `python`) controla que lenguajes ven los
estudiantes. Estar en el registro no basta: hay que habilitarlo Y el binario
(`g++`, `javac`) debe existir en la imagen.

---

## Seguridad -- Patrones Bloqueados

Las listas de patrones bloqueados son **por lenguaje** (`backend/src/utils/validators.js`)
y fallan cerrado: un lenguaje sin lista definida no se ejecuta.

Python bloquea codigo que contiene:
- `import subprocess`
- `subprocess.`
- `os.system(`, `os.popen(`, `os.execv(`, `os.execve(`
- `__import__(`

C++ y Java tienen listas propias: ejecutar programas (`system(`, `fork(`,
`Runtime.getRuntime`, `ProcessBuilder`), sistema de archivos (`<fstream>`,
`<cstdio>`, `java.io.File`, `Files.`) y red.

> Para lenguajes compilados la lista negra NO es la defensa principal: el codigo
> nativo llega a las syscalls por caminos que ninguna regex cubre. La defensa
> real son los limites de proceso y el kill de grupo. La lista solo cierra las
> puertas obvias.

Efectos colaterales conocidos en C++: bloquear `<cstdio>` y `<stdio.h>` deja sin
`printf` (hay que usar `cout`), y `system("pause")` se rechaza. Ambos a
proposito, pero conviene decirselo al estudiante en el enunciado.

---

## Limites de Ejecucion por Proceso

`backend/src/services/processLimits.js` envuelve cada proceso con `prlimit`:
topes de CPU, memoria virtual, tamano de archivo, cantidad de procesos y
descriptores. Los hace cumplir el kernel, no dependen de que una regex haya
previsto el abuso.

`prlimit` se detecta al arrancar. Si falta, Python corre sin limites y se avisa
en el log, pero los lenguajes compilados se niegan a ejecutar (`requiresLimits`).

El proceso se lanza en su **propio grupo** y el timeout mata al grupo entero. Sin
eso, un descendiente sobrevive al `SIGKILL`, mantiene abiertas las tuberias de
stdout y la corrida no termina: el timeout deja de acotar la duracion.

> `RLIMIT_NPROC` va **apagado** (`NPROC_MAX=0`). No cuenta procesos sino TAREAS
> (hilos), y es por UID en todo el sistema: mientras el codigo del estudiante
> comparta UID con el backend, cualquier tope razonable ya esta superado por los
> hilos existentes y `g++` no logra lanzar `cc1plus`. Medido: 147 procesos son
> 1193 tareas. La fork bomb queda acotada por el kill de grupo y la lista de
> patrones. El tope recobra sentido con un UID dedicado.

---

## Cola de Ejecuciones

`backend/src/services/runQueue.js` limita cuantas submissions se ejecutan a la
vez (`MAX_CONCURRENT_RUNS`, default 4). El tope cuenta submissions completas
—compilacion mas todos sus casos— porque lo caro es compilar. Lo que no cabe
espera turno; si la espera pasa de `QUEUE_TIMEOUT` (30s) se responde que el
servidor esta ocupado.

---

## Reglas de Desarrollo

1. **La logica de ejercicios va en el frontend.** El backend no sabe que ejercicio se esta resolviendo.
2. **El backend es minimalista.** No agregar features al backend que puedan vivir en el frontend.
3. **Guardar TODO en la base de datos.** Incluso submissions fallidas -- son datos de investigacion.
4. **No implementar rankings ni calculos de nota.** Solo persistir datos crudos.
5. **No agregar autenticacion.** Herramienta de investigacion simple.
6. **Monorepo:** Respetar separacion `frontend/`, `backend/`.
7. **Sin Docker-in-Docker:** el codigo se ejecuta via `child_process` directamente en el backend.
8. **El lenguaje no es un tratamiento.** Se registra como covariable. Los intentos se
   cuentan por `(carnet, problem_id)`, nunca por lenguaje: si no, cambiar de lenguaje
   reiniciaria el contador y anularia `show_tries` y `try_timer`.

---

## Endpoints API

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/submissions` | Access PW | Ejecutar codigo (un input) |
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
| Tratamientos aleatorios (hide_tests, show_tries, try_timer) | Funcionando |
| Panel de administracion (/admin) | Funcionando |
| Contrasenas de acceso | Funcionando |
| Export CSV | Funcionando |
