import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['nanostyle.onrender.com']
  },
  server: {
    host: true // Listen on all addresses
  }
});