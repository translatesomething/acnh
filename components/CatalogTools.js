'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTools } from '../lib/api';
import { loadSet, saveSet, getBuyPrice } from '../lib/catalogUtils';
import { DetailModal, DetailActions, ErrorRetry } from './CatalogFurniture';

export default function CatalogTools() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [owned, setOwned] = useState(() => loadSet('ct_tool_owned'));
  const [selected, setSelected] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState([]);

  useEffect(() => {
    setLoading(true); setError(null);
    getTools().then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(e.name === 'AbortError' ? 'API timed out.' : 'Failed to load tools.');
    });
  }, [retryKey]);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) { const kw = search.toLowerCase(); list = list.filter(i => i.name?.toLowerCase().includes(kw)); }
    if (showCustom) list = list.filter(i => i.customizable);
    return list;
  }, [items, search, showCustom]);

  const toggle = (name, e) => {
    if (e) e.stopPropagation();
    setOwned(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); saveSet('ct_tool_owned', n); return n; });
  };

  const toggleCompare = (item, e) => {
    e.stopPropagation();
    setCompareItems(prev => prev.find(i => i.name === item.name) ? prev.filter(i => i.name !== item.name) : prev.length < 4 ? [...prev, item] : prev);
  };

  // Group tools by base type for comparison suggestions
  const toolGroups = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const base = item.name.replace(/^(Flimsy|Golden|Colorful|Outdoorsy|Star Net|Fish Fishing Rod)\s*/i, '').replace(/^(Star|Fish)\s+/i, '');
      const key = base.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.values(groups).filter(g => g.length > 1);
  }, [items]);

  return (
    <>
      <div className="ct-tracker">
        <div className="ct-tracker-row">
          <span className="material-icons">handyman</span><span>Owned: <strong>{owned.size}</strong> / {items.length}</span>
        </div>
      </div>

      <div className="ct-filters">
        <div className="ct-search-wrap">
          <span className="material-icons">search</span>
          <input className="ct-search" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ct-search-clear" onClick={() => setSearch('')}><span className="material-icons">close</span></button>}
        </div>
        <div className="ct-filter-row"><span className="ct-filter-label">Quick</span>
          <div className="ct-toggle-chips">
            <button className={`ct-toggle-chip ${showCustom ? 'active' : ''}`} onClick={() => setShowCustom(!showCustom)}>
              <span className="material-icons" style={{ fontSize: 16 }}>brush</span> Customizable
            </button>
            <button className={`ct-toggle-chip ${compareMode ? 'active' : ''}`} onClick={() => { setCompareMode(!compareMode); setCompareItems([]); }}>
              <span className="material-icons" style={{ fontSize: 16 }}>compare</span> Compare
            </button>
          </div>
        </div>
      </div>

      <div className="ct-results-bar"><span>{loading ? 'Loading...' : `${filtered.length} tools`}</span></div>
      {error && <ErrorRetry message={error} onRetry={() => setRetryKey(k => k + 1)} />}
      {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : <>
        <div className="ct-grid">
          {filtered.map(item => {
            const img = item.variations?.[0]?.image_url;
            const price = getBuyPrice(item);
            const isComparing = compareItems.find(i => i.name === item.name);
            return (
              <div key={item.name} className={`ct-card ${owned.has(item.name) ? 'owned' : ''} ${isComparing ? 'wishlisted' : ''}`}
                onClick={() => compareMode ? toggleCompare(item, { stopPropagation: () => {} }) : setSelected(item)}>
                <div className="ct-card-img-wrap">
                  {img ? <img src={img} alt={item.name} className="ct-card-img" loading="lazy" /> : <div className="ct-card-shimmer"><span className="material-icons">image</span></div>}
                  {owned.has(item.name) && <span className="ct-badge ct-badge--owned"><span className="material-icons">check_circle</span></span>}
                  {compareMode && <span className={`ct-badge ct-badge--wish`} style={{ opacity: isComparing ? 1 : 0.3 }}><span className="material-icons">compare</span></span>}
                </div>
                <div className="ct-card-body">
                  <h4 className="ct-card-title">{item.name}</h4>
                  <div className="ct-card-footer">
                    {price && <span className="ct-card-price"><span className="material-icons">payments</span>{price.toLocaleString()}</span>}
                    {item.uses && <span className="ct-card-vars">{item.uses} uses</span>}
                    {item.customizable && <span className="ct-card-lucky"><span className="material-icons">brush</span></span>}
                  </div>
                </div>
                <div className="ct-card-actions">
                  <button className={`ct-action-btn ${owned.has(item.name) ? 'active' : ''}`} onClick={e => toggle(item.name, e)}>
                    <span className="material-icons">{owned.has(item.name) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        {compareMode && compareItems.length >= 2 && (
          <div className="ct-compare-table-wrap">
            <h3>Tool Comparison</h3>
            <table className="ct-compare-table">
              <thead>
                <tr><th>Property</th>{compareItems.map(i => <th key={i.name}>{i.name}</th>)}</tr>
              </thead>
              <tbody>
                <tr><td>Image</td>{compareItems.map(i => <td key={i.name}>{i.variations?.[0]?.image_url && <img src={i.variations[0].image_url} alt={i.name} style={{ width: 48, height: 48 }} />}</td>)}</tr>
                <tr><td>Durability</td>{compareItems.map(i => <td key={i.name}>{i.uses || '—'}</td>)}</tr>
                <tr><td>Buy Price</td>{compareItems.map(i => <td key={i.name}>{getBuyPrice(i)?.toLocaleString() || 'N/A'}</td>)}</tr>
                <tr><td>Sell Price</td>{compareItems.map(i => <td key={i.name}>{i.sell?.toLocaleString() || '—'}</td>)}</tr>
                <tr><td>Customizable</td>{compareItems.map(i => <td key={i.name}>{i.customizable ? `Yes (${i.custom_kits} kits)` : 'No'}</td>)}</tr>
                <tr><td>HHA</td>{compareItems.map(i => <td key={i.name}>{i.hha_base || 0}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tool group suggestions */}
        {compareMode && compareItems.length < 2 && toolGroups.length > 0 && (
          <div className="ct-compare-suggest">
            <p>Select 2-4 tools to compare, or try these groups:</p>
            <div className="ct-toggle-chips" style={{ marginTop: 8 }}>
              {toolGroups.slice(0, 5).map((g, i) => (
                <button key={i} className="ct-toggle-chip" onClick={() => setCompareItems(g.slice(0, 4))}>
                  {g.map(t => t.name).join(' vs ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </>}

      {selected && <DetailModal onClose={() => setSelected(null)}>
        <ToolDetail item={selected} owned={owned} onOwn={n => toggle(n)} />
      </DetailModal>}
    </>
  );
}

function ToolDetail({ item, owned, onOwn }) {
  const [activeVar, setActiveVar] = useState(0);
  const bells = item.buy?.find(b => b.currency === 'Bells')?.price;
  const durabilityPct = item.uses ? Math.min(100, (Number(item.uses) / 100) * 100) : 0;

  return (
    <div className="ct-detail">
      <div className="ct-detail-hero">
        {item.variations?.length > 0 && <img src={item.variations[activeVar]?.image_url || ''} alt={item.name} className="ct-detail-img" />}
        <div className="ct-detail-hero-info">
          <h2>{item.name}</h2>
          <div className="ct-detail-badges">
            {item.customizable && <span className="ct-detail-lucky-badge"><span className="material-icons">brush</span> Customizable</span>}
          </div>
        </div>
      </div>

      {item.uses && (
        <div className="ct-durability">
          <h4>Durability</h4>
          <div className="ct-durability-bar"><div className="ct-durability-fill" style={{ width: `${durabilityPct}%` }} /></div>
          <span className="ct-durability-label">{item.uses} uses</span>
        </div>
      )}

      {item.variations?.length > 1 && <div className="ct-detail-vars"><h4>Variations</h4>
        <div className="ct-var-grid">{item.variations.map((v, i) => (
          <button key={i} className={`ct-var-item ${activeVar === i ? 'active' : ''}`} onClick={() => setActiveVar(i)}>
            <img src={v.image_url} alt={v.variation || `#${i + 1}`} /><span>{v.variation || `#${i + 1}`}</span>
          </button>
        ))}</div>
      </div>}

      <div className="ct-detail-info-grid">
        <div className="ct-info-item"><span className="ct-info-label">Buy Price</span><span>{bells ? `${bells.toLocaleString()} Bells` : 'Not for sale'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">Sell Price</span><span>{item.sell ? `${item.sell.toLocaleString()} Bells` : '—'}</span></div>
        <div className="ct-info-item"><span className="ct-info-label">HHA</span><span>{item.hha_base || 0} pts</span></div>
        {item.customizable && <div className="ct-info-item"><span className="ct-info-label">Custom Kits</span><span>{item.custom_kits}{item.custom_body_part ? ` (${item.custom_body_part})` : ''}</span></div>}
        {item.version_added && <div className="ct-info-item"><span className="ct-info-label">Added In</span><span>v{item.version_added}</span></div>}
      </div>

      {item.availability?.length > 0 && <div className="ct-detail-avail"><h4>How to Get</h4><div className="ct-avail-list">{item.availability.map((a, i) => <div key={i} className="ct-avail-item"><span className="material-icons">storefront</span><span>{a.from}{a.note ? ` — ${a.note}` : ''}</span></div>)}</div></div>}
      <DetailActions name={item.name} url={item.url} owned={owned} onOwn={onOwn} />
    </div>
  );
}
