'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCritters } from '../lib/api';
import CritterDetails from './CritterDetails';

const CRITTER_TYPES = [
  { id: 'fish', label: 'Fish',          icon: 'set_meal'  },
  { id: 'bugs', label: 'Bugs',          icon: 'bug_report'},
  { id: 'sea',  label: 'Sea Creatures', icon: 'waves'     },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── localStorage helpers ─────────────────────────────────────────────────────
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

// ─── Time helpers ─────────────────────────────────────────────────────────────
// Parse "4 PM", "9 AM" → 24h number
function toH24(h, mer) {
  h = parseInt(h);
  return mer.toUpperCase() === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
}
// Check if `hour` (0-23) falls in range string like "4 PM – 9 AM" or "All day"
function isHourAvailable(hour, timeStr) {
  if (!timeStr || timeStr === 'NA') return false;
  if (timeStr === 'All day') return true;
  const m = timeStr.match(/(\d+)\s*(AM|PM)\s*[–\-]\s*(\d+)\s*(AM|PM)/i);
  if (!m) return true;
  const start = toH24(m[1], m[2]);
  const end   = toH24(m[3], m[4]);
  // Normal range (e.g. 8 AM – 5 PM = 8..17)
  if (start < end) return hour >= start && hour < end;
  // Overnight range (e.g. 4 PM – 9 AM = 16..23, 0..8)
  return hour >= start || hour < end;
}

// Check if critter is available in given hemisphere / month / optional hour
function checkAvail(critter, hemiKey, month, hour) {
  const availArr = hemiKey === 'north'
    ? critter.n_availability_array
    : critter.s_availability_array;

  // API stores months as strings ("1"-"12")
  if (!availArr?.includes(String(month))) return false;

  if (hour !== null && hour !== undefined) {
    const timesByMonth = hemiKey === 'north'
      ? critter.times_by_month_north
      : critter.times_by_month_south;
    const timeStr = timesByMonth?.[String(month)];
    return isHourAvailable(hour, timeStr);
  }
  return true;
}

export default function CritterpediaPage() {
  const [critterType, setCritterType]           = useState('fish');
  const [data, setData]                         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [hemisphere, setHemisphere]             = useState('north');
  const [selectedMonth, setSelectedMonth]       = useState(null);
  const [simulateHour, setSimulateHour]         = useState(null);
  const [searchKeyword, setSearchKeyword]       = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCritter, setSelectedCritter]   = useState(null);
  const [showDetails, setShowDetails]           = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const [itemsPerPage, setItemsPerPage]         = useState(20);

  // ── Tracker ───────────────────────────────────────────────────────────────
  const [caught, setCaught]   = useState(() => loadSet('acnh-caught-fish'));
  const [donated, setDonated] = useState(() => loadSet('acnh-donated-fish'));

  useEffect(() => {
    setCaught(loadSet(`acnh-caught-${critterType}`));
    setDonated(loadSet(`acnh-donated-${critterType}`));
  }, [critterType]);

  const toggleCaught = (e, name) => {
    e.stopPropagation();
    const next = new Set(caught);
    if (next.has(name)) next.delete(name); else next.add(name);
    setCaught(next);
    saveSet(`acnh-caught-${critterType}`, next);
  };

  const toggleDonated = (e, name) => {
    e.stopPropagation();
    const next = new Set(donated);
    if (next.has(name)) next.delete(name); else next.add(name);
    setDonated(next);
    saveSet(`acnh-donated-${critterType}`, next);
  };

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadData(critterType);
    setSearchKeyword('');
    setSelectedLocation(null);
    setSelectedMonth(null);
    setSimulateHour(null);
  }, [critterType]);

  const loadData = async (type) => {
    setLoading(true);
    setError(null);
    setData([]);
    try {
      const result = await getCritters(type);
      setData(Array.isArray(result) ? result : []);
    } catch {
      setError('Failed to load data. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // ── Current real time ─────────────────────────────────────────────────────
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentHour  = now.getHours();

  const isAvailableNow = selectedMonth === currentMonth && simulateHour === currentHour;

  const handleAvailableNow = () => {
    if (isAvailableNow) {
      setSelectedMonth(null);
      setSimulateHour(null);
    } else {
      setSelectedMonth(currentMonth);
      setSimulateHour(currentHour);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  // Location field: fish/bugs use "location", sea uses "location" too
  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    data.forEach(c => { if (c.location) locs.add(c.location); });
    return Array.from(locs).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(kw));
    }
    if (selectedLocation) {
      filtered = filtered.filter(c => c.location === selectedLocation);
    }
    if (selectedMonth !== null) {
      filtered = filtered.filter(c =>
        checkAvail(c, hemisphere, selectedMonth, simulateHour)
      );
    }
    return filtered;
  }, [data, searchKeyword, selectedLocation, selectedMonth, simulateHour, hemisphere]);

  useEffect(() => {
    setCurrentPage(1);
  }, [critterType, searchKeyword, selectedLocation, selectedMonth, simulateHour, hemisphere, itemsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredData.length / itemsPerPage),
    [filteredData.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    const total = totalPages;
    const cur   = currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur <= 4) {
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (cur >= total - 3) {
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push('...');
        for (let i = cur - 1; i <= cur + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  const hasFilters = !!(searchKeyword || selectedLocation || selectedMonth !== null);
  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedLocation(null);
    setSelectedMonth(null);
    setSimulateHour(null);
  };

  const typeInfo = CRITTER_TYPES.find(t => t.id === critterType);
  const caughtPct  = data.length ? Math.round((caught.size  / data.length) * 100) : 0;
  const donatedPct = data.length ? Math.round((donated.size / data.length) * 100) : 0;

  return (
    <div className="critterpedia-page">

      {/* ── Type Sub-tabs ── */}
      <div className="critter-type-tabs">
        {CRITTER_TYPES.map(t => (
          <button
            key={t.id}
            className={`critter-type-tab critter-type-tab--${t.id} ${critterType === t.id ? 'active' : ''}`}
            onClick={() => setCritterType(t.id)}
          >
            <span className="material-icons">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Filter Panel ── */}
      <div className="critter-filter-panel animate-search">

        {/* Search */}
        <div className="critter-search-wrapper">
          <span className="material-icons critter-search-icon">search</span>
          <input
            type="text"
            className="critter-search"
            placeholder={`Search ${typeInfo?.label.toLowerCase()}…`}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button className="critter-search-clear" onClick={() => setSearchKeyword('')}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>

        <div className="critter-filter-row">
          {/* Hemisphere */}
          <div className="critter-filter-group">
            <span className="critter-filter-label">
              <span className="material-icons">public</span>
              Hemisphere
            </span>
            <div className="critter-hemi-btns">
              <button
                className={`critter-hemi-btn ${hemisphere === 'north' ? 'active' : ''}`}
                onClick={() => setHemisphere('north')}
              >🌍 North</button>
              <button
                className={`critter-hemi-btn ${hemisphere === 'south' ? 'active' : ''}`}
                onClick={() => setHemisphere('south')}
              >🌏 South</button>
            </div>
          </div>

          {/* Available Now */}
          <div className="critter-filter-group">
            <span className="critter-filter-label">
              <span className="material-icons">bolt</span>
              Quick
            </span>
            <button
              className={`critter-avail-now-btn ${isAvailableNow ? 'active' : ''}`}
              onClick={handleAvailableNow}
            >
              <span className="material-icons">today</span>
              Available Now
              {isAvailableNow && (
                <span className="critter-avail-now-time">
                  ({MONTH_NAMES[currentMonth - 1]}, {currentHour}:00)
                </span>
              )}
            </button>
          </div>

          {/* Month chips */}
          <div className="critter-filter-group critter-filter-group--month">
            <span className="critter-filter-label">
              <span className="material-icons">calendar_month</span>
              Month
            </span>
            <div className="critter-month-chips">
              {MONTH_NAMES.map((m, idx) => {
                const monthNum = idx + 1;
                const isCurrentReal = monthNum === currentMonth;
                return (
                  <button
                    key={m}
                    className={[
                      'critter-month-chip',
                      selectedMonth === monthNum ? 'active' : '',
                      isCurrentReal && !selectedMonth ? 'today-hint' : '',
                    ].join(' ')}
                    onClick={() => {
                      const next = selectedMonth === monthNum ? null : monthNum;
                      setSelectedMonth(next);
                      if (!next) setSimulateHour(null);
                    }}
                    title={isCurrentReal ? `${m} (current month)` : m}
                  >
                    {m}
                    {isCurrentReal && <span className="critter-month-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Travel: hour slider (shows when month is selected) */}
        {selectedMonth !== null && (
          <div className="critter-filter-group">
            <span className="critter-filter-label">
              <span className="material-icons">schedule</span>
              Simulate Hour
              <span className="critter-timetag">⏰ Time Travel</span>
            </span>
            <div className="critter-time-travel-row">
              <button
                className={`critter-allday-btn ${simulateHour === null ? 'active' : ''}`}
                onClick={() => setSimulateHour(null)}
              >
                All Day
              </button>
              <input
                type="range"
                min={0}
                max={23}
                value={simulateHour !== null ? simulateHour : 12}
                onChange={e => setSimulateHour(Number(e.target.value))}
                className="critter-hour-range"
              />
              <span
                className={`critter-hour-display ${simulateHour !== null ? 'active' : ''}`}
                onClick={() => setSimulateHour(simulateHour !== null ? null : 12)}
                title="Click to activate / deactivate"
              >
                {simulateHour !== null
                  ? `${String(simulateHour).padStart(2, '0')}:00`
                  : '— : —'
                }
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        {uniqueLocations.length > 0 && (
          <div className="critter-filter-group">
            <span className="critter-filter-label">
              <span className="material-icons">place</span>
              Location
            </span>
            <div className="critter-location-chips">
              <button
                className={`critter-location-chip ${!selectedLocation ? 'active' : ''}`}
                onClick={() => setSelectedLocation(null)}
              >All</button>
              {uniqueLocations.map(loc => (
                <button
                  key={loc}
                  className={`critter-location-chip ${selectedLocation === loc ? 'active' : ''}`}
                  onClick={() => setSelectedLocation(selectedLocation === loc ? null : loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tracker Progress Bar ── */}
      {!loading && data.length > 0 && (
        <div className="critter-tracker-bar">
          <div className="critter-tracker-item">
            <span className="critter-tracker-label">
              <span className="material-icons">catching_pokemon</span>
              Caught <strong>{caught.size}</strong>/{data.length}
            </span>
            <div className="critter-tracker-track">
              <div
                className={`critter-tracker-fill critter-tracker-fill--${critterType}`}
                style={{ width: `${caughtPct}%` }}
              />
            </div>
            <span className="critter-tracker-pct">{caughtPct}%</span>
          </div>
          <div className="critter-tracker-item">
            <span className="critter-tracker-label">
              <span className="material-icons">museum</span>
              Donated <strong>{donated.size}</strong>/{data.length}
            </span>
            <div className="critter-tracker-track">
              <div
                className="critter-tracker-fill critter-tracker-fill--donated"
                style={{ width: `${donatedPct}%` }}
              />
            </div>
            <span className="critter-tracker-pct">{donatedPct}%</span>
          </div>
        </div>
      )}

      {/* ── Results Bar ── */}
      <div className="critter-results-bar">
        <span className="critter-result-count">
          {loading
            ? 'Loading…'
            : <><strong>{filteredData.length}</strong> {typeInfo?.label.toLowerCase()} found</>
          }
        </span>
        {hasFilters && !loading && (
          <button className="critter-clear-filters-btn" onClick={clearFilters}>
            <span className="material-icons">clear_all</span>
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-spinner"><div className="spinner"></div></div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="empty-state">
          <span className="material-icons empty-icon">error_outline</span>
          <h2>Failed to load</h2>
          <p>{error}</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="empty-state">
          <span className="material-icons empty-icon">search_off</span>
          <h2>No critters found</h2>
          <p>Try adjusting your search or filters</p>
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters} type="button">
              <span className="material-icons">clear_all</span>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && !error && paginatedData.length > 0 && (
        <div className={`critter-grid critter-grid--${critterType}`}>
          {paginatedData.map(critter => {
            const isNow     = checkAvail(critter, hemisphere, currentMonth, currentHour);
            const isCaught  = caught.has(critter.name);
            const isDonated = donated.has(critter.name);

            // Availability text for the selected hemisphere
            const availMonths = hemisphere === 'north' ? critter.n_availability : critter.s_availability;
            const availTime   = critter.time;

            const priceLabel =
              critterType === 'fish' && critter.sell_cj
                ? `CJ: ${Number(critter.sell_cj).toLocaleString()}`
              : critterType === 'bugs' && critter.sell_flick
                ? `Flick: ${Number(critter.sell_flick).toLocaleString()}`
              : null;

            return (
              <div
                key={critter.name}
                className={[
                  'critter-card',
                  `critter-card--${critterType}`,
                  isCaught  ? 'critter-card--caught'  : '',
                  isDonated ? 'critter-card--donated' : '',
                ].join(' ')}
                onClick={() => { setSelectedCritter(critter); setShowDetails(true); }}
              >
                {/* Badges */}
                <div className="critter-card-badge-row">
                  <span className="critter-card-number">#{critter.number}</span>
                  {isNow && <span className="critter-now-pill">Now</span>}
                </div>

                {/* Image */}
                <img
                  src={critter.render_url || critter.image_url}
                  alt={critter.name}
                  className="critter-card-img"
                  loading="lazy"
                />

                {/* Info */}
                <div className="critter-card-info">
                  <h3 className="critter-card-name">{critter.name}</h3>

                  <div className="critter-card-tags">
                    {critter.location && (
                      <span className="critter-card-tag">
                        <span className="material-icons">place</span>
                        {critter.location}
                      </span>
                    )}
                    {critter.shadow_size && (
                      <span className="critter-card-tag">
                        <span className="material-icons">opacity</span>
                        {critter.shadow_size}
                      </span>
                    )}
                    {critter.shadow_movement && critter.shadow_movement !== critter.shadow_size && (
                      <span className="critter-card-tag">
                        <span className="material-icons">speed</span>
                        {critter.shadow_movement}
                      </span>
                    )}
                    {critter.rarity && (
                      <span className="critter-card-tag">
                        <span className="material-icons">star</span>
                        {critter.rarity}
                      </span>
                    )}
                  </div>

                  <div className="critter-price-row">
                    <span className="critter-price-nook">
                      <span className="material-icons">storefront</span>
                      {Number(critter.sell_nook).toLocaleString()}
                    </span>
                    {priceLabel && (
                      <span className="critter-price-special">{priceLabel}</span>
                    )}
                  </div>

                  {availMonths && (
                    <div className="critter-avail-summary">
                      <span>{availMonths}</span>
                      {availTime && availTime !== 'All day' && (
                        <span> · {availTime}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tracker buttons */}
                <div className="critter-card-tracker" onClick={e => e.stopPropagation()}>
                  <button
                    className={`critter-tracker-btn ${isCaught ? 'tracker-caught' : ''}`}
                    onClick={e => toggleCaught(e, critter.name)}
                    title={isCaught ? 'Caught ✓ (click to undo)' : 'Mark as caught'}
                  >
                    <span className="material-icons">
                      {isCaught ? 'check_circle' : 'catching_pokemon'}
                    </span>
                    <span>{isCaught ? 'Caught' : 'Catch'}</span>
                  </button>
                  <button
                    className={`critter-tracker-btn ${isDonated ? 'tracker-donated' : ''}`}
                    onClick={e => toggleDonated(e, critter.name)}
                    title={isDonated ? 'Donated ✓ (click to undo)' : 'Donate to museum'}
                  >
                    <span className="material-icons">
                      {isDonated ? 'check_circle' : 'museum'}
                    </span>
                    <span>{isDonated ? 'Donated' : 'Donate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && !loading && (
        <div className="pagination-controls">
          <button
            className="pagination-btn pagination-nav"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <span className="material-icons">chevron_left</span>
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((page, idx) =>
              typeof page === 'number' ? (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span key={`e${idx}`} className="pagination-ellipsis">…</span>
              )
            )}
          </div>

          <button
            className="pagination-btn pagination-nav"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <span className="material-icons">chevron_right</span>
          </button>

          <div className="items-per-page-selector">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="items-per-page-select"
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Details Modal ── */}
      {showDetails && selectedCritter && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowDetails(false)} aria-label="Close">
              <span className="material-icons">close</span>
            </button>
            <CritterDetails
              critter={selectedCritter}
              type={critterType}
              hemisphere={hemisphere}
              isCaught={caught.has(selectedCritter.name)}
              isDonated={donated.has(selectedCritter.name)}
              onToggleCaught={e => toggleCaught(e, selectedCritter.name)}
              onToggleDonated={e => toggleDonated(e, selectedCritter.name)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
