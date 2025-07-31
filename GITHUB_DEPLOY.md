# Hướng dẫn đẩy code lên GitHub

## Bước 1: Cấu hình Git

Trước khi commit, cần cấu hình thông tin người dùng:

```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

## Bước 2: Kiểm tra trạng thái

```bash
git status
```

Đảm bảo các file nhạy cảm đã được loại trừ:
- ✅ `.env` files
- ✅ `*.sql` files  
- ✅ `*.json` service account files
- ✅ `node_modules/`
- ✅ `build/`

## Bước 3: Commit code

```bash
git add .
git commit -m "feat: Migrate to Supabase with realtime sync

- Add Supabase integration with realtime subscriptions
- Implement SupabaseContext for state management  
- Add RealtimeStatus component for monitoring
- Update all pages to use Supabase instead of Google Sheets
- Add comprehensive setup guides
- Improve .gitignore to exclude sensitive files
- Add env-template.txt for easy configuration
- Update README.md with new setup instructions"
```

## Bước 4: Push lên GitHub

```bash
git push origin main
```

## Bước 5: Kiểm tra trên GitHub

1. Vào repository trên GitHub
2. Kiểm tra các file đã được đẩy lên
3. Đảm bảo không có file nhạy cảm nào

## Files được đẩy lên:

### ✅ Code chính:
- `src/` - Toàn bộ source code
- `public/` - Static files
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config

### ✅ Documentation:
- `README.md` - Hướng dẫn chính
- `SUPABASE_SETUP.md` - Hướng dẫn setup Supabase
- `REALTIME_SETUP.md` - Hướng dẫn bật realtime
- `env-template.txt` - Template cho environment variables

### ✅ Configuration:
- `.gitignore` - Loại trừ file nhạy cảm

## Files KHÔNG được đẩy lên:

### ❌ Sensitive files:
- `.env` - Environment variables
- `*.sql` - Database scripts
- `*.json` - Service account keys
- `node_modules/` - Dependencies
- `build/` - Build output

### ❌ Development files:
- `test-*.js` - Test scripts
- `check-*.js` - Check scripts
- `fix-*.js` - Fix scripts
- `import-*.js` - Import scripts

## Sau khi đẩy lên GitHub:

### 1. Clone trên máy khác:
```bash
git clone <repository-url>
cd quan-ly-kho-v2
npm install
```

### 2. Setup environment:
```bash
cp env-template.txt .env
# Chỉnh sửa .env với thông tin thực tế
```

### 3. Setup Supabase:
- Làm theo hướng dẫn trong `SUPABASE_SETUP.md`
- Bật realtime theo `REALTIME_SETUP.md`

### 4. Chạy ứng dụng:
```bash
npm start
```

## Lưu ý quan trọng:

1. **Không bao giờ commit file `.env`** - chứa thông tin nhạy cảm
2. **Không commit service account keys** - có thể bị lạm dụng
3. **Không commit database dumps** - có thể chứa dữ liệu thật
4. **Luôn kiểm tra `.gitignore`** trước khi commit

## Troubleshooting:

### Lỗi "Author identity unknown"
```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

### Lỗi "Permission denied"
- Kiểm tra quyền truy cập repository
- Đảm bảo đã authenticate với GitHub

### Lỗi "Large file"
- Kiểm tra file size
- Sử dụng Git LFS nếu cần
- Loại trừ file lớn trong `.gitignore` 