import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages, the site is served from /<repo-name>/.
// Set VITE_BASE at build time, e.g. VITE_BASE=/three-lives/  (note trailing slash).
// Locally (npm run dev), VITE_BASE is unset and base falls back to '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
