import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,

    proxy: {
      '/api': {
        target: 'https://labour-connect-backend.onrender.com',
        changeOrigin: true,
        secure: true
      },

      '/socket.io': {
        target: 'https://labour-connect-backend.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true
      }
    }
  }
});