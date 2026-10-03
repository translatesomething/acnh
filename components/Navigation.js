'use client';

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
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'event',
    description: 'Calendar & Special Events',
  },
  {
    id: 'museum',
    label: 'Museum',
    icon: 'museum',
    description: 'Art, Fossils & Gyroids',
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: 'inventory_2',
    description: 'Furniture & Items',
  }
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="main-navigation" aria-label="Sections">
      <div className="nav-container">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
            onClick={() => !item.comingSoon && onTabChange(item.id)}
            title={item.comingSoon ? 'Coming soon' : item.description}
            disabled={item.comingSoon}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.comingSoon && (
              <span className="coming-soon-badge">Soon</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
