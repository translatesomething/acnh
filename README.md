# Animal Crossing: New Horizons Explorer

A web application for exploring Animal Crossing: New Horizons data — villagers, critters, events, museum collections, and full catalog (furniture, clothing, interior, tools, items, recipes, photos) — built with **Next.js** and **React**.

🌐 **Live Demo**: [GitHub Pages](https://translatesomething.github.io/acnh/)

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **JavaScript (ES6+)** - Programming language
- **CSS3** - Styling with CSS Variables, Gradients, and Animations
- **Nookipedia API** - Animal Crossing data source

## Features

### Villagers
- Search by name, species, or personality
- Filter by species, personality, game appearance, gender, birthday month, and zodiac sign
- "Random 5" mode — picks 5 random villagers each session
- Paginated results (5 / 10 / 20 per page)
- Detailed modal with tabbed layout (Overview, NH Details, House)
- High-quality photos via `nh_details.photo_url`

### Critterpedia (Fish / Bugs / Sea Creatures)
- Separate tabs for **Fish**, **Bugs**, and **Sea Creatures**
- **Available Now** — filters critters catchable at the current date and time
- **Time Travel** — simulate any hour to check availability
- Filter by **month**, **hemisphere**, and **location**
- Search by name
- Collection tracker with **caught** / **donated** status (persisted in localStorage)
- Progress bars for caught and donated counts
- Detailed modal with pricing, 12-month availability chart, museum phrase, and catch phrase

### Events
- **Today's Events** banner highlighting current events
- **Calendar view** with monthly grid and event dots
- **List view** with search and sorting
- Filter by event type (Birthday, Event, Nook Shopping, Recipes, Season, Shopping season)
- Click any calendar day to see all events in a popup
- Event detail modal with Nookipedia wiki links

### Museum (Art, Fossils, Gyroids)
- **Artwork** — browse all 43 paintings and statues
  - Filter by type (Painting / Statue) and forgery status
  - Real vs Fake comparison with side-by-side images
  - Authenticity tips to spot forgeries
  - Full texture views for detailed inspection
  - Donation tracker with progress bar
- **Fossils** — 73 individual fossils across 35 groups
  - Group view showing completion progress per skeleton
  - Individual view with grid layout
  - Per-piece donation tracker with group-level progress bars
  - Fossil group details with Blathers' museum descriptions
- **Gyroids** — 36 gyroids with all variations
  - Filter by sound type (Drum set, Melody, Kick, Snare, etc.)
  - Variation gallery showing all color options
  - Customization details (kits, Cyrus price)
  - Collection tracker with progress bar

### Catalog
Catalog is split into seven sections with filters, detail modals, and collection tracking (localStorage). Data is cached for faster repeat loads; API timeouts show a retry option.

- **Furniture** — Housewares, Miscellaneous, Wall-mounted, Ceiling decor
  - Filter by color, series, Lucky items, Customizable
  - Search by name; variation gallery and HHA info in detail modal
  - Owned / Wishlist tracker
- **Clothing** — Tops, Bottoms, Dress-up, Headwear, Accessories, Socks, Shoes, Bags, Umbrellas
  - Filter by color, style (Active, Cool, Cute, etc.), Label themes, Villager wearable
  - Variation gallery; styles, seasonality, and availability in detail
  - Owned / Wishlist tracker
- **Interior** — Wallpaper, Floors, Rugs
  - Filter by color and series; direct image display
  - HHA points, themes, colors, availability in detail
  - Owned tracker
- **Tools** — All tools (~150 items)
  - Durability bar, buy/sell price, customization info
  - **Compare mode** — select 2–4 tools for side-by-side comparison (durability, price, HHA)
  - Owned tracker
- **Items** — Misc items with auto-grouping
  - Groups: Materials, Fences, Fruits & Edibles, Plants, Seasonal, Others
  - Filter by season; stack size and material type in detail
- **Recipes (DIY)** — Recipe book with materials
  - Filter by material (Iron Nugget, Wood, etc.) and source (Balloons, Villagers, etc.)
  - **Shopping list** — add recipes to get aggregated materials needed
  - **Reverse lookup** — click a material in detail to filter recipes using it
  - Learned / Shopping list trackers
- **Photos & Posters** — Villager photos and posters
  - Filter by type (Photos / Posters)
  - Frame gallery (8 frame styles) in detail modal
  - Owned tracker

### General
- Dark mode / Light mode toggle
- Responsive design for mobile and desktop
- Smooth animations and gradient accents
- Persistent collection tracking via localStorage
- **Performance**: Critterpedia and Catalog load on demand (lazy); Catalog sub-tabs (Furniture, Clothing, etc.) each load when first opened
- **Reliability**: API requests use timeouts; failed or timed-out requests show an error message and **Retry** button (Villagers, Critterpedia, Events, Museum, Catalog)

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page (tab routing)
│   ├── globals.css        # Global styles
│   └── icon.png           # App icon/favicon
├── components/
│   ├── Navigation.js          # Main navigation menu
│   ├── VillagerDetails.js     # Villager details modal
│   ├── CritterpediaPage.js    # Critterpedia page (Fish/Bugs/Sea)
│   ├── CritterDetails.js      # Critter details modal
│   ├── EventsPage.js          # Events calendar and list
│   ├── MuseumPage.js          # Museum (Art/Fossils/Gyroids)
│   ├── CatalogPage.js         # Catalog tab orchestrator
│   ├── CatalogFurniture.js    # Furniture catalog + shared grid/modal/pagination
│   ├── CatalogClothing.js     # Clothing catalog
│   ├── CatalogInterior.js     # Interior (Wallpaper/Floors/Rugs)
│   ├── CatalogTools.js       # Tools with comparison mode
│   ├── CatalogItems.js       # Misc items with auto-grouping
│   ├── CatalogRecipes.js     # DIY recipes + shopping list
│   ├── CatalogPhotos.js      # Photos & posters
│   ├── CopyNotification.js   # Copy-to-clipboard notification
│   ├── ThemeProviderWrapper.js
│   └── ThemeToggle.js
├── lib/
│   ├── api.js             # API (villagers, critters, events, museum, catalog endpoints)
│   ├── catalogUtils.js    # Catalog cache, trackers, pagination, bg load
│   ├── game-mapping.js    # Game name mapping utility
│   └── theme.js           # Theme context
├── public/
│   ├── acnh-logo.png
│   ├── favicon.ico
│   └── favicon.png
└── scripts/
    └── kill-port.js       # Port cleanup utility
```

## Environment Variables

1. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

2. Fill in your API key:
```
NEXT_PUBLIC_NOOKIPEDIA_API_KEY=your_api_key_here
NEXT_PUBLIC_NOOKIPEDIA_API_URL=https://api.nookipedia.com
```

Get your free API key at: [api.nookipedia.com](https://api.nookipedia.com/)

## Deploy to GitHub Pages

### Automatic (GitHub Actions — Recommended)

1. Push the repository to GitHub
2. Go to **Settings** > **Pages**, set source to **GitHub Actions**
3. Add your API key: **Settings** > **Secrets and variables** > **Actions** → new secret `NOOKIPEDIA_API_KEY`
4. Push to `main` — the workflow deploys automatically

### Manual

```bash
npm run build
npx gh-pages -d out
```

## API

Powered by the [Nookipedia API](https://api.nookipedia.com/).

| Endpoint | Used for |
|---|---|
| `GET /villagers?nhdetails=true` | Villager list with NH details |
| `GET /nh/fish` | Fish list |
| `GET /nh/bugs` | Bugs list |
| `GET /nh/sea` | Sea creatures list |
| `GET /nh/events` | Events and calendar data |
| `GET /nh/art` | Artwork (paintings & statues) |
| `GET /nh/fossils/individuals` | Individual fossil pieces |
| `GET /nh/fossils/groups` | Fossil groups with descriptions |
| `GET /nh/gyroids` | Gyroids with variations |
| `GET /nh/furniture` | Furniture list (by category) and item details |
| `GET /nh/clothing` | Clothing list (by category) and item details |
| `GET /nh/interior` | Interior (Wallpaper/Floors/Rugs) and item details |
| `GET /nh/tools` | Tools list and item details |
| `GET /nh/items` | Misc items list and item details |
| `GET /nh/recipes` | DIY recipes and item details |
| `GET /nh/photos` | Photos & posters list and item details |

## License

MIT
