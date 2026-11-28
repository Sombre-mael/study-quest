// Turns the mascot artwork into the app's icons: a framed pixel portrait (the
// installable icon), a transparent full-body mascot for the app, and a head for
// the header logo. The hoodie is recoloured from the blue of the artwork to the
// app's violet, so the character sits in the platform's palette.
//
// Run `pnpm run icons` after changing the artwork. The PNGs it writes into
// public/ are committed, so a normal build does not need sharp.
import { readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const source = readFileSync(new URL('./mascot-source.webp', import.meta.url))
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

// Bump this whenever the artwork changes. Installed apps keep the launcher
// icon they were given at install time as long as the manifest points at the
// same file names, so a new icon needs new URLs. The version appears here, in
// the manifest (vite.config.ts) and in index.html; `pnpm run build` fails if a
// name does not match the generated files, so a forgotten one cannot ship.
const ICON_VERSION = 'v2'

const BRAND = '#03706a'
const CREAM = '#fdf8ec'
// Shadow, mid and highlight of the hoodie, taken from the app's violet accent.
const HOODIE = ['#2a0f5c', '#5b21b6', '#8b5cf6'].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)))

/** Repaints the blue hoodie in the app's violet, keeping its folds. */
async function recolorHoodie() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = new Uint8Array(data)
  const c = info.channels
  const total = info.width * info.height
  const hoodie = []
  for (let i = 0; i < total; i++) {
    const r = px[i * c]
    const g = px[i * c + 1]
    const b = px[i * c + 2]
    // The only strong blue in the artwork is the sweater (jeans are grey).
    if (b > r + 40 && b > g + 25 && b > 90) hoodie.push(i)
  }
  // A new artwork could lose the blue entirely; fail loudly instead of silently
  // shipping a blue hoodie on a violet-minded icon.
  if (hoodie.length < total * 0.02) {
    throw new Error('sweat introuvable dans l’artwork : vérifie que scripts/mascot-source.webp est toujours le bon dessin')
  }
  const lum = (i) => 0.299 * px[i * c] + 0.587 * px[i * c + 1] + 0.114 * px[i * c + 2]
  let lo = 255
  let hi = 0
  for (const i of hoodie) {
    const l = lum(i)
    if (l < lo) lo = l
    if (l > hi) hi = l
  }
  const [shadow, mid, light] = HOODIE
  for (const i of hoodie) {
    const t = Math.max(0, Math.min(1, (lum(i) - lo) / (hi - lo || 1)))
    const a = t < 0.5 ? shadow : mid
    const b = t < 0.5 ? mid : light
    const k = t < 0.5 ? t * 2 : (t - 0.5) * 2
    for (let ch = 0; ch < 3; ch++) px[i * c + ch] = Math.round(a[ch] + (b[ch] - a[ch]) * k)
  }
  return sharp(Buffer.from(px), { raw: { width: info.width, height: info.height, channels: c } }).png().toBuffer()
}

/** Cuts the flat white studio background, starting from the image border so
 *  the white sneakers and highlights inside the character survive. */
async function cutBackground(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = new Uint8Array(data)
  const { width, height, channels } = info
  const seen = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0

  const isPaper = (i) => {
    const r = px[i * channels]
    const g = px[i * channels + 1]
    const b = px[i * channels + 2]
    return Math.min(r, g, b) >= 232 && Math.max(r, g, b) - Math.min(r, g, b) <= 16
  }
  const push = (i) => {
    if (seen[i] || !isPaper(i)) return
    seen[i] = 1
    queue[tail++] = i
  }

  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }

  while (head < tail) {
    const i = queue[head++]
    px[i * channels + 3] = 0
    const x = i % width
    const y = (i / width) | 0
    if (x > 0) push(i - 1)
    if (x < width - 1) push(i + 1)
    if (y > 0) push(i - width)
    if (y < height - 1) push(i + width)
  }

  return sharp(Buffer.from(px), { raw: { width, height, channels } }).png().toBuffer()
}

const art = await cutBackground(await recolorHoodie())
const { width, height } = await sharp(art).metadata()

/** Head and shoulders, sized so the face reads even at 48 px. */
async function bust(size) {
  const side = Math.round(Math.min(width, height * 0.46))
  const left = Math.round(width / 2 - side / 2)
  return sharp(art)
    .extract({ left, top: 0, width: side, height: side })
    .resize(size, size, { fit: 'cover', kernel: 'nearest' })
    .toBuffer()
}

/** The icon: portrait on brand colour, inside a chunky cream pixel frame. */
async function portrait() {
  return sharp({ create: { width: 512, height: 512, channels: 4, background: BRAND } })
    .composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect x="27" y="27" width="458" height="458" fill="none" stroke="${CREAM}" stroke-width="14"/></svg>`), top: 0, left: 0 },
      { input: await bust(460), top: 44, left: 26 },
    ])
    .png()
    .toBuffer()
}

const icon = await portrait()

await Promise.all([
  sharp(icon).toFile(out(`pwa-512-${ICON_VERSION}.png`)),
  sharp(icon).resize(192, 192, { kernel: 'nearest' }).toFile(out(`pwa-192-${ICON_VERSION}.png`)),
  sharp(icon).resize(64, 64, { kernel: 'nearest' }).toFile(out(`favicon-${ICON_VERSION}.png`)),
  sharp(icon).resize(180, 180, { kernel: 'nearest' }).toFile(out(`apple-touch-icon-${ICON_VERSION}.png`)),
  // Maskable icons are cropped to a circle by the launcher: drop the frame and
  // keep the face inside the safe circle.
  sharp({ create: { width: 512, height: 512, channels: 4, background: BRAND } })
    .composite([{ input: await bust(430), top: 41, left: 41 }])
    .png()
    .toFile(out(`pwa-maskable-512-${ICON_VERSION}.png`)),
])

// The transparent full body, for the panels inside the app. A limited palette
// keeps the 780 px figure under 100 kB without a visible loss.
const mascot = await sharp(art)
  .resize({ height: 780, kernel: 'nearest' })
  .trim({ threshold: 1 })
  .png({ palette: true, colours: 256, effort: 10 })
  .toFile(out('mascot.png'))

/** A square head crop, for the header logo and the hero frame. */
async function head(size, name) {
  const side = Math.round(Math.min(width, height * 0.34))
  const left = Math.round(width / 2 - side / 2)
  await sharp(art)
    .extract({ left, top: 0, width: side, height: side })
    .resize(size, size, { kernel: 'nearest' })
    .png({ palette: true, colours: 256 })
    .toFile(out(name))
}

await Promise.all([head(256, 'mascot-head.png'), head(320, 'mascot-bust.png')])

// Icons from an older version are dead weight and confuse the next edit: drop
// them here, so bumping ICON_VERSION is the only step that is easy to forget.
for (const name of readdirSync(new URL('../public/', import.meta.url))) {
  const previous = /-v(\d+)\.png$/.exec(name)
  if (previous && `v${previous[1]}` !== ICON_VERSION) unlinkSync(out(name))
}

console.log(`icônes PWA et mascotte écrites dans public/ (${mascot.width}×${mascot.height})`)
