# 🔄 Auto Sync - Hướng Dẫn Sử Dụng

## ✅ Tính Năng Đã Thêm

Đã thêm **Auto Sync realtime** như ứng dụng cũ với các tính năng:

### 🎯 **Core Features:**
- ✅ **Auto sync mỗi 15 giây** (có thể điều chỉnh)
- ✅ **Sync từ Google Sheets** về ứng dụng
- ✅ **Cache dữ liệu** trong localStorage
- ✅ **Real-time updates** khi có thay đổi
- ✅ **Status indicator** trên thanh toolbar
- ✅ **Manual sync** khi cần thiết

### 🎛️ **Controls:**
- ✅ **Bật/Tắt** auto sync
- ✅ **Điều chỉnh interval** (5s - 60s)
- ✅ **Force sync** ngay lập tức
- ✅ **Manual sync** thủ công
- ✅ **Reset stats** thống kê

## 🚀 Cách Sử Dụng

### **1. Trạng Thái Auto Sync**
- **Icon trên toolbar**: Hiển thị trạng thái sync
- **Màu xanh**: Đang chạy bình thường
- **Màu đỏ**: Có lỗi
- **Màu vàng**: Đang xử lý
- **Màu xám**: Đã tắt

### **2. Trang Auto Sync**
- **Menu**: Auto Sync → Quản lý Auto Sync
- **Cài đặt**: Bật/tắt, điều chỉnh interval
- **Trạng thái**: Xem thông tin chi tiết
- **Thống kê**: Số lần sync, phiên bản dữ liệu

### **3. Cách Hoạt Động**
```
🔄 Auto Sync Flow:
1. Khởi động → Tải dữ liệu từ Google Sheets
2. Mỗi 15s → Kiểm tra thay đổi mới
3. Có thay đổi → Cập nhật localStorage
4. UI tự động refresh → Hiển thị dữ liệu mới
5. Thông báo → "Dữ liệu đã được cập nhật!"
```

## 🎛️ Cài Đặt

### **Interval Options:**
- **5 giây**: Sync nhanh nhất (có thể gây rate limit)
- **10 giây**: Cân bằng tốt
- **15 giây**: Mặc định (khuyến nghị)
- **30 giây**: Tiết kiệm tài nguyên
- **60 giây**: Chậm nhất

### **Storage Mode:**
- **localStorage**: Cache dữ liệu local
- **Real-time**: Cập nhật ngay khi có thay đổi
- **Hybrid**: Kết hợp cả hai

## 📊 Monitoring

### **Status Indicators:**
```
✅ Đã kết nối: Kết nối Google Sheets OK
🔄 Đang chạy: Auto sync đang hoạt động
⏳ Đang xử lý: Đang sync dữ liệu
❌ Lỗi: Có lỗi xảy ra
```

### **Statistics:**
- **Sync count**: Số lần sync thành công
- **Data version**: Phiên bản dữ liệu
- **Last sync**: Thời gian sync cuối
- **Last update**: Thời gian cập nhật cuối

## 🔧 Troubleshooting

### **Lỗi Kết Nối:**
```
❌ Mất kết nối Google Sheets
→ Kiểm tra internet
→ Kiểm tra Google Sheet permissions
→ Kiểm tra Service Account
```

### **Lỗi Sync:**
```
❌ Lỗi đồng bộ dữ liệu
→ Kiểm tra console logs
→ Thử manual sync
→ Reset auto sync
```

### **Rate Limiting:**
```
⚠️ Rate limit từ Google API
→ Tăng interval lên 30s-60s
→ Giảm số lần sync
→ Sử dụng manual sync
```

## 🎯 Best Practices

### **1. Interval Settings:**
- **Development**: 5-10 giây
- **Production**: 15-30 giây
- **High traffic**: 30-60 giây

### **2. Monitoring:**
- **Kiểm tra status icon** thường xuyên
- **Xem logs** trong console
- **Monitor sync count** tăng đều

### **3. Performance:**
- **Không sync quá nhanh** (tránh rate limit)
- **Sử dụng manual sync** khi cần thiết
- **Reset stats** định kỳ

## 🚀 Advanced Features

### **1. Manual Sync:**
- Click icon sync trên toolbar
- Vào trang Auto Sync → "Sync thủ công"
- Force sync ngay lập tức

### **2. Force Sync:**
- Bỏ qua rate limiting
- Sync ngay lập tức
- Dùng khi cần dữ liệu mới nhất

### **3. Reset Stats:**
- Xóa thống kê sync
- Reset counter về 0
- Dùng để monitor mới

## 📱 UI Components

### **1. AutoSyncStatusIcon:**
- Hiển thị trên toolbar
- Click để force sync
- Badge hiển thị số lần sync

### **2. AutoSyncStatus:**
- Component chi tiết
- Hiển thị trong trang Auto Sync
- Controls và thông tin

### **3. AutoSync Page:**
- Trang quản lý đầy đủ
- Cài đặt và monitoring
- Thống kê chi tiết

## 🎉 Kết Quả

Sau khi setup:
- ✅ **Real-time sync** mỗi 15 giây
- ✅ **Auto update UI** khi có thay đổi
- ✅ **Status monitoring** trực quan
- ✅ **Manual controls** linh hoạt
- ✅ **Error handling** tốt
- ✅ **Performance optimized**

**Bây giờ ứng dụng sẽ tự động cập nhật dữ liệu từ Google Sheets mỗi 15 giây!** 🚀 