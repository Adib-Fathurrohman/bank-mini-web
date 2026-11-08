import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the built app is served. The production site serves it under /api/
// (https://bank.rumput.tech/api/); set VITE_BASE_PATH=/ to serve it at the root.
// Only the build (and `vite preview`) use it: in development /api is the backend proxy.
const PRODUCTION_BASE = '/api/'

export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In development /api is proxied to the Laravel backend so requests are
  // same-origin (backend limitation L4).
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8000'

  return {
    base: command === 'build' || isPreview ? env.VITE_BASE_PATH || PRODUCTION_BASE : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    // `vite preview` serves the build under its base (/api/), so it must not
    // inherit the dev proxy above.
    preview: { proxy: {} },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
