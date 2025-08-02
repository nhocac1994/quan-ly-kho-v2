# 📊 Hướng dẫn quản lý Supabase Free Tier Usage

## 🎯 Giới hạn Free Tier

### **Database:**
- **Database size**: 500MB
- **Database requests**: 50,000 requests/month
- **Database connections**: 2 connections

### **Auth:**
- **Users**: 50,000 users
- **Auth requests**: 50,000 requests/month

### **Storage:**
- **Storage size**: 1GB
- **Storage requests**: 50,000 requests/month

### **Edge Functions:**
- **Function invocations**: 500,000 invocations/month
- **Function execution time**: 10 seconds max

### **Realtime:**
- **Realtime connections**: 2 connections
- **Realtime messages**: 2,000 messages/month

## 🔍 Cách kiểm tra Usage

### **Bước 1: Supabase Dashboard**
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **Usage** hoặc **Billing** → **Usage**

### **Bước 2: Sử dụng SQL Functions**
Chạy script `supabase-usage-functions.sql` trong SQL Editor:

```sql
-- Kiểm tra kích thước database
SELECT get_database_size();

-- Kiểm tra kích thước từng bảng
SELECT * FROM get_table_sizes();

-- Lấy thống kê tổng quan
SELECT * FROM get_usage_summary();

-- Lấy thống kê chi tiết từng bảng
SELECT * FROM get_table_details();
```

### **Bước 3: Sử dụng Node.js Script**
```bash
node check-supabase-usage.js
```

## 📈 Cách tối ưu Usage

### **1. Tối ưu Database Size**

#### **Xóa dữ liệu cũ:**
```sql
-- Xóa inbound/outbound shipments cũ (> 90 ngày)
SELECT * FROM cleanup_old_data(90);

-- Xóa dữ liệu test
DELETE FROM products WHERE ten_san_pham LIKE '%test%';
DELETE FROM suppliers WHERE ten_nha_cung_cap LIKE '%test%';
```

#### **Sử dụng indexes:**
```sql
-- Tạo indexes cho các cột thường query
CREATE INDEX IF NOT EXISTS idx_products_ten_san_pham ON products(ten_san_pham);
CREATE INDEX IF NOT EXISTS idx_suppliers_ten_ncc ON suppliers(ten_nha_cung_cap);
CREATE INDEX IF NOT EXISTS idx_customers_ten_kh ON customers(ten_khach_hang);
```

### **2. Tối ưu Requests**

#### **Sử dụng pagination:**
```typescript
// Thay vì lấy tất cả
const { data } = await supabase.from('products').select('*');

// Sử dụng pagination
const { data } = await supabase
  .from('products')
  .select('*')
  .range(0, 49); // Lấy 50 records đầu
```

#### **Sử dụng select cụ thể:**
```typescript
// Thay vì select tất cả
const { data } = await supabase.from('products').select('*');

// Chỉ select cần thiết
const { data } = await supabase
  .from('products')
  .select('id, ten_san_pham, sl_ton');
```

### **3. Tối ưu Realtime**

#### **Chỉ subscribe khi cần:**
```typescript
// Chỉ subscribe khi component mount
useEffect(() => {
  const subscription = supabase
    .channel('products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 🛠️ Monitoring Tools

### **1. Supabase Dashboard**
- **Usage**: Xem usage realtime
- **Logs**: Xem logs requests
- **Performance**: Xem performance metrics

### **2. Custom Monitoring**
```typescript
// Thêm monitoring vào app
const monitorRequest = async (table: string, operation: string) => {
  console.log(`[${new Date().toISOString()}] ${operation} on ${table}`);
  
  // Có thể gửi đến analytics service
  // analytics.track('supabase_request', { table, operation });
};
```

### **3. Alerts**
```typescript
// Kiểm tra usage định kỳ
const checkUsage = async () => {
  const { data } = await supabase.rpc('get_usage_summary');
  
  data.forEach(metric => {
    if (metric.percentage_used > 80) {
      console.warn(`⚠️ ${metric.metric} đã sử dụng ${metric.percentage_used}%`);
    }
  });
};
```

## 🚨 Cảnh báo khi gần giới hạn

### **Database Size > 400MB (80%)**
- Xóa dữ liệu cũ
- Nén dữ liệu
- Cân nhắc upgrade plan

### **Requests > 40,000/month (80%)**
- Tối ưu queries
- Sử dụng caching
- Giảm số lượng requests

### **Realtime Messages > 1,600/month (80%)**
- Giảm số lượng subscriptions
- Sử dụng polling thay vì realtime
- Tối ưu message frequency

## 💡 Best Practices

### **1. Regular Cleanup**
```sql
-- Tạo cron job để cleanup hàng tuần
-- Xóa dữ liệu > 90 ngày
SELECT cleanup_old_data(90);
```

### **2. Monitor Growth**
```sql
-- Kiểm tra growth rate hàng tháng
SELECT 
  DATE_TRUNC('month', ngay_tao) as month,
  COUNT(*) as new_records
FROM inbound_shipments
GROUP BY month
ORDER BY month;
```

### **3. Optimize Queries**
```sql
-- Sử dụng EXPLAIN để analyze queries
EXPLAIN SELECT * FROM products WHERE ten_san_pham LIKE '%laptop%';
```

### **4. Use Caching**
```typescript
// Cache data trong localStorage
const getCachedProducts = () => {
  const cached = localStorage.getItem('products_cache');
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};
```

## 📊 Usage Reports

### **Weekly Report:**
```sql
-- Tạo weekly usage report
SELECT 
  'Weekly Usage Report' as report_type,
  get_database_size() as db_size,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM suppliers) as total_suppliers,
  NOW() as report_date;
```

### **Monthly Growth:**
```sql
-- Theo dõi growth hàng tháng
SELECT 
  DATE_TRUNC('month', ngay_tao) as month,
  COUNT(*) as new_records,
  pg_size_pretty(pg_database_size(current_database())) as db_size
FROM inbound_shipments
GROUP BY month
ORDER BY month;
```

## 🔧 Troubleshooting

### **Lỗi "Database size limit exceeded"**
1. Chạy cleanup script
2. Xóa dữ liệu test
3. Nén dữ liệu
4. Cân nhắc upgrade

### **Lỗi "Request limit exceeded"**
1. Kiểm tra queries không cần thiết
2. Sử dụng caching
3. Tối ưu pagination
4. Giảm realtime subscriptions

### **Lỗi "Realtime limit exceeded"**
1. Giảm số lượng subscriptions
2. Sử dụng polling
3. Tối ưu message frequency

## 📞 Hỗ trợ

- **Supabase Docs**: https://supabase.com/docs
- **Pricing**: https://supabase.com/pricing
- **Community**: https://github.com/supabase/supabase/discussions

---

**💡 Lưu ý**: Free tier đủ cho hầu hết ứng dụng nhỏ và vừa. Nếu cần nhiều hơn, cân nhắc upgrade lên Pro plan ($25/month). 