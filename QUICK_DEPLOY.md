# 🚀 Quick Deploy Guide - Không Thấy Workflow?

## Vấn Đề: Không thấy "Deploy to GitHub Pages" trong tab Actions

### Nguyên nhân có thể:
1. Workflow chưa được trigger lần đầu
2. GitHub Pages chưa được enable
3. Cần refresh trang

## ✅ Giải Pháp Từng Bước

### Bước 1: Enable GitHub Pages TRƯỚC

**Quan trọng:** Phải enable GitHub Pages trước khi workflow có thể chạy!

1. Vào: https://github.com/translatesomething/acnh/settings/pages
2. Ở phần **Source**, chọn **"GitHub Actions"**
3. Click **Save**

### Bước 2: Trigger Workflow Lần Đầu

Có 2 cách:

#### Cách 1: Push một commit (Dễ nhất)
```bash
# Tạo một file nhỏ để trigger
echo "# Deployment trigger" >> .deploy-trigger
git add .deploy-trigger
git commit -m "Trigger GitHub Pages deployment"
git push origin main
```

#### Cách 2: Manual Trigger (Nếu đã enable Pages)
1. Vào tab **Actions**
2. Ở sidebar bên trái, bạn sẽ thấy **"Deploy to GitHub Pages"**
3. Click vào nó
4. Click nút **"Run workflow"** (bên phải, màu xanh)
5. Chọn branch `main`
6. Click **"Run workflow"**

### Bước 3: Kiểm Tra

1. Vào tab **Actions** lại
2. Bạn sẽ thấy workflow run mới
3. Click vào nó để xem progress
4. Đợi các bước chạy xong:
   - ✅ Checkout
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Setup Pages
   - ✅ Build with Next.js
   - ✅ Upload artifact
   - ✅ Deploy to GitHub Pages

## ⚠️ Lưu Ý Quan Trọng

### Phải có GitHub Secrets trước!
Nếu chưa thêm API key vào Secrets, build sẽ fail!

1. Vào: https://github.com/translatesomething/acnh/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `NOOKIPEDIA_API_KEY`
4. Value: `97152a5c-9c98-47e7-9f08-e6b52b3f8751`
5. Click **"Add secret"**

## 🔍 Nếu Vẫn Không Thấy

### Kiểm tra:
1. **Workflow file có tồn tại không?**
   - Vào: https://github.com/translatesomething/acnh/tree/main/.github/workflows
   - Phải thấy file `deploy.yml`

2. **File đã được commit chưa?**
   - Kiểm tra trong repository có file `.github/workflows/deploy.yml`

3. **Refresh trang**
   - Hard refresh: Ctrl+F5 (Windows) hoặc Cmd+Shift+R (Mac)

4. **Kiểm tra permissions**
   - Đảm bảo bạn có quyền write vào repository

## 📝 Checklist

Trước khi deploy, đảm bảo:
- [ ] GitHub Pages đã enable (Settings → Pages → GitHub Actions)
- [ ] API key đã thêm vào Secrets (Settings → Secrets → Actions)
- [ ] Workflow file tồn tại (`.github/workflows/deploy.yml`)
- [ ] Đã push code lên GitHub
- [ ] Repository là public (hoặc có GitHub Pro)

## 🎯 Sau Khi Deploy Thành Công

1. Đợi 1-2 phút
2. Vào: https://github.com/translatesomething/acnh/settings/pages
3. Bạn sẽ thấy URL: `https://translatesomething.github.io/acnh/`
4. Truy cập URL để xem site!

## 🐛 Troubleshooting

### Workflow không chạy?
- Kiểm tra xem đã enable GitHub Pages chưa
- Kiểm tra xem có lỗi syntax trong workflow file không

### Build fails?
- Kiểm tra Secrets có đúng tên không (`NOOKIPEDIA_API_KEY`)
- Xem logs trong workflow để tìm lỗi cụ thể

### 404 sau khi deploy?
- Đợi thêm 1-2 phút
- Clear browser cache
- Kiểm tra URL có đúng không
