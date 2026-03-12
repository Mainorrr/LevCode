# LevCode Frontend - React Editor

UI minimalista para el Online Judge LevCode usando **React + Vite + CodeMirror**.

## 🚀 Quick Start

### Instalar dependencias
```bash
cd frontend
npm install
```

### Ejecutar en desarrollo
```bash
npm run dev
```

Frontend estará disponible en: **http://localhost:3001**

### Compilar para producción
```bash
npm run build
npm run preview
```

---

## 📁 Estructura

```
frontend/
├── src/
│   ├── main.jsx              ← Entry point
│   ├── App.jsx               ← Componente principal
│   ├── App.css               ← Estilos
│   ├── index.css             ← Estilos globales
│   └── components/
│       ├── CodeEditor.jsx    ← Editor CodeMirror
│       └── ResultDisplay.jsx ← Muestra resultados
├── index.html                ← HTML template
├── vite.config.js            ← Configuración Vite
└── package.json
```

---

## ⚙️ Configuración

**Proxy API** (en `vite.config.js`):
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // Backend URL
    changeOrigin: true,
  }
}
```

Esto permite que `fetch('/api/submissions')` auto-redirija al backend.

---

## 🎨 Features

✅ **Editor de código** — Syntax highlighting para Java  
✅ **Ejecución** — Envía a backend vía POST  
✅ **Resultados** — Output, errores, tiempo de ejecución  
✅ **Metadatos** — Usuario ID y Problema ID (opcionales)  
✅ **Responsive** — Desktop + Mobile  
✅ **Minimalista** — Sin dependencias pesadas  

---

## 🔧 Tecnologías

| Dependencia | Versión | Propósito |
|---|---|---|
| **React** | 18.2.0 | UI framework |
| **Vite** | 5.0.8 | Build tool (rápido) |
| **CodeMirror** | 6.0.1 | Editor minimalista |
| **@codemirror/lang-java** | 6.4.5 | Java syntax |

---

## 📡 API Integration

El frontend espera que el backend esté en `http://localhost:3000`.

**Request:**
```json
POST /api/submissions
{
  "code": "public class Solution { ... }",
  "userId": "user123",
  "problemId": "problem_001"
}
```

**Response:**
```json
{
  "success": true,
  "output": "...",
  "error": "",
  "executionTime": 250,
  "limits": {...}
}
```

---

## 💡 Development Tips

- **Cambiar puerto frontend**: Edita `vite.config.js`, línea `port: 3001`
- **Cambiar URL backend**: Edita `vite.config.js`, línea `target: 'http://localhost:3000'`
- **Agregar temas CodeMirror**: Instala `@codemirror/theme-*` y aplica en `CodeEditor.jsx`
- **Debugging**: Abre DevTools (F12) en Chrome para logs del cliente

---

## 🚢 Deploy a Vercel

1. **Conecta repo a Vercel**
2. **Root directory**: `frontend/`
3. **Build command**: `npm run build`
4. **Output directory**: `dist`
5. **Environment variables**: 
   - `VITE_API_URL=https://your-railway-backend.com`

Luego actualiza `vite.config.js` para usar esta variable en producción.
