import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // A project site on GitHub Pages lives under /<repo>/, while Vercel and a
  // local build are served from the root. The Pages workflow sets
  // SITE_BASE=/study-quest/; everywhere else the app stays at '/'.
  // `src/lib/router.tsx` reads the result back from `import.meta.env.BASE_URL`.
  const { SITE_BASE } = loadEnv(mode, '.', 'SITE_')
  const base = SITE_BASE ? `${SITE_BASE.replace(/\/+$/, '')}/` : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      cloudflare(),
      // The planner is a phone-first app used daily: it installs to the home
      // screen and keeps working offline. `autoUpdate` swaps the cache in the
      // background, so a deploy reaches installed copies without a prompt.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Study Quest — planner de révisions',
          short_name: 'Study Quest',
          description:
            'Transforme tes révisions en quête : planifie tes séances, gagne de l’XP, monte de niveau et affronte chaque contrôle comme un boss.',
          lang: 'fr',
          dir: 'ltr',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#04332f',
          background_color: '#04332f',
          categories: ['education', 'productivity'],
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
          // The pixel fonts come from Google; caching them keeps the look
          // offline. Everything else is already precached from the build.
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: { port: 5182, strictPort: false },
  }
})
