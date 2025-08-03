# 📊 Cấu Trúc Database - Hệ Thống Quản Lý Kho

## 🏗️ Sơ Đồ Tổng Quan

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   company_info  │    │      users      │    │    products     │
│                 │    │                 │    │                 │
│ • ten_cong_ty   │    │ • ho_va_ten     │    │ • san_pham_id   │
│ • ten_day_du    │    │ • email         │    │ • ten_san_pham  │
│ • loai_cong_ty  │    │ • chuc_vu       │    │ • kho_id        │
│ • nguoi_dai_dien│    │ • phan_quyen    │    │ • ten_kho       │
│ • sdt           │    │                 │    │ • dvt           │
└─────────────────┘    └─────────────────┘    │ • sl_ton        │
                                              └─────────────────┘
                                                       │
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    suppliers    │    │    customers    │    │ shipment_headers│
│                 │    │                 │    │                 │
│ • ten_nha_cung_c│    │ • ten_khach_hang│    │ • shipment_id   │
│ • loai_ncc      │    │ • loai_khach_hang│   │ • shipment_type │
│ • nguoi_dai_dien│    │ • nguoi_dai_dien│    │ • shipment_date │
│ • sdt           │    │ • sdt           │    │ • supplier_id   │
│ • email         │    │ • email         │    │ • supplier_name │
│ • dia_chi       │    │ • dia_chi       │    │ • customer_id   │
└─────────────────┘    └─────────────────┘    │ • customer_name │
                                              └─────────────────┘
                                                       │
                                                       │ 1:N
                                                       ▼
                                              ┌─────────────────┐
                                              │ shipment_items  │
                                              │                 │
                                              │ • product_id    │
                                              │ • product_code  │
                                              │ • product_name  │
                                              │ • unit          │
                                              │ • quantity      │
                                              │ • unit_price    │
                                              └─────────────────┘
