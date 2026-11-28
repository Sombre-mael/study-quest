// Post-build fix-ups for the static app.
// 1. GitHub Pages answers an unknown path with the site's 404.html, so a copy
//    of index.html there lets /quests, /week or /focus/:id boot the router
//    instead of showing GitHub's own 404.
// 2. Strips files the Sites uploader refuses (hidden files and source maps)
//    from the build output, so `deploy.json` can point straight at dist/.
// 3. Checks that every icon named in the manifest and in index.html exists.
//    Icon file names carry a version that is written by hand in three places,
//    and a stale name shows up as a missing icon rather than a broken build.
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

function clean(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('.') || name.endsWith('.map')) {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) clean(path)
  }
}

// fileURLToPath keeps Windows drive letters intact (URL.pathname gives /C:/...).
const dist = fileURLToPath(new URL('../dist', import.meta.url))
clean(dist)

const client = join(dist, 'client')
copyFileSync(join(client, 'index.html'), join(client, '404.html'))

const html = readFileSync(join(client, 'index.html'), 'utf8')
const manifest = JSON.parse(readFileSync(join(client, 'manifest.webmanifest'), 'utf8'))
const named = [
  ...manifest.icons.map((icon) => icon.src),
  ...[...html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)].map((match) => match[1]),
]
const missing = named.filter((src) => !existsSync(join(client, basename(src))))
if (missing.length > 0) {
  throw new Error(`icônes absentes de public/ : ${missing.join(', ')} (ICON_VERSION à jour ?)`)
}
