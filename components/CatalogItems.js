'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getItemNames, getItemBatch, getItems } from '../lib/api';
import { getBuyPrice, loadCache, saveCache, formatApiErrorMessage } from '../lib/catalogUtils';
import { DetailModal, DetailActions, ErrorRetry, Pagination, SlowLoadingMessage } from './CatalogFurniture';

const ITEMS_PER_PAGE = 24;
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
  const [allNames, setAllNames] = useState([]);
  const [detailsCache, setDetailsCache] = useState(() => loadCache('item', 'all'));
  const [namesLoading, setNamesLoading] = useState(true);
  const [pageDetailsLoading, setPageDetailsLoading] = useState(false);
  const [fullItems, setFullItems] = useState(null);
  const [fullItemsLoading, setFullItemsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const loadingPageRef = useRef(null);

  // Load names only (fast) — stale-while-revalidate: show cache first
  useEffect(() => {
    let cancelled = false;
    setError(null);
    const cached = loadCache('item', 'all');
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) {
      setAllNames(cachedNames);
      setNamesLoading(false);
    } else {
      setNamesLoading(true);
    }
    getItemNames().then(data => {
      if (cancelled) return;
      setAllNames(Array.isArray(data) ? data : []);
      setNamesLoading(false);
    }).catch(e => {
      if (!cancelled) { setNamesLoading(false); setError(formatApiErrorMessage(e)); }
    });
    return () => { cancelled = true; };
  }, [retryKey]);

  const groups = useMemo(() => fullItems ? groupItems(fullItems) : {}, [fullItems]);
  const seasons = useMemo(() => {
    if (!fullItems?.length) return [];
    const s = new Set();
    fullItems.forEach(i => { if (i.material_seasonality) s.add(i.material_seasonality); });
    return [...s].sort();
  }, [fullItems]);

  // Filtered names for "All" view (search only)
  const filteredNames = useMemo(() => {
    if (!search.trim()) return allNames;
    const kw = search.toLowerCase();
    return allNames.filter(n => n?.toLowerCase().includes(kw));
  }, [allNames, search]);

  const totalPages = Math.max(1, Math.ceil(filteredNames.length / ITEMS_PER_PAGE));
  const pageNames = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNames.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNames, currentPage]);

  // Load details only for current page (when in "All" view)
  useEffect(() => {
    if (activeGroup !== 'all' || pageNames.length === 0) return;
    const missing = pageNames.filter(n => !detailsCache[n]);
    if (missing.length === 0) return;
    const pageKey = `${currentPage}-${pageNames[0]}`;
    if (loadingPageRef.current === pageKey) return;
    loadingPageRef.current = pageKey;
    let cancelled = false;
    setPageDetailsLoading(true);
    getItemBatch(missing).then(items => {
      if (cancelled) return;
      setDetailsCache(prev => {
        const next = { ...prev };
        items.forEach(item => { if (item?.name) next[item.name] = item; });
        saveCache('item', 'all', next);
        return next;
      });
      setPageDetailsLoading(false);
      loadingPageRef.current = null;
    }).catch(() => {
      if (!cancelled) { setPageDetailsLoading(false); loadingPageRef.current = null; }
    });
    return () => { cancelled = true; };
  }, [activeGroup, currentPage, pageNames, detailsCache]);

  useEffect(() => { setCurrentPage(1); }, [search, activeGroup]);

  // When switching to a group, load full list once
  const groupLoadCancelledRef = useRef(false);
  const handleGroupTab = (id) => {
    groupLoadCancelledRef.current = true;
    setActiveGroup(id);
    if (id === 'all') return;
    if (fullItems) return;
    groupLoadCancelledRef.current = false;
    setFullItemsLoading(true);
    getItems().then(data => {
      if (groupLoadCancelledRef.current) return;
      setFullItems(Array.isArray(data) ? data : []);
      setFullItemsLoading(false);
    }).catch(() => { if (!groupLoadCancelledRef.current) setFullItemsLoading(false); });
  };
  useEffect(() => () => { groupLoadCancelledRef.current = true; }, []);

  const filteredGroupItems = useMemo(() => {
    if (activeGroup === 'all') return [];
    let list = groups[activeGroup] || [];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(i => i.name?.toLowerCase().includes(kw)); }
    if (seasonFilter) list = list.filter(i => i.material_seasonality === seasonFilter);
    return list;
  }, [groups, activeGroup, search, seasonFilter]);

  const showAllView = activeGroup === 'all';
  const displayItems = showAllView
    ? pageNames.map(name => detailsCache[name] || { name })
    : filteredGroupItems;
  const loadingFullForGroup = activeGroup !== 'all' && fullItemsLoading && !fullItems?.length;

  return (
    <>
      <div className="ct-cat-tabs">
        <button className={`ct-cat-tab ${activeGroup === 'all' ? 'active' : ''}`} onClick={() => setActiveGroup('all')}>
          <span className="material-icons" style={{ fontSize: 18 }}>apps</span>All ({allNames.length})
        </button>
        {GROUP_DEFS.map(g => (
          <button key={g.id} className={`ct-cat-tab ${activeGroup === g.id ? 'active' : ''}`} onClick={() => handleGroupTab(g.id)}>
            <span className="material-icons" style={{ fontSize: 18 }}>{g.icon}</span>
            {g.label} ({fullItems ? (groups[g.id]?.length ?? 0) : '…'})
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

      <div className="ct-results-bar">
        <span>
          {showAllView ? `${filteredNames.length} items` : `${filteredGroupItems.length} items`}
          {showAllView && totalPages > 1 && ` · Page ${currentPage}/${totalPages}`}
        </span>
      </div>
      <SlowLoadingMessage loading={namesLoading && allNames.length === 0} />
      {error && <ErrorRetry message={error} onRetry={() => setRetryKey(k => k + 1)} />}
      {namesLoading ? <div className="loading-spinner"><div className="spinner"></div></div> : loadingFullForGroup ? (
        <div className="loading-spinner"><div className="spinner"></div><p style={{ marginTop: 8, fontSize: 14 }}>Loading group…</p></div>
      ) : (
        <>
          <div className="ct-grid">
            {displayItems.map(item => {
              const img = item.image_url || item.variations?.[0]?.image_url;
              const price = getBuyPrice(item);
              const hasDetails = !!item.image_url;
              return (
                <div key={item.name} className="ct-card" onClick={() => hasDetails && setSelected(item)}>
                  <div className="ct-card-img-wrap">
                    {img ? <img src={img} alt={item.name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
                  </div>
                  <div className="ct-card-body">
                    <h4 className="ct-card-title">{item.name}</h4>
                    <div className="ct-card-footer">
                      {price != null && <span className="ct-card-price"><span className="material-icons">payments</span>{price.toLocaleString()}</span>}
                      {item.stack > 1 && <span className="ct-card-vars">×{item.stack}</span>}
                      {item.is_fence && <span className="ct-card-lucky"><span className="material-icons">fence</span></span>}
                      {item.edible && <span className="ct-card-lucky"><span className="material-icons">nutrition</span></span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showAllView && totalPages > 1 && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          )}
        </>
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
