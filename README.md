# Animal Crossing: New Horizons - Villager Search

A web application for searching and viewing villager information from Animal Crossing, built with **Next.js** and **React**.

🌐 **Live Demo**: [GitHub Pages](https://your-username.github.io/acnh/)

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **JavaScript** - Programming language
- **CSS3** - Styling with CSS Variables and Animations

## Features

- 🔍 Search villagers by name, species, or personality
- 📋 Display villager list with detailed information
- 🎮 View games where villagers have appeared
- 📋 Copy game name by double-clicking
- 🌓 Dark mode / Light mode
- 📱 Responsive design for mobile and desktop
- ✨ Smooth animations and transitions

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   ├── globals.css        # Global styles
│   └── icon.png           # App icon/favicon
├── components/
│   ├── CopyNotification.js        # Copy notification component
│   ├── Navigation.js              # Main navigation menu
│   ├── ThemeProviderWrapper.js    # Theme provider wrapper
│   ├── ThemeToggle.js             # Dark mode toggle
│   └── VillagerDetails.js         # Villager details modal
├── lib/
│   ├── api.js             # API service
│   ├── game-mapping.js    # Game name mapping utility
│   └── theme.js           # Theme context
├── public/
│   ├── acnh-logo.png      # Logo image
│   ├── favicon.ico        # Favicon ICO
│   └── favicon.png        # Favicon PNG
└── scripts/
    └── kill-port.js       # Port cleanup utility
```

## Setup Environment Variables

1. Copy `env.example` file to `.env.local`:
```bash
cp env.example .env.local
```

2. Add your API key to `.env.local`:
```
NEXT_PUBLIC_NOOKIPEDIA_API_KEY=your_api_key_here
NEXT_PUBLIC_NOOKIPEDIA_API_URL=https://api.nookipedia.com
```

Get your API key at: [Nookipedia API](https://api.nookipedia.com/)

## Deploy to GitHub Pages

### Method 1: Automatic with GitHub Actions (Recommended)

1. Push code to GitHub repository
2. Go to **Settings** > **Pages** in the repository
3. Select **Source**: "GitHub Actions"
4. Add API key to **Secrets**:
   - Go to **Settings** > **Secrets and variables** > **Actions**
   - Add new secret: `NOOKIPEDIA_API_KEY` with your API key value
5. Push code to `main` branch - GitHub Actions will automatically deploy

### Method 2: Manual Deploy

```bash
# Build static files
npm run build

# Deploy to gh-pages branch
npx gh-pages -d out
```

## API

This application uses the [Nookipedia API](https://api.nookipedia.com/) to fetch villager data.

## License

MIT
