# 🚀 Hướng Dẫn Cập Nhật Tính Năng Kiện Hàng

## 📋 Tổng Quan

Tính năng **Kiện Hàng** đã được thêm vào hệ thống Quản Lý Kho để theo dõi số lượng kiện hàng trong mỗi phiếu nhập kho. Điều này giúp quản lý chi tiết hơn về cách hàng hóa được đóng gói và vận chuyển.

## 🔄 Các Thay Đổi Đã Thực Hiện

### 1. **Database Schema**
- ✅ Thêm trường `total_kien_hang` vào bảng `shipment_headers`
- ✅ Thêm trường `kien_hang` vào bảng `shipment_items`
- ✅ Tạo indexes để tối ưu hiệu suất

### 2. **Giao Diện Người Dùng**
- ✅ Thêm cột "Tổng Kiện Hàng" vào bảng chính
- ✅ Hiển thị kiện hàng trong mobile view
- ✅ Thêm thống kê tổng kiện hàng
- ✅ Cập nhật form thêm/sửa phiếu nhập

### 3. **Chức Năng In Phiếu**
- ✅ Thêm cột "Kiện hàng" vào phiếu in
- ✅ Hiển thị tổng kiện hàng trong phiếu

### 4. **Import Excel**
- ✅ Hỗ trợ import kiện hàng từ Excel
- ✅ Tự động tính tổng kiện hàng khi import

## 🛠️ Cách Cập Nhật Database

### Bước 1: Chạy Script SQL
1. Vào **Supabase Dashboard** > **SQL Editor**
2. Tạo query mới
3. Copy và paste nội dung từ file `UPDATE_KIEN_HANG_SCHEMA.sql`
4. Chạy script

### Bước 2: Kiểm Tra Kết Quả
```sql
-- Kiểm tra xem các trường đã được thêm chưa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shipment_headers' 
AND column_name IN ('total_kien_hang');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shipment_items' 
AND column_name IN ('kien_hang');
```

## 📊 Cấu Trúc Excel Import Mới

Khi import Excel, cấu trúc cột mới như sau:

| Cột | Mô tả | Ví dụ |
|-----|-------|-------|
| A | Mã phiếu | PNK080825_302 |
| B | Ngày nhập | 2025-08-08 |
| C | Loại nhập | Nhập hàng |
| D | Mã sản phẩm | SP001 |
| E | Tên sản phẩm | Laptop Dell |
| F | Đơn vị tính | Cái |
| G | Số lượng | 10 |
| H | **Kiện hàng** | **5** |
| I | Ghi chú | Hàng mới |
| J | Mã NCC | NCC001 |
| K | Tên NCC | Công ty ABC |
| L | Tài xế | Nguyễn Văn A |
| M | Nội dung nhập | Nhập hàng tháng 8 |

## 🎯 Tính Năng Mới

### 1. **Hiển Thị Kiện Hàng**
- Bảng chính hiển thị cột "Tổng Kiện Hàng"
- Mobile view hiển thị thông tin kiện hàng
- Thống kê tổng kiện hàng toàn hệ thống

### 2. **Quản Lý Kiện Hàng**
- Nhập số kiện hàng cho từng sản phẩm
- Tự động tính tổng kiện hàng cho phiếu
- Hiển thị trong chi tiết phiếu

### 3. **In Phiếu**
- Phiếu in bao gồm cột kiện hàng
- Tổng kiện hàng được hiển thị rõ ràng

## 🔍 Kiểm Tra Sau Cập Nhật

### 1. **Kiểm Tra Database**
```sql
-- Kiểm tra dữ liệu mẫu
SELECT 
  shipment_id,
  total_quantity,
  total_kien_hang
FROM shipment_headers 
LIMIT 5;
```

### 2. **Kiểm Tra Giao Diện**
- ✅ Bảng chính hiển thị cột "Tổng Kiện Hàng"
- ✅ Form thêm/sửa có trường kiện hàng
- ✅ Mobile view hiển thị kiện hàng
- ✅ In phiếu có thông tin kiện hàng

### 3. **Kiểm Tra Import**
- ✅ Import Excel với cột kiện hàng
- ✅ Dữ liệu được lưu đúng
- ✅ Tổng kiện hàng được tính chính xác

## 🚨 Lưu Ý Quan Trọng

1. **Backup Database**: Luôn backup database trước khi chạy script cập nhật
2. **Test Environment**: Test trên môi trường dev trước khi áp dụng production
3. **Dữ Liệu Hiện Có**: Các phiếu cũ sẽ có kiện hàng = 1 (mặc định)
4. **Excel Template**: Cập nhật template Excel để bao gồm cột kiện hàng

## 📞 Hỗ Trợ

Nếu gặp vấn đề trong quá trình cập nhật:
1. Kiểm tra logs trong Supabase
2. Xem console browser để debug
3. Liên hệ team phát triển

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: 2025-01-XX  
**Tác giả**: Development Team 