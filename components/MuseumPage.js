'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getArt, getFossils, getGyroids } from '../lib/api';

const MUSEUM_TABS = [
  { id: 'art',     label: 'Artwork',  icon: 'palette' },
  { id: 'fossils', label: 'Fossils',  icon: 'diamond' },
  { id: 'gyroids', label: 'Gyroids',  icon: 'graphic_eq' },
];

function loadSet(key) {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveSet(key, set) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function MuseumPage() {
  const [tab, setTab] = useState('art');

  // Art state
  const [artData, setArtData] = useState([]);
  const [artLoading, setArtLoading] = useState(false);
  const [artError, setArtError] = useState(null);
  const [artSearch, setArtSearch] = useState('');
  const [artTypeFilter, setArtTypeFilter] = useState('all');
  const [artFakeFilter, setArtFakeFilter] = useState('all');
  const [artDonated, setArtDonated] = useState(() => loadSet('museum_art_donated'));
  const [selectedArt, setSelectedArt] = useState(null);

  // Fossils state
  const [fossilData, setFossilData] = useState({ individuals: [], groups: [] });
  const [fossilLoading, setFossilLoading] = useState(false);
  const [fossilError, setFossilError] = useState(null);
  const [fossilSearch, setFossilSearch] = useState('');
  const [fossilViewMode, setFossilViewMode] = useState('groups');
  const [fossilDonated, setFossilDonated] = useState(() => loadSet('museum_fossil_donated'));
  const [selectedFossil, setSelectedFossil] = useState(null);

  // Gyroids state
  const [gyroidData, setGyroidData] = useState([]);
  const [gyroidLoading, setGyroidLoading] = useState(false);
  const [gyroidError, setGyroidError] = useState(null);
  const [gyroidSearch, setGyroidSearch] = useState('');
  const [gyroidSoundFilter, setGyroidSoundFilter] = useState('all');
  const [gyroidCollected, setGyroidCollected] = useState(() => loadSet('museum_gyroid_collected'));
  const [selectedGyroid, setSelectedGyroid] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => { setCurrentPage(1); }, [tab, artSearch, artTypeFilter, artFakeFilter, fossilSearch, fossilViewMode, gyroidSearch, gyroidSoundFilter]);

  const artCancelledRef = useRef(false);
  const fossilCancelledRef = useRef(false);
  const gyroidCancelledRef = useRef(false);

  // Fetch art
  const loadArt = () => {
    setArtError(null);
    setArtLoading(true);
    artCancelledRef.current = false;
    getArt()
      .then(d => { if (!artCancelledRef.current) setArtData(Array.isArray(d) ? d : []); })
      .catch(e => { if (!artCancelledRef.current) setArtError(e?.message || 'Failed to load art.'); })
      .finally(() => { if (!artCancelledRef.current) setArtLoading(false); });
  };
  useEffect(() => {
    if (tab !== 'art' || artData.length > 0 || artLoading) return;
    artCancelledRef.current = false;
    setArtError(null);
    setArtLoading(true);
    getArt()
      .then(d => { if (!artCancelledRef.current) setArtData(Array.isArray(d) ? d : []); })
      .catch(e => { if (!artCancelledRef.current) setArtError(e?.message || 'Failed to load art.'); })
      .finally(() => { if (!artCancelledRef.current) setArtLoading(false); });
    return () => { artCancelledRef.current = true; };
  }, [tab]);

  // Fetch fossils
  const loadFossils = () => {
    setFossilError(null);
    setFossilLoading(true);
    fossilCancelledRef.current = false;
    getFossils()
      .then(d => { if (!fossilCancelledRef.current) setFossilData(d || { individuals: [], groups: [] }); })
      .catch(e => { if (!fossilCancelledRef.current) setFossilError(e?.message || 'Failed to load fossils.'); })
      .finally(() => { if (!fossilCancelledRef.current) setFossilLoading(false); });
  };
  useEffect(() => {
    if (tab !== 'fossils' || fossilData.individuals.length > 0 || fossilLoading) return;
    fossilCancelledRef.current = false;
    setFossilError(null);
    setFossilLoading(true);
    getFossils()
      .then(d => { if (!fossilCancelledRef.current) setFossilData(d || { individuals: [], groups: [] }); })
      .catch(e => { if (!fossilCancelledRef.current) setFossilError(e?.message || 'Failed to load fossils.'); })
      .finally(() => { if (!fossilCancelledRef.current) setFossilLoading(false); });
    return () => { fossilCancelledRef.current = true; };
  }, [tab]);

  // Fetch gyroids
  const loadGyroids = () => {
    setGyroidError(null);
    setGyroidLoading(true);
    gyroidCancelledRef.current = false;
    getGyroids()
      .then(d => { if (!gyroidCancelledRef.current) setGyroidData(Array.isArray(d) ? d : []); })
      .catch(e => { if (!gyroidCancelledRef.current) setGyroidError(e?.message || 'Failed to load gyroids.'); })
      .finally(() => { if (!gyroidCancelledRef.current) setGyroidLoading(false); });
  };
  useEffect(() => {
    if (tab !== 'gyroids' || gyroidData.length > 0 || gyroidLoading) return;
    gyroidCancelledRef.current = false;
    setGyroidError(null);
    setGyroidLoading(true);
    getGyroids()
      .then(d => { if (!gyroidCancelledRef.current) setGyroidData(Array.isArray(d) ? d : []); })
      .catch(e => { if (!gyroidCancelledRef.current) setGyroidError(e?.message || 'Failed to load gyroids.'); })
      .finally(() => { if (!gyroidCancelledRef.current) setGyroidLoading(false); });
    return () => { gyroidCancelledRef.current = true; };
  }, [tab]);

  // ─── Art logic ─────────────────────────────────────────
  const filteredArt = useMemo(() => {
    let list = [...artData];
    if (artSearch.trim()) {
      const kw = artSearch.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(kw) || a.art_name?.toLowerCase().includes(kw) || a.author?.toLowerCase().includes(kw));
    }
    if (artTypeFilter !== 'all') list = list.filter(a => a.art_type === artTypeFilter);
    if (artFakeFilter === 'has_fake') list = list.filter(a => a.has_fake);
    if (artFakeFilter === 'no_fake') list = list.filter(a => !a.has_fake);
    return list;
  }, [artData, artSearch, artTypeFilter, artFakeFilter]);

  const artDonatedCount = useMemo(() => artData.filter(a => artDonated.has(a.name)).length, [artData, artDonated]);

  const toggleArtDonated = (name, e) => {
    if (e) e.stopPropagation();
    setArtDonated(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      saveSet('museum_art_donated', next);
      return next;
    });
  };

  // ─── Fossils logic ─────────────────────────────────────
  const fossilGroupMap = useMemo(() => {
    const map = {};
    fossilData.groups.forEach(g => { map[g.name] = g; });
    return map;
  }, [fossilData.groups]);

  const groupedFossils = useMemo(() => {
    const grouped = {};
    const standalone = [];
    fossilData.individuals.forEach(f => {
      if (f.fossil_group) {
        if (!grouped[f.fossil_group]) grouped[f.fossil_group] = [];
        grouped[f.fossil_group].push(f);
      } else {
        standalone.push(f);
      }
    });
    return { grouped, standalone };
  }, [fossilData.individuals]);

  const filteredFossilGroups = useMemo(() => {
    const kw = fossilSearch.toLowerCase();
    if (!kw) return Object.keys(groupedFossils.grouped).sort();
    return Object.keys(groupedFossils.grouped).filter(g => g.toLowerCase().includes(kw)).sort();
  }, [groupedFossils.grouped, fossilSearch]);

  const filteredStandaloneFossils = useMemo(() => {
    const kw = fossilSearch.toLowerCase();
    if (!kw) return groupedFossils.standalone;
    return groupedFossils.standalone.filter(f => f.name.toLowerCase().includes(kw));
  }, [groupedFossils.standalone, fossilSearch]);

  const filteredFossilIndividuals = useMemo(() => {
    const kw = fossilSearch.toLowerCase();
    if (!kw) return fossilData.individuals;
    return fossilData.individuals.filter(f => f.name.toLowerCase().includes(kw) || (f.fossil_group && f.fossil_group.toLowerCase().includes(kw)));
  }, [fossilData.individuals, fossilSearch]);

  const fossilDonatedCount = useMemo(() => fossilData.individuals.filter(f => fossilDonated.has(f.name)).length, [fossilData.individuals, fossilDonated]);

  const toggleFossilDonated = (name, e) => {
    if (e) e.stopPropagation();
    setFossilDonated(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      saveSet('museum_fossil_donated', next);
      return next;
    });
  };

  const getFossilGroupCompletion = (groupName) => {
    const pieces = groupedFossils.grouped[groupName] || [];
    const donated = pieces.filter(f => fossilDonated.has(f.name)).length;
    return { donated, total: pieces.length };
  };

  // ─── Gyroids logic ─────────────────────────────────────
  const uniqueSounds = useMemo(() => [...new Set(gyroidData.map(g => g.sound).filter(Boolean))].sort(), [gyroidData]);

  const filteredGyroids = useMemo(() => {
    let list = [...gyroidData];
    if (gyroidSearch.trim()) {
      const kw = gyroidSearch.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(kw) || g.sound?.toLowerCase().includes(kw));
    }
    if (gyroidSoundFilter !== 'all') list = list.filter(g => g.sound === gyroidSoundFilter);
    return list;
  }, [gyroidData, gyroidSearch, gyroidSoundFilter]);

  const gyroidCollectedCount = useMemo(() => gyroidData.filter(g => gyroidCollected.has(g.name)).length, [gyroidData, gyroidCollected]);

  const toggleGyroidCollected = (name, e) => {
    if (e) e.stopPropagation();
    setGyroidCollected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      saveSet('museum_gyroid_collected', next);
      return next;
    });
  };

  // ─── Pagination helpers ────────────────────────────────
  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };
  const totalPagesFor = (list) => Math.ceil(list.length / itemsPerPage);

  const getPageNumbers = (total) => {
    const pages = [];
    const current = currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current <= 4) {
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  const PaginationControls = ({ totalItems }) => {
    const total = totalPagesFor(totalItems);
    if (total <= 1) return null;
    return (
      <div className="mu-pagination">
        <button className="mu-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          <span className="material-icons">chevron_left</span>
        </button>
        <div className="mu-page-numbers">
          {getPageNumbers(total).map((p, i) =>
            typeof p === 'string'
              ? <span key={`e${i}`} className="mu-page-ellipsis">...</span>
              : <button key={p} className={`mu-page-num ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
          )}
        </div>
        <button className="mu-page-btn" disabled={currentPage === total} onClick={() => setCurrentPage(p => p + 1)}>
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="mu-page">
      {/* Sub-tabs */}
      <div className="mu-tabs">
        {MUSEUM_TABS.map(t => (
          <button key={t.id} className={`mu-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="material-icons">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ ART TAB ═══════════ */}
      {tab === 'art' && (
        <div className="mu-section">
          {/* Progress bar */}
          <div className="mu-tracker">
            <div className="mu-tracker-label">
              <span className="material-icons">emoji_events</span>
              Art Gallery: {artDonatedCount} / {artData.length} donated
            </div>
            <div className="mu-tracker-bar">
              <div className="mu-tracker-fill" style={{ width: artData.length ? `${(artDonatedCount / artData.length) * 100}%` : '0%' }} />
            </div>
          </div>

          {/* Filters */}
          <div className="mu-filters">
            <div className="mu-search-wrap">
              <span className="material-icons">search</span>
              <input className="mu-search" placeholder="Search artwork, artist, real name..." value={artSearch} onChange={e => setArtSearch(e.target.value)} />
              {artSearch && <button className="mu-search-clear" onClick={() => setArtSearch('')}><span className="material-icons">close</span></button>}
            </div>
            <div className="mu-chip-row">
              <span className="mu-chip-label">Type</span>
              {['all', 'Painting', 'Statue'].map(t => (
                <button key={t} className={`mu-chip ${artTypeFilter === t ? 'active' : ''}`} onClick={() => setArtTypeFilter(t)}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
            <div className="mu-chip-row">
              <span className="mu-chip-label">Forgery</span>
              {[['all', 'All'], ['has_fake', 'Has Fake'], ['no_fake', 'Always Real']].map(([v, l]) => (
                <button key={v} className={`mu-chip ${artFakeFilter === v ? 'active' : ''}`} onClick={() => setArtFakeFilter(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="mu-results-bar">
            <span>{filteredArt.length} artwork{filteredArt.length !== 1 ? 's' : ''}</span>
          </div>

          {artLoading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : artError ? (
            <div className="empty-state">
              <span className="material-icons empty-icon">error_outline</span>
              <h2>Failed to load</h2>
              <p>{artError}</p>
              <button className="clear-filters-btn" onClick={loadArt} type="button" style={{ cursor: 'pointer', marginTop: 12 }}>
                <span className="material-icons">refresh</span> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mu-grid mu-grid--art">
                {paginate(filteredArt).map(art => (
                  <div key={art.name} className={`mu-card mu-card--art ${artDonated.has(art.name) ? 'donated' : ''}`} onClick={() => setSelectedArt(art)}>
                    <div className="mu-card-img-wrap">
                      <img src={art.image_url} alt={art.name} className="mu-card-img" loading="lazy" />
                      {art.has_fake && <span className="mu-badge mu-badge--fake">Fake exists</span>}
                      {artDonated.has(art.name) && <span className="mu-badge mu-badge--donated"><span className="material-icons">check_circle</span></span>}
                    </div>
                    <div className="mu-card-body">
                      <h4 className="mu-card-title">{art.name}</h4>
                      <p className="mu-card-sub">{art.art_name}</p>
                      <p className="mu-card-meta">{art.author} · {art.year}</p>
                      <div className="mu-card-footer">
                        <span className="mu-card-type">{art.art_type}</span>
                        <span className="mu-card-price"><span className="material-icons">payments</span>{art.sell?.toLocaleString()}</span>
                      </div>
                    </div>
                    <button className={`mu-donate-btn ${artDonated.has(art.name) ? 'active' : ''}`} onClick={e => toggleArtDonated(art.name, e)} title={artDonated.has(art.name) ? 'Mark as not donated' : 'Mark as donated'}>
                      <span className="material-icons">{artDonated.has(art.name) ? 'museum' : 'add_circle_outline'}</span>
                    </button>
                  </div>
                ))}
              </div>
              <PaginationControls totalItems={filteredArt} />
            </>
          )}

          {/* Art detail modal */}
          {selectedArt && (
            <div className="mu-modal-overlay" onClick={() => setSelectedArt(null)}>
              <div className="mu-modal" onClick={e => e.stopPropagation()}>
                <button className="mu-modal-close" onClick={() => setSelectedArt(null)}><span className="material-icons">close</span></button>
                <div className="mu-art-detail">
                  <div className="mu-art-detail-images">
                    <div className="mu-art-real">
                      <h4>Real</h4>
                      <img src={selectedArt.image_url} alt={`${selectedArt.name} (Real)`} />
                    </div>
                    {selectedArt.has_fake && selectedArt.fake_image_url && (
                      <div className="mu-art-fake">
                        <h4>Fake</h4>
                        <img src={selectedArt.fake_image_url} alt={`${selectedArt.name} (Fake)`} />
                      </div>
                    )}
                  </div>
                  <div className="mu-art-detail-info">
                    <h2>{selectedArt.name}</h2>
                    <p className="mu-art-realname">"{selectedArt.art_name}" by {selectedArt.author}</p>
                    <div className="mu-art-meta-grid">
                      <div className="mu-meta-item"><span className="mu-meta-label">Type</span><span>{selectedArt.art_type}</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">Year</span><span>{selectedArt.year}</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">Style</span><span>{selectedArt.art_style}</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">Buy Price</span><span>{selectedArt.buy?.toLocaleString()} Bells</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">Sell Price</span><span>{selectedArt.sell?.toLocaleString()} Bells</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">Size</span><span>{selectedArt.width}×{selectedArt.length}</span></div>
                      <div className="mu-meta-item"><span className="mu-meta-label">From</span><span>{selectedArt.availability}</span></div>
                    </div>
                    {selectedArt.description && (
                      <div className="mu-art-description">
                        <h4>Description</h4>
                        <p>{selectedArt.description}</p>
                      </div>
                    )}
                    {selectedArt.has_fake && selectedArt.authenticity && (
                      <div className="mu-art-authenticity">
                        <h4><span className="material-icons">search</span> How to Spot the Fake</h4>
                        <p>{selectedArt.authenticity}</p>
                      </div>
                    )}
                    {selectedArt.has_fake && selectedArt.texture_url && (
                      <div className="mu-art-textures">
                        <h4>Full Textures</h4>
                        <div className="mu-art-texture-row">
                          <div>
                            <span className="mu-tex-label">Real</span>
                            <img src={selectedArt.texture_url} alt="Real texture" />
                          </div>
                          {selectedArt.fake_texture_url && (
                            <div>
                              <span className="mu-tex-label">Fake</span>
                              <img src={selectedArt.fake_texture_url} alt="Fake texture" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mu-detail-actions">
                      <button className={`mu-donate-action ${artDonated.has(selectedArt.name) ? 'active' : ''}`} onClick={() => toggleArtDonated(selectedArt.name)}>
                        <span className="material-icons">{artDonated.has(selectedArt.name) ? 'museum' : 'add_circle_outline'}</span>
                        {artDonated.has(selectedArt.name) ? 'Donated to Museum' : 'Mark as Donated'}
                      </button>
                      <a href={selectedArt.url} target="_blank" rel="noopener noreferrer" className="mu-wiki-link">
                        <span className="material-icons">open_in_new</span> Nookipedia
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ FOSSILS TAB ═══════════ */}
      {tab === 'fossils' && (
        <div className="mu-section">
          <div className="mu-tracker">
            <div className="mu-tracker-label">
              <span className="material-icons">emoji_events</span>
              Fossil Collection: {fossilDonatedCount} / {fossilData.individuals.length} donated
            </div>
            <div className="mu-tracker-bar">
              <div className="mu-tracker-fill" style={{ width: fossilData.individuals.length ? `${(fossilDonatedCount / fossilData.individuals.length) * 100}%` : '0%' }} />
            </div>
          </div>

          <div className="mu-filters">
            <div className="mu-search-wrap">
              <span className="material-icons">search</span>
              <input className="mu-search" placeholder="Search fossils..." value={fossilSearch} onChange={e => setFossilSearch(e.target.value)} />
              {fossilSearch && <button className="mu-search-clear" onClick={() => setFossilSearch('')}><span className="material-icons">close</span></button>}
            </div>
            <div className="mu-chip-row">
              <span className="mu-chip-label">View</span>
              <button className={`mu-chip ${fossilViewMode === 'groups' ? 'active' : ''}`} onClick={() => setFossilViewMode('groups')}>
                <span className="material-icons" style={{ fontSize: 16 }}>account_tree</span> By Group
              </button>
              <button className={`mu-chip ${fossilViewMode === 'all' ? 'active' : ''}`} onClick={() => setFossilViewMode('all')}>
                <span className="material-icons" style={{ fontSize: 16 }}>grid_view</span> All Individual
              </button>
            </div>
          </div>

          <div className="mu-results-bar">
            <span>
              {fossilViewMode === 'groups'
                ? `${filteredFossilGroups.length} groups + ${filteredStandaloneFossils.length} standalone`
                : `${filteredFossilIndividuals.length} fossils`}
            </span>
          </div>

          {fossilLoading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : fossilError ? (
            <div className="empty-state">
              <span className="material-icons empty-icon">error_outline</span>
              <h2>Failed to load</h2>
              <p>{fossilError}</p>
              <button className="clear-filters-btn" onClick={loadFossils} type="button" style={{ cursor: 'pointer', marginTop: 12 }}>
                <span className="material-icons">refresh</span> Retry
              </button>
            </div>
          ) : fossilViewMode === 'groups' ? (
            <div className="mu-fossil-groups">
              {filteredFossilGroups.map(groupName => {
                const meta = fossilGroupMap[groupName];
                const pieces = groupedFossils.grouped[groupName] || [];
                const completion = getFossilGroupCompletion(groupName);
                return (
                  <div key={groupName} className={`mu-fossil-group ${completion.donated === completion.total ? 'complete' : ''}`}>
                    <div className="mu-fg-header" onClick={() => setSelectedFossil(meta || { name: groupName })}>
                      <div className="mu-fg-title-row">
                        <h4>{groupName}</h4>
                        {meta?.room && <span className="mu-fg-room">Room {meta.room}</span>}
                      </div>
                      <div className="mu-fg-progress">
                        <div className="mu-fg-progress-bar">
                          <div className="mu-fg-progress-fill" style={{ width: `${(completion.donated / completion.total) * 100}%` }} />
                        </div>
                        <span className="mu-fg-progress-text">{completion.donated}/{completion.total}</span>
                      </div>
                    </div>
                    <div className="mu-fg-pieces">
                      {pieces.map(f => (
                        <div key={f.name} className={`mu-fossil-piece ${fossilDonated.has(f.name) ? 'donated' : ''}`}>
                          <img src={f.image_url} alt={f.name} loading="lazy" />
                          <span className="mu-fp-name">{f.name}</span>
                          <span className="mu-fp-price"><span className="material-icons">payments</span>{f.sell?.toLocaleString()}</span>
                          <button className={`mu-donate-sm ${fossilDonated.has(f.name) ? 'active' : ''}`} onClick={() => toggleFossilDonated(f.name)} title={fossilDonated.has(f.name) ? 'Not donated' : 'Donated'}>
                            <span className="material-icons">{fossilDonated.has(f.name) ? 'check_circle' : 'radio_button_unchecked'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredStandaloneFossils.length > 0 && (
                <div className="mu-fossil-group">
                  <div className="mu-fg-header">
                    <div className="mu-fg-title-row"><h4>Standalone Fossils</h4></div>
                  </div>
                  <div className="mu-fg-pieces">
                    {filteredStandaloneFossils.map(f => (
                      <div key={f.name} className={`mu-fossil-piece ${fossilDonated.has(f.name) ? 'donated' : ''}`}>
                        <img src={f.image_url} alt={f.name} loading="lazy" />
                        <span className="mu-fp-name">{f.name}</span>
                        <span className="mu-fp-price"><span className="material-icons">payments</span>{f.sell?.toLocaleString()}</span>
                        <button className={`mu-donate-sm ${fossilDonated.has(f.name) ? 'active' : ''}`} onClick={() => toggleFossilDonated(f.name)} title={fossilDonated.has(f.name) ? 'Not donated' : 'Donated'}>
                          <span className="material-icons">{fossilDonated.has(f.name) ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mu-grid mu-grid--fossil">
                {paginate(filteredFossilIndividuals).map(f => (
                  <div key={f.name} className={`mu-card mu-card--fossil ${fossilDonated.has(f.name) ? 'donated' : ''}`}>
                    <div className="mu-card-img-wrap">
                      <img src={f.image_url} alt={f.name} className="mu-card-img" loading="lazy" />
                      {fossilDonated.has(f.name) && <span className="mu-badge mu-badge--donated"><span className="material-icons">check_circle</span></span>}
                    </div>
                    <div className="mu-card-body">
                      <h4 className="mu-card-title">{f.name}</h4>
                      {f.fossil_group && <p className="mu-card-sub">{f.fossil_group}</p>}
                      <div className="mu-card-footer">
                        <span className="mu-card-price"><span className="material-icons">payments</span>{f.sell?.toLocaleString()}</span>
                        {f.colors?.length > 0 && (
                          <span className="mu-card-colors">{f.colors.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <button className={`mu-donate-btn ${fossilDonated.has(f.name) ? 'active' : ''}`} onClick={e => toggleFossilDonated(f.name, e)}>
                      <span className="material-icons">{fossilDonated.has(f.name) ? 'museum' : 'add_circle_outline'}</span>
                    </button>
                  </div>
                ))}
              </div>
              <PaginationControls totalItems={filteredFossilIndividuals} />
            </>
          )}

          {/* Fossil detail modal */}
          {selectedFossil && (
            <div className="mu-modal-overlay" onClick={() => setSelectedFossil(null)}>
              <div className="mu-modal mu-modal--sm" onClick={e => e.stopPropagation()}>
                <button className="mu-modal-close" onClick={() => setSelectedFossil(null)}><span className="material-icons">close</span></button>
                <div className="mu-fossil-detail">
                  <h2>{selectedFossil.name}</h2>
                  {selectedFossil.room && <p className="mu-fd-room">Museum Room {selectedFossil.room}</p>}
                  {selectedFossil.description && (
                    <div className="mu-fd-desc">
                      <h4><span className="material-icons">format_quote</span> Blathers Says</h4>
                      <p>{selectedFossil.description}</p>
                    </div>
                  )}
                  {selectedFossil.url && (
                    <a href={selectedFossil.url} target="_blank" rel="noopener noreferrer" className="mu-wiki-link">
                      <span className="material-icons">open_in_new</span> Nookipedia
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ GYROIDS TAB ═══════════ */}
      {tab === 'gyroids' && (
        <div className="mu-section">
          <div className="mu-tracker">
            <div className="mu-tracker-label">
              <span className="material-icons">emoji_events</span>
              Gyroid Catalog: {gyroidCollectedCount} / {gyroidData.length} collected
            </div>
            <div className="mu-tracker-bar">
              <div className="mu-tracker-fill mu-tracker-fill--gyroid" style={{ width: gyroidData.length ? `${(gyroidCollectedCount / gyroidData.length) * 100}%` : '0%' }} />
            </div>
          </div>

          <div className="mu-filters">
            <div className="mu-search-wrap">
              <span className="material-icons">search</span>
              <input className="mu-search" placeholder="Search gyroids..." value={gyroidSearch} onChange={e => setGyroidSearch(e.target.value)} />
              {gyroidSearch && <button className="mu-search-clear" onClick={() => setGyroidSearch('')}><span className="material-icons">close</span></button>}
            </div>
            <div className="mu-chip-row mu-chip-row--wrap">
              <span className="mu-chip-label">Sound</span>
              <button className={`mu-chip ${gyroidSoundFilter === 'all' ? 'active' : ''}`} onClick={() => setGyroidSoundFilter('all')}>All</button>
              {uniqueSounds.map(s => (
                <button key={s} className={`mu-chip ${gyroidSoundFilter === s ? 'active' : ''}`} onClick={() => setGyroidSoundFilter(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="mu-results-bar">
            <span>{filteredGyroids.length} gyroid{filteredGyroids.length !== 1 ? 's' : ''}</span>
          </div>

          {gyroidLoading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : gyroidError ? (
            <div className="empty-state">
              <span className="material-icons empty-icon">error_outline</span>
              <h2>Failed to load</h2>
              <p>{gyroidError}</p>
              <button className="clear-filters-btn" onClick={loadGyroids} type="button" style={{ cursor: 'pointer', marginTop: 12 }}>
                <span className="material-icons">refresh</span> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mu-grid mu-grid--gyroid">
                {paginate(filteredGyroids).map(g => (
                  <div key={g.name} className={`mu-card mu-card--gyroid ${gyroidCollected.has(g.name) ? 'collected' : ''}`} onClick={() => setSelectedGyroid(g)}>
                    <div className="mu-card-img-wrap">
                      <img src={g.variations?.[0]?.image_url || ''} alt={g.name} className="mu-card-img" loading="lazy" />
                      {gyroidCollected.has(g.name) && <span className="mu-badge mu-badge--donated"><span className="material-icons">check_circle</span></span>}
                    </div>
                    <div className="mu-card-body">
                      <h4 className="mu-card-title">{g.name}</h4>
                      <p className="mu-card-sub"><span className="material-icons" style={{ fontSize: 14 }}>music_note</span> {g.sound}</p>
                      <div className="mu-card-footer">
                        <span className="mu-card-price"><span className="material-icons">payments</span>{g.sell?.toLocaleString()}</span>
                        <span className="mu-gyroid-vars">{g.variation_total} var{g.variation_total !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <button className={`mu-donate-btn ${gyroidCollected.has(g.name) ? 'active' : ''}`} onClick={e => toggleGyroidCollected(g.name, e)} title={gyroidCollected.has(g.name) ? 'Mark as not collected' : 'Mark as collected'}>
                      <span className="material-icons">{gyroidCollected.has(g.name) ? 'check_circle' : 'add_circle_outline'}</span>
                    </button>
                  </div>
                ))}
              </div>
              <PaginationControls totalItems={filteredGyroids} />
            </>
          )}

          {/* Gyroid detail modal */}
          {selectedGyroid && (
            <div className="mu-modal-overlay" onClick={() => setSelectedGyroid(null)}>
              <div className="mu-modal" onClick={e => e.stopPropagation()}>
                <button className="mu-modal-close" onClick={() => setSelectedGyroid(null)}><span className="material-icons">close</span></button>
                <div className="mu-gyroid-detail">
                  <div className="mu-gd-header">
                    <img src={selectedGyroid.variations?.[0]?.image_url || ''} alt={selectedGyroid.name} className="mu-gd-hero" />
                    <div>
                      <h2>{selectedGyroid.name}</h2>
                      <p className="mu-gd-sound"><span className="material-icons">music_note</span> {selectedGyroid.sound}</p>
                    </div>
                  </div>

                  <div className="mu-art-meta-grid">
                    <div className="mu-meta-item"><span className="mu-meta-label">Sell Price</span><span>{selectedGyroid.sell?.toLocaleString()} Bells</span></div>
                    <div className="mu-meta-item"><span className="mu-meta-label">Customizable</span><span>{selectedGyroid.customizable ? 'Yes' : 'No'}</span></div>
                    {selectedGyroid.customizable && (
                      <>
                        <div className="mu-meta-item"><span className="mu-meta-label">Custom Kits</span><span>{selectedGyroid.custom_kits} {selectedGyroid.custom_kit_type}</span></div>
                        <div className="mu-meta-item"><span className="mu-meta-label">Custom Part</span><span>{selectedGyroid.custom_body_part}</span></div>
                        <div className="mu-meta-item"><span className="mu-meta-label">Cyrus Price</span><span>{selectedGyroid.cyrus_price?.toLocaleString()} Bells</span></div>
                      </>
                    )}
                    <div className="mu-meta-item"><span className="mu-meta-label">Size</span><span>{selectedGyroid.grid_width}×{selectedGyroid.grid_length}</span></div>
                    <div className="mu-meta-item"><span className="mu-meta-label">HHA Base</span><span>{selectedGyroid.hha_base}</span></div>
                    <div className="mu-meta-item"><span className="mu-meta-label">Added In</span><span>v{selectedGyroid.version_added}</span></div>
                    {selectedGyroid.availability?.length > 0 && (
                      <div className="mu-meta-item"><span className="mu-meta-label">How to Get</span><span>{selectedGyroid.availability.map(a => a.from).join(', ')}</span></div>
                    )}
                  </div>

                  {selectedGyroid.variations?.length > 0 && (
                    <div className="mu-gd-variations">
                      <h4>Variations ({selectedGyroid.variation_total})</h4>
                      <div className="mu-gd-var-grid">
                        {selectedGyroid.variations.map(v => (
                          <div key={v.variation} className="mu-gd-var-item">
                            <img src={v.image_url} alt={v.variation} />
                            <span className="mu-gd-var-name">{v.variation}</span>
                            {v.colors?.length > 0 && <span className="mu-gd-var-colors">{v.colors.join(', ')}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mu-detail-actions">
                    <button className={`mu-donate-action ${gyroidCollected.has(selectedGyroid.name) ? 'active' : ''}`} onClick={() => toggleGyroidCollected(selectedGyroid.name)}>
                      <span className="material-icons">{gyroidCollected.has(selectedGyroid.name) ? 'check_circle' : 'add_circle_outline'}</span>
                      {gyroidCollected.has(selectedGyroid.name) ? 'Collected' : 'Mark as Collected'}
                    </button>
                    <a href={selectedGyroid.url} target="_blank" rel="noopener noreferrer" className="mu-wiki-link">
                      <span className="material-icons">open_in_new</span> Nookipedia
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
