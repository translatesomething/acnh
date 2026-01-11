# Animal Crossing: New Horizons - Villager Search

Ứng dụng tìm kiếm và xem thông tin villagers từ Animal Crossing, được xây dựng với **Next.js** và **React**.

🌐 **Live Demo**: [GitHub Pages](https://your-username.github.io/acnh/)

## Công nghệ sử dụng

- **Next.js 15** - React framework với App Router
- **React 19** - UI library
- **JavaScript** - Ngôn ngữ lập trình
- **CSS3** - Styling với CSS Variables và Animations

## Tính năng

- 🔍 Tìm kiếm villagers theo tên, loài, hoặc tính cách
- 📋 Hiển thị danh sách villagers với thông tin chi tiết
- 🎮 Xem các game mà villager đã xuất hiện
- 📋 Copy tên game bằng double-click
- 🌓 Dark mode / Light mode
- 📱 Responsive design cho mobile và desktop
- ✨ Animations và transitions mượt mà

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Chạy production server
npm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Cấu trúc dự án

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── CopyNotification.js    # Copy notification component
│   ├── ThemeToggle.js          # Dark mode toggle
│   └── VillagerDetails.js      # Villager details modal
├── lib/
│   ├── api.js             # API service
│   ├── game-mapping.js     # Game name mapping utility
│   └── theme.js           # Theme context
└── public/
    └── acnh-logo.png       # Logo image
```

## Setup Environment Variables

1. Copy file `env.example` thành `.env.local`:
```bash
cp env.example .env.local
```

2. Thêm API key của bạn vào `.env.local`:
```
NEXT_PUBLIC_NOOKIPEDIA_API_KEY=your_api_key_here
NEXT_PUBLIC_NOOKIPEDIA_API_URL=https://api.nookipedia.com
```

Lấy API key tại: [Nookipedia API](https://api.nookipedia.com/)

## Deploy lên GitHub Pages

### Cách 1: Tự động với GitHub Actions (Khuyến nghị)

1. Push code lên GitHub repository
2. Vào **Settings** > **Pages** trong repository
3. Chọn **Source**: "GitHub Actions"
4. Thêm API key vào **Secrets**:
   - Vào **Settings** > **Secrets and variables** > **Actions**
   - Thêm secret mới: `NOOKIPEDIA_API_KEY` với giá trị API key của bạn
5. Push code lên branch `main` - GitHub Actions sẽ tự động deploy

### Cách 2: Deploy thủ công

```bash
# Build static files
npm run build

# Deploy lên gh-pages branch
npx gh-pages -d out
```

## API

Ứng dụng sử dụng [Nookipedia API](https://api.nookipedia.com/) để lấy dữ liệu villagers.

## License

MIT
