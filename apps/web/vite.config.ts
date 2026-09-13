import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [react()],
  preview: {
    port: 4173,
    strictPort: true,
  },
})
