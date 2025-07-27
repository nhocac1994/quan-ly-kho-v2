# Hệ Thống Quản Lý Kho - React App

Ứng dụng quản lý kho với tính năng auto sync realtime với Google Sheets.

## 🚀 Tính Năng

- ✅ **Quản lý sản phẩm** - Thêm, sửa, xóa sản phẩm
- ✅ **Quản lý nhà cung cấp** - Quản lý thông tin NCC
- ✅ **Quản lý khách hàng** - Quản lý thông tin KH
- ✅ **Quản lý nhập kho** - Theo dõi nhập kho
- ✅ **Quản lý xuất kho** - Theo dõi xuất kho
- ✅ **Auto Sync Realtime** - Đồng bộ với Google Sheets mỗi 30s
- ✅ **Dashboard** - Thống kê tổng quan
- ✅ **Responsive UI** - Giao diện đẹp, dễ sử dụng

## 🛠️ Công Nghệ

- **Frontend:** React 18 + TypeScript
- **UI Framework:** Material-UI (MUI)
- **State Management:** React Context + useReducer
- **Data Fetching:** @tanstack/react-query
- **Google Sheets Integration:** Service Account JWT
- **Auto Sync:** Custom Context với localStorage

## 📦 Cài Đặt

```bash
# Clone repository
git clone <your-repo-url>
cd quan-ly-kho-v2

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chạy ứng dụng
npm start
```

## ⚙️ Cấu Hình

Tạo file `.env` với các biến môi trường:

```env
REACT_APP_GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
REACT_APP_GOOGLE_PRIVATE_KEY=your_private_key
REACT_APP_GOOGLE_API_KEY=your_api_key
```

## 🔧 Cấu Hình Google Sheets

1. **Tạo Service Account** trong Google Cloud Console
2. **Bật Google Sheets API**
3. **Chia sẻ Google Sheet** với Service Account email
4. **Cấu hình cấu trúc sheet:**
   - `DM_SAN_PHAM` - Danh mục sản phẩm
   - `NCC` - Nhà cung cấp
   - `KHACH_HANG` - Khách hàng
   - `NHAP_KHO` - Nhập kho
   - `XUAT_KHO` - Xuất kho

## 🚀 Auto Sync

- **Interval mặc định:** 30 giây
- **Rate limiting protection:** Tự động dừng khi bị limit
- **Error handling:** Fallback về mock data
- **Real-time updates:** UI tự động cập nhật

## 📁 Cấu Trúc Dự Án

```
src/
├── components/          # UI Components
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── pages/              # Page Components
├── services/           # API Services
├── types/              # TypeScript Types
└── utils/              # Utility Functions
```

## 🎯 Sử Dụng

1. **Dashboard:** Xem tổng quan hệ thống
2. **Sản phẩm:** Quản lý danh mục sản phẩm
3. **Nhà cung cấp:** Quản lý thông tin NCC
4. **Khách hàng:** Quản lý thông tin KH
5. **Nhập kho:** Theo dõi nhập kho
6. **Xuất kho:** Theo dõi xuất kho
7. **Auto Sync:** Cấu hình đồng bộ

## 📝 Scripts

```bash
npm start          # Chạy development server
npm run build      # Build production
npm test           # Chạy tests
npm run eject      # Eject CRA (không khuyến khích)
```

## 🤝 Đóng Góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Liên Hệ

- **Email:** your-email@example.com
- **GitHub:** [@your-username](https://github.com/your-username)

---

⭐ Nếu dự án này hữu ích, hãy cho một star nhé!
