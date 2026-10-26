import { distKm } from './utils';

const toRad = (d) => (d * Math.PI) / 180;

// Radial map: centre = city, pin distance = real distance, angle = real bearing.
// Needs no tiles or libraries, so it stays crisp in the narrow sidebar.
export default function Dial({ centre, places, active, onPick }) {
  const R = 86;
  const max = Math.max(1, ...places.map((p) => p.distanceKm));
  const pos = (p) => {
    const dx = (p.lon - centre.lon) * Math.cos(toRad(centre.lat));
    const a = Math.atan2(dx, p.lat - centre.lat);
    const r = Math.max(14, (p.distanceKm / max) * R);
    return [100 + r * Math.sin(a), 100 - r * Math.cos(a)];
  };
  return (
    <svg className="dial" viewBox="-6 0 212 200" role="group" aria-label="Places around the centre by distance and direction">
      {[1 / 3, 2 / 3, 1].map((f) => <circle key={f} cx="100" cy="100" r={R * f} className="ring" />)}
      <text x="100" y="9" className="cardinal">N</text>
      <text x="100" y="197" className="cardinal">{max.toFixed(max < 10 ? 1 : 0)} km</text>
      <circle cx="100" cy="100" r="4" className="hub" />
      {places.map((p, i) => {
        const [x, y] = pos(p);
        return (
          <g key={p.id} className={'pin' + (active === p.id ? ' on' : '')} onClick={() => onPick(p.id)}
            tabIndex={0} role="button" aria-label={`${i + 1}. ${p.name}, ${p.distanceKm} km`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(p.id))}>
            <circle cx={x} cy={y} r="8" />
            <text x={x} y={y + 3} textAnchor="middle">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
