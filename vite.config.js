import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'; // 👈 ADD THIS

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(),
            tailwindcss(),
            tsconfigPaths(), // 👈 ADD THIS
          ],
})

