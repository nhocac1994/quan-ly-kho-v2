# Hướng dẫn thiết lập Supabase Database cho Quản Lý Kho V2

## ⚠️ QUAN TRỌNG: Cập nhật Schema (nếu đã có database cũ)

Nếu bạn đã có database Supabase cũ, hãy chạy lệnh SQL sau để cập nhật schema:

```sql
-- Cập nhật bảng shipment_headers để thêm các field mới
ALTER TABLE shipment_headers 
ADD COLUMN IF NOT EXISTS driver VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_kien_hang INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Cập nhật bảng shipment_items để thêm trường kien_hang
ALTER TABLE shipment_items 
ADD COLUMN IF NOT EXISTS kien_hang INTEGER DEFAULT 1;
```

Hoặc sử dụng file `UPDATE_SHIPMENT_HEADERS.sql` đã được tạo sẵn.

## Bước 1: Tạo Supabase Project

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Chọn organization
4. Đặt tên project (ví dụ: `quan-ly-kho-v2`)
5. Đặt database password
6. Chọn region gần nhất
7. Click **Create new project**

## Bước 2: Lấy thông tin kết nối

1. Vào **Settings** > **API**
2. Copy **Project URL** và **anon public** key
3. Cập nhật vào file `.env`:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Bước 3: Tạo Database Schema

1. Vào **SQL Editor**
2. Click **New query**
3. Copy và paste script sau:

