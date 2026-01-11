'use client';

import { useTheme } from '../lib/theme';

const navigationItems = [
  {
    id: 'villagers',
    label: 'Villagers',
    icon: 'people',
    description: 'Search and browse villagers'
  },
  {
    id: 'critterpedia',
    label: 'Critterpedia',
    icon: 'bug_report',
    description: 'Fish, Bugs & Sea Creatures',
    comingSoon: true
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'event',
    description: 'Calendar & Special Events',
    comingSoon: true
  },
  {
    id: 'museum',
    label: 'Museum',
    icon: 'museum',
    description: 'Art, Fossils & Gyroids',
    comingSoon: true
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: 'inventory_2',
    description: 'Furniture & Items',
    comingSoon: true
  }
];

export default function Navigation({ activeTab, onTabChange }) {
  const { theme } = useTheme();

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
            onClick={() => !item.comingSoon && onTabChange(item.id)}
            title={item.comingSoon ? 'Coming soon' : item.description}
            disabled={item.comingSoon}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.comingSoon && (
              <span className="coming-soon-badge">Soon</span>
            )}
          </button>
        ))}
      </div>
      <style jsx>{`
        .main-navigation {
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--border-color);
          box-shadow: 0 2px 8px var(--acnh-shadow);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 4px;
          padding: 12px 20px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .nav-container::-webkit-scrollbar {
          display: none;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 20px;
          background: transparent;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all var(--transition-speed) ease;
          font-family: inherit;
          color: var(--text-secondary);
          position: relative;
          min-width: 100px;
          flex-shrink: 0;
        }

        .nav-item:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          transform: translateY(-2px);
        }

        .nav-item.active {
          background: var(--acnh-green);
          color: white;
          border-color: var(--acnh-green);
          box-shadow: 0 4px 12px rgba(130, 207, 156, 0.3);
        }

        .nav-item.active:hover {
          background: var(--acnh-brown);
          border-color: var(--acnh-brown);
          transform: translateY(-2px) scale(1.05);
        }

        .nav-item:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .nav-item.coming-soon {
          opacity: 0.7;
        }

        .nav-icon {
          font-size: 24px;
          transition: transform var(--transition-speed) ease;
        }

        .nav-item:hover:not(:disabled) .nav-icon {
          transform: scale(1.1);
        }

        .nav-item.active .nav-icon {
          transform: scale(1.15);
        }

        .nav-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        .coming-soon-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--acnh-brown);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 8px 12px;
            gap: 2px;
          }

          .nav-item {
            padding: 10px 12px;
            min-width: 80px;
          }

          .nav-icon {
            font-size: 20px;
          }

          .nav-label {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .nav-item {
            padding: 8px 10px;
            min-width: 70px;
          }

          .nav-label {
            font-size: 10px;
          }

          .coming-soon-badge {
            font-size: 8px;
            padding: 1px 4px;
          }
        }
      `}</style>
    </nav>
  );
}