```

## 📋 Chi Tiết Các Bảng

### 1. 🏢 **company_info** - Thông Tin Công Ty
```sql
CREATE TABLE company_info (
  id UUID PRIMARY KEY,
  ten_cong_ty VARCHAR(255),
  ten_day_du VARCHAR(500),
  loai_cong_ty VARCHAR(100),
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  website VARCHAR(255),
  ma_so_thue VARCHAR(50),
  logo TEXT,
  ngay_tao TIMESTAMP,
  nguoi_tao VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 2. 👥 **users** - Người Dùng Hệ Thống
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  ho_va_ten VARCHAR(255),
  email VARCHAR(255),
  chuc_vu VARCHAR(100),
  phan_quyen VARCHAR(50),
  trang_thai VARCHAR(50),
  ngay_tao TIMESTAMP,
  nguoi_tao VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 3. 📦 **products** - Sản Phẩm
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  san_pham_id VARCHAR(100) UNIQUE,  -- Mã sản phẩm (SP001, SP002...)
  ten_san_pham VARCHAR(255),
  kho_id VARCHAR(100),
  ten_kho VARCHAR(255),
  dvt VARCHAR(50),                  -- Đơn vị tính
  sl_ton INTEGER DEFAULT 0,         -- Số lượng tồn kho
  hien_thi VARCHAR(10),
  ghi_chu TEXT,
  ngay_tao TIMESTAMP,
  nguoi_tao VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 4. 🏭 **suppliers** - Nhà Cung Cấp
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  ten_nha_cung_cap VARCHAR(255),
  hien_thi VARCHAR(10),
  ten_day_du VARCHAR(500),
  loai_ncc VARCHAR(100),
  logo TEXT,
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  website VARCHAR(255),
  ma_so_thue VARCHAR(50),
  tinh_trang VARCHAR(50),
  nv_phu_trach VARCHAR(255),
  ghi_chu TEXT,
  ngay_tao TIMESTAMP,
  nguoi_tao VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 5. 👤 **customers** - Khách Hàng
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  ten_khach_hang VARCHAR(255),
  hien_thi VARCHAR(10),
  ten_day_du VARCHAR(500),
  loai_khach_hang VARCHAR(100),
  logo TEXT,
  nguoi_dai_dien VARCHAR(255),
  sdt VARCHAR(20),
  email VARCHAR(255),
  dia_chi TEXT,
  tinh_trang VARCHAR(50),
  nv_phu_trach VARCHAR(255),
  ghi_chu TEXT,
  ngay_tao TIMESTAMP,
  nguoi_tao VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 6. 📋 **shipment_headers** - Phiếu Nhập/Xuất Kho
```sql
CREATE TABLE shipment_headers (
  id UUID PRIMARY KEY,
  shipment_id VARCHAR(100) UNIQUE,  -- Mã phiếu (NK001, XK001...)
  shipment_type VARCHAR(20),        -- 'inbound' hoặc 'outbound'
  shipment_date DATE,
  supplier_id VARCHAR(100),         -- Liên kết với suppliers
  supplier_name VARCHAR(255),
  customer_id VARCHAR(100),         -- Liên kết với customers
  customer_name VARCHAR(255),
  content TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP
);
```

### 7. 📝 **shipment_items** - Chi Tiết Sản Phẩm Trong Phiếu
```sql
CREATE TABLE shipment_items (
  id UUID PRIMARY KEY,
  shipment_header_id UUID,          -- FK đến shipment_headers
  product_id VARCHAR(100),          -- Liên kết với products.san_pham_id
  product_code VARCHAR(100),
  product_name VARCHAR(255),
  unit VARCHAR(50),
  quantity INTEGER,
  unit_price DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP
);
```

## 🔗 Mối Quan Hệ Giữa Các Bảng

### **1. Quan Hệ 1:N (Một-Nhiều)**
```
shipment_headers (1) ────► shipment_items (N)
```

- **1 phiếu** có thể chứa **nhiều sản phẩm**
- **shipment_header_id** trong `shipment_items` tham chiếu đến `id` trong `shipment_headers`

### **2. Quan Hệ Tham Chiếu (Reference)**
```
products.san_pham_id ────► shipment_items.product_id
suppliers.id ────────────► shipment_headers.supplier_id
customers.id ───────────► shipment_headers.customer_id
```

### **3. Quan Hệ Logic (Không có FK)**
```
shipment_headers.supplier_name ────► suppliers.ten_nha_cung_cap
shipment_headers.customer_name ────► customers.ten_khach_hang
```

## 📊 Views và Functions

### **1. product_stock_fixed** - View Tính Tồn Kho
```sql
CREATE VIEW product_stock_fixed AS
SELECT 
  p.id,
  p.san_pham_id,
  p.ten_san_pham,
  p.kho_id,
  p.ten_kho,
  p.dvt,
  p.sl_ton as current_stock,
  COALESCE(inbound.total_inbound, 0) as total_inbound,
  COALESCE(outbound.total_outbound, 0) as total_outbound,
  GREATEST(0, COALESCE(inbound.total_inbound, 0) - COALESCE(outbound.total_outbound, 0)) as calculated_stock
FROM products p
LEFT JOIN (
  SELECT si.product_id, SUM(si.quantity) as total_inbound
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE sh.shipment_type = 'inbound'
  GROUP BY si.product_id
) inbound ON p.san_pham_id = inbound.product_id
LEFT JOIN (
  SELECT si.product_id, SUM(si.quantity) as total_outbound
  FROM shipment_items si
  JOIN shipment_headers sh ON si.shipment_header_id = sh.id
  WHERE sh.shipment_type = 'outbound'
  GROUP BY si.product_id
) outbound ON p.san_pham_id = outbound.product_id;
```

### **2. update_product_stock_fixed()** - Function Cập Nhật Tồn Kho
```sql
CREATE FUNCTION update_product_stock_fixed()
RETURNS VOID AS $$
DECLARE
  product_record RECORD;
  total_inbound INTEGER;
  total_outbound INTEGER;
  final_stock INTEGER;
BEGIN
  FOR product_record IN SELECT id, san_pham_id FROM products LOOP
    -- Tính tổng nhập
    SELECT COALESCE(SUM(si.quantity), 0) INTO total_inbound
    FROM shipment_items si
    JOIN shipment_headers sh ON si.shipment_header_id = sh.id
    WHERE si.product_id = product_record.san_pham_id
    AND sh.shipment_type = 'inbound';
    
    -- Tính tổng xuất
    SELECT COALESCE(SUM(si.quantity), 0) INTO total_outbound
    FROM shipment_items si
    JOIN shipment_headers sh ON si.shipment_header_id = sh.id
    WHERE si.product_id = product_record.san_pham_id
    AND sh.shipment_type = 'outbound';
    
    -- Cập nhật tồn kho
    final_stock := GREATEST(0, total_inbound - total_outbound);
    UPDATE products SET sl_ton = final_stock WHERE id = product_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Luồng Dữ Liệu

### **1. Nhập Kho (Inbound)**
```
1. Tạo shipment_headers (shipment_type = 'inbound')
2. Thêm shipment_items với quantity > 0
3. Function tự động cập nhật products.sl_ton
```

### **2. Xuất Kho (Outbound)**
```
1. Tạo shipment_headers (shipment_type = 'outbound')
2. Thêm shipment_items với quantity > 0
3. Function tự động cập nhật products.sl_ton
```

### **3. Tính Tồn Kho**
```
sl_ton = Tổng nhập - Tổng xuất
Tổng nhập = SUM(quantity) từ shipment_items JOIN shipment_headers WHERE shipment_type = 'inbound'
Tổng xuất = SUM(quantity) từ shipment_items JOIN shipment_headers WHERE shipment_type = 'outbound'
```

## 🔍 Indexes Quan Trọng

```sql
-- Indexes cho performance
CREATE INDEX idx_products_san_pham_id ON products(san_pham_id);
CREATE INDEX idx_shipment_headers_shipment_id ON shipment_headers(shipment_id);
CREATE INDEX idx_shipment_headers_shipment_type ON shipment_headers(shipment_type);
CREATE INDEX idx_shipment_headers_shipment_date ON shipment_headers(shipment_date);
CREATE INDEX idx_shipment_items_shipment_header_id ON shipment_items(shipment_header_id);
CREATE INDEX idx_shipment_items_product_id ON shipment_items(product_id);
```

## 📈 Dữ Liệu Mẫu

### **Products**
| san_pham_id | ten_san_pham | kho_id | ten_kho | dvt | sl_ton |
|-------------|--------------|--------|---------|-----|--------|
| SP001 | Laptop Dell Inspiron | KHO1 | Kho chính | Cái | 10 |
| SP002 | Chuột không dây | KHO1 | Kho chính | Cái | 50 |
| SP003 | Bàn phím cơ | KHO1 | Kho chính | Cái | 25 |

### **Shipment Headers**
| shipment_id | shipment_type | shipment_date | supplier_name | customer_name |
|-------------|---------------|---------------|---------------|---------------|
| NK001 | inbound | 2024-01-01 | Công ty ABC | - |
| XK001 | outbound | 2024-01-02 | - | Khách hàng XYZ |

### **Shipment Items**
| shipment_header_id | product_id | product_name | quantity | unit_price |
|-------------------|------------|--------------|----------|------------|
| NK001 | SP001 | Laptop Dell Inspiron | 5 | 15000000 |
| XK001 | SP001 | Laptop Dell Inspiron | 2 | 16000000 |

---

## 🎯 Tóm Tắt

✅ **7 bảng chính** với mối quan hệ rõ ràng  
✅ **1 view** để tính toán tồn kho real-time  
✅ **1 function** để cập nhật tồn kho tự động  
✅ **Indexes** tối ưu cho performance  
✅ **Dữ liệu mẫu** để test hệ thống  

Hệ thống được thiết kế để quản lý kho một cách hiệu quả với khả năng theo dõi nhập/xuất/tồn kho real-time! 🚀 