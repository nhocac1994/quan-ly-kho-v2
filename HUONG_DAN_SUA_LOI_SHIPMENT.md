# 🔧 Hướng Dẫn Sửa Lỗi Shipment Items

## 🚨 Vấn Đề Hiện Tại

Lỗi `operator does not exist: uuid = text` xảy ra vì:
- Bảng `shipment_items` có trường `product_id` kiểu `VARCHAR(100)`
- Code đang gửi `UUID` từ bảng `products`
- PostgreSQL không thể so sánh `UUID` với `VARCHAR`

## 📋 Các Bước Sửa Lỗi

### Bước 1: Truy cập Supabase SQL Editor
1. Đăng nhập vào Supabase Dashboard
2. Vào project của bạn
3. Chọn **SQL Editor** từ menu bên trái

### Bước 2: Kiểm Tra Tình Trạng Hiện Tại

**Chạy script kiểm tra trước:**

```sql
-- Chạy file: CHECK_SHIPMENT_STATUS.sql
-- Hoặc copy nội dung từ file đó
```

### Bước 3: Thực hiện Script Sửa Lỗi

**Chạy script này theo thứ tự:**

```sql
-- 1. Tạo backup (an toàn)
CREATE TABLE IF NOT EXISTS shipment_items_backup AS 
SELECT * FROM shipment_items;

-- 2. Thêm cột mới với kiểu UUID
ALTER TABLE shipment_items 
ADD COLUMN IF NOT EXISTS product_uuid UUID;

-- 3. Cập nhật dữ liệu từ products table (sử dụng JOIN thay vì regex)
UPDATE shipment_items 
SET product_uuid = p.id
FROM products p
WHERE shipment_items.product_id = p.san_pham_id;

-- 4. Kiểm tra kết quả
SELECT 
  COUNT(*) as total_updated,
  COUNT(product_uuid) as with_uuid,
  COUNT(*) - COUNT(product_uuid) as without_uuid
FROM shipment_items;

-- 5. Xóa cột cũ và đổi tên cột mới
ALTER TABLE shipment_items DROP COLUMN IF EXISTS product_id;
ALTER TABLE shipment_items RENAME COLUMN product_uuid TO product_id;

-- 6. Thêm foreign key constraint
ALTER TABLE shipment_items 
ADD CONSTRAINT fk_shipment_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7. Cập nhật indexes
DROP INDEX IF EXISTS idx_shipment_items_product_id;
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id ON shipment_items(product_id);
```

### Bước 4: Cập Nhật Các Hàm SQL

**Chạy script cập nhật functions:**

```sql
-- Cập nhật hàm calculate_product_stock
CREATE OR REPLACE FUNCTION calculate_product_stock(product_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_inbound INTEGER;
  total_outbound INTEGER;
BEGIN
  SELECT COALESCE(SUM(si.quantity), 0) INTO total_inbound
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE si.product_id = product_id_param
  AND sh.shipment_type = 'inbound';

  SELECT COALESCE(SUM(si.quantity), 0) INTO total_outbound
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE si.product_id = product_id_param
  AND sh.shipment_type = 'outbound';

  RETURN total_inbound - total_outbound;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật view product_stock_fixed
CREATE OR REPLACE VIEW product_stock_fixed AS
SELECT 
  p.id,
  p.san_pham_id,
  p.ten_san_pham,
  p.kho_id,
  p.ten_kho,
  p.dvt,
  p.sl_ton as current_stock,
  COALESCE(inbound.total_quantity, 0) as total_inbound,
  COALESCE(outbound.total_quantity, 0) as total_outbound,
  COALESCE(inbound.total_quantity, 0) - COALESCE(outbound.total_quantity, 0) as calculated_stock
FROM products p
LEFT JOIN (
  SELECT 
    si.product_id,
    SUM(si.quantity) as total_quantity
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE sh.shipment_type = 'inbound'
  GROUP BY si.product_id
) inbound ON p.id = inbound.product_id
LEFT JOIN (
  SELECT 
    si.product_id,
    SUM(si.quantity) as total_quantity
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE sh.shipment_type = 'outbound'
  GROUP BY si.product_id
) outbound ON p.id = outbound.product_id;

-- Cập nhật trigger
CREATE OR REPLACE FUNCTION update_product_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_single_product_stock(NEW.product_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM update_single_product_stock(OLD.product_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock ON shipment_items;
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT OR UPDATE OR DELETE ON shipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_trigger();
```

### Bước 5: Kiểm Tra Kết Quả

```sql
-- Kiểm tra cấu trúc cuối cùng
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'shipment_items' 
AND column_name = 'product_id';

-- Kiểm tra dữ liệu
SELECT 
  si.id,
  si.product_id,
  p.san_pham_id,
  p.ten_san_pham,
  si.quantity
FROM shipment_items si
LEFT JOIN products p ON si.product_id = p.id
LIMIT 5;

-- Test tính stock
SELECT 
  p.san_pham_id,
  p.ten_san_pham,
  p.sl_ton as current_stock,
  calculate_product_stock(p.id) as calculated_stock
FROM products p
LIMIT 5;
```

## ✅ Kết Quả Mong Đợi

Sau khi thực hiện xong:
- ✅ `product_id` trong `shipment_items` sẽ có kiểu `UUID`
- ✅ Foreign key constraint được tạo
- ✅ Các hàm tính stock hoạt động bình thường
- ✅ Trigger tự động cập nhật stock
- ✅ Không còn lỗi `uuid = text`

## 🔄 Rollback (Nếu Cần)

Nếu có vấn đề, có thể khôi phục từ backup:

```sql
-- Khôi phục từ backup
DROP TABLE shipment_items;
CREATE TABLE shipment_items AS SELECT * FROM shipment_items_backup;
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra output của từng bước
2. Đảm bảo không có lỗi syntax
3. Kiểm tra quyền truy cập database
4. Liên hệ support nếu cần 