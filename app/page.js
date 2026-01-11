'use client';

import { useState, useEffect } from 'react';
import { getVillagers, getVillagerDetails } from '../lib/api';
import { getFullGameName } from '../lib/game-mapping';
import VillagerDetails from '../components/VillagerDetails';
import CopyNotification from '../components/CopyNotification';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  const [villagers, setVillagers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVillager, setSelectedVillager] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  useEffect(() => {
    loadVillagers();
  }, []);

  useEffect(() => {
    searchData(searchKeyword);
  }, [searchKeyword, villagers]);

  const loadVillagers = async () => {
    try {
      setLoading(true);
      const data = await getVillagers();
      setVillagers(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error loading villagers:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchData = (keyword) => {
    if (!keyword.trim()) {
      setFilteredData(villagers);
      return;
    }

    const filtered = villagers.filter((villager) =>
      villager.name.toLowerCase().includes(keyword.toLowerCase()) ||
      villager.personality.toLowerCase().includes(keyword.toLowerCase()) ||
      villager.species.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const showVillagerDetails = async (villager) => {
    try {
      const details = await getVillagerDetails(villager.name);
      setSelectedVillager(details);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading villager details:', error);
    }
  };

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

  return (
    <>
      <ThemeToggle />
      <div className="acnh-header">
        <img 
          src="/acnh-logo.png" 
          alt="Animal Crossing: New Horizons Logo" 
          className="acnh-logo floating"
        />
      </div>

      <div className="container">
        <div className="search-container animate-search">
          <div className="search-form">
            <label className="search-label">
              <span className="material-icons leaf-icon">search</span>
              Search Villagers
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="Enter villager name..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {!loading && (
          <div className="grid-layout">
            {filteredData.map((villager, index) => (
              <div
                key={`${villager.name}-${index}-${villager.species || ''}`}
                className="villager-card animate-card"
                onClick={() => showVillagerDetails(villager)}
              >
                <img
                  src={villager.image_url}
                  alt={villager.name}
                  className="villager-image"
                />
                <div className="villager-info">
                  <h3>{villager.name}</h3>
                  <p>
                    <span className="material-icons leaf-icon">pets</span>
                    {villager.species}
                  </p>
                  <p>
                    <span className="material-icons leaf-icon">cake</span>
                    {villager.birthday_month} {villager.birthday_day}
                  </p>
                  <p>
                    <span className="material-icons leaf-icon">psychology</span>
                    {villager.personality}
                  </p>
                  <p className="villager-quote">"{villager.phrase}"</p>
                </div>
                <div className="game-appearances">
                  <div className="game-chips">
                    {villager.appearances.slice(0, 3).map((game, idx) => (
                      <div
                        key={`${villager.name}-game-${idx}-${game}`}
                        className="game-chip"
                        title={getFullGameName(game)}
                        onDoubleClick={(e) => copyGameName(e, getFullGameName(game))}
                      >
                        <span className="game-name">{getFullGameName(game)}</span>
                      </div>
                    ))}
                    {villager.appearances.length > 3 && (
                      <div
                        className="game-chip"
                        title={getRemainingGames(villager.appearances)}
                      >
                        +{villager.appearances.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDetails && selectedVillager && (
          <div className="modal-overlay" onClick={() => setShowDetails(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="close-button" 
                onClick={() => setShowDetails(false)}
                aria-label="Close"
              >
                <span className="material-icons">close</span>
              </button>
              <VillagerDetails villager={selectedVillager} onClose={() => setShowDetails(false)} />
            </div>
          </div>
        )}

        <CopyNotification show={copyNotification} onClose={() => setCopyNotification(false)} />
      </div>
    </>
  );
}
