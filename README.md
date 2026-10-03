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
Catalog is split into seven sections with filters, detail modals, and collection tracking (localStorage). All data comes from local JSON snapshots, so each section opens without waiting on the API. Cards show their image and details right away, and the filters cover every item in the category, not only the ones you opened. A failed load shows a retry option.

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
- **Look**: modeled on the in-game Nook Phone. Light mode is the island by day, dark mode is the island by night, and the choice is remembered without a flash on load
- **Today on the island**: the Villagers page opens with the date, today's villager birthdays and today's events
- Responsive design: on phones the section navigation becomes a bottom tab bar and detail views become bottom sheets
- Fonts and icons are bundled with the site, so nothing is loaded from Google
- Persistent collection tracking via localStorage
- **Data**: the site never calls the Nookipedia API in the browser. It reads JSON snapshots from `public/data/`, created by `npm run fetch-data` (see [Updating the data](#updating-the-data)). No API key is shipped to visitors and there are no CORS or rate-limit issues
- **Performance**: Critterpedia and Catalog load on demand (lazy); Catalog sub-tabs (Furniture, Clothing, etc.) each load when first opened; only the active Catalog tab is kept in memory (switching tabs unmounts the previous one to reduce RAM use)
- **Reliability**: data requests use timeouts; failed or timed-out requests show an error message and **Retry** button (Villagers, Critterpedia, Events, Museum, Catalog)

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

No API key is needed to run the site: all data is already in `public/data/`. A key is only needed to refresh that data (see [Updating the data](#updating-the-data)).

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page (tab routing)
│   ├── styles/            # Design system, one file per area
│   │   ├── tokens.css         # Colors (day and night), type, radii, spacing
│   │   ├── base.css           # Reset, typography, focus ring
│   │   ├── shell.css          # Header, navigation, footer
│   │   ├── shared.css         # Chips, tabs, search, buttons, pagination, modals
│   │   └── villagers.css, critterpedia.css, events.css, museum.css, catalog*.css
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
│   ├── TodayPanel.js          # Date, birthdays and events for today
│   ├── ThemeProviderWrapper.js
│   └── ThemeToggle.js
├── lib/
│   ├── api.js             # Data layer: reads the JSON snapshots in public/data
│   ├── catalogUtils.js    # Catalog helpers: trackers, pagination, error messages
│   ├── game-mapping.js    # Game name mapping utility
│   └── theme.js           # Theme context
├── public/
│   ├── data/              # Nookipedia snapshots (generated by npm run fetch-data)
│   ├── acnh-logo.png
│   ├── favicon.ico
│   └── favicon.png
└── scripts/
    ├── fetch-data.mjs    # Downloads the Nookipedia data into public/data
    └── kill-port.js       # Port cleanup utility
```

## Updating the data

The committed files in `public/data/` are all the site needs to run. You only need an API key to refresh them.

1. Copy `env.example` to `.env.local` and set your key (free at [api.nookipedia.com](https://api.nookipedia.com/)):
```
NOOKIPEDIA_API_KEY=your_api_key_here
```

2. Download the data, then commit the changed files:
```bash
npm run fetch-data
```

The script keeps a dataset's previous file if its download fails or comes back much smaller than before, and exits with code 1 when any dataset could not be refreshed. Re-running it when nothing changed leaves the files untouched.

The GitHub Actions workflow runs the same script before every build and once a week. If the refresh fails, the deploy continues with the committed files and logs a warning.

## Deploy to GitHub Pages

### Automatic (GitHub Actions — Recommended)

1. Push the repository to GitHub
2. Go to **Settings** > **Pages**, set source to **GitHub Actions**
3. Optional, for automatic data refresh: **Settings** > **Secrets and variables** > **Actions** → new secret `NOOKIPEDIA_API_KEY`. Without it the site deploys with the committed data
4. Push to `main` — the workflow deploys automatically

### Manual

```bash
npm run build
npx gh-pages -d out
```

## API

Data from [Nookipedia](https://nookipedia.com/) (CC BY-SA 3.0), fetched with the [Nookipedia API](https://api.nookipedia.com/) by `npm run fetch-data` and stored in `public/data/`. The site itself does not call the API.

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
