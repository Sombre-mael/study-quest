import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // A project site on GitHub Pages lives under /<repo>/, while Vercel and a
  // local build are served from the root. The Pages workflow sets
  // SITE_BASE=/study-quest/; everywhere else the app stays at '/'.
  // `src/lib/router.tsx` reads the result back from `import.meta.env.BASE_URL`.
  const { SITE_BASE } = loadEnv(mode, '.', 'SITE_')
  const base = SITE_BASE ? `${SITE_BASE.replace(/\/+$/, '')}/` : '/'

  return {
    base,
    plugins: [react(), tailwindcss(), cloudflare()],
    server: { port: 5182, strictPort: false },
  }
})
