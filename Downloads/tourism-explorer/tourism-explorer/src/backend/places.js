// Pure data logic (no framework imports) so it is easy to read and test.
import { CATEGORIES, DEFAULT, byKey, detect, BLOCK } from './categories.js';

const RADII = [5000, 15000, 30000]; // metres; widen until we have enough results
const MIN_RESULTS = 5;
const MAX_PER_CALL = 20; // Geoapify limit required by the brief
const cache = new Map();

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.v;
  const v = await fn();
  if (cache.size > 300) cache.clear();
  cache.set(key, { v, exp: Date.now() + ttlMs });
  return v;
}

async function getJson(url, ms = 6000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`upstream ${r.status}`);
  return r.json();
}

const toRad = (d) => (d * Math.PI) / 180;
export function km(aLat, aLon, bLat, bLon) {
  const x = Math.sin(toRad(bLat - aLat) / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(toRad(bLon - aLon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

// Drop unnamed / non-tourist items, remove duplicates, rank well-known places first.
export function clean(features, lat, lon) {
  const seen = [];
  const out = [];
  for (const f of features) {
    const p = f.properties || {};
    if (!p.name || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    if ((p.categories || []).some((c) => BLOCK.test(c))) continue;
    const name = p.name.toLowerCase();
    if (seen.some((s) => s.name === name || km(s.lat, s.lon, p.lat, p.lon) < 0.05)) continue;
    seen.push({ name, lat: p.lat, lon: p.lon });
    const wiki = p.wiki_and_media?.wikipedia || null; // "en:Title"
    const typeCat = (p.categories || []).find((c) => /^(tourism|entertainment|leisure|religion)/.test(c));
    out.push({
      id: p.place_id || `${p.lat},${p.lon}`,
      name: p.name, lat: p.lat, lon: p.lon,
      type: typeCat ? typeCat.split('.').pop().replace(/_/g, ' ') : 'sight',
      address: p.address_line2 || p.formatted || '',
      distanceKm: +km(lat, lon, p.lat, p.lon).toFixed(1),
      wiki,
      notable: !!(wiki || p.datasource?.raw?.wikidata),
    });
  }
  return out.sort((a, b) => Number(b.notable) - Number(a.notable) || a.distanceKm - b.distanceKm);
}

async function wikiSummary(wiki) {
  if (!wiki) return null;
  const [lang, ...rest] = wiki.split(':');
  if (!/^[a-z-]{2,10}$/.test(lang) || !rest.length) return null;
  const title = encodeURIComponent(rest.join(':').replace(/ /g, '_'));
  try {
    const j = await cached(`w:${wiki}`, 864e5, () =>
      getJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`, 3000));
    if (!j.extract) return null;
    return j.extract.split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.');
  } catch { return null; } // optional enrichment: never break the list
}

export async function findPlaces({ lat, lon, cat, q, apiKey }) {
  if (!apiKey) throw new HttpError(500, 'Places service is not configured (missing GEOAPIFY_API_KEY).');
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) throw new HttpError(400, 'Valid lat and lon are required.');
  const category = cat ? byKey(cat) : detect(q);

  let places = [];
  let radius = RADII[0];
  try {
    for (const r of RADII) {
      radius = r;
      const url = `https://api.geoapify.com/v2/places?categories=${category.geo}` +
        `&filter=circle:${lon},${lat},${r}&bias=proximity:${lon},${lat}&limit=${MAX_PER_CALL}&apiKey=${apiKey}`;
      const data = await cached(`p:${category.key}:${lat.toFixed(3)}:${lon.toFixed(3)}:${r}`, 36e5, () => getJson(url));
      places = clean(data.features || [], lat, lon);
      if (places.length >= MIN_RESULTS) break;
    }
  } catch (e) {
    console.error('geoapify failed:', e.message);
    throw new HttpError(502, 'Places service is unavailable right now. Please try again.');
  }
  const sums = await Promise.all(places.slice(0, 8).map((p) => wikiSummary(p.wiki)));
  sums.forEach((s, i) => { places[i].summary = s; });
  return {
    category: { key: category.key, label: category.label },
    radiusKm: radius / 1000,
    places,
    chips: [{ key: DEFAULT.key, label: DEFAULT.label }, ...CATEGORIES.map(({ key, label }) => ({ key, label }))],
  };
}

export async function getWeather(lat, lon) {
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) throw new HttpError(400, 'Valid lat and lon are required.');
  try {
    const j = await cached(`wx:${lat.toFixed(1)}:${lon.toFixed(1)}`, 18e5, () => getJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=1', 4000));
    const d = j.daily;
    return { max: d.temperature_2m_max[0], min: d.temperature_2m_min[0], rain: d.precipitation_probability_max[0], code: d.weather_code[0] };
  } catch { throw new HttpError(502, 'Weather is unavailable.'); }
}
