'use client';

import { getFullGameName } from '../lib/game-mapping';
import { useState } from 'react';

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: 'info'  },
  { id: 'nh',        label: 'NH Details',  icon: 'auto_awesome' },
  { id: 'house',     label: 'House',       icon: 'home'  },
];

export default function VillagerDetails({ villager, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copyNotification, setCopyNotification] = useState(false);

  if (!villager) return null;

  const nh = villager.nh_details;
  const hasNH = !!nh;

  const copyGameName = (event, gameName) => {
    event.stopPropagation();
    navigator.clipboard.writeText(gameName).then(() => {
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 1500);
    });
  };

  return (
    <div className="vd">
      {/* Hero */}
      <div className="vd-hero">
        <img
          src={nh?.photo_url || villager.image_url}
          alt={villager.name}
          className="vd-hero-img"
        />
        <div className="vd-hero-info">
          <h2 className="vd-name">{villager.name}</h2>
          <span className="vd-species-badge">
            <span className="material-icons">pets</span>
            {villager.species}
          </span>
          {villager.quote && (
            <p className="vd-quote">&ldquo;{villager.quote}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="vd-tabs">
        {TABS.map(tab => {
          if (tab.id === 'nh' && !hasNH) return null;
          if (tab.id === 'house' && (!nh?.house_interior_url && !nh?.house_exterior_url)) return null;
          return (
            <button
              key={tab.id}
              className={`vd-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-icons">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="vd-section">
          <div className="vd-props-grid">
            <div className="vd-prop">
              <span className="material-icons">cake</span>
              <div>
                <span className="vd-prop-label">Birthday</span>
                <span className="vd-prop-value">{villager.birthday_month} {villager.birthday_day}</span>
              </div>
            </div>
            <div className="vd-prop">
              <span className="material-icons">favorite</span>
              <div>
                <span className="vd-prop-label">Personality</span>
                <span className="vd-prop-value">{villager.personality}</span>
              </div>
            </div>
            <div className="vd-prop">
              <span className="material-icons">person</span>
              <div>
                <span className="vd-prop-label">Gender</span>
                <span className="vd-prop-value">{villager.gender}</span>
              </div>
            </div>
            {villager.sign && (
              <div className="vd-prop">
                <span className="material-icons">auto_awesome</span>
                <div>
                  <span className="vd-prop-label">Zodiac</span>
                  <span className="vd-prop-value">{villager.sign}</span>
                </div>
              </div>
            )}
            <div className="vd-prop">
              <span className="material-icons">chat_bubble</span>
              <div>
                <span className="vd-prop-label">Catchphrase</span>
                <span className="vd-prop-value">&ldquo;{villager.phrase}&rdquo;</span>
              </div>
            </div>
            {villager.clothing && (
              <div className="vd-prop">
                <span className="material-icons">checkroom</span>
                <div>
                  <span className="vd-prop-label">Default Clothing</span>
                  <span className="vd-prop-value">{villager.clothing}</span>
                </div>
              </div>
            )}
            {villager.debut && (
              <div className="vd-prop">
                <span className="material-icons">videogame_asset</span>
                <div>
                  <span className="vd-prop-label">Debut</span>
                  <span className="vd-prop-value">{getFullGameName(villager.debut)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Game Appearances */}
          {villager.appearances?.length > 0 && (
            <div className="vd-games-section">
              <h4 className="vd-section-title">
                <span className="material-icons">sports_esports</span>
                Game Appearances ({villager.appearances.length})
              </h4>
              <div className="vd-game-chips">
                {villager.appearances.map((game, idx) => (
                  <span
                    key={`${game}-${idx}`}
                    className="vd-game-chip"
                    title={`Double click to copy`}
                    onDoubleClick={e => copyGameName(e, getFullGameName(game))}
                  >
                    {getFullGameName(game)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Previous phrases */}
          {villager.prev_phrases?.length > 0 && (
            <div className="vd-prev-phrases">
              <h4 className="vd-section-title">
                <span className="material-icons">history</span>
                Previous Catchphrases
              </h4>
              <div className="vd-phrase-chips">
                {villager.prev_phrases.map((p, i) => (
                  <span key={i} className="vd-phrase-chip">&ldquo;{p}&rdquo;</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NH Details Tab */}
      {activeTab === 'nh' && hasNH && (
        <div className="vd-section">
          <div className="vd-nh-images">
            {nh.icon_url && (
              <img src={nh.icon_url} alt="Icon" className="vd-nh-icon" title="Villager Icon" />
            )}
            {nh.photo_url && (
              <img src={nh.photo_url} alt="Photo" className="vd-nh-photo" title="Villager Photo" />
            )}
          </div>

          <div className="vd-props-grid">
            {nh.catchphrase && (
              <div className="vd-prop">
                <span className="material-icons">chat</span>
                <div>
                  <span className="vd-prop-label">NH Catchphrase</span>
                  <span className="vd-prop-value">&ldquo;{nh.catchphrase}&rdquo;</span>
                </div>
              </div>
            )}
            {nh['sub-personality'] && (
              <div className="vd-prop">
                <span className="material-icons">psychology</span>
                <div>
                  <span className="vd-prop-label">Sub-personality</span>
                  <span className="vd-prop-value">Type {nh['sub-personality']}</span>
                </div>
              </div>
            )}
            {nh.hobby && (
              <div className="vd-prop">
                <span className="material-icons">palette</span>
                <div>
                  <span className="vd-prop-label">Hobby</span>
                  <span className="vd-prop-value">{nh.hobby}</span>
                </div>
              </div>
            )}
            {nh.clothing && (
              <div className="vd-prop">
                <span className="material-icons">checkroom</span>
                <div>
                  <span className="vd-prop-label">NH Clothing</span>
                  <span className="vd-prop-value">
                    {nh.clothing}{nh.clothing_variation ? ` (${nh.clothing_variation})` : ''}
                  </span>
                </div>
              </div>
            )}
            {nh.umbrella && (
              <div className="vd-prop">
                <span className="material-icons">umbrella</span>
                <div>
                  <span className="vd-prop-label">Umbrella</span>
                  <span className="vd-prop-value">{nh.umbrella}</span>
                </div>
              </div>
            )}
          </div>

          {/* Favorite Styles & Colors */}
          {(nh.fav_styles?.length > 0 || nh.fav_colors?.length > 0) && (
            <div className="vd-fav-section">
              {nh.fav_styles?.length > 0 && (
                <div className="vd-fav-group">
                  <h4 className="vd-section-title">
                    <span className="material-icons">style</span>
                    Favorite Styles
                  </h4>
                  <div className="vd-fav-chips">
                    {nh.fav_styles.map(s => (
                      <span key={s} className="vd-fav-chip vd-fav-chip--style">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {nh.fav_colors?.length > 0 && (
                <div className="vd-fav-group">
                  <h4 className="vd-section-title">
                    <span className="material-icons">palette</span>
                    Favorite Colors
                  </h4>
                  <div className="vd-fav-chips">
                    {nh.fav_colors.map(c => (
                      <span key={c} className="vd-fav-chip vd-fav-chip--color">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NH Quote */}
          {nh.quote && nh.quote !== villager.quote && (
            <div className="vd-nh-quote">
              <span className="material-icons">format_quote</span>
              <p>&ldquo;{nh.quote}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* House Tab */}
      {activeTab === 'house' && hasNH && (
        <div className="vd-section">
          <div className="vd-house-images">
            {nh.house_exterior_url && (
              <div className="vd-house-img-wrap">
                <h4 className="vd-section-title">
                  <span className="material-icons">holiday_village</span>
                  Exterior
                </h4>
                <img src={nh.house_exterior_url} alt="House Exterior" className="vd-house-img" />
              </div>
            )}
            {nh.house_interior_url && (
              <div className="vd-house-img-wrap">
                <h4 className="vd-section-title">
                  <span className="material-icons">weekend</span>
                  Interior
                </h4>
                <img src={nh.house_interior_url} alt="House Interior" className="vd-house-img" />
              </div>
            )}
          </div>

          <div className="vd-props-grid">
            {nh.house_wallpaper && (
              <div className="vd-prop">
                <span className="material-icons">wallpaper</span>
                <div>
                  <span className="vd-prop-label">Wallpaper</span>
                  <span className="vd-prop-value">{nh.house_wallpaper}</span>
                </div>
              </div>
            )}
            {nh.house_flooring && (
              <div className="vd-prop">
                <span className="material-icons">grid_on</span>
                <div>
                  <span className="vd-prop-label">Flooring</span>
                  <span className="vd-prop-value">{nh.house_flooring}</span>
                </div>
              </div>
            )}
            {nh.house_music && (
              <div className="vd-prop">
                <span className="material-icons">music_note</span>
                <div>
                  <span className="vd-prop-label">Music</span>
                  <span className="vd-prop-value">{nh.house_music}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy notification */}
      {copyNotification && (
        <div className="vd-copy-toast">Game name copied!</div>
      )}
    </div>
  );
}
