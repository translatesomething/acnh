/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'acnh'
const basePath = isProd && process.env.USE_BASE_PATH !== 'false' ? `/${repoName}` : ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dodo.ac', pathname: '/**' },
      { protocol: 'https', hostname: 'nookipedia.com', pathname: '/**' },
    ],
    unoptimized: true,
  },
  // Base path for GitHub Pages (use repo name or leave empty for custom domain)
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true, // Required for GitHub Pages
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
