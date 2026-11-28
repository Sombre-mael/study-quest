import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves a project site under /<repo>/, so every asset URL and
  // every route carries this prefix. `src/lib/router.tsx` reads it back from
  // `import.meta.env.BASE_URL`, which Vite fills in from here.
  base: '/study-quest/',
  plugins: [react(), tailwindcss(), cloudflare()],
  server: { port: 5182, strictPort: false },
})
