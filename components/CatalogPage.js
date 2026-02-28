'use client';

import { useState } from 'react';
import CatalogFurniture from './CatalogFurniture';
import CatalogClothing from './CatalogClothing';
import CatalogInterior from './CatalogInterior';
import CatalogTools from './CatalogTools';
import CatalogItems from './CatalogItems';
import CatalogRecipes from './CatalogRecipes';
import CatalogPhotos from './CatalogPhotos';

const TABS = [
  { id: 'furniture', label: 'Furniture', icon: 'weekend' },
  { id: 'clothing', label: 'Clothing', icon: 'checkroom' },
  { id: 'interior', label: 'Interior', icon: 'home' },
  { id: 'tools', label: 'Tools', icon: 'handyman' },
  { id: 'items', label: 'Items', icon: 'inventory_2' },
  { id: 'recipes', label: 'Recipes', icon: 'menu_book' },
  { id: 'photos', label: 'Photos', icon: 'photo_library' },
];

const COMPONENTS = {
  furniture: CatalogFurniture,
  clothing: CatalogClothing,
  interior: CatalogInterior,
  tools: CatalogTools,
  items: CatalogItems,
  recipes: CatalogRecipes,
  photos: CatalogPhotos,
};

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('furniture');
  const ActiveComponent = COMPONENTS[activeTab];

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
      <ActiveComponent />
    </div>
  );
}
