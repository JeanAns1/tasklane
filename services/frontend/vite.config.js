import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In local dev (npm run dev), proxy API calls to the services running on the host.
// In Docker, Nginx does the same job (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/tasks': 'http://localhost:3000',
      '/api/analytics': 'http://localhost:8000',
    },
  },
});
