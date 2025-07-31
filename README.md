# Quản Lý Kho V2 - React + Supabase

Ứng dụng quản lý kho hàng với realtime sync, được xây dựng bằng React và Supabase.

## 🚀 Tính năng

- ✅ **Quản lý sản phẩm** - Thêm, sửa, xóa sản phẩm
- ✅ **Quản lý nhà cung cấp** - Thông tin nhà cung cấp
- ✅ **Quản lý khách hàng** - Thông tin khách hàng
- ✅ **Quản lý nhập kho** - Theo dõi hàng nhập
- ✅ **Quản lý xuất kho** - Theo dõi hàng xuất
- ✅ **Quản lý người dùng** - Phân quyền người dùng
- ✅ **Realtime Sync** - Đồng bộ realtime giữa các thiết bị
- ✅ **Responsive Design** - Tương thích mobile và desktop
- ✅ **Material-UI** - Giao diện đẹp và hiện đại

## 📋 Yêu cầu hệ thống

- Node.js 16+ 
- npm hoặc yarn
- Supabase account

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd quan-ly-kho-v2
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Thiết lập Supabase

#### Tạo project Supabase
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Tạo project mới
3. Lưu lại URL và API Key

#### Tạo file .env
```bash
cp env-template.txt .env
```

Chỉnh sửa file `.env`:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Thiết lập Database
1. Vào Supabase Dashboard > SQL Editor
2. Chạy script setup database (xem file `SUPABASE_SETUP.md`)
3. Bật realtime (xem file `REALTIME_SETUP.md`)

### 4. Chạy ứng dụng
```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## 📁 Cấu trúc project

```
src/
├── components/          # React components
├── contexts/           # React contexts
├── pages/              # Các trang chính
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## 🔧 Cấu hình

### Environment Variables
- `REACT_APP_SUPABASE_URL`: URL của Supabase project
- `REACT_APP_SUPABASE_ANON_KEY`: Anon key của Supabase

### Database Schema
Xem file `SUPABASE_SETUP.md` để biết chi tiết về cấu trúc database.

## 🚀 Deployment

### Build production
```bash
npm run build
```

### Deploy lên Vercel/Netlify
1. Push code lên GitHub
2. Kết nối với Vercel/Netlify
3. Cấu hình environment variables
4. Deploy

## 📱 Sử dụng

### Đăng nhập
- Sử dụng tài khoản mặc định: `admin@company.com`

### Quản lý dữ liệu
- **Sản phẩm**: Thêm, sửa, xóa sản phẩm
- **Nhà cung cấp**: Quản lý thông tin nhà cung cấp
- **Khách hàng**: Quản lý thông tin khách hàng
- **Nhập/Xuất kho**: Theo dõi hàng hóa

### Realtime Sync
- Dữ liệu tự động đồng bộ giữa các thiết bị
- Không cần refresh trang để thấy thay đổi

## 🐛 Troubleshooting

### Lỗi kết nối Supabase
- Kiểm tra URL và API Key trong file `.env`
- Đảm bảo Supabase project đang hoạt động

### Lỗi realtime
- Chạy script bật realtime (xem `REALTIME_SETUP.md`)
- Kiểm tra component `RealtimeStatus` trong Dashboard

### Lỗi build
```bash
npm run build
```
Kiểm tra console để xem lỗi chi tiết.

## 📄 License

MIT License

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub.
