// Fonts are bundled with the site (no request to Google, works offline). They load first so the
// app styles that follow always win over the icon font's own .material-icons rule.
import 'material-icons/iconfont/filled.css'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/nunito-sans/latin-400.css'
import '@fontsource/nunito-sans/latin-400-italic.css'
import '@fontsource/nunito-sans/latin-600.css'
import '@fontsource/nunito-sans/latin-700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/shared.css'
import './styles/villagers.css'
import './styles/critterpedia.css'
import './styles/events.css'
import './styles/museum.css'
import './styles/catalog.css'
import './styles/catalog-detail.css'
import ThemeProviderWrapper from '../components/ThemeProviderWrapper'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: 'Animal Crossing: New Horizons',
  description: 'Villagers, critters, events, the museum and the catalog for Animal Crossing: New Horizons.',
  icons: {
    icon: [
      { url: `${basePath}/favicon.png`, type: 'image/png' },
      { url: `${basePath}/favicon.ico`, type: 'image/x-icon' }
    ],
    apple: `${basePath}/acnh-logo.png`,
  },
}

// Runs before the first paint so a visitor who chose night never sees a flash of day.
const themeScript = `try{var t=localStorage.getItem('theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href={`${basePath}/favicon.ico`} type="image/x-icon" />
        <link rel="icon" href={`${basePath}/favicon.png`} type="image/png" />
        <link rel="apple-touch-icon" href={`${basePath}/acnh-logo.png`} />
      </head>
      <body>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
        <footer className="site-footer">
          <p>
            Data from <a href="https://nookipedia.com" target="_blank" rel="noopener noreferrer">Nookipedia</a>, used under CC BY-SA 3.0.
          </p>
          <p>Animal Crossing is a trademark of Nintendo. This is an unofficial fan site.</p>
        </footer>
      </body>
    </html>
  )
}
