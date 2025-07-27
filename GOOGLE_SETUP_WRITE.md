# Hướng dẫn cấu hình Google Sheets API để GHI dữ liệu

## ⚠️ Lưu ý quan trọng
Để có thể **GHI** dữ liệu vào Google Sheets, bạn cần sử dụng **Service Account** thay vì API Key.

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google Sheets API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google Sheets API" và bật

## Bước 2: Tạo Service Account

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Điền thông tin:
   - Service account name: `quan-ly-kho-service`
   - Service account ID: tự động tạo
   - Description: `Service account cho ứng dụng Quản lý kho`
4. Click "Create and Continue"
5. Bỏ qua "Grant this service account access to project"
6. Click "Done"

## Bước 3: Tạo Private Key

1. Trong danh sách Service Accounts, click vào service account vừa tạo
2. Vào tab "Keys"
3. Click "Add Key" > "Create new key"
4. Chọn "JSON"
5. Click "Create"
6. File JSON sẽ được download về máy

## Bước 4: Tạo Google Sheet

1. Tạo Google Sheet mới
2. Copy Spreadsheet ID từ URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. **Chia sẻ Google Sheet** với Service Account:
   - Click "Share" (góc trên bên phải)
   - Thêm email service account: `quan-ly-kho-service@your-project.iam.gserviceaccount.com`
   - Cấp quyền "Editor"
   - Click "Done"
4. Tạo các sheet sau (theo cấu trúc thực tế):
   - DM_SAN_PHAM (cột A-L)
   - NCC (cột A-N)
   - KHACH_HANG (cột A-N)
   - NHAP_KHO (cột A-N)
   - XUAT_KHO (cột A-N)
   - NHAP_KHO_CT (cột A-R) - Chi tiết nhập kho
   - XUAT_KHO_CT (cột A-R) - Chi tiết xuất kho
   - THONG_TIN_CTY (cột A-J) - Thông tin công ty
   - NGUOI_DUNG (cột A-N) - Quản lý người dùng

## Bước 5: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `quan-ly-kho-v2`:

```env
REACT_APP_GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL=quan-ly-kho-service@your-project.iam.gserviceaccount.com
REACT_APP_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
```

**Lưu ý:** 
- Copy `client_email` từ file JSON vào `SERVICE_ACCOUNT_EMAIL`
- Copy `private_key` từ file JSON vào `PRIVATE_KEY` (giữ nguyên format với `\n`)

## Bước 6: Cấu hình Vercel (nếu deploy)

1. Vào Vercel Dashboard
2. Chọn project
3. Vào "Settings" > "Environment Variables"
4. Thêm các biến môi trường tương tự như trên

## Bước 7: Cấu trúc Google Sheet

### Sheet "DM_SAN_PHAM" (cột A-L):
| A (ID) | B (Mã SP) | C (Tên SP) | D (Kho ID) | E (Tên kho) | F (ĐVT) | G (SL tồn) | H (Hiển thị) | I (Ghi chú) | J (Ngày tạo) | K (Người tạo) | L (Update) |
|--------|-----------|------------|------------|-------------|---------|------------|---------------|-------------|--------------|---------------|------------|

### Sheet "NCC" (cột A-N):
| A (ID) | B (Tên NCC) | C (Hiển thị) | D (Tên đầy đủ) | E (Loại NCC) | F (Logo) | G (Người đại diện) | H (SDT) | I (Tình trạng) | J (NV phụ trách) | K (Ghi chú) | L (Ngày tạo) | M (Người tạo) | N (Update) |
|--------|-------------|---------------|----------------|--------------|----------|-------------------|---------|----------------|------------------|-------------|--------------|---------------|------------|

### Sheet "KHACH_HANG" (cột A-N):
| A (ID) | B (Tên KH) | C (Hiển thị) | D (Tên đầy đủ) | E (Loại KH) | F (Logo) | G (Người đại diện) | H (SDT) | I (Tình trạng) | J (NV phụ trách) | K (Ghi chú) | L (Ngày tạo) | M (Người tạo) | N (Update) |
|--------|------------|---------------|----------------|--------------|----------|-------------------|---------|----------------|------------------|-------------|--------------|---------------|------------|

### Sheet "NHAP_KHO" (cột A-N):
| A (ID) | B (Loại nhập) | C (Ngày nhập) | D (KH ID) | E (Tên KH) | F (Mã HĐ) | G (SL SP) | H (SL xuất) | I (Tài xế) | J (Nội dung) | K (Ghi chú) | L (Ngày tạo) | M (Người tạo) | N (Update) |
|--------|--------------|---------------|-----------|------------|-----------|-----------|-------------|------------|--------------|-------------|--------------|---------------|------------|

### Sheet "XUAT_KHO" (cột A-N):
| A (ID) | B (Loại xuất) | C (Ngày xuất) | D (KH ID) | E (Tên KH) | F (Mã HĐ) | G (SL SP) | H (SL xuất) | I (Tài xế) | J (Nội dung) | K (Ghi chú) | L (Ngày tạo) | M (Người tạo) | N (Update) |
|--------|--------------|---------------|-----------|------------|-----------|-----------|-------------|------------|--------------|-------------|--------------|---------------|------------|

### Sheet "NHAP_KHO_CT" (cột A-R) - Chi tiết nhập kho:
| A (ID) | B (Nhập kho ID) | C (Ngày nhập) | D (SP ID) | E (Tên SP) | F (Nhóm SP) | G (Hãng SX) | H (Hình ảnh) | I (Thông tin) | J (Quy cách) | K (ĐVT) | L (SL tồn) | M (Kho ID) | N (SL nhập) | O (Ghi chú) | P (Ngày tạo) | Q (Người tạo) | R (Update) |

### Sheet "XUAT_KHO_CT" (cột A-R) - Chi tiết xuất kho:
| A (ID) | B (Xuất kho ID) | C (Ngày xuất) | D (SP ID) | E (Tên SP) | F (Nhóm SP) | G (Hãng SX) | H (Hình ảnh) | I (Thông tin) | J (Quy cách) | K (ĐVT) | L (SL tồn) | M (Kho ID) | N (SL xuất) | O (Ghi chú) | P (Ngày tạo) | Q (Người tạo) | R (Update) |

## Lưu ý bảo mật

- **Không commit** file JSON private key lên git
- **Sử dụng .env** để lưu thông tin nhạy cảm
- **Giới hạn quyền** của service account chỉ cho Google Sheets
- **Backup dữ liệu** thường xuyên 