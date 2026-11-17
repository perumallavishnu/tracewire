import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // the manifest lets scripts/prerender.mjs preload the hero figure's chunks (deleted after)
  build: { manifest: true },
})
