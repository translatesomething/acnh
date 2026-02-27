'use client';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TYPE_CONFIG = {
  fish: { icon: 'set_meal',   label: 'Fish',         colorClass: 'fish' },
  bugs: { icon: 'bug_report', label: 'Bug',          colorClass: 'bugs' },
  sea:  { icon: 'waves',      label: 'Sea Creature', colorClass: 'sea'  },
};

export default function CritterDetails({
  critter,
  type,
  hemisphere,
  isCaught,
  isDonated,
  onToggleCaught,
  onToggleDonated,
}) {
  if (!critter) return null;

  const config       = TYPE_CONFIG[type] || TYPE_CONFIG.fish;
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentHour  = now.getHours();

  // Check availability using the real API field names
  const isMonthAvailable = (hemiKey, month) => {
    const arr = hemiKey === 'north' ? critter.n_availability_array : critter.s_availability_array;
    return arr?.includes(String(month)) ?? false;
  };

  const isCurrentlyAvailable = (hemiKey) => {
    if (!isMonthAvailable(hemiKey, currentMonth)) return false;
    const timesByMonth = hemiKey === 'north'
      ? critter.times_by_month_north
      : critter.times_by_month_south;
    const timeStr = timesByMonth?.[String(currentMonth)];
    if (!timeStr || timeStr === 'NA') return false;
    if (timeStr === 'All day') return true;
    // Parse time range "4 PM – 9 AM"
    const m = timeStr.match(/(\d+)\s*(AM|PM)\s*[–\-]\s*(\d+)\s*(AM|PM)/i);
    if (!m) return true;
    const toH = (h, mer) => {
      h = parseInt(h);
      return mer.toUpperCase() === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    };
    const start = toH(m[1], m[2]);
    const end   = toH(m[3], m[4]);
    return start < end ? (currentHour >= start && currentHour < end)
                       : (currentHour >= start || currentHour < end);
  };

  // Availability text per hemisphere (human-readable)
  const northAvail  = critter.n_availability || 'All year';
  const southAvail  = critter.s_availability || 'All year';
  const northAvailNow = isCurrentlyAvailable('north');
  const southAvailNow = isCurrentlyAvailable('south');

  // Time per month for a given hemisphere
  const getMonthTime = (hemiKey, month) => {
    const timesByMonth = hemiKey === 'north'
      ? critter.times_by_month_north
      : critter.times_by_month_south;
    return timesByMonth?.[String(month)];
  };

  return (
    <div className="critter-details-modal">

      {/* ── Header ── */}
      <div className="critter-details-type-header">
        <span className={`critter-details-type-badge critter-details-type-badge--${config.colorClass}`}>
          <span className="material-icons">{config.icon}</span>
          {config.label} #{critter.number}
        </span>
        <div className="critter-details-avail-badges">
          {northAvailNow && (
            <span className="critter-details-avail-now">
              <span className="critter-now-dot"></span>
              North Now
            </span>
          )}
          {southAvailNow && (
            <span className="critter-details-avail-now critter-details-avail-now--south">
              <span className="critter-now-dot"></span>
              South Now
            </span>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="critter-details-hero">
        <div className="critter-details-image-wrapper">
          <img
            src={critter.render_url || critter.image_url}
            alt={critter.name}
            className="critter-details-image"
          />
        </div>

        <div className="critter-details-info">
          <h2 className="critter-details-name">{critter.name}</h2>

          {/* Tracker */}
          {(onToggleCaught || onToggleDonated) && (
            <div className="critter-details-tracker">
              <button
                className={`critter-tracker-btn ${isCaught ? 'tracker-caught' : ''}`}
                onClick={onToggleCaught}
              >
                <span className="material-icons">
                  {isCaught ? 'check_circle' : 'catching_pokemon'}
                </span>
                <span>{isCaught ? 'Caught' : 'Mark Caught'}</span>
              </button>
              <button
                className={`critter-tracker-btn ${isDonated ? 'tracker-donated' : ''}`}
                onClick={onToggleDonated}
              >
                <span className="material-icons">
                  {isDonated ? 'check_circle' : 'museum'}
                </span>
                <span>{isDonated ? 'Donated' : 'Donate to Museum'}</span>
              </button>
            </div>
          )}

          {/* Prices */}
          <div className="critter-details-prices">
            <div className="critter-price-card">
              <span className="critter-price-card-label">Nook&apos;s Cranny</span>
              <span className="critter-price-card-value">
                {Number(critter.sell_nook)?.toLocaleString() ?? '—'} <small>bells</small>
              </span>
            </div>
            {type === 'fish' && critter.sell_cj && (
              <div className="critter-price-card critter-price-card--special">
                <span className="critter-price-card-label">C.J.</span>
                <span className="critter-price-card-value">
                  {Number(critter.sell_cj).toLocaleString()} <small>bells</small>
                </span>
              </div>
            )}
            {type === 'bugs' && critter.sell_flick && (
              <div className="critter-price-card critter-price-card--special">
                <span className="critter-price-card-label">Flick</span>
                <span className="critter-price-card-value">
                  {Number(critter.sell_flick).toLocaleString()} <small>bells</small>
                </span>
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="critter-details-props">
            {critter.location && (
              <div className="critter-detail-prop">
                <span className="material-icons">place</span>
                <span className="critter-detail-prop-label">Location</span>
                <span className="critter-detail-prop-value">{critter.location}</span>
              </div>
            )}
            {critter.shadow_size && (
              <div className="critter-detail-prop">
                <span className="material-icons">opacity</span>
                <span className="critter-detail-prop-label">Shadow</span>
                <span className="critter-detail-prop-value">{critter.shadow_size}</span>
              </div>
            )}
            {critter.shadow_movement && (
              <div className="critter-detail-prop">
                <span className="material-icons">speed</span>
                <span className="critter-detail-prop-label">Movement</span>
                <span className="critter-detail-prop-value">{critter.shadow_movement}</span>
              </div>
            )}
            {critter.weather && (
              <div className="critter-detail-prop">
                <span className="material-icons">wb_cloudy</span>
                <span className="critter-detail-prop-label">Weather</span>
                <span className="critter-detail-prop-value">{critter.weather}</span>
              </div>
            )}
            {critter.rarity && (
              <div className="critter-detail-prop">
                <span className="material-icons">star</span>
                <span className="critter-detail-prop-label">Rarity</span>
                <span className="critter-detail-prop-value">{critter.rarity}</span>
              </div>
            )}
            {critter.total_catch && critter.total_catch !== '0' && (
              <div className="critter-detail-prop">
                <span className="material-icons">museum</span>
                <span className="critter-detail-prop-label">Museum</span>
                <span className="critter-detail-prop-value">
                  Catch {critter.total_catch} to complete
                </span>
              </div>
            )}
            {(critter.tank_width || critter.tank_length) && (
              <div className="critter-detail-prop">
                <span className="material-icons">water</span>
                <span className="critter-detail-prop-label">Tank size</span>
                <span className="critter-detail-prop-value">
                  {critter.tank_width} × {critter.tank_length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Catch Phrase ── */}
      {critter.catchphrase && (
        <div className="critter-catch-phrase">
          <span className="material-icons">format_quote</span>
          <p>&ldquo;{critter.catchphrase}&rdquo;</p>
        </div>
      )}

      {/* ── Monthly Availability Chart ── */}
      <div className="critter-avail-section">
        <h3 className="critter-section-title">
          <span className="material-icons">event_available</span>
          Monthly Availability
        </h3>

        {[
          { key: 'north', label: '🌍 Northern Hemisphere', availStr: northAvail },
          { key: 'south', label: '🌏 Southern Hemisphere', availStr: southAvail },
        ].map(({ key, label, availStr }) => (
          <div key={key} className="critter-hemi-avail">
            <div className="critter-hemi-header">
              <span className="critter-hemi-title">{label}</span>
              <span className="critter-hemi-time-range">
                <span className="material-icons">schedule</span>
                {critter.time || 'All day'}
              </span>
            </div>
            <div className="critter-month-chart">
              {MONTH_NAMES.map((m, idx) => {
                const month     = idx + 1;
                const available = isMonthAvailable(key, month);
                const isCurrent = month === currentMonth;
                const timeStr   = available ? getMonthTime(key, month) : null;
                return (
                  <div
                    key={m}
                    className={[
                      'critter-month-box',
                      available ? `available--${config.colorClass}` : '',
                      isCurrent ? 'current-month' : '',
                    ].join(' ')}
                    title={available
                      ? `${m}: ${timeStr && timeStr !== 'All day' ? timeStr : 'All day'}`
                      : `${m}: Not available`
                    }
                  >
                    <span className="critter-month-box-label">{m}</span>
                    {available && <span className="critter-month-box-check">✓</span>}
                  </div>
                );
              })}
            </div>
            <div className="critter-hemi-avail-str">{availStr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
