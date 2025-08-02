# 🔧 Giải quyết vấn đề Sync Count cao

## Vấn đề
Số lần sync (sync count) có thể tăng rất cao do:
- Auto sync interval quá ngắn
- Vòng lặp vô hạn trong useEffect
- Realtime subscriptions trigger quá nhiều

## Giải pháp đã áp dụng

### 1. Tăng interval mặc định
- Từ 30 giây → 60 giây (1 phút)
- Giảm số lần sync không cần thiết

### 2. Sửa vòng lặp vô hạn
- Loại bỏ `startAutoSync` và `stopAutoSync` khỏi dependency array
- Tránh re-render liên tục

### 3. Lưu sync count vào localStorage
- Sync count được lưu và khôi phục khi refresh trang
- Tránh mất dữ liệu khi reload

### 4. Thêm nút reset
- Nút màu cam trong AutoSyncStatus component
- Reset sync count về 0 khi cần

## Cách sử dụng

### Reset sync count thủ công:
1. Mở Developer Tools (F12)
2. Vào Console tab
3. Chạy lệnh:
```javascript
localStorage.setItem('supabase_auto_sync_syncCount', '0');
window.location.reload();
```

### Hoặc sử dụng nút trong UI:
1. Vào trang AutoSync
2. Click nút màu cam (Reset số lần sync)
3. Xác nhận reset

### Điều chỉnh interval:
1. Vào trang AutoSync
2. Chọn interval phù hợp (khuyến nghị: 60s hoặc cao hơn)
3. Auto sync sẽ tự động điều chỉnh

## Khuyến nghị

### Interval tối ưu:
- **Development**: 30-60 giây
- **Production**: 60-300 giây (1-5 phút)
- **Low activity**: 300-600 giây (5-10 phút)

### Monitoring:
- Kiểm tra sync count định kỳ
- Reset nếu quá cao (>1000)
- Điều chỉnh interval theo nhu cầu

## Troubleshooting

### Sync count vẫn tăng nhanh:
1. Kiểm tra console log
2. Tắt auto sync tạm thời
3. Kiểm tra realtime subscriptions
4. Reset và thử lại

### Auto sync không hoạt động:
1. Kiểm tra kết nối Supabase
2. Kiểm tra realtime status
3. Refresh trang
4. Kiểm tra localStorage config 