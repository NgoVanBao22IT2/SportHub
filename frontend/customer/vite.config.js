import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind on all interfaces — enables LAN and ngrok access
    port: 5175,
    // Allow ngrok and any external host to reach the Vite dev server
    allowedHosts: 'all',
    proxy: {
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
