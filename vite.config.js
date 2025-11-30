import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Explicitly check process.env first (for Render/System vars), then the loaded env object
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    // Define global constant replacements
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    preview: {
      allowedHosts: ['nanostyle.onrender.com']
    },
    server: {
      host: true
    }
  };
});