```sql
-- =====================================================
-- TẠO DATABASE SCHEMA CHO ỨNG DỤNG QUẢN LÝ KHO V2
-- =====================================================

-- Tạo bảng company_info (Thông tin công ty)
CREATE TABLE IF NOT EXISTS company_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten_cong_ty VARCHAR(255) NOT NULL,
  ten_day_du VARCHAR(500),
  loai_cong_ty VARCHAR(100),
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  website VARCHAR(255),
  logo TEXT,
  ghi_chu TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng users (Người dùng)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ho_va_ten VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  chuc_vu VARCHAR(100),
  phan_quyen VARCHAR(50) DEFAULT 'User',
  sdt VARCHAR(20),
  dia_chi TEXT,
  trang_thai VARCHAR(50) DEFAULT 'Hoạt động',
  ghi_chu TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng suppliers (Nhà cung cấp)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten_nha_cung_cap VARCHAR(255) NOT NULL,
  hien_thi VARCHAR(10) DEFAULT 'Có',
  ten_day_du VARCHAR(500),
  loai_ncc VARCHAR(100),
  logo TEXT,
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  website VARCHAR(255),
  ma_so_thue VARCHAR(50),
  tinh_trang VARCHAR(50) DEFAULT 'Hoạt động',
  nv_phu_trach VARCHAR(255),
  ghi_chu TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng customers (Khách hàng)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten_khach_hang VARCHAR(255) NOT NULL,
  hien_thi VARCHAR(10) DEFAULT 'Có',
  ten_day_du VARCHAR(500),
  loai_khach_hang VARCHAR(100),
  logo TEXT,
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  tinh_trang VARCHAR(50) DEFAULT 'Hoạt động',
  nv_phu_trach VARCHAR(255),
  ghi_chu TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng products (Sản phẩm)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  san_pham_id VARCHAR(100) UNIQUE NOT NULL,
  ten_san_pham VARCHAR(255) NOT NULL,
  kho_id VARCHAR(100),
  ten_kho VARCHAR(255),
  dvt VARCHAR(50),
  sl_ton INTEGER DEFAULT 0,
  hien_thi VARCHAR(10) DEFAULT 'Có',
  ghi_chu TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng shipment_headers (Phiếu nhập/xuất kho)
CREATE TABLE IF NOT EXISTS shipment_headers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id VARCHAR(100) UNIQUE NOT NULL,
  shipment_type VARCHAR(20) NOT NULL CHECK (shipment_type IN ('inbound', 'outbound')),
  shipment_date DATE NOT NULL,
  supplier_id VARCHAR(100),
  supplier_name VARCHAR(255),
  customer_id VARCHAR(100),
  customer_name VARCHAR(255),
  driver VARCHAR(255),                    -- Tài xế
  import_type VARCHAR(100),              -- Loại nhập/xuất
  content TEXT,                          -- Nội dung
  notes TEXT,                            -- Ghi chú
  total_quantity INTEGER DEFAULT 0,      -- Tổng số lượng
  total_kien_hang INTEGER DEFAULT 0,     -- Tổng kiện hàng
  total_amount DECIMAL(15,2) DEFAULT 0,  -- Tổng tiền
  status VARCHAR(50) DEFAULT 'active',   -- Trạng thái
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng shipment_items (Chi tiết sản phẩm trong phiếu)
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_header_id UUID NOT NULL REFERENCES shipment_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  quantity INTEGER NOT NULL,
  kien_hang INTEGER DEFAULT 1,           -- Số kiện hàng
  unit_price DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TẠO INDEXES ĐỂ TỐI ƯU HIỆU SUẤT
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_san_pham_id ON products(san_pham_id);
CREATE INDEX IF NOT EXISTS idx_products_ten_san_pham ON products(ten_san_pham);
CREATE INDEX IF NOT EXISTS idx_products_hien_thi ON products(hien_thi);

CREATE INDEX IF NOT EXISTS idx_suppliers_ten_nha_cung_cap ON suppliers(ten_nha_cung_cap);
CREATE INDEX IF NOT EXISTS idx_suppliers_hien_thi ON suppliers(hien_thi);
CREATE INDEX IF NOT EXISTS idx_suppliers_tinh_trang ON suppliers(tinh_trang);

CREATE INDEX IF NOT EXISTS idx_customers_ten_khach_hang ON customers(ten_khach_hang);
CREATE INDEX IF NOT EXISTS idx_customers_hien_thi ON customers(hien_thi);
CREATE INDEX IF NOT EXISTS idx_customers_tinh_trang ON customers(tinh_trang);

CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_id ON shipment_headers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_type ON shipment_headers(shipment_type);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_date ON shipment_headers(shipment_date);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_supplier_name ON shipment_headers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_customer_name ON shipment_headers(customer_name);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_header_id ON shipment_items(shipment_header_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id ON shipment_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_code ON shipment_items(product_code);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Thông tin công ty
INSERT INTO company_info (ten_cong_ty, ten_day_du, loai_cong_ty, nguoi_dai_dien, sdt, email, dia_chi) 
VALUES (
  'Công ty TNHH Quản Lý Kho V2', 
  'Công ty TNHH Quản Lý Kho V2', 
  'Công ty công nghệ', 
  'Nguyễn Văn Admin', 
  '0123456789',
  'admin@company.com',
  '123 Đường ABC, Quận 1, TP.HCM'
) ON CONFLICT DO NOTHING;

-- Người dùng
INSERT INTO users (ho_va_ten, email, chuc_vu, phan_quyen, sdt) 
VALUES 
  ('Admin', 'admin@company.com', 'Quản trị viên', 'Admin', '0123456789'),
  ('Nhân viên kho', 'nhanvien@company.com', 'Nhân viên kho', 'User', '0987654321')
ON CONFLICT DO NOTHING;

-- Sản phẩm mẫu
INSERT INTO products (san_pham_id, ten_san_pham, kho_id, ten_kho, dvt, sl_ton, ghi_chu) 
VALUES 
  ('SP001', 'Laptop Dell Inspiron 15', 'KHO1', 'Kho chính', 'Cái', 10, 'Laptop văn phòng'),
  ('SP002', 'Chuột không dây Logitech', 'KHO1', 'Kho chính', 'Cái', 50, 'Chuột máy tính'),
  ('SP003', 'Bàn phím cơ', 'KHO1', 'Kho chính', 'Cái', 30, 'Bàn phím gaming'),
  ('SP004', 'Màn hình 24 inch', 'KHO1', 'Kho chính', 'Cái', 15, 'Màn hình LED'),
  ('SP005', 'Ổ cứng SSD 500GB', 'KHO1', 'Kho chính', 'Cái', 25, 'Ổ cứng thể rắn'),
  ('SP006', 'RAM DDR4 8GB', 'KHO1', 'Kho chính', 'Thanh', 40, 'Bộ nhớ RAM'),
  ('SP007', 'Card đồ họa GTX 1660', 'KHO1', 'Kho chính', 'Cái', 8, 'Card màn hình'),
  ('SP008', 'Nguồn máy tính 500W', 'KHO1', 'Kho chính', 'Cái', 20, 'Nguồn ATX')
ON CONFLICT DO NOTHING;

-- Nhà cung cấp mẫu
INSERT INTO suppliers (ten_nha_cung_cap, ten_day_du, loai_ncc, nguoi_dai_dien, sdt, email, dia_chi, tinh_trang) 
VALUES 
  ('Công ty TNHH ABC', 'Công ty TNHH ABC', 'Nhà cung cấp thiết bị', 'Nguyễn Văn A', '0123456789', 'abc@company.com', 'Hà Nội', 'Hoạt động'),
  ('Công ty TNHH XYZ', 'Công ty TNHH XYZ', 'Nhà cung cấp linh kiện', 'Trần Thị B', '0987654321', 'xyz@company.com', 'TP.HCM', 'Hoạt động'),
  ('Công ty TNHH DEF', 'Công ty TNHH DEF', 'Nhà cung cấp phụ kiện', 'Lê Văn C', '0111222333', 'def@company.com', 'Đà Nẵng', 'Hoạt động')
ON CONFLICT DO NOTHING;

-- Khách hàng mẫu
INSERT INTO customers (ten_khach_hang, ten_day_du, loai_khach_hang, nguoi_dai_dien, sdt, email, dia_chi, tinh_trang) 
VALUES 
  ('Khách hàng VIP 1', 'Công ty TNHH VIP 1', 'Khách hàng VIP', 'Phạm Văn D', '0999888777', 'vip1@customer.com', 'TP.HCM', 'Hoạt động'),
  ('Khách hàng thường 1', 'Công ty TNHH Thường 1', 'Khách hàng thường', 'Hoàng Thị E', '0888777666', 'thuong1@customer.com', 'Hà Nội', 'Hoạt động'),
  ('Khách hàng VIP 2', 'Công ty TNHH VIP 2', 'Khách hàng VIP', 'Vũ Văn F', '0777666555', 'vip2@customer.com', 'Đà Nẵng', 'Hoạt động')
ON CONFLICT DO NOTHING;

-- Phiếu nhập kho mẫu
INSERT INTO shipment_headers (shipment_id, shipment_type, shipment_date, supplier_id, supplier_name, content, notes) 
VALUES 
  ('NK001', 'inbound', '2024-01-01', 'SUP001', 'Công ty TNHH ABC', 'Nhập kho lần đầu', 'Nhập hàng đầu năm'),
  ('NK002', 'inbound', '2024-01-05', 'SUP002', 'Công ty TNHH XYZ', 'Nhập bổ sung', 'Bổ sung hàng tồn kho'),
  ('NK003', 'inbound', '2024-01-10', 'SUP003', 'Công ty TNHH DEF', 'Nhập theo đơn hàng', 'Nhập theo đơn hàng số 001')
ON CONFLICT DO NOTHING;

-- Phiếu xuất kho mẫu
INSERT INTO shipment_headers (shipment_id, shipment_type, shipment_date, customer_id, customer_name, content, notes) 
VALUES 
  ('XK001', 'outbound', '2024-01-02', 'CUS001', 'Khách hàng VIP 1', 'Xuất kho bán hàng', 'Xuất theo đơn hàng số 001'),
  ('XK002', 'outbound', '2024-01-06', 'CUS002', 'Khách hàng thường 1', 'Xuất kho bán hàng', 'Xuất theo đơn hàng số 002'),
  ('XK003', 'outbound', '2024-01-12', 'CUS003', 'Khách hàng VIP 2', 'Xuất kho bán hàng', 'Xuất theo đơn hàng số 003')
ON CONFLICT DO NOTHING;

-- Chi tiết phiếu nhập kho
INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'NK001'),
  (SELECT id FROM products WHERE san_pham_id = 'SP001'),
  'SP001',
  'Laptop Dell Inspiron 15',
  'Cái',
  5,
  15000000,
  'Laptop văn phòng'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'NK001'),
  (SELECT id FROM products WHERE san_pham_id = 'SP002'),
  'SP002',
  'Chuột không dây Logitech',
  'Cái',
  20,
  500000,
  'Chuột máy tính'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'NK002'),
  (SELECT id FROM products WHERE san_pham_id = 'SP003'),
  'SP003',
  'Bàn phím cơ',
  'Cái',
  15,
  2000000,
  'Bàn phím gaming'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'NK003'),
  (SELECT id FROM products WHERE san_pham_id = 'SP004'),
  'SP004',
  'Màn hình 24 inch',
  'Cái',
  8,
  3000000,
  'Màn hình LED'
ON CONFLICT DO NOTHING;

-- Chi tiết phiếu xuất kho
INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'XK001'),
  (SELECT id FROM products WHERE san_pham_id = 'SP001'),
  'SP001',
  'Laptop Dell Inspiron 15',
  'Cái',
  2,
  16000000,
  'Bán cho khách VIP'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'XK002'),
  (SELECT id FROM products WHERE san_pham_id = 'SP002'),
  'SP002',
  'Chuột không dây Logitech',
  'Cái',
  10,
  600000,
  'Bán cho khách thường'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price, notes) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'XK003'),
  (SELECT id FROM products WHERE san_pham_id = 'SP003'),
  'SP003',
  'Bàn phím cơ',
  'Cái',
  5,
  2200000,
  'Bán cho khách VIP'
ON CONFLICT DO NOTHING;

-- =====================================================
-- TẠO FUNCTIONS VÀ TRIGGERS
-- =====================================================

-- Function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo triggers cho tất cả các bảng
CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON company_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipment_headers_updated_at BEFORE UPDATE ON shipment_headers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipment_items_updated_at BEFORE UPDATE ON shipment_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để tự động cập nhật số lượng tồn kho khi có phiếu nhập/xuất
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Khi thêm item mới
        IF EXISTS (SELECT 1 FROM shipment_headers WHERE id = NEW.shipment_header_id AND shipment_type = 'inbound') THEN
            -- Phiếu nhập: tăng tồn kho
            UPDATE products 
            SET sl_ton = sl_ton + NEW.quantity 
            WHERE id = NEW.product_id;
        ELSIF EXISTS (SELECT 1 FROM shipment_headers WHERE id = NEW.shipment_header_id AND shipment_type = 'outbound') THEN
            -- Phiếu xuất: giảm tồn kho
            UPDATE products 
            SET sl_ton = sl_ton - NEW.quantity 
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Khi cập nhật item
        IF EXISTS (SELECT 1 FROM shipment_headers WHERE id = NEW.shipment_header_id AND shipment_type = 'inbound') THEN
            -- Phiếu nhập: cập nhật tồn kho
            UPDATE products 
            SET sl_ton = sl_ton - OLD.quantity + NEW.quantity 
            WHERE id = NEW.product_id;
        ELSIF EXISTS (SELECT 1 FROM shipment_headers WHERE id = NEW.shipment_header_id AND shipment_type = 'outbound') THEN
            -- Phiếu xuất: cập nhật tồn kho
            UPDATE products 
            SET sl_ton = sl_ton + OLD.quantity - NEW.quantity 
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Khi xóa item
        IF EXISTS (SELECT 1 FROM shipment_headers WHERE id = OLD.shipment_header_id AND shipment_type = 'inbound') THEN
            -- Phiếu nhập: giảm tồn kho
            UPDATE products 
            SET sl_ton = sl_ton - OLD.quantity 
            WHERE id = OLD.product_id;
        ELSIF EXISTS (SELECT 1 FROM shipment_headers WHERE id = OLD.shipment_header_id AND shipment_type = 'outbound') THEN
            -- Phiếu xuất: tăng tồn kho
            UPDATE products 
            SET sl_ton = sl_ton + OLD.quantity 
            WHERE id = OLD.product_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Tạo trigger cho shipment_items
CREATE TRIGGER update_stock_on_shipment_item_change
    AFTER INSERT OR UPDATE OR DELETE ON shipment_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

4. Click **Run** để thực thi

## Bước 4: Bật Realtime (Khuyến nghị)

Để có realtime sync giữa các thiết bị, chạy script sau:

```sql
-- Bật realtime cho tất cả các bảng
ALTER PUBLICATION supabase_realtime ADD TABLE company_info;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_headers;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_items;
```

## Bước 5: Cấu hình RLS (Row Level Security) - Tùy chọn

Nếu muốn bảo mật dữ liệu, bật RLS:

```sql
-- Bật RLS cho tất cả các bảng
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép tất cả (cho development)
CREATE POLICY "Allow all" ON company_info FOR ALL USING (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON shipment_headers FOR ALL USING (true);
CREATE POLICY "Allow all" ON shipment_items FOR ALL USING (true);
```

## Bước 6: Test kết nối

1. Chạy ứng dụng: `npm start`
2. Vào Dashboard
3. Kiểm tra các chức năng:
   - ✅ Quản lý sản phẩm
   - ✅ Quản lý nhà cung cấp
   - ✅ Quản lý khách hàng
   - ✅ Nhập kho
   - ✅ Xuất kho
   - ✅ Báo cáo xuất nhập tồn
   - ✅ Lịch sử giao dịch

## Cấu trúc Database

### Bảng chính:
- **company_info**: Thông tin công ty
- **users**: Người dùng hệ thống
- **suppliers**: Nhà cung cấp
- **customers**: Khách hàng
- **products**: Sản phẩm
- **shipment_headers**: Phiếu nhập/xuất kho
- **shipment_items**: Chi tiết sản phẩm trong phiếu

### Tính năng tự động:
- ✅ **Auto update timestamp**: Tự động cập nhật `updated_at`
- ✅ **Auto stock management**: Tự động cập nhật tồn kho khi nhập/xuất
- ✅ **Cascade delete**: Xóa phiếu sẽ xóa chi tiết
- ✅ **Indexes**: Tối ưu hiệu suất truy vấn

### Sample Data:
- ✅ 8 sản phẩm mẫu
- ✅ 3 nhà cung cấp mẫu
- ✅ 3 khách hàng mẫu
- ✅ 3 phiếu nhập kho mẫu
- ✅ 3 phiếu xuất kho mẫu
- ✅ Chi tiết phiếu đầy đủ

## Troubleshooting

### Lỗi "relation does not exist"
- Đảm bảo đã chạy script tạo bảng
- Kiểm tra tên bảng có đúng không

### Lỗi "permission denied"
- Kiểm tra API key có đúng không
- Đảm bảo RLS policy cho phép truy cập

### Lỗi realtime
- Kiểm tra đã bật realtime cho các bảng chưa

### Lỗi trigger
- Kiểm tra function `update_product_stock()` đã được tạo
- Kiểm tra trigger đã được gắn vào bảng `shipment_items`

## Kết quả

Sau khi hoàn thành:
- ✅ Database đã được tạo với đầy đủ bảng và relationships
- ✅ Sample data đã được insert với dữ liệu thực tế
- ✅ Triggers tự động cập nhật tồn kho
- ✅ Indexes tối ưu hiệu suất
- ✅ Realtime sync đã được bật (nếu chọn)
- ✅ Ứng dụng có thể kết nối và hoạt động đầy đủ 