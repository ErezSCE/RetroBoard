import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite configuration for the frontend package.
export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 5173,
  },
});
