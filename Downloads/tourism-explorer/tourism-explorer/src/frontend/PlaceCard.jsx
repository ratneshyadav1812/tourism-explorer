import { dirUrl, distKm } from './utils';

export default function PlaceCard({ p, n, open, onToggle, user }) {
  const fromUser = user ? distKm(user, p) : null;
  return (
    <li id={'te-' + p.id} className={'card' + (open ? ' open' : '')}>
      <button className="card-head" onClick={onToggle} aria-expanded={open}>
        <span className="num">{n}</span>
        <span className="name">{p.name}{p.notable && <span className="badge">Well known</span>}</span>
        <span className="meta">{p.type}, {p.distanceKm} km from centre</span>
      </button>
      {open && (
        <div className="card-body">
          {p.summary && <p>{p.summary}</p>}
          {p.address && <p className="addr">{p.address}</p>}
          {fromUser != null && <p className="addr">{user.approx ? 'About ' : ''}{fromUser.toFixed(1)} km from you{user.approx ? ' (location is approximate)' : ''}</p>}
          <a href={dirUrl(p)} target="_blank" rel="noreferrer noopener">Get directions</a>
        </div>
      )}
    </li>
  );
}
