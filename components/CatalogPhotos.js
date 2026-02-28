'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getPhotoNames, getPhotoBatch } from '../lib/api';
import { loadSet, saveSet, loadCache, saveCache, clearCache, bgLoad } from '../lib/catalogUtils';
import { Pagination, DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

export default function CatalogPhotos() {
  const [allNames, setAllNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState({});
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(null);
  const [owned, setOwned] = useState(() => loadSet('ct_photo_owned'));
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
    const cached = loadCache('photo', 'all');
    setCache(cached);
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) { setAllNames(cachedNames); setLoading(false); }

    getPhotoNames().then(names => {
      if (cancelled) return;
      setAllNames(names); setLoading(false);
      if (Object.keys(cached).length >= names.length) return;
      const controller = new AbortController(); abortRef.current = controller;
      setBgProg({ loaded: Object.keys(cached).length, total: names.length, active: true });
      bgLoad({ names, cached, batchFn: getPhotoBatch, controller,
        onProgress: acc => { setCache({ ...acc }); setBgProg({ loaded: Object.keys(acc).length, total: names.length, active: true }); },
        onDone: acc => { saveCache('photo', 'all', acc); setCache({ ...acc }); setBgProg(p => ({ ...p, active: false })); }
      });
    }).catch(e => { if (!cancelled) { setLoading(false); if (cachedNames.length === 0) setError(e.name === 'AbortError' ? 'API timed out.' : 'Failed to load.'); } });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [refreshKey]);

  const categories = useMemo(() => {
    const s = new Set();
    Object.values(cache).forEach(p => { if (p.category) s.add(p.category); });
    return [...s].sort();
  }, [cache]);

  const filtered = useMemo(() => {
    let list = [...allNames];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(n => n.toLowerCase().includes(kw)); }
    if (catFilter) list = list.filter(n => cache[n]?.category === catFilter);
    return list;
  }, [allNames, search, catFilter, cache]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageNames = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  useEffect(() => { setPage(1); }, [search, catFilter]);

  const toggle = (name, e) => {
    if (e) e.stopPropagation();
    setOwned(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet('ct_photo_owned', n); return n; });
  };

  const pct = bgProg.total > 0 ? Math.round((bgProg.loaded / bgProg.total) * 100) : 0;

  return (
    <>
      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">photo_library</span><span>Owned: <strong>{owned.size}</strong></span>
          {bgProg.active && <><span className="ct-tracker-sep">|</span><span className="ct-bg-progress"><span className="material-icons ct-spin" style={{ fontSize: 14 }}>sync</span> {bgProg.loaded}/{bgProg.total} ({pct}%)</span></>}
          {!bgProg.active && bgProg.total > 0 && bgProg.loaded >= bgProg.total && <><span className="ct-tracker-sep">|</span><span className="ct-bg-done"><span className="material-icons" style={{ fontSize: 14 }}>check_circle</span> Cached</span></>}
        </div>
        {bgProg.active && <div className="ct-progress-bar"><div className="ct-progress-fill" style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search photos & posters..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>
        {categories.length > 0 && <div className="ct-filter-row"><span className="ct-filter-label">Type</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!catFilter ? 'active' : ''}`} onClick={() => setCatFilter(null)}>All</button>
            {categories.map(c => <button key={c} className={`ct-color-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>)}
          </div>
        </div>}
        <div className="ct-filter-row"><span className="ct-filter-label">Quick</span>
          <div className="ct-toggle-chips">
            <button className="ct-toggle-chip" onClick={() => { clearCache('photo', 'all'); setCache({}); setBgProg({ loaded: 0, total: 0, active: false }); setRefreshKey(k => k + 1); }}>
              <span className="material-icons" style={{ fontSize: 16 }}>refresh</span> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} items`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRefreshKey(k => k + 1)} />}
      {loading && allNames.length === 0 ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <div className="ct-grid">
          {pageNames.map(name => {
            const item = cache[name];
            const img = item?.variations?.[0]?.image_url;
            return (
              <div key={name} className={`ct-card ${owned.has(name) ? 'owned' : ''}`} onClick={() => item && setSelected(item)}>
                <div className="ct-card-img-wrap">
                  {img ? <img src={img} alt={name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
                  {owned.has(name) && <span className="ct-badge ct-badge--owned"><span className="material-icons">check_circle</span></span>}
                </div>
                <div className="ct-card-body">
                  <h4 className="ct-card-title">{name}</h4>
                  {item ? <div className="ct-card-footer">
                    <span className="ct-card-vars">{item.category}</span>
                    {item.variation_total > 1 && <span className="ct-card-vars">{item.variation_total} frames</span>}
                  </div> : <div className="ct-card-shimmer-text" />}
                </div>
                <div className="ct-card-actions">
                  <button className={`ct-action-btn ${owned.has(name) ? 'active' : ''}`} onClick={e => toggle(name, e)}>
                    <span className="material-icons">{owned.has(name) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={setPage} />}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <PhotoDetail item={selected} owned={owned} onOwn={n => toggle(n)} />
      </DetailModal>}
    </>
  );
}

function PhotoDetail({ item, owned, onOwn }) {
  const [activeVar, setActiveVar] = useState(0);
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;

  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.variations?.length > 0 && <img src={item.variations[activeVar]?.image_url || ''} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          <div className="ct-detail-badges">
            <span className="ct-detail-cat-badge">{item.category}</span>
            {item.customizable && <span className="ct-detail-lucky-badge"><span className="material-icons">brush</span> Customizable Frame</span>}
            {item.interactable && <span className="ct-detail-door-badge"><span className="material-icons">touch_app</span> Interactable</span>}
          </div>
        </div>
      </div>

      {/* Frame gallery */}
      {item.variations?.length > 1 && (
        <div className="ct-detail-vars">
          <h4>Frame Styles ({item.variations.length})</h4>
          <div className="ct-var-grid">
            {item.variations.map((v, i) => (
              <button key={i} className={`ct-var-item ${activeVar === i ? 'active' : ''}`} onClick={() => setActiveVar(i)}>
                <img src={v.image_url} alt={v.variation || `Frame ${i + 1}`} />
                <span>{v.variation || `#${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">HHA</span><span>{item.hha_base || 0} pts</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Size</span><span>{item.grid_width}×{item.grid_length}</span></div>
        {item.customizable && <div className="ct-info-item"><span className="ct-info-label">Custom Kits</span><span>{item.custom_kits} ({item.custom_body_part || 'Frame'})</span></div>}
        {item.version_added && <div className="ct-info-item"><span className="ct-info-label">Added In</span><span>v{item.version_added}</span></div>}
      </div>

      {item.variations?.[activeVar]?.colors?.length > 0 && <div className="ct-detail-colors"><h4>Colors ({item.variations[activeVar].variation || 'Default'})</h4><div className="ct-theme-chips">{item.variations[activeVar].colors.map(c => <span key={c} className="ct-theme-chip">{c}</span>)}</div></div>}
      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      <DetailActions name={item.name} url={item.url} owned={owned} onOwn={onOwn} />
    </div>
  );
}
