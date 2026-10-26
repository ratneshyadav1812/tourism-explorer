const toRad = (d) => (d * Math.PI) / 180;

export function distKm(a, b) {
  const x = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

// searchData may be an array or a single object; pick the entity that carries coordinates.
export function readInput(searchData, searchQuery) {
  const sd = Array.isArray(searchData) ? searchData[0] : searchData;
  const ents = sd?.entities || [];
  const ent = ents.find((e) => Number.isFinite(e?.entityInfo?.geo?.lat)) || null;
  const geo = ent?.entityInfo?.geo;
  const c = sd?.userLocation?.position?.coords;
  return {
    query: sd?.query || searchQuery || '',
    lat: geo?.lat,
    lon: geo?.long ?? geo?.lon,
    city: geo?.city || ent?.word || 'this place',
    user: c && Number.isFinite(c.latitude) ? { lat: c.latitude, lon: c.longitude, approx: sd.userLocation.source === 'ip' } : null,
  };
}

// Greedy nearest-neighbour walk from the centre over the 6 best places, split into 3 day parts.
export function planDay(places, centre) {
  const pool = places.slice(0, 6);
  const route = [];
  let cur = centre;
  while (pool.length) {
    pool.sort((a, b) => distKm(cur, a) - distKm(cur, b));
    cur = pool.shift();
    route.push(cur);
  }
  return ['Morning', 'Afternoon', 'Evening']
    .map((slot, i) => ({ slot, stops: route.slice(i * 2, i * 2 + 2) }))
    .filter((g) => g.stops.length);
}

export const wxLabel = (c) => c === 0 ? 'Clear' : c < 4 ? 'Partly cloudy' : c < 50 ? 'Fog' : c < 70 ? 'Rain' : c < 80 ? 'Snow' : c < 95 ? 'Showers' : 'Storm';
export const dirUrl = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

// Platform theme shape is not documented, so read it defensively.
export function themeMode(theme) {
  const m = theme?.palette?.mode || theme?.mode || (typeof theme === 'string' ? theme : null);
  return m === 'dark' || m === 'light' ? m : undefined;
}
