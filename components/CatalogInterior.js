'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getInteriorNames, getInteriorBatch, INTERIOR_CATEGORIES, FURNITURE_COLORS } from '../lib/api';
import { loadSet, saveSet, loadCache, saveCache, clearCache, getBuyPrice, bgLoad } from '../lib/catalogUtils';
import { CatalogGrid, Pagination, DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

export default function CatalogInterior() {
  const [category, setCategory] = useState('Wallpaper');
  const [allNames, setAllNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState(null);
  const [seriesFilter, setSeriesFilter] = useState(null);
  const [owned, setOwned] = useState(() => loadSet('ct_int_owned'));
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [bgProg, setBgProg] = useState({ loaded: 0, total: 0, active: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const PER_PAGE = 24;
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    setLoading(true); setError(null); setAllNames([]); setPage(1);
    setBgProg({ loaded: 0, total: 0, active: false });
    const cached = loadCache('int', category);
    setCache(cached);
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) { setAllNames(cachedNames); setLoading(false); }

    getInteriorNames(category).then(names => {
      if (cancelled) return;
      setAllNames(names); setLoading(false);
      if (Object.keys(cached).length >= names.length) return;
      const controller = new AbortController(); abortRef.current = controller;
      setBgProg({ loaded: Object.keys(cached).length, total: names.length, active: true });
      bgLoad({ names, cached, batchFn: getInteriorBatch, controller,
        onProgress: acc => { setCache({ ...acc }); setBgProg({ loaded: Object.keys(acc).length, total: names.length, active: true }); },
        onDone: acc => { saveCache('int', category, acc); setCache({ ...acc }); setBgProg(p => ({ ...p, active: false })); }
      });
    }).catch(e => { if (!cancelled) { setLoading(false); if (cachedNames.length === 0) setError(e.name === 'AbortError' ? 'API timed out.' : 'Failed to load.'); } });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [category, refreshKey]);

  const filtered = useMemo(() => {
    let list = [...allNames];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(n => n.toLowerCase().includes(kw)); }
    if (colorFilter || seriesFilter) {
      list = list.filter(n => {
        const d = cache[n]; if (!d) return false;
        if (colorFilter && !(d.colors || []).includes(colorFilter)) return false;
        if (seriesFilter && d.item_series !== seriesFilter) return false;
        return true;
      });
    }
    return list;
  }, [allNames, search, colorFilter, seriesFilter, cache]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageNames = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const series = useMemo(() => [...new Set(Object.values(cache).map(d => d.item_series).filter(Boolean))].sort(), [cache]);

  useEffect(() => { setPage(1); }, [search, colorFilter, seriesFilter]);

  const toggle = (key, setter, name, e) => {
    if (e) e.stopPropagation();
    setter(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet(key, n); return n; });
  };

  const pct = bgProg.total > 0 ? Math.round((bgProg.loaded / bgProg.total) * 100) : 0;

  return (
    <>
      <div className="ct-cat-tabs">
        {INTERIOR_CATEGORIES.map(c => (
          <button key={c} className={`ct-cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            <span className="material-icons" style={{ fontSize: 18 }}>{c === 'Wallpaper' ? 'wallpaper' : c === 'Floors' ? 'grid_on' : 'crop_square'}</span>{c}
          </button>
        ))}
      </div>

      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">home</span><span>Owned: <strong>{owned.size}</strong></span>
          {bgProg.active && <><span className="ct-tracker-sep">|</span><span className="ct-bg-progress"><span className="material-icons ct-spin" style={{ fontSize: 14 }}>sync</span> {bgProg.loaded}/{bgProg.total} ({pct}%)</span></>}
          {!bgProg.active && bgProg.total > 0 && bgProg.loaded >= bgProg.total && <><span className="ct-tracker-sep">|</span><span className="ct-bg-done"><span className="material-icons" style={{ fontSize: 14 }}>check_circle</span> Cached</span></>}
        </div>
        {bgProg.active && <div className="ct-progress-bar"><div className="ct-progress-fill" style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search interior..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>
        <div className="ct-filter-row"><span className="ct-filter-label">Color</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!colorFilter ? 'active' : ''}`} onClick={() => setColorFilter(null)}>All</button>
            {FURNITURE_COLORS.map(c => <button key={c} className={`ct-color-chip ${colorFilter === c ? 'active' : ''}`} onClick={() => setColorFilter(c)}>{c}</button>)}
          </div>
        </div>
        {series.length > 0 && <div className="ct-filter-row"><span className="ct-filter-label">Series</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!seriesFilter ? 'active' : ''}`} onClick={() => setSeriesFilter(null)}>All</button>
            {series.map(s => <button key={s} className={`ct-color-chip ${seriesFilter === s ? 'active' : ''}`} onClick={() => setSeriesFilter(s)}>{s}</button>)}
          </div>
        </div>}
        <div className="ct-filter-row"><span className="ct-filter-label">Quick</span>
          <div className="ct-toggle-chips">
            <button className="ct-toggle-chip" onClick={() => { clearCache('int', category); setCache({}); setBgProg({ loaded: 0, total: 0, active: false }); setRefreshKey(k => k + 1); }}>
              <span className="material-icons" style={{ fontSize: 16 }}>refresh</span> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} items`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRefreshKey(k => k + 1)} />}
      {loading && allNames.length === 0 ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <CatalogGrid items={pageNames} cache={cache} owned={owned}
          onSelect={n => cache[n] && setSelected(cache[n])}
          onOwn={(n, e) => toggle('ct_int_owned', setOwned, n, e)}
          getImg={item => item?.image_url || item?.variations?.[0]?.image_url}
          getExtra={item => item ? <>
            {item.item_series && <p className="ct-card-series">{item.item_series}</p>}
            <div className="ct-card-footer">
              {getBuyPrice(item) && <span className="ct-card-price"><span className="material-icons">payments</span>{getBuyPrice(item).toLocaleString()}</span>}
              {item.hha_base > 0 && <span className="ct-card-vars">{item.hha_base} HHA</span>}
            </div>
          </> : <div className="ct-card-shimmer-text" />}
        />
        {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={setPage} />}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <InteriorDetail item={selected} owned={owned} onOwn={n => toggle('ct_int_owned', setOwned, n)} />
      </DetailModal>}
    </>
  );
}

function InteriorDetail({ item, owned, onOwn }) {
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;
  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        <img src={item.image_url || ''} alt={item.name} className="ct-detail-img" />
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          {item.item_series && <span className="ct-detail-series">{item.item_series} Series</span>}
          {item.item_set && <span className="ct-detail-set">{item.item_set} Set</span>}
          <div className="ct-detail-badges"><span className="ct-detail-cat-badge">{item.category}</span></div>
        </div>
      </div>
      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">HHA</span><span>{item.hha_base} pts{item.hha_category ? ` (${item.hha_category})` : ''}</span></div>
        {item.themes?.length > 0 && <div className="ct-info-item ct-info-wide"><span className="ct-info-label">Themes</span><div className="ct-theme-chips">{item.themes.map(t => <span key={t} className="ct-theme-chip">{t}</span>)}</div></div>}
        {item.colors?.length > 0 && <div className="ct-info-item ct-info-wide"><span className="ct-info-label">Colors</span><div className="ct-theme-chips">{item.colors.map(c => <span key={c} className="ct-theme-chip">{c}</span>)}</div></div>}
      </div>
      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      <DetailActions name={item.name} url={item.url} owned={owned} onOwn={onOwn} />
    </div>
  );
}
