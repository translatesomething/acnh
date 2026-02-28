'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getClothingNames, getClothingBatch, CLOTHING_CATEGORIES, CLOTHING_STYLES, CLOTHING_LABEL_THEMES, FURNITURE_COLORS } from '../lib/api';
import { loadSet, saveSet, loadCache, saveCache, clearCache, getBuyPrice, bgLoad } from '../lib/catalogUtils';
import { CatalogGrid, Pagination, DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

export default function CatalogClothing() {
  const [category, setCategory] = useState('Tops');
  const [allNames, setAllNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState(null);
  const [styleFilter, setStyleFilter] = useState(null);
  const [labelFilter, setLabelFilter] = useState(null);
  const [showVillEquip, setShowVillEquip] = useState(false);
  const [owned, setOwned] = useState(() => loadSet('ct_cloth_owned'));
  const [wishlist, setWishlist] = useState(() => loadSet('ct_cloth_wish'));
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [bgProg, setBgProg] = useState({ loaded: 0, total: 0, active: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const PER_PAGE = 20;
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    setLoading(true); setError(null); setAllNames([]); setPage(1);
    setBgProg({ loaded: 0, total: 0, active: false });
    const cached = loadCache('cloth', category);
    setCache(cached);
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) { setAllNames(cachedNames); setLoading(false); }

    getClothingNames(category).then(names => {
      if (cancelled) return;
      setAllNames(names); setLoading(false);
      if (Object.keys(cached).length >= names.length) return;
      const controller = new AbortController(); abortRef.current = controller;
      setBgProg({ loaded: Object.keys(cached).length, total: names.length, active: true });
      bgLoad({ names, cached, batchFn: getClothingBatch, controller,
        onProgress: acc => { setCache({ ...acc }); setBgProg({ loaded: Object.keys(acc).length, total: names.length, active: true }); },
        onDone: acc => { saveCache('cloth', category, acc); setCache({ ...acc }); setBgProg(p => ({ ...p, active: false })); }
      });
    }).catch(e => { if (!cancelled) { setLoading(false); if (cachedNames.length === 0) setError(e.name === 'AbortError' ? 'API timed out. Server may be slow.' : 'Failed to load. Try again.'); } });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [category, refreshKey]);

  const filtered = useMemo(() => {
    let list = [...allNames];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(n => n.toLowerCase().includes(kw)); }
    if (colorFilter || styleFilter || labelFilter || showVillEquip) {
      list = list.filter(n => {
        const d = cache[n]; if (!d) return false;
        if (colorFilter && !(d.variations || []).flatMap(v => v.colors || []).includes(colorFilter)) return false;
        if (styleFilter && !(d.styles || []).includes(styleFilter)) return false;
        if (labelFilter && !(d.label_themes || []).includes(labelFilter)) return false;
        if (showVillEquip && !d.vill_equip) return false;
        return true;
      });
    }
    return list;
  }, [allNames, search, colorFilter, styleFilter, labelFilter, showVillEquip, cache]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageNames = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  useEffect(() => { setPage(1); }, [search, colorFilter, styleFilter, labelFilter, showVillEquip]);

  const toggle = (key, setter, name, e) => {
    if (e) e.stopPropagation();
    setter(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet(key, n); return n; });
  };

  const pct = bgProg.total > 0 ? Math.round((bgProg.loaded / bgProg.total) * 100) : 0;
  const CAT_ICONS = { Tops: 'dry_cleaning', Bottoms: 'straighten', 'Dress-up': 'checkroom', Headwear: 'face', Accessories: 'visibility', Socks: 'socks', Shoes: 'ice_skating', Bags: 'shopping_bag', Umbrellas: 'umbrella' };

  return (
    <>
      <div className="ct-cat-tabs">
        {CLOTHING_CATEGORIES.map(c => (
          <button key={c} className={`ct-cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            <span className="material-icons" style={{ fontSize: 18 }}>{CAT_ICONS[c] || 'checkroom'}</span>{c}
          </button>
        ))}
      </div>

      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">checkroom</span><span>Owned: <strong>{owned.size}</strong></span>
          <span className="ct-tracker-sep">|</span><span className="material-icons">favorite</span><span>Wishlist: <strong>{wishlist.size}</strong></span>
          {bgProg.active && <><span className="ct-tracker-sep">|</span><span className="ct-bg-progress"><span className="material-icons ct-spin" style={{ fontSize: 14 }}>sync</span> {bgProg.loaded}/{bgProg.total} ({pct}%)</span></>}
          {!bgProg.active && bgProg.total > 0 && bgProg.loaded >= bgProg.total && <><span className="ct-tracker-sep">|</span><span className="ct-bg-done"><span className="material-icons" style={{ fontSize: 14 }}>check_circle</span> Cached</span></>}
        </div>
        {bgProg.active && <div className="ct-progress-bar"><div className="ct-progress-fill" style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search clothing..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>

        <div className="ct-filter-row"><span className="ct-filter-label">Color</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!colorFilter ? 'active' : ''}`} onClick={() => setColorFilter(null)}>All</button>
            {FURNITURE_COLORS.map(c => <button key={c} className={`ct-color-chip ${colorFilter === c ? 'active' : ''}`} onClick={() => setColorFilter(c)}>{c}</button>)}
          </div>
        </div>

        <div className="ct-filter-row"><span className="ct-filter-label">Style</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!styleFilter ? 'active' : ''}`} onClick={() => setStyleFilter(null)}>All</button>
            {CLOTHING_STYLES.map(s => <button key={s} className={`ct-color-chip ${styleFilter === s ? 'active' : ''}`} onClick={() => setStyleFilter(s)}>{s}</button>)}
          </div>
        </div>

        <div className="ct-filter-row"><span className="ct-filter-label">Label</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!labelFilter ? 'active' : ''}`} onClick={() => setLabelFilter(null)}>All</button>
            {CLOTHING_LABEL_THEMES.map(t => <button key={t} className={`ct-color-chip ${labelFilter === t ? 'active' : ''}`} onClick={() => setLabelFilter(t)}>{t}</button>)}
          </div>
        </div>

        <div className="ct-filter-row"><span className="ct-filter-label">Quick</span>
          <div className="ct-toggle-chips">
            <button className={`ct-toggle-chip ${showVillEquip ? 'active' : ''}`} onClick={() => setShowVillEquip(!showVillEquip)}>
              <span className="material-icons" style={{ fontSize: 16 }}>people</span> Villager Wearable
            </button>
            <button className="ct-toggle-chip" onClick={() => { clearCache('cloth', category); setCache({}); setBgProg({ loaded: 0, total: 0, active: false }); setRefreshKey(k => k + 1); }}>
              <span className="material-icons" style={{ fontSize: 16 }}>refresh</span> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} items`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRefreshKey(k => k + 1)} />}
      {loading && allNames.length === 0 ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <CatalogGrid items={pageNames} cache={cache} owned={owned} wishlist={wishlist}
          onSelect={n => cache[n] && setSelected(cache[n])}
          onOwn={(n, e) => toggle('ct_cloth_owned', setOwned, n, e)}
          onWish={(n, e) => toggle('ct_cloth_wish', setWishlist, n, e)}
          getImg={item => item?.variations?.[0]?.image_url}
          getExtra={item => item ? <>
            <div className="ct-card-footer">
              {getBuyPrice(item) && <span className="ct-card-price"><span className="material-icons">payments</span>{getBuyPrice(item).toLocaleString()}</span>}
              {item.variation_total > 1 && <span className="ct-card-vars">{item.variation_total} vars</span>}
              {item.vill_equip && <span className="ct-card-lucky" title="Villager wearable"><span className="material-icons">people</span></span>}
            </div>
          </> : <div className="ct-card-shimmer-text" />}
        />
        {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={setPage} />}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <ClothingDetail item={selected} owned={owned} wishlist={wishlist}
          onOwn={n => toggle('ct_cloth_owned', setOwned, n)} onWish={n => toggle('ct_cloth_wish', setWishlist, n)} />
      </DetailModal>}
    </>
  );
}

function ClothingDetail({ item, owned, wishlist, onOwn, onWish }) {
  const [activeVar, setActiveVar] = useState(0);
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;
  const poki = item.buy?.find(b => b.currency === 'Poki')?.price;

  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.variations?.length > 0 && <img src={item.variations[activeVar]?.image_url || ''} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          <div className="ct-detail-badges">
            <span className="ct-detail-cat-badge">{item.category}</span>
            {item.vill_equip && <span className="ct-detail-lucky-badge"><span className="material-icons">people</span> Villager Wearable</span>}
            {item.seasonality && item.seasonality !== 'All year' && <span className="ct-detail-door-badge">{item.seasonality}</span>}
          </div>
        </div>
      </div>

      {item.variations?.length > 1 && <div className="ct-detail-vars"><h4>Variations ({item.variation_total})</h4>
        <div className="ct-var-grid">{item.variations.map((v, i) => (
          <button key={i} className={`ct-var-item ${activeVar === i ? 'active' : ''}`} onClick={() => setActiveVar(i)}>
            <img src={v.image_url} alt={v.variation || `#${i + 1}`} /><span>{v.variation || `#${i + 1}`}</span>
          </button>
        ))}</div>
      </div>}

      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span>
          {poki && <span className="ct-info-sub">{poki.toLocaleString()} Poki</span>}</div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        {item.styles?.length > 0 && <div className="ct-info-item"><span className="ct-info-label">Styles</span><div className="ct-theme-chips">{item.styles.map(s => <span key={s} className="ct-theme-chip">{s}</span>)}</div></div>}
        {item.label_themes?.length > 0 && <div className="ct-info-item ct-info-wide"><span className="ct-info-label">Label Themes</span><div className="ct-theme-chips">{item.label_themes.map(t => <span key={t} className="ct-theme-chip ct-theme-chip--label">{t}</span>)}</div></div>}
        <div className="ct-info-item"><span className="ct-info-label">Seasonality</span><span>{item.seasonality || 'All year'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Villager Wearable</span><span>{item.vill_equip ? 'Yes' : 'No'}</span></div>
      </div>

      {item.variations?.[activeVar]?.colors?.length > 0 && <div className="ct-detail-colors"><h4>Colors ({item.variations[activeVar].variation || 'Default'})</h4><div className="ct-theme-chips">{item.variations[activeVar].colors.map(c => <span key={c} className="ct-theme-chip">{c}</span>)}</div></div>}
      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      <DetailActions name={item.name} url={item.url} owned={owned} wishlist={wishlist} onOwn={onOwn} onWish={onWish} />
    </div>
  );
}
