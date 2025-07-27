# 🔑 Setup API Key v4 - Đơn Giản

## ✅ Phương Pháp Đơn Giản

Sử dụng **API Key v4** thay vì OAuth 2.0 phức tạp. Chỉ cần:

1. **API Key** - Đã có sẵn
2. **Google Sheet ID** - Đã có sẵn  
3. **Chia sẻ Google Sheet** - Cần làm

## 🔧 Bước 1: Chia Sẻ Google Sheet

### **Cách 1: Chia sẻ công khai (Đơn giản nhất)**

1. **Mở Google Sheet**: `Database_QuanLyKho_V1`
2. **Click "Share"** (góc trên bên phải)
3. **Click "Change to anyone with the link"**
4. **Chọn "Editor"** (quyền chỉnh sửa)
5. **Click "Done"**

### **Cách 2: Chia sẻ với API Key domain**

1. **Vào Google Cloud Console**
2. **APIs & Services > Credentials**
3. **Tìm API Key**: `AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og`
4. **Click "Edit"**
5. **Thêm domain**: `localhost:3000` (cho development)

## 🔍 Test API Key

### **Test đọc dữ liệu:**
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/values/DM_SAN_PHAM!A1:L1?key=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og"
```

### **Test ghi dữ liệu:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"values":[["test"]]}' \
  "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/values/DM_SAN_PHAM!A:L:append?valueInputOption=RAW&key=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og"
```

## 📋 Environment Variables

File `.env` chỉ cần:

```env
REACT_APP_GOOGLE_SPREADSHEET_ID=1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig
REACT_APP_GOOGLE_API_KEY=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og
```

**Không cần:**
- ❌ Service Account Email
- ❌ Private Key
- ❌ OAuth 2.0
- ❌ JWT Authentication

## 🚀 Test Ứng Dụng

1. **Chia sẻ Google Sheet** (bước trên)
2. **Chạy ứng dụng**: `npm start`
3. **Thử thêm sản phẩm mới**
4. **Kiểm tra Google Sheet** - Dữ liệu sẽ xuất hiện

## ✅ Kết Quả Mong Đợi

```
✅ Google Sheets connection successful
✅ Data written successfully to Google Sheets
```

Và dữ liệu sẽ xuất hiện trong Google Sheet thật!

## 🔧 Troubleshooting

### **Lỗi 403 Forbidden:**
- Chia sẻ Google Sheet công khai
- Hoặc thêm domain vào API Key restrictions

### **Lỗi 400 Bad Request:**
- Kiểm tra API Key đúng
- Kiểm tra Sheet ID đúng

### **Lỗi CORS:**
- API Key không có CORS restrictions
- Hoặc thêm domain vào API Key

## 🎯 Ưu Điểm

- ✅ **Đơn giản** - Không cần OAuth 2.0
- ✅ **Nhanh** - Chỉ cần API Key
- ✅ **Dễ setup** - Chia sẻ Google Sheet
- ✅ **Hoạt động ngay** - Không cần backend

**Bây giờ hãy chia sẻ Google Sheet và test!** 🚀 