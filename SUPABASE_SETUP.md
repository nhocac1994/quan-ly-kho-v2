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

-- Tạo bảng inbound_shipments
CREATE TABLE IF NOT EXISTS inbound_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  xuat_kho_id VARCHAR(100) NOT NULL,
  ngay_nhap DATE NOT NULL,
  san_pham_id VARCHAR(100) NOT NULL,
  ten_san_pham VARCHAR(255),
  nhom_san_pham VARCHAR(100),
  hang_sx VARCHAR(100),
  hinh_anh TEXT,
  thong_tin TEXT,
  quy_cach VARCHAR(255),
  dvt VARCHAR(50),
  sl_nhap INTEGER NOT NULL,
  ghi_chu TEXT,
  nha_cung_cap_id VARCHAR(100),
  ten_nha_cung_cap VARCHAR(255),
  dia_chi TEXT,
  so_dt VARCHAR(20),
  noi_dung_nhap TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng outbound_shipments
CREATE TABLE IF NOT EXISTS outbound_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  xuat_kho_id VARCHAR(100) NOT NULL,
  ngay_xuat DATE NOT NULL,
  san_pham_id VARCHAR(100) NOT NULL,
  ten_san_pham VARCHAR(255),
  nhom_san_pham VARCHAR(100),
  hang_sx VARCHAR(100),
  hinh_anh TEXT,
  thong_tin TEXT,
  quy_cach VARCHAR(255),
  dvt VARCHAR(50),
  sl_xuat INTEGER NOT NULL,
  ghi_chu TEXT,
  so_hd VARCHAR(100),
  ma_kh VARCHAR(100),
  ten_khach_hang VARCHAR(255),
  dia_chi TEXT,
  so_dt VARCHAR(20),
  noi_dung_xuat TEXT,
  ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nguoi_tao VARCHAR(255) DEFAULT 'Admin',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_products_san_pham_id ON products(san_pham_id);
CREATE INDEX IF NOT EXISTS idx_inbound_shipments_ngay_nhap ON inbound_shipments(ngay_nhap);
CREATE INDEX IF NOT EXISTS idx_outbound_shipments_ngay_xuat ON outbound_shipments(ngay_xuat);

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
```

4. Click **Run** để thực thi

## Bước 4: Bật Realtime (Tùy chọn)

Để có realtime sync giữa các thiết bị, chạy script sau:

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

## Bước 5: Cấu hình RLS (Row Level Security)

Nếu muốn bảo mật dữ liệu, bật RLS:

```sql
-- Bật RLS cho tất cả các bảng
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_shipments ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép tất cả (cho development)
CREATE POLICY "Allow all" ON company_info FOR ALL USING (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON inbound_shipments FOR ALL USING (true);
CREATE POLICY "Allow all" ON outbound_shipments FOR ALL USING (true);
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