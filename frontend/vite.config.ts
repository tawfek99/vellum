import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `@/...` maps to `src/...` (kept in sync with tsconfig paths).
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The project lives on a OneDrive-synced drive, where native file watching
    // is unreliable; polling keeps hot-reload working.
    watch: { usePolling: true },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
