# Tourism Explorer

A hyperDart standalone component that answers "what's worth seeing in X?" at a glance.
Triggered by queries like *things to do in Paris*, *museums in Delhi*, *best places to visit in Kurukshetra*.

## Idea
Instead of a travel-site listing, the main view is a **distance dial**: the city is the centre and every numbered pin sits at its real distance and compass bearing. You see how spread out the sights are in one glance, in the sidebar or mainline, with no map tiles. Tap a pin to open its card; tap a chip to switch category.

## Features
- Attractions near the searched place; category detected from the query (museums, temples, forts, monuments, parks, viewpoints, historic sites) plus live category chips
- Per place: type, address, distance from centre, distance from you (when the platform provides a location), Wikipedia summary when one exists, directions link
- Clear states for loading, no results (with a one-click "Show all sights"), errors (with retry) and missing place
- Today's weather with an indoor hint when rain is likely
- One-day plan: nearest-neighbour walking route grouped into morning, afternoon and evening
- Light and dark mode, sidebar and mainline layouts (CSS container queries and `props.format`)

## Design decisions
- **Accuracy:** only tourism categories are queried; food, lodging, shop and office categories are blocked server-side as a safety net; unnamed places are dropped; duplicates (same name, or under 50 m apart) are merged; places linked to Wikipedia/Wikidata rank first.
- **"In and around":** if fewer than 5 places are found within 5 km the search widens to 15 km, then 30 km.
- **Robustness:** Wikipedia and weather are optional and fail silently; upstream calls have timeouts; results are cached in the Worker; every UI state is handled.
- **Secrets:** the Geoapify key exists only in the Worker (`c.env.GEOAPIFY_API_KEY`). The frontend never sees it.

## Structure
```
src/backend/index.js        Hono routes (/api/places, /api/weather)
src/backend/places.js       Geoapify + Wikipedia + Open-Meteo logic
src/backend/categories.js   Query text -> Geoapify categories (add a query pattern here)
src/frontend/TourismExplorer.jsx  main component
src/frontend/Dial.jsx, PlaceCard.jsx, utils.js, styles.css
```

## Data sources and libraries
Geoapify Places API, Wikipedia REST API (summaries), Open-Meteo (weather). React, Vite, Hono, Cloudflare Workers (template defaults); no extra runtime libraries.

## Run locally
```
npm install
cd src/backend && npm install && cd ../..
cp src/backend/.dev.vars.example src/backend/.dev.vars   # then put your Geoapify key in it
cd src/backend && npx wrangler dev        # API on :3001
npm run start                              # sandbox on :5173 (second terminal)
```
Publish: `npm run build`, then `cd src/backend && npm run build`, then `npm publish` (runs validation).

## How it was built / AI use
Built with the hyperDart react+vite+hono template. Code was drafted with Claude (Anthropic).
[Replace this line with what you personally wrote, changed, tested and reviewed.]
