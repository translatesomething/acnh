/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'acnh'
const basePath = isProd && process.env.USE_BASE_PATH !== 'false' ? `/${repoName}` : ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  images: {
    domains: ['dodo.ac', 'nookipedia.com'],
    unoptimized: true
  },
  // Base path for GitHub Pages (sử dụng tên repo hoặc để trống nếu dùng custom domain)
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true, // Cần cho GitHub Pages
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
