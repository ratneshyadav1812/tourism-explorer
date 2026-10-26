import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { findPlaces, getWeather, HttpError } from './places.js'

const app = new Hono()

// Logger Middleware
app.use('*', logger())

// Enable CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',

        // ⚠️ DEV_DOMAIN and PROD_DOMAIN are injected via Cloudflare env vars.
        // These values are available at runtime once your component is
        // published and approved. Do NOT remove them — they are required
        // for deployed environments to work correctly.
        c.env.DEV_DOMAIN,
        c.env.STAGING_DOMAIN,
        c.env.PROD_DOMAIN,
      ].filter(Boolean) 

      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)


//  Route: health check
app.get('/api/message', (c) => c.json({ message: 'Tourism Explorer API is running' }))

const fail = (c, e) => c.json({ error: e instanceof HttpError ? e.message : 'Unexpected error' }, e instanceof HttpError ? e.status : 500)

//  Route: attractions near a point. ?lat&lon&q=<search text>&cat=<chip key>
//  The Geoapify key is read from the Worker env (never shipped to the frontend).
app.get('/api/places', async (c) => {
  try {
    const { lat, lon, q, cat } = c.req.query()
    return c.json(await findPlaces({ lat: parseFloat(lat), lon: parseFloat(lon), q, cat, apiKey: c.env.GEOAPIFY_API_KEY }))
  } catch (e) { return fail(c, e) }
})

//  Route: today's weather (Open-Meteo, no key needed)
app.get('/api/weather', async (c) => {
  try {
    return c.json(await getWeather(parseFloat(c.req.query('lat')), parseFloat(c.req.query('lon'))))
  } catch (e) { return fail(c, e) }
})

//  Route: Insert Data into D1
// app.post('/api/users', async (c) => {
//   const body = await c.req.json()
//   const { name, email } = body

//   if (!name || !email) {
//     return c.json({ error: 'Name and email are required' }, 400)
//   }

//   try {
//     await c.env.DB.prepare(
//       'INSERT INTO users (name, email) VALUES (?, ?)'
//     ).bind(name, email).run()

//     return c.json({ success: true, message: 'User added successfully' }, 201)
//   } catch (err) {
//     return c.json({ error: 'Database error', details: err.message }, 500)
//   }
// })

//  Route: Fetch All Users
// app.get('/api/users', async (c) => {
//   try {
//     const { results } = await c.env.DB.prepare('SELECT * FROM users').all()
//     return c.json(results)
//   } catch (err) {
//     return c.json({ error: 'Database error', details: err.message }, 500)
//   }
// })

export default app