# Hướng dẫn sử dụng trang Auto Sync

## 🎯 **Tổng quan**

Trang "Quản lý Auto Sync" đã được cập nhật để hỗ trợ chuyển đổi linh hoạt giữa:
- **Supabase**: Database PostgreSQL với realtime sync
- **Mock Data**: Dữ liệu mẫu cho development/testing

## 🔧 **Các thành phần chính**

### 1. **Data Source Switcher**
- **Vị trí**: Ở đầu trang, ngay dưới tiêu đề
- **Chức năng**: Chuyển đổi giữa Supabase và Mock Data
- **Cách sử dụng**: 
  - Bật switch để sử dụng Supabase
  - Tắt switch để sử dụng Mock Data

### 2. **Thông báo thông tin**
- **Supabase**: Hiển thị thông tin về realtime sync, không có rate limiting
- **Mock Data**: Cảnh báo về dữ liệu chỉ lưu trong memory

### 3. **Cài đặt Auto Sync**
- **Chỉ hiển thị khi dùng Supabase**
- **Bật Auto Sync**: Kích hoạt realtime sync
- **Interval**: Thời gian giữa các lần sync (10s - 5m)
- **Các nút điều khiển**: Bắt đầu, Dừng, Sync thủ công

### 4. **Trạng thái kết nối**
- **Nguồn dữ liệu**: Hiển thị Supabase hoặc Mock Data
- **Kết nối Supabase**: Trạng thái kết nối database
- **Realtime**: Trạng thái realtime subscriptions
- **Auto Sync**: Trạng thái auto sync
- **Đang xử lý**: Có đang sync hay không

### 5. **Supabase Realtime Status**
- **Chỉ hiển thị khi dùng Supabase**
- **Trạng thái từng bảng**: Products, Suppliers, Customers, etc.
- **Thông tin kết nối**: Số lượng subscriptions, lỗi

### 6. **Thống kê**
- **Lần sync**: Số lần đã sync
- **Nguồn dữ liệu**: Supabase hoặc Mock Data
- **Interval**: Thời gian sync (chỉ Supabase)
- **Kết nối**: Trạng thái kết nối

## 🚀 **Cách sử dụng**

### **Chuyển sang Supabase**
1. Mở trang "Quản lý Auto Sync"
2. Tìm Data Source Switcher ở đầu trang
3. Bật switch "Sử dụng Supabase"
4. Cấu hình environment variables:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Reload trang để áp dụng

### **Chuyển sang Mock Data**
1. Tắt switch "Sử dụng Supabase" trong Data Source Switcher
2. Reload trang
3. Ứng dụng sẽ sử dụng dữ liệu mẫu

### **Cấu hình Auto Sync (Supabase)**
1. Đảm bảo đang sử dụng Supabase
2. Bật "Bật Auto Sync (Realtime)"
3. Điều chỉnh interval (10s - 5m)
4. Nhấn "Bắt đầu" để khởi động
5. Theo dõi trạng thái trong phần "Trạng thái"

## 📊 **Theo dõi trạng thái**

### **Supabase Realtime Status**
- **Màu xanh**: Kết nối thành công
- **Màu vàng**: Đang kết nối
- **Màu đỏ**: Có lỗi kết nối

### **Thông tin chi tiết**
- **Realtime subscriptions**: Số bảng đã kết nối realtime
- **Lỗi kết nối**: Số lỗi hiện tại
- **Trạng thái tổng**: Hoạt động bình thường/Có lỗi/Đang kết nối

## 🔧 **Troubleshooting**

### **Lỗi "Cannot connect to Supabase"**
1. Kiểm tra environment variables
2. Kiểm tra internet connection
3. Kiểm tra Supabase project status
4. Chuyển sang Mock Data để test

### **Realtime không hoạt động**
1. Kiểm tra Supabase Realtime Status
2. Đảm bảo đã enable realtime cho các bảng
3. Kiểm tra RLS policies
4. Reload trang

### **Auto Sync không chạy**
1. Đảm bảo đang sử dụng Supabase
2. Kiểm tra "Bật Auto Sync" đã được bật
3. Kiểm tra interval không quá ngắn
4. Xem logs trong console

## 🎯 **Best Practices**

### **Development**
- Sử dụng Mock Data cho development nhanh
- Test với Supabase trước khi deploy
- Sử dụng interval ngắn (10-30s) cho testing

### **Production**
- Luôn sử dụng Supabase
- Set interval phù hợp (60s-5m)
- Monitor realtime status
- Backup data regularly

### **Testing**
- Test với cả hai data sources
- Verify realtime functionality
- Test error handling
- Test auto sync intervals

## 📝 **Lưu ý quan trọng**

1. **Mock Data**: Dữ liệu sẽ mất khi reload trang
2. **Supabase**: Cần cấu hình environment variables
3. **Auto Sync**: Chỉ hoạt động với Supabase
4. **Realtime**: Tự động cập nhật UI khi có thay đổi
5. **Performance**: Supabase tốt hơn cho production

## 🎉 **Kết luận**

Với trang Auto Sync mới, bạn có thể:
- ✅ Chuyển đổi linh hoạt giữa Supabase và Mock Data
- ✅ Theo dõi trạng thái realtime chi tiết
- ✅ Cấu hình auto sync phù hợp
- ✅ Debug dễ dàng với thông tin trạng thái
- ✅ Phát triển nhanh với Mock Data
- ✅ Deploy production với Supabase

Chọn nguồn dữ liệu phù hợp và tận hưởng trải nghiệm quản lý kho tốt hơn! 