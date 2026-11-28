// Turns the mascot artwork into the app's icons: a pixel portrait with a book
// badge (the installable icon), a transparent full-body mascot for the app, and
// a head for the header logo.
//
// Run `pnpm run icons` after changing the artwork. The PNGs it writes into
// public/ are committed, so a normal build does not need sharp.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const source = readFileSync(new URL('./mascot-source.webp', import.meta.url))
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

const BRAND = '#03706a'

/** Cuts the flat white studio background, starting from the image border so
 *  the white sneakers and highlights inside the character survive. */
async function cutBackground() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const px = new Uint8Array(data)
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

/** The book badge: the old logo glyph, drawn chunky on an ink tile. */
function bookBadge(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#10201f"/>
      <rect x="2" y="2" width="60" height="60" fill="none" stroke="#fdf8ec" stroke-width="2"/>
      <path d="M32 19v28M32 19c-4.5-3-10-4-17-3v28c7-1 12.5 0 17 3 4.5-3 10-4 17-3V16c-7-1-12.5 0-17 3z"
        fill="none" stroke="#fdf8ec" stroke-width="5" stroke-linecap="square" stroke-linejoin="miter"/>
    </svg>`,
  )
}

/** Portrait: head and shoulders on the brand colour, with the book badge. */
async function portrait(size) {
  const full = sharp(await cutBackground())
  const { width, height } = await full.metadata()
  const side = Math.round(Math.min(width, height * 0.62))
  const left = Math.max(0, Math.round(width / 2 - side / 2))
  const bust = await full
    .extract({ left, top: 0, width: side, height: side })
    .resize(size, size, { fit: 'cover', kernel: 'nearest' })
    .toBuffer()

  const badge = Math.round(size * 0.3)
  const margin = Math.round(size * 0.055)
  return sharp({ create: { width: size, height: size, channels: 4, background: BRAND } })
    .composite([
      { input: bust, top: 0, left: 0 },
      { input: bookBadge(badge), top: size - badge - margin, left: size - badge - margin },
    ])
    .png()
    .toBuffer()
}

const art = await portrait(512)

await Promise.all([
  sharp(art).toFile(out('pwa-512.png')),
  sharp(art).resize(192, 192, { kernel: 'nearest' }).toFile(out('pwa-192.png')),
  sharp(art).resize(64, 64, { kernel: 'nearest' }).toFile(out('favicon.png')),
  // Maskable icons are cropped to a circle by the launcher: keep the art in
  // the middle 78% so nothing important is lost.
  sharp({ create: { width: 512, height: 512, channels: 4, background: BRAND } })
    .composite([{ input: await sharp(art).resize(400, 400, { kernel: 'nearest' }).toBuffer(), top: 56, left: 56 }])
    .png()
    .toFile(out('pwa-maskable-512.png')),
  sharp(art).resize(180, 180, { kernel: 'nearest' }).toFile(out('apple-touch-icon.png')),
])

// The transparent full body, for the panels inside the app. A limited palette
// keeps a 780 px figure around 150 kB without a visible loss.
const mascot = await sharp(await cutBackground())
  .resize({ height: 780, kernel: 'nearest' })
  .trim({ threshold: 1 })
  .png({ palette: true, colours: 256, effort: 10 })
  .toFile(out('mascot.png'))

/** A square head crop, for the header logo and the hero frame. */
async function head(size, name) {
  const full = sharp(await cutBackground())
  const { width, height } = await full.metadata()
  const side = Math.round(Math.min(width, height * 0.36))
  const left = Math.round(width / 2 - side / 2)
  await full
    .extract({ left, top: 0, width: side, height: side })
    .resize(size, size, { kernel: 'nearest' })
    .png({ palette: true, colours: 256 })
    .toFile(out(name))
}

await Promise.all([head(256, 'mascot-head.png'), head(320, 'mascot-bust.png')])

console.log(`icônes PWA et mascotte écrites dans public/ (${mascot.width}×${mascot.height})`)
