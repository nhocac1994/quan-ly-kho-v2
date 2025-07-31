# Hướng dẫn bật Realtime Sync

## Vấn đề
Hiện tại ứng dụng chưa có realtime sync giữa các thiết bị. Khi một thiết bị thay đổi dữ liệu, các thiết bị khác không tự động cập nhật mà phải refresh trang.

## Giải pháp
Bật realtime trong Supabase để dữ liệu tự động đồng bộ giữa các thiết bị.

## Các bước thực hiện

### 1. Truy cập Supabase Dashboard
- Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
- Chọn project của bạn

### 2. Mở SQL Editor
- Vào menu **SQL Editor** trong sidebar bên trái
- Click **New query**

### 3. Chạy script bật realtime
Copy và paste script sau vào SQL Editor:

```sql
-- Bật realtime cho tất cả các bảng
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound_shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE outbound_shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE company_info;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

### 4. Chạy script
- Click **Run** để thực thi script
- Đợi script hoàn thành

### 5. Kiểm tra trạng thái
Chạy script sau để kiểm tra:

```sql
-- Kiểm tra các bảng đã được bật realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### 6. Test realtime
- Mở ứng dụng trên 2 thiết bị khác nhau
- Tạo/sửa/xóa dữ liệu trên một thiết bị
- Kiểm tra xem thiết bị kia có tự động cập nhật không

## Lưu ý
- Realtime chỉ hoạt động khi có kết nối internet
- Một số thay đổi có thể mất vài giây để đồng bộ
- Nếu vẫn không hoạt động, kiểm tra console để xem lỗi

## Troubleshooting

### Lỗi "Publication does not exist"
Nếu gặp lỗi này, chạy script sau trước:

```sql
-- Tạo publication nếu chưa có
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
```

### Lỗi "Table does not exist"
Đảm bảo các bảng đã được tạo trước khi bật realtime.

### Kiểm tra kết nối
Trong Dashboard của ứng dụng, component `RealtimeStatus` sẽ hiển thị trạng thái kết nối realtime.

## Kết quả mong đợi
Sau khi bật realtime:
- ✅ Dữ liệu tự động đồng bộ giữa các thiết bị
- ✅ Không cần refresh trang để thấy thay đổi
- ✅ Trải nghiệm người dùng mượt mà hơn 