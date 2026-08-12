import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    // Vite rechaza peticiones cuyo Host no reconoce. Para exponer el servidor de
    // desarrollo por un túnel (demo al profesor, prueba desde el celular) hay que
    // permitir el dominio del túnel. Se listan dominios concretos y no `true`,
    // que aceptaría cualquier Host.
    allowedHosts: ['.trycloudflare.com', '.lhr.life', '.localhost.run', '.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  }
})
