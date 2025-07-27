# 📝 Google Apps Script Setup - Ghi Dữ Liệu Với API Key

## ❌ Vấn Đề

Google Sheets API v4 **không hỗ trợ API Key cho write operations**. Chỉ hỗ trợ OAuth 2.0 hoặc Service Account.

## ✅ Giải Pháp: Google Apps Script

Tạo **Google Apps Script Web App** để ghi dữ liệu với API Key đơn giản.

## 🔧 Bước 1: Tạo Google Apps Script

### **1. Mở Google Apps Script**
- Truy cập: https://script.google.com/
- Click **"New project"**

### **2. Đặt tên project**
- Đổi tên thành: `QuanLyKho_WebApp`

### **3. Copy code sau:**

```javascript
function doPost(e) {
  try {
    // Parse request data
    const data = JSON.parse(e.postData.contents);
    const { action, spreadsheetId, range, values } = data;
    
    // Get spreadsheet
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(range.split('!')[0]);
    
    if (action === 'append') {
      // Append values to sheet
      const lastRow = sheet.getLastRow();
      const targetRange = sheet.getRange(lastRow + 1, 1, values.length, values[0].length);
      targetRange.setValues(values);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Data appended successfully',
          rowsAdded: values.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'QuanLyKho WebApp is running'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### **4. Save project**
- Click **"Save"** (Ctrl+S)
- Đặt tên: `QuanLyKho_WebApp`

## 🔧 Bước 2: Deploy Web App

### **1. Deploy**
- Click **"Deploy"** > **"New deployment"**
- Click **"Select type"** > **"Web app"**

### **2. Cấu hình**
- **Description**: `QuanLyKho v1.0`
- **Execute as**: `Me`
- **Who has access**: `Anyone`
- Click **"Deploy"**

### **3. Authorize**
- Click **"Authorize access"**
- Chọn Google account
- Click **"Advanced"** > **"Go to QuanLyKho_WebApp (unsafe)**
- Click **"Allow"**

### **4. Copy Web App URL**
- Copy URL: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
- Lưu lại để dùng trong code

## 🔧 Bước 3: Cập Nhật Frontend

### **1. Cập nhật googleSheetsService.ts**

```typescript
const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

const appendSheetData = async (range: string, values: any[][]): Promise<void> => {
  try {
    console.log('Writing data to Google Sheets via Apps Script:', { range, values });
    
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'append',
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        values: values
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Data written successfully to Google Sheets:', result);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to write data:', errorData);
      throw new Error(`Failed to write data: ${response.status} - ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
};
```

### **2. Thêm vào .env**

```env
REACT_APP_GOOGLE_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 🧪 Test Web App

### **1. Test với curl:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "action": "append",
    "spreadsheetId": "1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig",
    "range": "DM_SAN_PHAM!A:L",
    "values": [["test123", "SP999", "Test Product", "KHO1", "Kho Test", "Cái", "100", "Có", "Test via Apps Script", "2024-01-01", "Admin", "2024-01-01"]]
  }' \
  'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
```

### **2. Test trong browser:**

```javascript
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'append',
    spreadsheetId: '1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig',
    range: 'DM_SAN_PHAM!A:L',
    values: [['test123', 'SP999', 'Test Product', 'KHO1', 'Kho Test', 'Cái', '100', 'Có', 'Test via Apps Script', '2024-01-01', 'Admin', '2024-01-01']]
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## ✅ Kết Quả Mong Đợi

```
✅ Data written successfully to Google Sheets: {
  success: true,
  message: "Data appended successfully",
  rowsAdded: 1
}
```

Và dữ liệu sẽ xuất hiện trong Google Sheet!

## 🎯 Ưu Điểm

- ✅ **Đơn giản** - Không cần OAuth 2.0
- ✅ **API Key friendly** - Hoạt động với API Key
- ✅ **Dễ setup** - Chỉ cần Google Apps Script
- ✅ **Miễn phí** - Google Apps Script free tier

## 📞 Troubleshooting

### **Lỗi CORS:**
- Google Apps Script tự động handle CORS
- Không cần cấu hình thêm

### **Lỗi Authorization:**
- Đảm bảo deploy với "Anyone" access
- Kiểm tra authorization đã được approve

### **Lỗi 404:**
- Kiểm tra Web App URL đúng
- Đảm bảo Web App đã được deploy

**Bây giờ hãy tạo Google Apps Script và test!** 🚀 