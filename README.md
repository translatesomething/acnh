# Animal Crossing: New Horizons Explorer

A web application for exploring Animal Crossing: New Horizons data — villagers, fish, bugs, and sea creatures — built with **Next.js** and **React**.

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
- Filter by species, personality, and game appearance
- "Random 5" mode — picks 5 random villagers each session
- Paginated results (5 / 10 / 20 per page)
- Detailed modal with birthday, personality, catchphrase, house info, and game appearances
- High-quality photos via `nh_details.photo_url`

### Critterpedia (Fish / Bugs / Sea Creatures)
- Separate tabs for **Fish**, **Bugs**, and **Sea Creatures**
- **Available Now** — filters critters catchable at the current date and time
- Filter by **month** (Jan – Dec)
- Filter by **hemisphere** (Northern / Southern)
- Filter by **location** (River, Ocean, Flying, etc.)
- Search by name
- Grid cards showing price, location, shadow size, and availability window
- Detailed modal with:
  - Sell price at Nook's Cranny + special buyer (C.J. / Flick)
  - Shadow size and movement speed (sea creatures)
  - Visual **12-month availability chart** for both hemispheres
  - Current month highlight in the chart

### General
- Dark mode / Light mode toggle
- Responsive design for mobile and desktop
- Smooth animations and gradient accents

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
│   ├── CopyNotification.js    # Copy-to-clipboard notification
│   ├── ThemeProviderWrapper.js
│   └── ThemeToggle.js
├── lib/
│   ├── api.js             # API service (villagers + critters)
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

## License

MIT
