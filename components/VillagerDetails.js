'use client';

import { getFullGameName } from '../lib/game-mapping';
import { useState } from 'react';

export default function VillagerDetails({ villager, onClose }) {
  const [copyNotification, setCopyNotification] = useState(false);

  const copyGameName = (event, gameName) => {
    event.stopPropagation();
    navigator.clipboard.writeText(gameName).then(() => {
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 1500);
    });
  };

  const getRemainingGames = (appearances) => {
    return appearances.slice(3)
      .map(game => getFullGameName(game))
      .join('\n');
  };

  if (!villager) return null;

  return (
    <>
      <div className="villager-details">
        <h2>{villager.name}</h2>
        <img 
          src={villager.image_url} 
          alt={villager.name} 
          className="villager-full-image"
        />
        <div className="details-grid">
          <div className="detail-item">
            <span className="material-icons">cake</span>
            <span>Birthday: {villager.birthday_month} {villager.birthday_day}</span>
          </div>
          <div className="detail-item">
            <span className="material-icons">favorite</span>
            <span>Personality: {villager.personality}</span>
          </div>
          <div className="detail-item">
            <span className="material-icons">pets</span>
            <span>Species: {villager.species}</span>
          </div>
          <div className="detail-item">
            <span className="material-icons">person</span>
            <span>Gender: {villager.gender}</span>
          </div>
          <div className="detail-item">
            <span className="material-icons">home</span>
            <span>House Interior: {villager.house_interior_url ? 'Available' : 'Not Available'}</span>
          </div>
        </div>
        <div className="villager-phrases">
          <h3>Catchphrase</h3>
          <p>"{villager.phrase}"</p>
          <h3>Coffee Preferences</h3>
          <p>{villager.coffee_preference || 'Unknown'}</p>
        </div>
        <div className="game-appearances">
          <h3>Game Appearances</h3>
          <div className="game-chips">
            {villager.appearances.map((game, index) => (
              <div
                key={`${villager.name}-${game}-${index}`}
                className="game-chip"
                title={getFullGameName(game)}
                onDoubleClick={(e) => copyGameName(e, getFullGameName(game))}
              >
                <span className="game-name">{getFullGameName(game)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .villager-details {
          padding: 20px;
          max-width: 600px;
        }
        .villager-full-image {
          width: 100%;
          max-width: 300px;
          margin: 20px auto;
          display: block;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .villager-phrases {
          margin: 20px 0;
          padding: 15px;
          background: var(--bg-tertiary, rgba(130, 207, 156, 0.1));
          border-radius: 10px;
          color: var(--text-primary, #513f34);
        }
        .game-appearances {
          margin-top: 20px;
        }
        .game-appearances h3 {
          margin-bottom: 10px;
        }
        .game-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .game-chip {
          background-color: var(--acnh-green, #82cf9c);
          color: white;
          padding: 8px 16px;
          border-radius: 16px;
          font-size: 0.9em;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
        }
        .game-chip:hover {
          background-color: var(--acnh-brown, #6ba481);
          transform: translateY(-2px);
        }
        .game-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .material-icons {
          font-size: 20px;
        }
      `}</style>
    </>
  );
}
