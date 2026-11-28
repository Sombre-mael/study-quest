// Rasterises public/favicon.svg into the PNG icons an installable app needs.
// Run with `node scripts/generate-icons.mjs` after changing the logo; the PNGs
// it writes into public/ are committed, so a normal build does not need sharp.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url))
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

/** The maskable variant keeps the art inside the safe circle, on brand colour. */
function icon(size, name, { maskable = false } = {}) {
  const inner = Math.round(size * (maskable ? 0.62 : 1))
  const pad = Math.round((size - inner) / 2)
  return sharp(svg, { density: 512 })
    .resize(inner, inner)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#03706a' })
    .png()
    .toFile(out(name))
}

await Promise.all([
  icon(192, 'pwa-192.png'),
  icon(512, 'pwa-512.png'),
  icon(512, 'pwa-maskable-512.png', { maskable: true }),
  icon(180, 'apple-touch-icon.png'),
])

console.log('icônes PWA écrites dans public/')
