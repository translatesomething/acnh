/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'acnh'

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  images: {
    domains: ['dodo.ac', 'nookipedia.com'],
    unoptimized: true
  },
  // Base path for GitHub Pages (sử dụng tên repo hoặc để trống nếu dùng custom domain)
  basePath: isProd && process.env.USE_BASE_PATH !== 'false' ? `/${repoName}` : '',
  assetPrefix: isProd && process.env.USE_BASE_PATH !== 'false' ? `/${repoName}` : '',
  trailingSlash: true, // Cần cho GitHub Pages
}

module.exports = nextConfig
