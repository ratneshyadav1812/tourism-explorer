import React, { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';
import Dial from './Dial';
import PlaceCard from './PlaceCard';
import { readInput, planDay, wxLabel, dirUrl, themeMode } from './utils';

function TourismExplorer(props) {
  // API_URL pattern required by the hyperDart template
  const API_URL = process.env.NODE_ENV === 'production' ? props.deployedBackendURL ? props.deployedBackendURL : '' : import.meta.env.VITE_API_URL;

  const input = useMemo(() => readInput(props.searchData, props.searchQuery), [props.searchData, props.searchQuery]);
  const ok = Number.isFinite(input.lat) && Number.isFinite(input.lon);
  const centre = { lat: input.lat, lon: input.lon };

  const [cat, setCat] = useState(null); // null = detect from the query text on the server
  const [state, setState] = useState({ status: 'loading' });
  const [wx, setWx] = useState(null);
  const [active, setActive] = useState(null);
  const [view, setView] = useState('list');
  const [retry, setRetry] = useState(0);
  const notified = useRef(false);

  // Tell the platform we're ready, once, after the first fetch settles.
  useEffect(() => {
    if (state.status !== 'loading' && !notified.current) {
      notified.current = true;
      props?.messageHandlers?.componentLoaded();
    }
  }, [state.status]);

  useEffect(() => {
    if (!ok) { setState({ status: 'noplace' }); return; }
    const ctl = new AbortController();
    setState((s) => ({ ...s, status: 'loading' }));
    const qs = new URLSearchParams({ lat: input.lat, lon: input.lon, q: input.query });
    if (cat) qs.set('cat', cat);
    fetch(`${API_URL}/api/places?${qs}`, { signal: ctl.signal })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
        return j;
      })
      .then((j) => { setActive(null); setState({ status: j.places.length ? 'ready' : 'empty', ...j }); })
      .catch((e) => e.name !== 'AbortError' && setState((s) => ({ ...s, status: 'error', message: e.message === 'Failed to fetch' ? 'Could not reach the places service.' : e.message })));
    return () => ctl.abort();
  }, [input.lat, input.lon, input.query, cat, retry]);

  useEffect(() => {
    if (!ok) return;
    setWx(null);
    fetch(`${API_URL}/api/weather?lat=${input.lat}&lon=${input.lon}`)
      .then((r) => (r.ok ? r.json() : null)).then(setWx).catch(() => setWx(null));
  }, [input.lat, input.lon]);

  const places = state.places || [];
  const plan = useMemo(() => (ok && places.length ? planDay(places, centre) : []), [state.places]);
  const known = places.filter((p) => p.notable).length;
  const pick = (id) => {
    setActive(id);
    setView('list');
    setTimeout(() => document.getElementById('te-' + id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
  };
  const activeChip = cat || state.category?.key;

  return (
    <section className={'te' + (props.format === 'sidebar' ? ' te--side' : '')} data-theme={themeMode(props.theme)}>
      <header>
        <h2>{state.category?.key && state.category.key !== 'all' ? state.category.label : 'Worth seeing'} in {input.city}</h2>
        {state.status === 'ready' && (
          <p className="sub">{places.length} {places.length === 1 ? 'place' : 'places'} within {state.radiusKm} km{known > 0 ? `, ${known} well known` : ''}</p>
        )}
        {wx && (
          <p className="sub">Today: {wxLabel(wx.code)}, {Math.round(wx.min)} to {Math.round(wx.max)}°C, {wx.rain}% chance of rain{wx.rain >= 60 ? '. Indoor spots are a safer pick.' : ''}</p>
        )}
      </header>

      {state.chips && (
        <div className="chips" role="group" aria-label="Filter by type">
          {state.chips.map((c) => (
            <button key={c.key} className={activeChip === c.key ? 'chip on' : 'chip'} aria-pressed={activeChip === c.key} onClick={() => setCat(c.key)}>{c.label}</button>
          ))}
        </div>
      )}

      {state.status === 'loading' && <div className="skel" aria-busy="true"><i /><i /><i /></div>}
      {state.status === 'noplace' && <p className="note">We couldn’t find a place in this search. Try “things to do in Paris”.</p>}
      {state.status === 'error' && (
        <div className="note" role="alert"><p>{state.message}</p><button className="chip" onClick={() => setRetry((n) => n + 1)}>Try again</button></div>
      )}
      {state.status === 'empty' && (
        <div className="note">
          <p>No {state.category.label.toLowerCase()} found within {state.radiusKm} km of {input.city}.</p>
          {state.category.key !== 'all' && <button className="chip" onClick={() => setCat('all')}>Show all sights</button>}
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <Dial centre={centre} places={places} active={active} onPick={pick} />
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>All places</button>
            <button role="tab" aria-selected={view === 'plan'} onClick={() => setView('plan')}>One-day plan</button>
          </div>
          {view === 'list' ? (
            <ol className="list">
              {places.map((p, i) => (
                <PlaceCard key={p.id} p={p} n={i + 1} user={input.user} open={active === p.id} onToggle={() => setActive(active === p.id ? null : p.id)} />
              ))}
            </ol>
          ) : (
            <div className="plan">
              {plan.map((g) => (
                <div key={g.slot}>
                  <h3>{g.slot}</h3>
                  <ol>{g.stops.map((p) => (
                    <li key={p.id}><a href={dirUrl(p)} target="_blank" rel="noreferrer noopener">{p.name}</a><span> {p.distanceKm} km from centre</span></li>
                  ))}</ol>
                </div>
              ))}
              <p className="note small">Stops are ordered as a walking route, nearest next.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TourismExplorer;
