'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getFurnitureNames, getFurnitureBatch, FURNITURE_CATEGORIES, FURNITURE_COLORS } from '../lib/api';
import { loadSet, saveSet, loadCache, saveCache, clearCache, getPageNumbers, getBuyPrice, bgLoad } from '../lib/catalogUtils';

export default function CatalogFurniture() {
  const [category, setCategory] = useState('Housewares');
  const [allNames, setAllNames] = useState([]);
  const [namesLoading, setNamesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState(null);
  const [seriesFilter, setSeriesFilter] = useState(null);
  const [showLucky, setShowLucky] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [owned, setOwned] = useState(() => loadSet('ct_fur_owned'));
  const [wishlist, setWishlist] = useState(() => loadSet('ct_fur_wish'));
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [bgProg, setBgProg] = useState({ loaded: 0, total: 0, active: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const PER_PAGE = 20;
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    setNamesLoading(true);
    setError(null);
    setAllNames([]);
    setPage(1);
    setBgProg({ loaded: 0, total: 0, active: false });
    const cached = loadCache('fur', category);
    setDetailsCache(cached);

    // If we have cached data, show it immediately even while fetching fresh names
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) {
      setAllNames(cachedNames);
      setNamesLoading(false);
    }

    getFurnitureNames(category).then(names => {
      if (cancelled) return;
      setAllNames(names);
      setNamesLoading(false);
      if (Object.keys(cached).length >= names.length) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setBgProg({ loaded: Object.keys(cached).length, total: names.length, active: true });

      bgLoad({
        names, cached, batchFn: getFurnitureBatch, controller,
        onProgress: acc => { setDetailsCache({ ...acc }); setBgProg({ loaded: Object.keys(acc).length, total: names.length, active: true }); },
        onDone: acc => { saveCache('fur', category, acc); setDetailsCache({ ...acc }); setBgProg(p => ({ ...p, active: false })); }
      });
    }).catch(e => {
      if (cancelled) return;
      setNamesLoading(false);
      if (cachedNames.length === 0) {
        setError(e.name === 'AbortError' ? 'API request timed out. The server may be slow.' : 'Failed to load data. Please try again.');
      }
    });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [category, refreshKey]);

  const filtered = useMemo(() => {
    let list = [...allNames];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(n => n.toLowerCase().includes(kw)); }
    if (colorFilter || seriesFilter || showLucky || showCustom) {
      list = list.filter(n => {
        const d = detailsCache[n]; if (!d) return false;
        if (colorFilter && !(d.variations || []).flatMap(v => v.colors || []).includes(colorFilter)) return false;
        if (seriesFilter && d.item_series !== seriesFilter) return false;
        if (showLucky && !d.lucky) return false;
        if (showCustom && !d.customizable) return false;
        return true;
      });
    }
    return list;
  }, [allNames, search, colorFilter, seriesFilter, showLucky, showCustom, detailsCache]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageNames = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const series = useMemo(() => [...new Set(Object.values(detailsCache).map(d => d.item_series).filter(Boolean))].sort(), [detailsCache]);

  useEffect(() => { setPage(1); }, [search, colorFilter, seriesFilter, showLucky, showCustom]);

  const toggle = (key, setter, name, e) => {
    if (e) e.stopPropagation();
    setter(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet(key, n); return n; });
  };

  const pct = bgProg.total > 0 ? Math.round((bgProg.loaded / bgProg.total) * 100) : 0;

  return (
    <>
      <div className="ct-cat-tabs">
        {FURNITURE_CATEGORIES.map(c => (
          <button key={c} className={`ct-cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            <span className="material-icons" style={{ fontSize: 18 }}>
              {c === 'Housewares' ? 'weekend' : c === 'Miscellaneous' ? 'category' : c === 'Wall-mounted' ? 'wallpaper' : 'light'}
            </span>{c}
          </button>
        ))}
      </div>

      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">inventory_2</span><span>Owned: <strong>{owned.size}</strong></span>
          <span className="ct-tracker-sep">|</span>
          <span className="material-icons">favorite</span><span>Wishlist: <strong>{wishlist.size}</strong></span>
          {bgProg.active && <><span className="ct-tracker-sep">|</span><span className="ct-bg-progress"><span className="material-icons ct-spin" style={{ fontSize: 14 }}>sync</span> {bgProg.loaded}/{bgProg.total} ({pct}%)</span></>}
          {!bgProg.active && bgProg.total > 0 && bgProg.loaded >= bgProg.total && <><span className="ct-tracker-sep">|</span><span className="ct-bg-done"><span className="material-icons" style={{ fontSize: 14 }}>check_circle</span> Cached</span></>}
        </div>
        {bgProg.active && <div className="ct-progress-bar"><div className="ct-progress-fill" style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search furniture..." value={search} onChange={e => setSearch(e.target.value)} />
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
            <button className={`ct-toggle-chip ${showLucky ? 'active' : ''}`} onClick={() => setShowLucky(!showLucky)}><span className="material-icons" style={{ fontSize: 16 }}>star</span> Lucky</button>
            <button className={`ct-toggle-chip ${showCustom ? 'active' : ''}`} onClick={() => setShowCustom(!showCustom)}><span className="material-icons" style={{ fontSize: 16 }}>brush</span> Customizable</button>
            <button className="ct-toggle-chip" onClick={() => { clearCache('fur', category); setDetailsCache({}); setBgProg({ loaded: 0, total: 0, active: false }); setRefreshKey(k => k + 1); }}><span className="material-icons" style={{ fontSize: 16 }}>refresh</span> Refresh</button>
          </div>
        </div>
      </div>

      <div className="ct-results-bar"><span>{namesLoading ? 'Loading...' : `${filtered.length} items`}</span></div>

      {error && <ErrorRetry message={error} onRetry={() => setRefreshKey(k => k + 1)} />}

      {namesLoading && allNames.length === 0 ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <CatalogGrid items={pageNames} cache={detailsCache} owned={owned} wishlist={wishlist}
          onSelect={n => detailsCache[n] && setSelected(detailsCache[n])}
          onOwn={(n, e) => toggle('ct_fur_owned', setOwned, n, e)}
          onWish={(n, e) => toggle('ct_fur_wish', setWishlist, n, e)}
          getImg={item => item?.variations?.[0]?.image_url}
          getExtra={item => item ? <>
            {item.item_series && <p className="ct-card-series">{item.item_series}</p>}
            <div className="ct-card-footer">
              {getBuyPrice(item) && <span className="ct-card-price"><span className="material-icons">payments</span>{getBuyPrice(item).toLocaleString()}</span>}
              {item.variation_total > 1 && <span className="ct-card-vars">{item.variation_total} vars</span>}
              {item.lucky && <span className="ct-card-lucky"><span className="material-icons">star</span></span>}
            </div>
          </> : <div className="ct-card-shimmer-text" />}
        />
        {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={setPage} />}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <FurnitureDetail item={selected} owned={owned} wishlist={wishlist}
          onOwn={n => toggle('ct_fur_owned', setOwned, n)} onWish={n => toggle('ct_fur_wish', setWishlist, n)} />
      </DetailModal>}
    </>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

export function CatalogGrid({ items, cache, owned, wishlist, onSelect, onOwn, onWish, getImg, getExtra }) {
  return (
    <div className="ct-grid">
      {items.map(name => {
        const item = cache[name];
        const img = getImg?.(item);
        return (
          <div key={name} className={`ct-card ${owned?.has(name) ? 'owned' : ''} ${wishlist?.has(name) ? 'wishlisted' : ''}`}
            onClick={() => onSelect(name)}>
            <div className="ct-card-img-wrap">
              {img ? <img src={img} alt={name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
              {owned?.has(name) && <span className="ct-badge ct-badge--owned"><span className="material-icons">check_circle</span></span>}
              {wishlist?.has(name) && <span className="ct-badge ct-badge--wish"><span className="material-icons">favorite</span></span>}
            </div>
            <div className="ct-card-body">
              <h4 className="ct-card-title">{name}</h4>
              {getExtra?.(item)}
            </div>
            <div className="ct-card-actions">
              {onOwn && <button className={`ct-action-btn ${owned?.has(name) ? 'active' : ''}`} onClick={e => onOwn(name, e)}><span className="material-icons">{owned?.has(name) ? 'check_circle' : 'radio_button_unchecked'}</span></button>}
              {onWish && <button className={`ct-action-btn ct-action-wish ${wishlist?.has(name) ? 'active' : ''}`} onClick={e => onWish(name, e)}><span className="material-icons">{wishlist?.has(name) ? 'favorite' : 'favorite_border'}</span></button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Pagination({ current, total, onChange }) {
  const pages = getPageNumbers(current, total);
  return (
    <div className="ct-pagination">
      <button className="ct-page-btn" disabled={current === 1} onClick={() => onChange(p => p - 1)}><span className="material-icons">chevron_left</span></button>
      <div className="ct-page-numbers">
        {pages.map((p, i) => typeof p === 'string'
          ? <span key={`e${i}`} className="ct-page-ellipsis">...</span>
          : <button key={p} className={`ct-page-num ${current === p ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
        )}
      </div>
      <button className="ct-page-btn" disabled={current === total} onClick={() => onChange(p => p + 1)}><span className="material-icons">chevron_right</span></button>
    </div>
  );
}

export function DetailModal({ onClose, children }) {
  return (
    <div className="ct-modal-overlay" onClick={onClose}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <button className="ct-modal-close" onClick={onClose}><span className="material-icons">close</span></button>
        {children}
      </div>
    </div>
  );
}

function FurnitureDetail({ item, owned, wishlist, onOwn, onWish }) {
  const [activeVar, setActiveVar] = useState(0);
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;
  const poki = item.buy?.find(b => b.currency === 'Poki')?.price;
  const miles = item.buy?.find(b => b.currency === 'Nook Miles')?.price;

  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.variations?.length > 0 && <img src={item.variations[activeVar]?.image_url || ''} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          {item.item_series && <span className="ct-detail-series">{item.item_series} Series</span>}
          {item.item_set && <span className="ct-detail-set">{item.item_set} Set</span>}
          <div className="ct-detail-badges">
            <span className="ct-detail-cat-badge">{item.category}</span>
            {item.lucky && <span className="ct-detail-lucky-badge"><span className="material-icons">star</span> Lucky{item.lucky_season ? ` (${item.lucky_season})` : ''}</span>}
            {item.door_decor && <span className="ct-detail-door-badge"><span className="material-icons">door_front</span> Door Decor</span>}
          </div>
        </div>
      </div>
      {item.variations?.length > 1 && <div className="ct-detail-vars"><h4>Variations ({item.variation_total})</h4>
        <div className="ct-var-grid">{item.variations.map((v, i) => (
          <button key={i} className={`ct-var-item ${activeVar === i ? 'active' : ''}`} onClick={() => setActiveVar(i)}>
            <img src={v.image_url} alt={v.variation || `#${i + 1}`} /><span>{v.variation || v.pattern || `#${i + 1}`}</span>
          </button>
        ))}</div>
      </div>}
      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span>
          {poki && <span className="ct-info-sub">{poki.toLocaleString()} Poki</span>}{miles && <span className="ct-info-sub">{miles.toLocaleString()} Nook Miles</span>}</div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Size</span><span>{item.grid_width}×{item.grid_length}{item.height ? ` (h: ${item.height.toFixed(1)})` : ''}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">HHA</span><span>{item.hha_base} pts{item.hha_category ? ` (${item.hha_category})` : ''}</span></div>
        {item.functions?.length > 0 && <div className="ct-info-item"><span className="ct-info-label">Functions</span><span>{item.functions.join(', ')}</span></div>}
        {item.customizable && <div className="ct-info-item"><span className="ct-info-label">Customizable</span><span>{item.custom_kits} {item.custom_kit_type || 'kit'}{item.custom_body_part ? ` (${item.custom_body_part})` : ''}</span></div>}
        {item.themes?.length > 0 && <div className="ct-info-item ct-info-wide"><span className="ct-info-label">Themes</span><div className="ct-theme-chips">{item.themes.map(t => <span key={t} className="ct-theme-chip">{t}</span>)}</div></div>}
        {item.tag && <div className="ct-info-item"><span className="ct-info-label">Tag</span><span>{item.tag}</span></div>}
        <div className="ct-info-item"><span className="ct-info-label">Added In</span><span>v{item.version_added}</span></div>
      </div>
      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      {item.variations?.[activeVar]?.colors?.length > 0 && <div className="ct-detail-colors"><h4>Colors ({item.variations[activeVar].variation || 'Default'})</h4><div className="ct-theme-chips">{item.variations[activeVar].colors.map(c => <span key={c} className="ct-theme-chip">{c}</span>)}</div></div>}
      <DetailActions name={item.name} url={item.url} owned={owned} wishlist={wishlist} onOwn={onOwn} onWish={onWish} />
    </div>
  );
}

export function ErrorRetry({ message, onRetry }) {
  return (
    <div className="ct-error">
      <span className="material-icons">cloud_off</span>
      <p>{message}</p>
      <button className="ct-error-retry" onClick={onRetry}>
        <span className="material-icons">refresh</span> Retry
      </button>
    </div>
  );
}

export function DetailActions({ name, url, owned, wishlist, onOwn, onWish }) {
  return (
    <div className="ct-detail-actions">
      {onOwn && <button className={`ct-detail-action-btn ${owned?.has(name) ? 'active' : ''}`} onClick={() => onOwn(name)}>
        <span className="material-icons">{owned?.has(name) ? 'check_circle' : 'add_circle_outline'}</span>{owned?.has(name) ? 'Owned' : 'Mark as Owned'}
      </button>}
      {onWish && <button className={`ct-detail-action-btn ct-detail-wish-btn ${wishlist?.has(name) ? 'active' : ''}`} onClick={() => onWish(name)}>
        <span className="material-icons">{wishlist?.has(name) ? 'favorite' : 'favorite_border'}</span>{wishlist?.has(name) ? 'In Wishlist' : 'Add to Wishlist'}
      </button>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="ct-wiki-link"><span className="material-icons">open_in_new</span> Nookipedia</a>}
    </div>
  );
}
