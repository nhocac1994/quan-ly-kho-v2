# 🔐 Service Account Authentication cho Write Operations

## ❌ Vấn đề Hiện Tại

Hiện tại ứng dụng có thể **đọc** dữ liệu từ Google Sheet nhưng **không thể ghi** do thiếu authentication đúng cách.

### Lỗi gặp phải:
```
❌ Failed to write data: 403 - Forbidden
```

## 🔧 Giải Pháp

### **Bước 1: Kiểm tra Service Account Permissions**

1. **Vào Google Cloud Console**:
   - Truy cập: https://console.cloud.google.com/
   - Chọn project: `ggsheetapi-432710`

2. **Kiểm tra Service Account**:
   - Vào "IAM & Admin" > "Service Accounts"
   - Tìm: `mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com`
   - Đảm bảo có role: `Editor` hoặc `Owner`

### **Bước 2: Kiểm tra Google Sheet Permissions**

1. **Mở Google Sheet**: `Database_QuanLyKho_V1`
2. **Chia sẻ với Service Account**:
   - Click "Share" (góc trên bên phải)
   - Thêm email: `mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com`
   - Quyền: **Editor**
   - Bỏ tick "Notify people"

### **Bước 3: Kiểm tra Google Sheets API**

1. **Vào Google Cloud Console** > "APIs & Services" > "Library"
2. **Tìm và enable**:
   - ✅ Google Sheets API
   - ✅ Google Drive API

### **Bước 4: Kiểm tra API Key Permissions**

1. **Vào "APIs & Services" > "Credentials"**
2. **Tìm API Key**: `AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og`
3. **Kiểm tra restrictions**:
   - Nếu có restrictions, đảm bảo cho phép Google Sheets API

## 🚀 Implement JWT Authentication

### **Option 1: Sử dụng JWT (Recommended)**

```typescript
// Thêm vào googleSheetsService.ts
import { jwtDecode } from 'jwt-decode';

const createJWT = async () => {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  // Sign JWT with private key
  // Implementation needed
};

const getAccessToken = async () => {
  const jwt = await createJWT();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const data = await response.json();
  return data.access_token;
};
```

### **Option 2: Sử dụng Google Auth Library (Node.js)**

```bash
npm install google-auth-library
```

```typescript
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  keyFile: 'path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const client = await auth.getClient();
const accessToken = await client.getAccessToken();
```

### **Option 3: Sử dụng Backend Proxy**

Tạo một backend API để handle authentication:

```javascript
// server.js
const express = require('express');
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  keyFile: './service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

app.post('/api/write-sheet', async (req, res) => {
  const client = await auth.getClient();
  // Write to Google Sheets
});
```

## 🔍 Debug Steps

### **1. Test Service Account Access**

```bash
# Test với curl
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/values/DM_SAN_PHAM!A1:L1"
```

### **2. Check Permissions**

```bash
# Test write permission
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"values":[["test"]]}' \
  "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/values/DM_SAN_PHAM!A:L:append?valueInputOption=RAW"
```

## 📋 Checklist

- [ ] Service Account có quyền Editor trên Google Sheet
- [ ] Google Sheets API được enable
- [ ] API Key có đúng permissions
- [ ] JWT authentication được implement
- [ ] Access token được generate thành công
- [ ] Write operations được test

## 🎯 Kết Quả Mong Đợi

Sau khi setup xong, bạn sẽ thấy:

```
✅ Data written successfully to Google Sheets
```

Thay vì:

```
❌ Failed to write data: 403 - Forbidden
```

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề, hãy:

1. **Kiểm tra console logs** trong browser
2. **Kiểm tra Network tab** để xem request/response
3. **Test với Postman** để verify API calls
4. **Kiểm tra Google Cloud Console** logs 