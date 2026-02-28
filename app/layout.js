import './globals.css'
import ThemeProviderWrapper from '../components/ThemeProviderWrapper'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: 'Animal Crossing: New Horizons',
  description: 'Animal Crossing Villager Search',
  icons: {
    icon: [
      { url: `${basePath}/favicon.png`, type: 'image/png' },
      { url: `${basePath}/favicon.ico`, type: 'image/x-icon' }
    ],
    apple: `${basePath}/acnh-logo.png`,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={`${basePath}/favicon.ico`} type="image/x-icon" />
        <link rel="icon" href={`${basePath}/favicon.png`} type="image/png" />
        <link rel="apple-touch-icon" href={`${basePath}/acnh-logo.png`} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  )
}
