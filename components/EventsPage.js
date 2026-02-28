'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEvents } from '../lib/api';

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_ICONS = {
  'Birthday':        { icon: 'cake',          color: '#e91e63' },
  'Event':           { icon: 'celebration',   color: '#ff9800' },
  'Nook Shopping':   { icon: 'shopping_bag',  color: '#4caf50' },
  'Recipes':         { icon: 'menu_book',     color: '#2196f3' },
  'Season':          { icon: 'park',          color: '#8bc34a' },
  'Shopping season': { icon: 'storefront',    color: '#9c27b0' },
};

function pad(n) { return String(n).padStart(2, '0'); }

export default function EventsPage() {
  const [allEvents, setAllEvents]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode]         = useState('calendar'); // 'calendar' | 'list'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { date, events[] }

  const now        = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      setAllEvents(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load events. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────
  const uniqueTypes = useMemo(() => {
    const t = new Set();
    allEvents.forEach(e => { if (e.type) t.add(e.type); });
    return [...t].sort();
  }, [allEvents]);

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const todayEvents = useMemo(
    () => allEvents.filter(e => e.date === todayStr),
    [allEvents, todayStr]
  );

  // Events for the viewed month
  const monthPrefix = `${viewYear}-${pad(viewMonth + 1)}`;
  const monthEvents = useMemo(() => {
    return allEvents.filter(e => e.date?.startsWith(monthPrefix));
  }, [allEvents, monthPrefix]);

  // Filtered events (for list mode)
  const filteredEvents = useMemo(() => {
    let list = [...allEvents];
    if (selectedTypes.size > 0) {
      list = list.filter(e => selectedTypes.has(e.type));
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(e => e.event.toLowerCase().includes(kw));
    }
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [allEvents, selectedTypes, searchKeyword]);

  // Events grouped by date for calendar cells
  const eventsByDate = useMemo(() => {
    const map = {};
    monthEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [monthEvents]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [viewYear, viewMonth]);

  // ── Handlers ────────────────────────────────────────────────────
  const toggleType = (type) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setSelectedTypes(next);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };

  const typeInfo = (type) => TYPE_ICONS[type] || { icon: 'event', color: '#607d8b' };

  // ── Pagination for list ─────────────────────────────────────────
  const [listPage, setListPage] = useState(1);
  const listPerPage = 30;
  useEffect(() => setListPage(1), [selectedTypes, searchKeyword]);
  const listTotalPages = Math.ceil(filteredEvents.length / listPerPage);
  const paginatedList  = filteredEvents.slice((listPage - 1) * listPerPage, listPage * listPerPage);

  return (
    <div className="events-page">

      {/* ── Today's Events Banner ── */}
      {!loading && todayEvents.length > 0 && (
        <div className="ev-today-banner">
          <div className="ev-today-header">
            <span className="material-icons">today</span>
            <span>Today — {MONTH_NAMES[now.getMonth()]} {now.getDate()}, {now.getFullYear()}</span>
          </div>
          <div className="ev-today-list">
            {todayEvents.map((ev, i) => {
              const ti = typeInfo(ev.type);
              return (
                <div key={i} className="ev-today-item" onClick={() => setSelectedEvent(ev)}>
                  <span className="material-icons" style={{ color: ti.color }}>{ti.icon}</span>
                  <span className="ev-today-name">{ev.event}</span>
                  <span className="ev-today-type" style={{ background: ti.color }}>{ev.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View Toggle + Filters ── */}
      <div className="ev-toolbar">
        <div className="ev-view-toggle">
          <button
            className={`ev-view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <span className="material-icons">calendar_month</span>
            Calendar
          </button>
          <button
            className={`ev-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="material-icons">view_list</span>
            List
          </button>
        </div>

        <div className="ev-type-filters">
          {uniqueTypes.map(type => {
            const ti = typeInfo(type);
            const isActive = selectedTypes.has(type);
            return (
              <button
                key={type}
                className={`ev-type-chip ${isActive ? 'active' : ''}`}
                style={isActive ? { background: ti.color, borderColor: ti.color } : {}}
                onClick={() => toggleType(type)}
              >
                <span className="material-icons">{ti.icon}</span>
                {type}
              </button>
            );
          })}
        </div>

        {viewMode === 'list' && (
          <div className="ev-search-wrapper">
            <span className="material-icons">search</span>
            <input
              type="text"
              className="ev-search"
              placeholder="Search events…"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button className="ev-search-clear" onClick={() => setSearchKeyword('')}>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="loading-spinner"><div className="spinner"></div></div>
      )}
      {error && !loading && (
        <div className="empty-state">
          <span className="material-icons empty-icon">error_outline</span>
          <h2>Failed to load</h2>
          <p>{error}</p>
        </div>
      )}

      {/* ═══ Calendar View ═══ */}
      {!loading && !error && viewMode === 'calendar' && (
        <div className="ev-calendar">
          {/* Nav */}
          <div className="ev-cal-nav">
            <button className="ev-cal-nav-btn" onClick={prevMonth}>
              <span className="material-icons">chevron_left</span>
            </button>
            <h3 className="ev-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
            <button className="ev-cal-nav-btn" onClick={nextMonth}>
              <span className="material-icons">chevron_right</span>
            </button>
            <button className="ev-cal-today-btn" onClick={goToday}>Today</button>
          </div>

          {/* Day headers */}
          <div className="ev-cal-grid">
            {DAY_LABELS.map(d => (
              <div key={d} className="ev-cal-day-header">{d}</div>
            ))}

            {/* Day cells */}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} className="ev-cal-cell ev-cal-cell--blank" />;
              const dateStr = `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const filteredDayEvents = selectedTypes.size > 0
                ? dayEvents.filter(e => selectedTypes.has(e.type))
                : dayEvents;

              const openDayPopup = () => {
                if (filteredDayEvents.length > 0) {
                  setSelectedDayEvents({ date: dateStr, events: filteredDayEvents });
                }
              };

              return (
                <div
                  key={day}
                  className={`ev-cal-cell ${isToday ? 'ev-cal-cell--today' : ''} ${filteredDayEvents.length > 0 ? 'ev-cal-cell--has-events' : ''}`}
                  onClick={openDayPopup}
                >
                  <span className={`ev-cal-day-num ${isToday ? 'ev-today-num' : ''}`}>{day}</span>
                  <div className="ev-cal-events">
                    {filteredDayEvents.slice(0, 2).map((ev, i) => {
                      const ti = typeInfo(ev.type);
                      return (
                        <div
                          key={i}
                          className="ev-cal-event-dot"
                          style={{ background: ti.color }}
                          title={`${ev.event} (${ev.type})`}
                        >
                          <span className="ev-cal-event-text">{ev.event}</span>
                        </div>
                      );
                    })}
                    {filteredDayEvents.length > 2 && (
                      <span className="ev-cal-more">
                        +{filteredDayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ List View ═══ */}
      {!loading && !error && viewMode === 'list' && (
        <div className="ev-list-view">
          <div className="ev-list-count">
            <strong>{filteredEvents.length}</strong> events found
          </div>

          {paginatedList.length === 0 && (
            <div className="empty-state">
              <span className="material-icons empty-icon">event_busy</span>
              <h2>No events found</h2>
              <p>Try adjusting your search or type filters</p>
            </div>
          )}

          <div className="ev-list-items">
            {paginatedList.map((ev, i) => {
              const ti = typeInfo(ev.type);
              const d = new Date(ev.date + 'T00:00:00');
              const isToday = ev.date === todayStr;
              return (
                <div
                  key={`${ev.date}-${i}`}
                  className={`ev-list-item ${isToday ? 'ev-list-item--today' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="ev-list-date-col">
                    <span className="ev-list-month">{MONTH_SHORT[d.getMonth()]}</span>
                    <span className="ev-list-day">{d.getDate()}</span>
                    <span className="ev-list-year">{d.getFullYear()}</span>
                  </div>
                  <div className="ev-list-info">
                    <span className="ev-list-name">{ev.event}</span>
                    <span className="ev-list-type-badge" style={{ background: ti.color }}>
                      <span className="material-icons">{ti.icon}</span>
                      {ev.type}
                    </span>
                  </div>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ev-list-wiki"
                      onClick={e => e.stopPropagation()}
                      title="View on Nookipedia"
                    >
                      <span className="material-icons">open_in_new</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {listTotalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn pagination-nav"
                onClick={() => setListPage(p => Math.max(1, p - 1))}
                disabled={listPage === 1}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="ev-list-page-info">
                Page {listPage} / {listTotalPages}
              </span>
              <button
                className="pagination-btn pagination-nav"
                onClick={() => setListPage(p => Math.min(listTotalPages, p + 1))}
                disabled={listPage === listTotalPages}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Day Events Popup ═══ */}
      {selectedDayEvents && (
        <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
          <div className="modal-content ev-day-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedDayEvents(null)} aria-label="Close">
              <span className="material-icons">close</span>
            </button>

            <div className="ev-day-popup">
              <h3 className="ev-day-popup-title">
                <span className="material-icons">calendar_today</span>
                {(() => {
                  const d = new Date(selectedDayEvents.date + 'T00:00:00');
                  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                })()}
                {selectedDayEvents.date === todayStr && (
                  <span className="ev-detail-today-badge">TODAY</span>
                )}
              </h3>
              <span className="ev-day-popup-count">
                {selectedDayEvents.events.length} event{selectedDayEvents.events.length > 1 ? 's' : ''}
              </span>

              <div className="ev-day-popup-list">
                {selectedDayEvents.events.map((ev, i) => {
                  const ti = typeInfo(ev.type);
                  return (
                    <div
                      key={i}
                      className="ev-day-popup-item"
                      onClick={() => { setSelectedDayEvents(null); setSelectedEvent(ev); }}
                    >
                      <span className="material-icons" style={{ color: ti.color, fontSize: '20px' }}>{ti.icon}</span>
                      <div className="ev-day-popup-item-info">
                        <span className="ev-day-popup-item-name">{ev.event}</span>
                        <span className="ev-day-popup-item-type" style={{ background: ti.color }}>{ev.type}</span>
                      </div>
                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ev-day-popup-wiki"
                          onClick={e => e.stopPropagation()}
                          title="View on Nookipedia"
                        >
                          <span className="material-icons">open_in_new</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Event Detail Modal ═══ */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content ev-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedEvent(null)} aria-label="Close">
              <span className="material-icons">close</span>
            </button>

            <div className="ev-detail">
              <div className="ev-detail-type-badge" style={{ background: typeInfo(selectedEvent.type).color }}>
                <span className="material-icons">{typeInfo(selectedEvent.type).icon}</span>
                {selectedEvent.type}
              </div>

              <h2 className="ev-detail-name">{selectedEvent.event}</h2>

              <div className="ev-detail-date">
                <span className="material-icons">event</span>
                {(() => {
                  const d = new Date(selectedEvent.date + 'T00:00:00');
                  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                })()}
                {selectedEvent.date === todayStr && (
                  <span className="ev-detail-today-badge">TODAY</span>
                )}
              </div>

              {selectedEvent.url && (
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ev-detail-wiki-link"
                >
                  <span className="material-icons">open_in_new</span>
                  View on Nookipedia
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
