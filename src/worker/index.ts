import { Hono } from 'hono'

// The Worker in front of the static app. The planner keeps its data in the
// browser (localStorage), so the only API route is a health check; add routes
// here when you move plans to a database. Unknown /api paths are a JSON 404;
// everything else falls through to the built assets, which answer any app
// path (/, /week, /stats, /focus/:id …) with index.html.
type Env = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.all('/api/health', (c) => c.json({ error: 'Méthode non autorisée' }, 405, { Allow: 'GET' }))
app.all('/api/*', (c) => c.json({ error: 'Introuvable' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
