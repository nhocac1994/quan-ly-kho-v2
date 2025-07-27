# Hướng dẫn cấu hình Google Sheets API (API Key)

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google Sheets API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google Sheets API" và bật

## Bước 2: Tạo API Key

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy API Key và lưu lại
4. (Tùy chọn) Click "Restrict Key" để giới hạn quyền truy cập

## Bước 3: Tạo Google Sheet

1. Tạo Google Sheet mới
2. Copy Spreadsheet ID từ URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. **Chia sẻ Google Sheet** với quyền "Anyone with the link can view":
   - Click "Share" (góc trên bên phải)
   - Click "Change to anyone with the link"
   - Chọn "Viewer"
   - Click "Done"
4. Tạo các sheet sau:
   - Products (cột A-L)
   - Suppliers (cột A-N)
   - Customers (cột A-N)
   - InboundShipments (cột A-N)
   - OutboundShipments (cột A-N)

## Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `quan-ly-kho-v2`:

```env
REACT_APP_GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
REACT_APP_GOOGLE_API_KEY=your_api_key_here
```

## Bước 5: Cấu hình Vercel (nếu deploy)

1. Vào Vercel Dashboard
2. Chọn project
3. Vào "Settings" > "Environment Variables"
4. Thêm các biến môi trường tương tự như trên

## Lưu ý

- **Chỉ đọc được**: API Key chỉ cho phép đọc dữ liệu, không thể ghi
- **Để ghi dữ liệu**: Cần sử dụng OAuth 2.0 hoặc Service Account
- **Bảo mật**: API Key cần được bảo vệ, không commit lên git

## Bước 6: Cấu hình Vercel (nếu deploy)

1. Vào Vercel Dashboard
2. Chọn project
3. Vào "Settings" > "Environment Variables"
4. Thêm các biến môi trường tương tự như trên

## Cấu trúc Google Sheet

### Products Sheet (A-L)
- A: ID
- B: Mã sản phẩm
- C: Tên sản phẩm
- D: Mã kho
- E: Tên kho
- F: Đơn vị tính
- G: Số lượng tồn
- H: Hiển thị
- I: Ghi chú
- J: Ngày tạo
- K: Người tạo
- L: Ngày cập nhật

### Suppliers Sheet (A-N)
- A: ID
- B: Tên NCC
- C: Hiển thị
- D: Tên đầy đủ
- E: Loại NCC
- F: Logo
- G: Người đại diện
- H: SĐT
- I: Tình trạng
- J: NV phụ trách
- K: Ghi chú
- L: Ngày tạo
- M: Người tạo
- N: Ngày cập nhật

### Customers Sheet (A-N)
- A: ID
- B: Tên khách hàng
- C: Hiển thị
- D: Tên đầy đủ
- E: Loại khách hàng
- F: Logo
- G: Người đại diện
- H: SĐT
- I: Tình trạng
- J: NV phụ trách
- K: Ghi chú
- L: Ngày tạo
- M: Người tạo
- N: Ngày cập nhật

### InboundShipments Sheet (A-N)
- A: ID
- B: Loại nhập
- C: Ngày nhập
- D: ID khách hàng
- E: Tên khách hàng
- F: Mã hóa đơn
- G: SL sản phẩm
- H: SL xuất
- I: Tài xế
- J: Nội dung nhập
- K: Ghi chú
- L: Ngày tạo
- M: Người tạo
- N: Ngày cập nhật

### OutboundShipments Sheet (A-N)
- A: ID
- B: Loại xuất
- C: Ngày xuất
- D: ID khách hàng
- E: Tên khách hàng
- F: Mã hóa đơn
- G: SL sản phẩm
- H: SL xuất
- I: Tài xế
- J: Nội dung xuất
- K: Ghi chú
- L: Ngày tạo
- M: Người tạo
- N: Ngày cập nhật

## Lưu ý

- Đảm bảo Google Sheet có quyền "Anyone with the link can view"
- User cần đăng nhập Google để có quyền chỉnh sửa
- API Key và Client ID cần được bảo mật, không commit lên git 