# Hướng dẫn chuyển đổi nguồn dữ liệu

## 🎯 **Mục đích**

Ứng dụng hiện tại hỗ trợ chuyển đổi linh hoạt giữa các nguồn dữ liệu:
- **Supabase**: Database PostgreSQL với realtime sync
- **Mock Data**: Dữ liệu mẫu cho development/testing

## 🔧 **Cách sử dụng**

### 1. **Chuyển đổi qua UI (Khuyến nghị)**

1. Mở ứng dụng trong development mode
2. Tìm component `DataSourceSwitcher` (thường ở Dashboard hoặc Settings)
3. Sử dụng switch để chuyển đổi giữa:
   - ✅ **Bật**: Sử dụng Supabase
   - ❌ **Tắt**: Sử dụng Mock Data

### 2. **Chuyển đổi qua Environment Variables**

Tạo file `.env.local` và cấu hình:

```env
# Data Source Configuration
REACT_APP_DATA_SOURCE=supabase
# Options: 'supabase' | 'mock'

# Supabase Configuration (chỉ cần khi dùng supabase)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. **Chuyển đổi qua localStorage (Development)**

Mở browser console và chạy:

```javascript
// Chuyển sang Supabase
localStorage.setItem('REACT_APP_DATA_SOURCE', 'supabase');
window.location.reload();

// Chuyển sang Mock Data
localStorage.setItem('REACT_APP_DATA_SOURCE', 'mock');
window.location.reload();
```

## 📊 **So sánh các nguồn dữ liệu**

| Tính năng | Supabase | Mock Data |
|-----------|----------|-----------|
| **Realtime Sync** | ✅ Có | ❌ Không |
| **Persistent Storage** | ✅ Có | ❌ Không |
| **Setup Complexity** | 🔶 Trung bình | ✅ Dễ dàng |
| **Performance** | ✅ Tốt | ✅ Nhanh |
| **Offline Support** | ❌ Không | ✅ Có |
| **Development** | 🔶 Cần config | ✅ Sẵn sàng |

## 🚀 **Kịch bản sử dụng**

### **Development/Testing**
```env
REACT_APP_DATA_SOURCE=mock
```
- Không cần cấu hình Supabase
- Dữ liệu mẫu sẵn có
- Phát triển nhanh chóng

### **Production**
```env
REACT_APP_DATA_SOURCE=supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key
```
- Realtime sync giữa users
- Dữ liệu persistent
- Performance tốt

### **Hybrid Mode**
- Sử dụng UI switcher để test
- Chuyển đổi linh hoạt trong development
- Dễ dàng debug

## 🔍 **Kiểm tra trạng thái**

### **Console Logs**
```javascript
// Kiểm tra data source hiện tại
console.log('Current data source:', localStorage.getItem('REACT_APP_DATA_SOURCE'));

// Kiểm tra Supabase connection
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
```

### **UI Indicators**
- **DataSourceSwitcher** hiển thị trạng thái kết nối
- **RealtimeStatus** hiển thị trạng thái realtime
- **Error alerts** khi có lỗi kết nối

## 🛠 **Troubleshooting**

### **Lỗi "Cannot connect to Supabase"**
1. Kiểm tra environment variables
2. Kiểm tra internet connection
3. Kiểm tra Supabase project status
4. Chuyển sang Mock Data để test

### **Lỗi "Data not loading"**
1. Kiểm tra data source configuration
2. Clear localStorage và reload
3. Kiểm tra console errors

### **Performance Issues**
1. Chuyển sang Mock Data để test
2. Kiểm tra Supabase performance
3. Optimize queries

## 📝 **Best Practices**

### **Development**
- Sử dụng Mock Data cho development nhanh
- Test với Supabase trước khi deploy
- Sử dụng UI switcher để test

### **Production**
- Luôn sử dụng Supabase
- Monitor performance
- Backup data regularly

### **Testing**
- Test với cả hai data sources
- Verify realtime functionality
- Test error handling

## 🎯 **Kết luận**

Với data source switcher, bạn có thể:

1. ✅ **Phát triển nhanh** với Mock Data
2. ✅ **Test realtime** với Supabase
3. ✅ **Deploy production** với Supabase
4. ✅ **Debug dễ dàng** với UI switcher

Chọn nguồn dữ liệu phù hợp với nhu cầu hiện tại! 