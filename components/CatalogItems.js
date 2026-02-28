'use client';

import { useState, useEffect, useMemo } from 'react';
import { getItems } from '../lib/api';
import { getBuyPrice } from '../lib/catalogUtils';
import { DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

const GROUP_DEFS = [
  { id: 'materials', label: 'Materials', icon: 'build', test: i => !!i.material_type },
  { id: 'fences', label: 'Fences', icon: 'fence', test: i => !!i.is_fence },
  { id: 'edibles', label: 'Fruits & Edibles', icon: 'nutrition', test: i => !!i.edible },
  { id: 'plants', label: 'Plants', icon: 'local_florist', test: i => !!i.plant_type },
  { id: 'seasonal', label: 'Seasonal', icon: 'calendar_month', test: i => !!i.material_seasonality && !i.material_type },
  { id: 'others', label: 'Others', icon: 'widgets', test: () => true },
];

function groupItems(items) {
  const groups = {};
  GROUP_DEFS.forEach(g => { groups[g.id] = []; });
  const assigned = new Set();
  items.forEach(item => {
    for (const g of GROUP_DEFS) {
      if (g.id === 'others') continue;
      if (g.test(item)) { groups[g.id].push(item); assigned.add(item.name); break; }
    }
  });
  items.forEach(item => { if (!assigned.has(item.name)) groups.others.push(item); });
  return groups;
}

export default function CatalogItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true); setError(null);
    getItems().then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(e.name === 'AbortError' ? 'API timed out.' : 'Failed to load items.');
    });
  }, [retryKey]);

  const groups = useMemo(() => groupItems(items), [items]);

  const seasons = useMemo(() => {
    const s = new Set();
    items.forEach(i => { if (i.material_seasonality) s.add(i.material_seasonality); });
    return [...s].sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = activeGroup === 'all' ? items : (groups[activeGroup] || []);
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(i => i.name?.toLowerCase().includes(kw)); }
    if (seasonFilter) list = list.filter(i => i.material_seasonality === seasonFilter);
    return list;
  }, [items, groups, activeGroup, search, seasonFilter]);

  return (
    <>
      <div className="ct-cat-tabs">
        <button className={`ct-cat-tab ${activeGroup === 'all' ? 'active' : ''}`} onClick={() => setActiveGroup('all')}>
          <span className="material-icons" style={{ fontSize: 18 }}>apps</span>All ({items.length})
        </button>
        {GROUP_DEFS.map(g => groups[g.id]?.length > 0 && (
          <button key={g.id} className={`ct-cat-tab ${activeGroup === g.id ? 'active' : ''}`} onClick={() => setActiveGroup(g.id)}>
            <span className="material-icons" style={{ fontSize: 18 }}>{g.icon}</span>{g.label} ({groups[g.id].length})
          </button>
        ))}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>
        {seasons.length > 0 && <div className="ct-filter-row"><span className="ct-filter-label">Season</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!seasonFilter ? 'active' : ''}`} onClick={() => setSeasonFilter(null)}>All</button>
            {seasons.map(s => <button key={s} className={`ct-color-chip ${seasonFilter === s ? 'active' : ''}`} onClick={() => setSeasonFilter(s)}>{s}</button>)}
          </div>
        </div>}
      </div>

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} items`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRetryKey(k => k + 1)} />}
      {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
        <div className="ct-grid">
          {filtered.map(item => {
            const img = item.image_url || item.variations?.[0]?.image_url;
            const price = getBuyPrice(item);
            return (
              <div key={item.name} className="ct-card" onClick={() => setSelected(item)}>
                <div className="ct-card-img-wrap">
                  {img ? <img src={img} alt={item.name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
                </div>
                <div className="ct-card-body">
                  <h4 className="ct-card-title">{item.name}</h4>
                  <div className="ct-card-footer">
                    {price && <span className="ct-card-price"><span className="material-icons">payments</span>{price.toLocaleString()}</span>}
                    {item.stack > 1 && <span className="ct-card-vars">×{item.stack}</span>}
                    {item.is_fence && <span className="ct-card-lucky"><span className="material-icons">fence</span></span>}
                    {item.edible && <span className="ct-card-lucky"><span className="material-icons">nutrition</span></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <ItemDetail item={selected} />
      </DetailModal>}
    </>
  );
}

function ItemDetail({ item }) {
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;
  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.image_url && <img src={item.image_url} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          <div className="ct-detail-badges">
            {item.material_type && <span className="ct-detail-cat-badge">{item.material_type}</span>}
            {item.is_fence && <span className="ct-detail-lucky-badge"><span className="material-icons">fence</span> Fence</span>}
            {item.edible && <span className="ct-detail-lucky-badge"><span className="material-icons">nutrition</span> Edible</span>}
            {item.plant_type && <span className="ct-detail-door-badge"><span className="material-icons">local_florist</span> {item.plant_type}</span>}
          </div>
        </div>
      </div>
      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Stack</span><span>{item.stack || 1}</span></div>
        {item.material_type && <div className="ct-info-item"><span className="ct-info-label">Material Type</span><span>{item.material_type}</span></div>}
        {item.material_seasonality && <div className="ct-info-item"><span className="ct-info-label">Season</span><span>{item.material_seasonality}</span></div>}
      </div>
      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      <DetailActions name={item.name} url={item.url} />
    </div>
  );
}
