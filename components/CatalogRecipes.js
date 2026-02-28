'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getRecipeNames, getRecipeBatch, getRecipesByMaterial } from '../lib/api';
import { loadSet, saveSet, loadCache, saveCache, clearCache, getBuyPrice, bgLoad } from '../lib/catalogUtils';
import { Pagination, DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

const COMMON_MATERIALS = ['Iron Nugget', 'Wood', 'Softwood', 'Hardwood', 'Stone', 'Clay', 'Gold Nugget', 'Star Fragment', 'Bamboo Piece', 'Tree Branch', 'Weeds'];

export default function CatalogRecipes() {
  const [allNames, setAllNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState({});
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [learned, setLearned] = useState(() => loadSet('ct_recipe_learned'));
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [bgProg, setBgProg] = useState({ loaded: 0, total: 0, active: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [shoppingList, setShoppingList] = useState(() => loadSet('ct_recipe_shop'));
  const [showShoppingPanel, setShowShoppingPanel] = useState(false);
  const PER_PAGE = 20;
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    setLoading(true); setError(null); setAllNames([]); setPage(1);
    setBgProg({ loaded: 0, total: 0, active: false });
    const cached = loadCache('recipe', 'all');
    setCache(cached);
    const cachedNames = Object.keys(cached);
    if (cachedNames.length > 0) { setAllNames(cachedNames); setLoading(false); }

    getRecipeNames().then(names => {
      if (cancelled) return;
      setAllNames(names); setLoading(false);
      if (Object.keys(cached).length >= names.length) return;
      const controller = new AbortController(); abortRef.current = controller;
      setBgProg({ loaded: Object.keys(cached).length, total: names.length, active: true });
      bgLoad({ names, cached, batchFn: getRecipeBatch, controller,
        onProgress: acc => { setCache({ ...acc }); setBgProg({ loaded: Object.keys(acc).length, total: names.length, active: true }); },
        onDone: acc => { saveCache('recipe', 'all', acc); setCache({ ...acc }); setBgProg(p => ({ ...p, active: false })); }
      });
    }).catch(e => { if (!cancelled) { setLoading(false); if (cachedNames.length === 0) setError(e.name === 'AbortError' ? 'API timed out.' : 'Failed to load.'); } });

    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [refreshKey]);

  const sources = useMemo(() => {
    const s = new Set();
    Object.values(cache).forEach(r => (r.availability || []).forEach(a => { if (a.from) s.add(a.from); }));
    return [...s].sort();
  }, [cache]);

  const filtered = useMemo(() => {
    let list = [...allNames];
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(n => n.toLowerCase().includes(kw)); }
    if (materialFilter || sourceFilter) {
      list = list.filter(n => {
        const d = cache[n]; if (!d) return false;
        if (materialFilter && !(d.materials || []).some(m => m.name === materialFilter)) return false;
        if (sourceFilter && !(d.availability || []).some(a => a.from === sourceFilter)) return false;
        return true;
      });
    }
    return list;
  }, [allNames, search, materialFilter, sourceFilter, cache]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageNames = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  useEffect(() => { setPage(1); }, [search, materialFilter, sourceFilter]);

  const toggleLearned = (name, e) => {
    if (e) e.stopPropagation();
    setLearned(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet('ct_recipe_learned', n); return n; });
  };

  const toggleShoppingItem = (name, e) => {
    if (e) e.stopPropagation();
    setShoppingList(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet('ct_recipe_shop', n); return n; });
  };

  const shoppingMaterials = useMemo(() => {
    const mats = {};
    shoppingList.forEach(name => {
      const r = cache[name]; if (!r?.materials) return;
      r.materials.forEach(m => { mats[m.name] = (mats[m.name] || 0) + m.count; });
    });
    return Object.entries(mats).sort((a, b) => a[0].localeCompare(b[0]));
  }, [shoppingList, cache]);

  const pct = bgProg.total > 0 ? Math.round((bgProg.loaded / bgProg.total) * 100) : 0;

  return (
    <>
      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">menu_book</span><span>Learned: <strong>{learned.size}</strong></span>
          <span className="ct-tracker-sep">|</span>
          <span className="material-icons">shopping_cart</span><span>Shopping: <strong>{shoppingList.size}</strong></span>
          {bgProg.active && <><span className="ct-tracker-sep">|</span><span className="ct-bg-progress"><span className="material-icons ct-spin" style={{ fontSize: 14 }}>sync</span> {bgProg.loaded}/{bgProg.total} ({pct}%)</span></>}
          {!bgProg.active && bgProg.total > 0 && bgProg.loaded >= bgProg.total && <><span className="ct-tracker-sep">|</span><span className="ct-bg-done"><span className="material-icons" style={{ fontSize: 14 }}>check_circle</span> Cached</span></>}
        </div>
        {bgProg.active && <div className="ct-progress-bar"><div className="ct-progress-fill" style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>

        <div className="ct-filter-row"><span className="ct-filter-label">Material</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!materialFilter ? 'active' : ''}`} onClick={() => setMaterialFilter(null)}>All</button>
            {COMMON_MATERIALS.map(m => <button key={m} className={`ct-color-chip ${materialFilter === m ? 'active' : ''}`} onClick={() => setMaterialFilter(m)}>{m}</button>)}
          </div>
        </div>

        {sources.length > 0 && <div className="ct-filter-row"><span className="ct-filter-label">Source</span>
          <div className="ct-color-chips">
            <button className={`ct-color-chip ${!sourceFilter ? 'active' : ''}`} onClick={() => setSourceFilter(null)}>All</button>
            {sources.slice(0, 12).map(s => <button key={s} className={`ct-color-chip ${sourceFilter === s ? 'active' : ''}`} onClick={() => setSourceFilter(s)}>{s}</button>)}
          </div>
        </div>}

        <div className="ct-filter-row"><span className="ct-filter-label">Quick</span>
          <div className="ct-toggle-chips">
            <button className={`ct-toggle-chip ${showShoppingPanel ? 'active' : ''}`} onClick={() => setShowShoppingPanel(!showShoppingPanel)}>
              <span className="material-icons" style={{ fontSize: 16 }}>shopping_cart</span> Shopping List
            </button>
            <button className="ct-toggle-chip" onClick={() => { clearCache('recipe', 'all'); setCache({}); setBgProg({ loaded: 0, total: 0, active: false }); setRefreshKey(k => k + 1); }}>
              <span className="material-icons" style={{ fontSize: 16 }}>refresh</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Shopping list panel */}
      {showShoppingPanel && (
        <div className="ct-shopping-panel">
          <div className="ct-shopping-header">
            <h4><span className="material-icons">shopping_cart</span> Shopping List ({shoppingList.size} recipes)</h4>
            {shoppingList.size > 0 && <button className="ct-clear-btn" onClick={() => { setShoppingList(new Set()); saveSet('ct_recipe_shop', new Set()); }}><span className="material-icons">delete</span> Clear</button>}
          </div>
          {shoppingMaterials.length > 0 ? (
            <div className="ct-shopping-mats">
              {shoppingMaterials.map(([name, count]) => (
                <div key={name} className="ct-shopping-mat-item">
                  <span className="ct-shopping-mat-name">{name}</span>
                  <span className="ct-shopping-mat-count">×{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="ct-shopping-empty">Add recipes to see total materials needed</p>}
        </div>
      )}

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} recipes`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRefreshKey(k => k + 1)} />}
      {loading && allNames.length === 0 ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <div className="ct-grid">
          {pageNames.map(name => {
            const item = cache[name];
            const img = item?.image_url;
            return (
              <div key={name} className={`ct-card ${learned.has(name) ? 'owned' : ''} ${shoppingList.has(name) ? 'wishlisted' : ''}`}
                onClick={() => item && setSelected(item)}>
                <div className="ct-card-img-wrap">
                  {img ? <img src={img} alt={name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
                  {learned.has(name) && <span className="ct-badge ct-badge--owned"><span className="material-icons">check_circle</span></span>}
                </div>
                <div className="ct-card-body">
                  <h4 className="ct-card-title">{name}</h4>
                  {item ? <>
                    <div className="ct-card-footer">
                      {item.sell && <span className="ct-card-price"><span className="material-icons">payments</span>{item.sell.toLocaleString()}</span>}
                      {item.materials?.length > 0 && <span className="ct-card-vars">{item.materials.length} mats</span>}
                    </div>
                  </> : <div className="ct-card-shimmer-text" />}
                </div>
                <div className="ct-card-actions">
                  <button className={`ct-action-btn ${learned.has(name) ? 'active' : ''}`} onClick={e => toggleLearned(name, e)} title="Learned">
                    <span className="material-icons">{learned.has(name) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                  <button className={`ct-action-btn ct-action-wish ${shoppingList.has(name) ? 'active' : ''}`} onClick={e => toggleShoppingItem(name, e)} title="Add to shopping list">
                    <span className="material-icons">{shoppingList.has(name) ? 'remove_shopping_cart' : 'add_shopping_cart'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={setPage} />}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <RecipeDetail item={selected} learned={learned} shoppingList={shoppingList}
          onLearn={n => toggleLearned(n)} onShop={n => toggleShoppingItem(n)}
          onMaterialClick={m => { setSelected(null); setMaterialFilter(m); }} />
      </DetailModal>}
    </>
  );
}

function RecipeDetail({ item, learned, shoppingList, onLearn, onShop, onMaterialClick }) {
  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.image_url && <img src={item.image_url} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          {item.serial_id && <span className="ct-detail-series">#{item.serial_id}</span>}
          <div className="ct-detail-badges">
            {item.recipes_to_unlock > 0 && <span className="ct-detail-cat-badge">Unlock: {item.recipes_to_unlock} recipes</span>}
          </div>
        </div>
      </div>

      {item.materials?.length > 0 && (
        <div className="ct-recipe-mats">
          <h4>Materials Required</h4>
          <div className="ct-recipe-mat-list">
            {item.materials.map((m, i) => (
              <button key={i} className="ct-recipe-mat-item" onClick={() => onMaterialClick?.(m.name)}>
                <span className="ct-recipe-mat-name">{m.name}</span>
                <span className="ct-recipe-mat-count">×{m.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        {item.recipes_to_unlock > 0 && <div className="ct-info-item"><span className="ct-info-label">Recipes to Unlock</span><span>{item.recipes_to_unlock}</span></div>}
      </div>

      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get Recipe</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}

      <div className="ct-detail-actions">
        <button className={`ct-detail-action-btn ${learned?.has(item.name) ? 'active' : ''}`} onClick={() => onLearn(item.name)}>
          <span className="material-icons">{learned?.has(item.name) ? 'check_circle' : 'add_circle_outline'}</span>{learned?.has(item.name) ? 'Learned' : 'Mark as Learned'}
        </button>
        <button className={`ct-detail-action-btn ct-detail-wish-btn ${shoppingList?.has(item.name) ? 'active' : ''}`} onClick={() => onShop(item.name)}>
          <span className="material-icons">{shoppingList?.has(item.name) ? 'remove_shopping_cart' : 'add_shopping_cart'}</span>{shoppingList?.has(item.name) ? 'In Shopping List' : 'Add to Shopping'}
        </button>
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="ct-wiki-link"><span className="material-icons">open_in_new</span> Nookipedia</a>}
      </div>
    </div>
  );
}
