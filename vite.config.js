import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:55036',
        changeOrigin: true
      },
      '/hubs': {
        target: 'http://localhost:55036',
        changeOrigin: true,
        ws: true //web sockets for signalR
      }
    }
  }
})
