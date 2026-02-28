'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVillagers } from '../lib/api';
import { getFullGameName } from '../lib/game-mapping';
import VillagerDetails from '../components/VillagerDetails';
import CopyNotification from '../components/CopyNotification';
import ThemeToggle from '../components/ThemeToggle';
import Navigation from '../components/Navigation';
import CritterpediaPage from '../components/CritterpediaPage';
import EventsPage from '../components/EventsPage';
import MuseumPage from '../components/MuseumPage';

export default function Home() {
  const [activeTab, setActiveTab] = useState('villagers');
  const [villagers, setVillagers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState(null);
  const [selectedGame, setSelectedGame] = useState('NH');
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState(null);
  const [selectedSign, setSelectedSign] = useState(null);
  const [isRandomMode, setIsRandomMode] = useState(() => {
    // Check if random mode was active in previous session
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('randomMode') === 'true';
    }
    return false;
  });
  const [selectedVillager, setSelectedVillager] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [villagerPhotos, setVillagerPhotos] = useState({}); // Cache for nh_details.photo_url

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

  const uniqueGenders = useMemo(() => {
    return [...new Set(villagers.map(v => v.gender))].filter(Boolean).sort();
  }, [villagers]);

  const uniqueSigns = useMemo(() => {
    return [...new Set(villagers.map(v => v.sign))].filter(Boolean).sort();
  }, [villagers]);

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

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

  // Pagination calculations
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData.length, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const startItem = useMemo(() => {
    return filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  }, [filteredData.length, currentPage, itemsPerPage]);

  const endItem = useMemo(() => {
    return Math.min(currentPage * itemsPerPage, filteredData.length);
  }, [currentPage, itemsPerPage, filteredData.length]);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const total = totalPages;
    const current = currentPage;
    
    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (current <= 4) {
        // Near the start: 1 2 3 4 5 ... last
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-start');
        pages.push(total);
      } else if (current >= total - 3) {
        // Near the end: 1 ... (total-4) (total-3) (total-2) (total-1) total
        pages.push('ellipsis-start');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: 1 ... (current-1) current (current+1) ... total
        pages.push('ellipsis-start');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        pages.push(total);
      }
    }
    
    return pages;
  };

  useEffect(() => {
    filterData();
  }, [searchKeyword, selectedSpecies, selectedPersonality, selectedGame, selectedGender, selectedBirthdayMonth, selectedSign, villagers, isRandomMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedSpecies, selectedPersonality, selectedGame, selectedGender, selectedBirthdayMonth, selectedSign, isRandomMode, itemsPerPage]);

  // Random 5 villagers when random mode is enabled or on page load if random mode was active
  useEffect(() => {
    if (isRandomMode && villagers.length > 0) {
      getRandomVillagers();
    }
  }, [isRandomMode, villagers]);

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

  const getRandomVillagers = () => {
    if (villagers.length === 0) return;
    
    // Shuffle array and pick 5 random villagers
    const shuffled = [...villagers].sort(() => Math.random() - 0.5);
    const randomFive = shuffled.slice(0, 5);
    setFilteredData(randomFive);
  };

  const exitRandomMode = () => {
    setIsRandomMode(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('randomMode');
    }
  };

  const filterData = () => {
    // If random mode is active, don't apply other filters
    if (isRandomMode) {
      getRandomVillagers();
      return;
    }

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
        if (selectedGame === 'NH') {
          return v.appearances.includes('NH') || v.appearances.includes('ACNH');
        }
        return v.appearances.includes(selectedGame);
      });
    }

    // Gender filter
    if (selectedGender) {
      filtered = filtered.filter(v => v.gender === selectedGender);
    }

    // Birthday month filter
    if (selectedBirthdayMonth) {
      filtered = filtered.filter(v => v.birthday_month === selectedBirthdayMonth);
    }

    // Zodiac sign filter
    if (selectedSign) {
      filtered = filtered.filter(v => v.sign === selectedSign);
    }

    setFilteredData(filtered);
  };

  const clearFilters = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSearchKeyword('');
    setSelectedSpecies(null);
    setSelectedPersonality(null);
    setSelectedGame('NH');
    setSelectedGender(null);
    setSelectedBirthdayMonth(null);
    setSelectedSign(null);
    setIsRandomMode(false);
    // Remove from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('randomMode');
    }
  };

  const handleRandomClick = () => {
    setIsRandomMode(true);
    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('randomMode', 'true');
    }
    // Clear other filters when entering random mode
    setSearchKeyword('');
    setSelectedSpecies(null);
    setSelectedPersonality(null);
    setSelectedGame('NH');
    setSelectedGender(null);
    setSelectedBirthdayMonth(null);
    setSelectedSign(null);
  };

  const hasNonDefaultGameFilter = selectedGame && selectedGame !== 'NH';
  const hasActiveFilters = searchKeyword || selectedSpecies || selectedPersonality || hasNonDefaultGameFilter || selectedGender || selectedBirthdayMonth || selectedSign || isRandomMode;

  const showVillagerDetails = (villager) => {
    setSelectedVillager(villager);
    setShowDetails(true);
  };

  // Get image URL for villager (prefer nh_details.photo_url from cache or villager object, fallback to image_url)
  const getVillagerImageUrl = (villager) => {
    // Check cache first
    if (villagerPhotos[villager.name]) {
      return villagerPhotos[villager.name];
    }
    // Check if nh_details exists and has photo_url in villager object
    if (villager.nh_details && villager.nh_details.photo_url) {
      return villager.nh_details.photo_url;
    }
    // Fallback to image_url
    return villager.image_url;
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
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/acnh-logo.png`}
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
                placeholder={isRandomMode ? "Random mode active - clear to search" : "Search by name, species, or personality..."}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  if (e.target.value.trim() && isRandomMode) {
                    setIsRandomMode(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('randomMode');
                    }
                  }
                }}
                disabled={isRandomMode}
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
                  className={`filter-btn ${!selectedSpecies && !isRandomMode ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSpecies(null);
                    setIsRandomMode(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('randomMode');
                    }
                  }}
                  disabled={isRandomMode}
                >
                  All
                </button>
                {uniqueSpecies.map(species => (
                  <button
                    key={species}
                    className={`filter-btn ${selectedSpecies === species && !isRandomMode ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSpecies(species);
                      setIsRandomMode(false);
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('randomMode');
                      }
                    }}
                    disabled={isRandomMode}
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
                  className={`filter-btn ${!selectedPersonality && !isRandomMode ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPersonality(null);
                    setIsRandomMode(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('randomMode');
                    }
                  }}
                  disabled={isRandomMode}
                >
                  All
                </button>
                {uniquePersonalities.map(personality => (
                  <button
                    key={personality}
                    className={`filter-btn ${selectedPersonality === personality && !isRandomMode ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPersonality(personality);
                      setIsRandomMode(false);
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('randomMode');
                      }
                    }}
                    disabled={isRandomMode}
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
                    className={`filter-btn ${selectedGame === game && !isRandomMode ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedGame(game);
                      setIsRandomMode(false);
                    }}
                    title={getFullGameName(game)}
                    disabled={isRandomMode}
                  >
                    {getFullGameName(game)}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">person</span>
                Gender
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedGender && !isRandomMode ? 'active' : ''}`}
                  onClick={() => { setSelectedGender(null); exitRandomMode(); }}
                  disabled={isRandomMode}
                >All</button>
                {uniqueGenders.map(g => (
                  <button
                    key={g}
                    className={`filter-btn ${selectedGender === g && !isRandomMode ? 'active' : ''}`}
                    onClick={() => { setSelectedGender(g); exitRandomMode(); }}
                    disabled={isRandomMode}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">cake</span>
                Birthday Month
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedBirthdayMonth && !isRandomMode ? 'active' : ''}`}
                  onClick={() => { setSelectedBirthdayMonth(null); exitRandomMode(); }}
                  disabled={isRandomMode}
                >All</button>
                {MONTH_NAMES.map(m => (
                  <button
                    key={m}
                    className={`filter-btn ${selectedBirthdayMonth === m && !isRandomMode ? 'active' : ''}`}
                    onClick={() => { setSelectedBirthdayMonth(m); exitRandomMode(); }}
                    disabled={isRandomMode}
                  >{m.slice(0, 3)}</button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">auto_awesome</span>
                Zodiac Sign
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedSign && !isRandomMode ? 'active' : ''}`}
                  onClick={() => { setSelectedSign(null); exitRandomMode(); }}
                  disabled={isRandomMode}
                >All</button>
                {uniqueSigns.map(s => (
                  <button
                    key={s}
                    className={`filter-btn ${selectedSign === s && !isRandomMode ? 'active' : ''}`}
                    onClick={() => { setSelectedSign(s); exitRandomMode(); }}
                    disabled={isRandomMode}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <span className="material-icons leaf-icon">shuffle</span>
                Quick View
              </label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${isRandomMode ? 'active' : ''}`}
                  onClick={handleRandomClick}
                  title="Show 5 random villagers"
                >
                  <span className="material-icons" style={{ fontSize: '16px', marginRight: '4px' }}>shuffle</span>
                  Random 5
                </button>
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
              <button 
                className="clear-filters-btn" 
                onClick={clearFilters}
                type="button"
                style={{ cursor: 'pointer' }}
              >
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
              {isRandomMode && (
                <span className="filter-chip">
                  <span className="material-icons" style={{ fontSize: '16px', marginRight: '4px' }}>shuffle</span>
                  Random 5 Villagers
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      exitRandomMode();
                    }} 
                    aria-label="Exit random mode"
                    type="button"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedGame && selectedGame !== 'NH' && !isRandomMode && (
                <span className="filter-chip">
                  Game: {getFullGameName(selectedGame)}
                  <button onClick={() => setSelectedGame('NH')} aria-label="Reset to New Horizons">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedGender && (
                <span className="filter-chip">
                  Gender: {selectedGender}
                  <button onClick={() => setSelectedGender(null)} aria-label="Remove gender filter">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedBirthdayMonth && (
                <span className="filter-chip">
                  Birthday: {selectedBirthdayMonth}
                  <button onClick={() => setSelectedBirthdayMonth(null)} aria-label="Remove birthday filter">
                    <span className="material-icons">close</span>
                  </button>
                </span>
              )}
              {selectedSign && (
                <span className="filter-chip">
                  Sign: {selectedSign}
                  <button onClick={() => setSelectedSign(null)} aria-label="Remove sign filter">
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
                  <button 
                    className="clear-filters-btn" 
                    onClick={clearFilters}
                    type="button"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="material-icons">clear_all</span>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {!loading && filteredData.length > 0 && (
              <>
                <div className="grid-layout">
                  {paginatedData.map((villager, index) => (
                    <div
                      key={`${villager.name}-${index}-${villager.species || ''}`}
                      className="villager-card animate-card"
                      onClick={() => showVillagerDetails(villager)}
                    >
                <img
                  src={getVillagerImageUrl(villager)}
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

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                      <button
                        className="pagination-btn pagination-nav"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <span className="material-icons">chevron_left</span>
                      </button>
                      
                      <div className="pagination-numbers">
                        {getPageNumbers().map((page, index) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                              aria-label={`Go to page ${page}`}
                              aria-current={currentPage === page ? 'page' : undefined}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        className="pagination-btn pagination-nav"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <span className="material-icons">chevron_right</span>
                      </button>

                      {/* Items per page selector */}
                      <div className="items-per-page-selector">
                        <select
                          id="items-per-page"
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="items-per-page-select"
                          aria-label="Items per page"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </div>
                    </div>
                  )}
              </>
            )}
          </>
        )}

        {activeTab === 'critterpedia' && <CritterpediaPage />}

        {activeTab === 'events' && <EventsPage />}

        {activeTab === 'museum' && <MuseumPage />}

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
