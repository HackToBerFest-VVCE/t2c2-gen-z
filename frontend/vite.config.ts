import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            // Graceful fallback for offline mode when local port 8000 is not reachable
            if (res && 'writeHead' in res && !(res as any).headersSent) {
              (res as any).writeHead(200, { 'Content-Type': 'application/json' });
              (res as any).end(JSON.stringify({
                status: 'offline',
                isBackendReachable: false,
                gemini_configured: false,
                message: 'Backend server is offline. Local knowledge & IndexedDB storage active.'
              }));
            }
          });
        }
      }
    }
  }
})
