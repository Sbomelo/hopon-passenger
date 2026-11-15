import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5101',
        changeOrigin: true
      },
      '/hubs': {
        target: 'http://localhost:5101',
        changeOrigin: true,
        ws: true //web sockets for signalR
      }
    }
  }
})
