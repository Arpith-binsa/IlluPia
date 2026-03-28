// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // OWASP: build-time guard — fail fast if required env vars are missing
  if (mode === 'production') {
    const required = ['VITE_SPOTIFY_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}. Check your Vercel environment settings.`);
      }
    }
  }

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
    },
  };
});
