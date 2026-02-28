'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const TABS = [
  { id: 'furniture', label: 'Furniture', icon: 'weekend' },
  { id: 'clothing', label: 'Clothing', icon: 'checkroom' },
  { id: 'interior', label: 'Interior', icon: 'home' },
  { id: 'tools', label: 'Tools', icon: 'handyman' },
  { id: 'items', label: 'Items', icon: 'inventory_2' },
  { id: 'recipes', label: 'Recipes', icon: 'menu_book' },
  { id: 'photos', label: 'Photos', icon: 'photo_library' },
];

// Lazy load each catalog section so only the active tab's code loads first
function TabLoading() {
  return (
    <div className="loading-spinner" style={{ minHeight: 200 }}>
      <div className="spinner"></div>
      <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );
}

const COMPONENTS = {
  furniture: dynamic(() => import('./CatalogFurniture'), { loading: TabLoading, ssr: false }),
  clothing: dynamic(() => import('./CatalogClothing'), { loading: TabLoading, ssr: false }),
  interior: dynamic(() => import('./CatalogInterior'), { loading: TabLoading, ssr: false }),
  tools: dynamic(() => import('./CatalogTools'), { loading: TabLoading, ssr: false }),
  items: dynamic(() => import('./CatalogItems'), { loading: TabLoading, ssr: false }),
  recipes: dynamic(() => import('./CatalogRecipes'), { loading: TabLoading, ssr: false }),
  photos: dynamic(() => import('./CatalogPhotos'), { loading: TabLoading, ssr: false }),
};

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('furniture');

  // Only mount the active tab so we don't keep 7 chunks + 7 component trees in memory.
  // When switching back, chunk loads from browser cache; data from API/localStorage cache.
  const Component = COMPONENTS[activeTab];

  return (
    <div className="ct-page">
      <div className="ct-main-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ct-main-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-icons" style={{ fontSize: 20 }}>{tab.icon}</span>
            <span className="ct-main-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="ct-tab-panel">
        <Component />
      </div>
    </div>
  );
}
