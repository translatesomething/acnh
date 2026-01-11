# Hướng dẫn Deploy lên GitHub Pages

## Bước 1: Tạo GitHub Repository

1. Tạo repository mới trên GitHub (có thể để public hoặc private)
2. Push code lên repository:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/acnh.git
git push -u origin main
```

## Bước 2: Thêm API Key vào GitHub Secrets

1. Vào repository trên GitHub
2. Vào **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Thêm secret:
   - **Name**: `NOOKIPEDIA_API_KEY`
   - **Value**: API key của bạn (97152a5c-9c98-47e7-9f08-e6b52b3f8751)
5. Click **Add secret**

## Bước 3: Enable GitHub Pages

1. Vào **Settings** > **Pages**
2. Ở phần **Source**, chọn **GitHub Actions**
3. Lưu lại

## Bước 4: Deploy

1. Push code lên branch `main`:
```bash
git add .
git commit -m "Setup GitHub Pages"
git push
```

2. Vào tab **Actions** trong repository
3. Workflow sẽ tự động chạy và deploy
4. Sau khi deploy xong, vào **Settings** > **Pages** để xem URL:
   - URL sẽ là: `https://your-username.github.io/acnh/`

## Lưu ý

- **Base Path**: Nếu tên repo khác `acnh`, cần sửa `basePath` trong `next.config.js`
- **Custom Domain**: Nếu dùng custom domain, set `USE_BASE_PATH=false` trong workflow
- **API Key**: Luôn được bảo vệ trong GitHub Secrets, không bao giờ lộ ra public

## Troubleshooting

### Build fails
- Kiểm tra xem đã thêm `NOOKIPEDIA_API_KEY` vào Secrets chưa
- Kiểm tra logs trong tab **Actions**

### 404 Error
- Kiểm tra `basePath` trong `next.config.js` có đúng tên repo không
- Đảm bảo `trailingSlash: true` trong config

### API không hoạt động
- Kiểm tra API key trong Secrets
- Kiểm tra console trong browser để xem lỗi
