import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      // explicit path mapping for `@` to ensure Vite always resolves
      // correctly even if tsconfigPaths plugin has issues.
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14', 'ios12'],
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    middlewareMode: false,
  },
})

