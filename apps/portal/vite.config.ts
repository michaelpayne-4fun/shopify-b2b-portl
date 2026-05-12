import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    host: true,
    // Allow ngrok / Cloudflare Tunnel to reach the dev server during
    // local OAuth round-trip testing.
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.trycloudflare.com'],
    // BFF API lives on a different port in dev; proxy /api/* to it.
    // Path is preserved (the BFF mounts its routes under /api).
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
