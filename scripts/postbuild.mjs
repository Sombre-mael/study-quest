// Post-build fix-ups for the static app.
// 1. GitHub Pages answers an unknown path with the site's 404.html, so a copy
//    of index.html there lets /quests, /week or /focus/:id boot the router
//    instead of showing GitHub's own 404.
// 2. Strips files the Sites uploader refuses (hidden files and source maps)
//    from the build output, so `deploy.json` can point straight at dist/.
import { copyFileSync, readdirSync, rmSync, statSync } from 'node:fs'
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
