# Hướng dẫn thiết lập Supabase Database

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
-- Tạo bảng company_info
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

-- Tạo bảng users
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

-- Tạo bảng suppliers
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

-- Tạo bảng customers
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

-- Tạo bảng products
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

-- Tạo bảng shipment_headers (thông tin chung của phiếu)
CREATE TABLE IF NOT EXISTS shipment_headers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id VARCHAR(100) UNIQUE NOT NULL,
  shipment_type VARCHAR(20) NOT NULL CHECK (shipment_type IN ('inbound', 'outbound')),
  shipment_date DATE NOT NULL,
  supplier_id VARCHAR(100),
  supplier_name VARCHAR(255),
  customer_id VARCHAR(100),
  customer_name VARCHAR(255),
  content TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng shipment_items (chi tiết sản phẩm trong phiếu)
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_header_id UUID NOT NULL REFERENCES shipment_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_products_san_pham_id ON products(san_pham_id);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_id ON shipment_headers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_type ON shipment_headers(shipment_type);
CREATE INDEX IF NOT EXISTS idx_shipment_headers_shipment_date ON shipment_headers(shipment_date);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_header_id ON shipment_items(shipment_header_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id ON shipment_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id_uuid ON shipment_items(product_id);

-- Insert sample data
INSERT INTO company_info (ten_cong_ty, ten_day_du, loai_cong_ty, nguoi_dai_dien, sdt) 
VALUES ('Công ty TNHH ABC', 'Công ty TNHH ABC', 'Công ty công nghệ', 'Nguyễn Văn A', '0123456789')
ON CONFLICT DO NOTHING;

INSERT INTO users (ho_va_ten, email, chuc_vu, phan_quyen) 
VALUES ('Admin', 'admin@company.com', 'Quản trị viên', 'Admin')
ON CONFLICT DO NOTHING;

INSERT INTO products (san_pham_id, ten_san_pham, kho_id, ten_kho, dvt, sl_ton) 
VALUES ('SP001', 'Laptop Dell Inspiron', 'KHO1', 'Kho chính', 'Cái', 10)
ON CONFLICT DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (ten_nha_cung_cap, sdt, email, dia_chi) 
VALUES ('Công ty ABC', '0123456789', 'abc@company.com', 'Hà Nội')
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (ten_khach_hang, sdt, email, dia_chi) 
VALUES ('Khách hàng XYZ', '0987654321', 'xyz@customer.com', 'TP.HCM')
ON CONFLICT DO NOTHING;

-- Insert sample shipment headers
INSERT INTO shipment_headers (shipment_id, shipment_type, shipment_date, supplier_id, supplier_name, content) 
VALUES ('NK001', 'inbound', '2024-01-01', 'SUP001', 'Công ty ABC', 'Nhập kho lần đầu')
ON CONFLICT DO NOTHING;

INSERT INTO shipment_headers (shipment_id, shipment_type, shipment_date, customer_id, customer_name, content) 
VALUES ('XK001', 'outbound', '2024-01-02', 'CUS001', 'Khách hàng XYZ', 'Xuất kho bán hàng')
ON CONFLICT DO NOTHING;

-- Insert sample shipment items
INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'NK001'),
  'SP001',
  'SP001',
  'Laptop Dell Inspiron',
  'Cái',
  5,
  15000000
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_header_id, product_id, product_code, product_name, unit, quantity, unit_price) 
SELECT 
  (SELECT id FROM shipment_headers WHERE shipment_id = 'XK001'),
  'SP001',
  'SP001',
  'Laptop Dell Inspiron',
  'Cái',
  2,
  16000000
ON CONFLICT DO NOTHING;
```

4. Click **Run** để thực thi

## Bước 4: Bật Realtime (Tùy chọn)

Để có realtime sync giữa các thiết bị, chạy script sau:

```sql
-- Bật realtime cho tất cả các bảng
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_headers;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_items;
ALTER PUBLICATION supabase_realtime ADD TABLE company_info;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

## Bước 5: Cấu hình RLS (Row Level Security)

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
3. Kiểm tra component `RealtimeStatus`
4. Thử tạo/sửa/xóa dữ liệu

## Troubleshooting

### Lỗi "relation does not exist"
- Đảm bảo đã chạy script tạo bảng
- Kiểm tra tên bảng có đúng không

### Lỗi "permission denied"
- Kiểm tra API key có đúng không
- Đảm bảo RLS policy cho phép truy cập

### Lỗi realtime
- Xem file `REALTIME_SETUP.md` để biết chi tiết

## Kết quả

Sau khi hoàn thành:
- ✅ Database đã được tạo với đầy đủ bảng
- ✅ Sample data đã được insert
- ✅ Realtime sync đã được bật (nếu chọn)
- ✅ Ứng dụng có thể kết nối và hoạt động 