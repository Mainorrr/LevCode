# LevCode — Frontend

React + Vite + CodeMirror. Carga ejercicios desde archivos de configuración locales, ejecuta los casos de prueba contra el backend y muestra los resultados.

## Correr en desarrollo

```bash
cd frontend
npm install
npm run dev
```

Disponible en http://localhost:3001. Requiere el backend corriendo en http://localhost:3000.

## Estructura

```
src/
├── components/
│   ├── App/              Componente principal, maneja flujo de vistas
│   ├── UserForm/         Formulario inicial: carnet, grupo, semestre
│   ├── ExerciseMenu/     Menu de seleccion de ejercicios
│   ├── CodeEditor/       Editor CodeMirror con soporte Python 3
│   └── ResultDisplay/    Muestra veredicto y casos fallidos
└── exercises/
    ├── index.js                  Registro central de ejercicios
    ├── hello-world/
    │   ├── config.json
    │   └── testcases.json
    └── suma-enteros/
        ├── config.json
        └── testcases.json
```

## Agregar un ejercicio

1. Crear una carpeta en `src/exercises/nombre-ejercicio/`

2. Crear `config.json`:
```json
{
  "id": "nombre-ejercicio",
  "title": "Título visible",
  "description": "Descripción del problema...",
  "showTestCases": true,
  "starterCode": "# Tu código aquí\n"
}
```

`showTestCases: true` muestra al estudiante los casos de prueba que falló.
`showTestCases: false` solo muestra el puntaje (X / N casos correctos).

3. Crear `testcases.json`:
```json
[
  { "input": "2 3", "expectedOutput": "5" },
  { "input": "0 0", "expectedOutput": "0" }
]
```

Para ejercicios sin stdin, usar `"input": ""`.

4. Registrar en `src/exercises/index.js`:
```js
import miEjercicioConfig    from './nombre-ejercicio/config.json'
import miEjercicioTestcases from './nombre-ejercicio/testcases.json'

export const exercises = [
  // ... ejercicios existentes ...
  { config: miEjercicioConfig, testcases: miEjercicioTestcases },
]
```

## Build para producción

```bash
npm run build
```

El output queda en `dist/`. Deployar en Vercel apuntando a esta carpeta.
