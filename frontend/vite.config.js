import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite rechaza peticiones cuyo Host no reconoce (protección contra DNS
// rebinding). Para exponer el frontend por un túnel — demo, prueba desde el
// celular — hay que permitir el dominio del túnel. Se listan dominios concretos
// y no `true`, que aceptaría cualquier Host.
const TUNNEL_HOSTS = ['.trycloudflare.com', '.lhr.life', '.localhost.run', '.ngrok-free.app']

// El backend vive aparte; el frontend le habla por rutas relativas /api.
const API_PROXY = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3001,
    allowedHosts: TUNNEL_HOSTS,
    proxy: API_PROXY,
  },

  // `npm run preview` sirve el build ya empaquetado. Para demos por túnel es lo
  // que hay que usar: el dev server manda cada módulo por separado (cientos de
  // peticiones), y con la latencia de un túnel eso tarda una eternidad en un
  // celular. El build son dos o tres archivos.
  preview: {
    port: 4173,
    allowedHosts: TUNNEL_HOSTS,
    proxy: API_PROXY,
  },
})
