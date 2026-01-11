'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVillagers, getVillagerDetails } from '../lib/api';
import { getFullGameName } from '../lib/game-mapping';
import VillagerDetails from '../components/VillagerDetails';
import CopyNotification from '../components/CopyNotification';
import ThemeToggle from '../components/ThemeToggle';
import Navigation from '../components/Navigation';

export default function Home() {
  const [activeTab, setActiveTab] = useState('villagers');
  const [villagers, setVillagers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState(null);
  const [selectedGame, setSelectedGame] = useState('NH'); // Default to New Horizons
  const [selectedVillager, setSelectedVillager] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  useEffect(() => {
    loadVillagers();
  }, []);

  // Get unique species and personalities for filters
  const uniqueSpecies = useMemo(() => {
    const species = [...new Set(villagers.map(v => v.species))].sort();
    return species;
  }, [villagers]);

  const uniquePersonalities = useMemo(() => {
    const personalities = [...new Set(villagers.map(v => v.personality))].sort();
    return personalities;
  }, [villagers]);

  const uniqueGames = useMemo(() => {
    const games = new Set();
    villagers.forEach(v => {
      if (v.appearances && Array.isArray(v.appearances)) {
        v.appearances.forEach(game => {
          // Normalize NH and ACNH to just NH
          if (game === 'ACNH') {
            games.add('NH');
          } else {
            games.add(game);
          }
        });
      }
    });
    return Array.from(games).sort((a, b) => {
      // Sort with NH first, then alphabetically
      if (a === 'NH') return -1;
      if (b === 'NH') return 1;
      return getFullGameName(a).localeCompare(getFullGameName(b));
    });
  }, [villagers]);

  useEffect(() => {
    filterData();
  }, [searchKeyword, selectedSpecies, selectedPersonality, selectedGame, villagers]);

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

  const filterData = () => {
    let filtered = [...villagers];

    // Search filter
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter((villager) =>
        villager.name.toLowerCase().includes(keyword) ||
        villager.personality.toLowerCase().includes(keyword) ||
        villager.species.toLowerCase().includes(keyword)
      );
    }

    // Species filter
    if (selectedSpecies) {
      filtered = filtered.filter(v => v.species === selectedSpecies);
    }

    // Personality filter
    if (selectedPersonality) {
      filtered = filtered.filter(v => v.personality === selectedPersonality);
    }

    // Game filter
    if (selectedGame) {
      filtered = filtered.filter(v => {
        if (!v.appearances || !Array.isArray(v.appearances)) return false;
        // Check for both 'NH' and 'ACNH' codes for New Horizons
        if (selectedGame === 'NH') {
          return v.appearances.includes('NH') || v.appearances.includes('ACNH');
        }
        return v.appearances.includes(selectedGame);
      });
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedSpecies(null);
    setSelectedPersonality(null);
    setSelectedGame('NH'); // Reset to default New Horizons
  };

  // Check if game filter is different from default (NH)
  const hasNonDefaultGameFilter = selectedGame && selectedGame !== 'NH';
  const hasActiveFilters = searchKeyword || selectedSpecies || selectedPersonality || hasNonDefaultGameFilter;

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

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container">
        {activeTab === 'villagers' && (
          <div className="search-container animate-search">
          <div className="search-form">
            <label className="search-label">
              <span className="material-icons leaf-icon">search</span>
              Search Villagers
            </label>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, species, or personality..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchKeyword('')}
                  aria-label="Clear search"
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">pets</span>
                Species
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedSpecies ? 'active' : ''}`}
                  onClick={() => setSelectedSpecies(null)}
                >
                  All
                </button>
                {uniqueSpecies.map(species => (
                  <button
                    key={species}
                    className={`filter-btn ${selectedSpecies === species ? 'active' : ''}`}
                    onClick={() => setSelectedSpecies(species)}
                  >
                    {species}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">psychology</span>
                Personality
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedPersonality ? 'active' : ''}`}
                  onClick={() => setSelectedPersonality(null)}
                >
                  All
                </button>
                {uniquePersonalities.map(personality => (
                  <button
                    key={personality}
                    className={`filter-btn ${selectedPersonality === personality ? 'active' : ''}`}
                    onClick={() => setSelectedPersonality(personality)}
                  >
                    {personality}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">videogame_asset</span>
                Game Appearance
              </label>
              <div className="filter-buttons">
                {uniqueGames.map(game => (
                  <button
                    key={game}
                    className={`filter-btn ${selectedGame === game ? 'active' : ''}`}
                    onClick={() => setSelectedGame(game)}
                    title={getFullGameName(game)}
                  >
                    {getFullGameName(game)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters & Result Count */}
          <div className="results-header">
            <div className="result-count">
              {!loading && (
                <>
                  <span className="count-number">{filteredData.length}</span>
                  <span className="count-text">
                    {filteredData.length === 1 ? 'villager' : 'villagers'} found
                  </span>
                </>
              )}
            </div>
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <span className="material-icons">clear_all</span>
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="active-filters">
              {searchKeyword && (
                <span className="filter-chip">
                  Search: "{searchKeyword}"
                  <button onClick={() => setSearchKeyword('')} aria-label="Remove search">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedSpecies && (
                <span className="filter-chip">
                  Species: {selectedSpecies}
                  <button onClick={() => setSelectedSpecies(null)} aria-label="Remove species filter">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedPersonality && (
                <span className="filter-chip">
                  Personality: {selectedPersonality}
                  <button onClick={() => setSelectedPersonality(null)} aria-label="Remove personality filter">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedGame && selectedGame !== 'NH' && (
                <span className="filter-chip">
                  Game: {getFullGameName(selectedGame)}
                  <button onClick={() => setSelectedGame('NH')} aria-label="Reset to New Horizons">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
            </div>
          )}
          </div>
        )}

        {activeTab === 'villagers' && loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {activeTab === 'villagers' && (
          <>
            {!loading && filteredData.length === 0 && (
              <div className="empty-state">
                <span className="material-icons empty-icon">search_off</span>
                <h2>No villagers found</h2>
                <p>Try adjusting your search or filters</p>
                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <span className="material-icons">clear_all</span>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {!loading && filteredData.length > 0 && (
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
          </>
        )}

        {activeTab === 'critterpedia' && (
          <div className="coming-soon-content">
            <span className="material-icons coming-soon-icon">bug_report</span>
            <h2>Critterpedia Coming Soon!</h2>
            <p>Browse fish, bugs, and sea creatures from Animal Crossing: New Horizons</p>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="coming-soon-content">
            <span className="material-icons coming-soon-icon">event</span>
            <h2>Events Calendar Coming Soon!</h2>
            <p>View special events, birthdays, and seasonal activities</p>
          </div>
        )}

        {activeTab === 'museum' && (
          <div className="coming-soon-content">
            <span className="material-icons coming-soon-icon">museum</span>
            <h2>Museum Collection Coming Soon!</h2>
            <p>Browse artwork, fossils, and gyroids</p>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="coming-soon-content">
            <span className="material-icons coming-soon-icon">inventory_2</span>
            <h2>Catalog Coming Soon!</h2>
            <p>Search furniture, clothing, and items</p>
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
