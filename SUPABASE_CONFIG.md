# Hướng dẫn cấu hình Supabase cho Quản lý kho

## ✅ **Trạng thái hiện tại**
- ✅ Database schema đã được tạo thành công
- ✅ Dependencies đã được cài đặt (`@supabase/supabase-js`)
- ✅ TypeScript types đã được cập nhật
- ✅ Build thành công không có lỗi

## 🔧 **Bước tiếp theo: Cấu hình Environment Variables**

### 1. Tạo file `.env.local`

Tạo file `.env.local` trong thư mục gốc của project:

```bash
# Trong thư mục quan-ly-kho-v2
touch .env.local
```

### 2. Thêm cấu hình Supabase

Copy nội dung từ `env-template.txt` và cập nhật với thông tin thực tế của bạn:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Google Sheets (giữ lại để backup)
REACT_APP_GOOGLE_SPREADSHEET_ID=1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig
REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL=mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com
REACT_APP_GOOGLE_API_KEY=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og
```

### 3. Lấy thông tin từ Supabase Dashboard

1. **Đăng nhập vào Supabase Dashboard**
2. **Chọn project** của bạn
3. **Vào Settings > API**
4. **Copy các thông tin sau:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `your-anon-key-here`

## 🚀 **Bước tiếp theo: Tích hợp vào ứng dụng**

### 1. Cập nhật App.tsx

Thêm SupabaseProvider vào App.tsx:

```tsx
import { SupabaseProvider } from './contexts/SupabaseContext';

function App() {
  return (
    <SupabaseProvider>
      {/* Các components khác */}
    </SupabaseProvider>
  );
}
```

### 2. Test kết nối

Tạo component test để kiểm tra kết nối:

```tsx
import { useSupabase } from './contexts/SupabaseContext';

const TestConnection = () => {
  const { products, loading, errors } = useSupabase();
  
  return (
    <div>
      <h3>Test Supabase Connection</h3>
      {loading.products ? (
        <p>Đang tải...</p>
      ) : errors.products ? (
        <p>Lỗi: {errors.products}</p>
      ) : (
        <p>Kết nối thành công! Có {products.length} sản phẩm</p>
      )}
    </div>
  );
};
```

## 🔄 **Migration dữ liệu từ Google Sheets**

### 1. Chạy migration script

```typescript
import { MigrationHelper } from './utils/migrationHelper';

const migrateData = async () => {
  const migrationHelper = new MigrationHelper((progress) => {
    console.log('Migration progress:', progress);
  });
  
  const result = await migrationHelper.migrateAllData();
  console.log('Migration result:', result);
};
```

### 2. Hoặc sử dụng component migration

Tạo component để migration dữ liệu:

```tsx
import { MigrationHelper } from '../utils/migrationHelper';

const MigrationComponent = () => {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState([]);
  
  const handleMigration = async () => {
    setMigrating(true);
    const migrationHelper = new MigrationHelper(setProgress);
    const result = await migrationHelper.migrateAllData();
    setMigrating(false);
    console.log('Migration completed:', result);
  };
  
  return (
    <div>
      <button onClick={handleMigration} disabled={migrating}>
        {migrating ? 'Đang migration...' : 'Bắt đầu migration'}
      </button>
      {progress.map((p, i) => (
        <div key={i}>
          {p.table}: {p.current}/{p.total} - {p.status}
        </div>
      ))}
    </div>
  );
};
```

## 🧪 **Testing**

### 1. Test kết nối cơ bản

```bash
npm start
```

Mở browser và kiểm tra console để xem:
- ✅ "Supabase connection successful"
- ✅ "Setting up Supabase realtime subscriptions..."

### 2. Test CRUD operations

```typescript
// Test tạo sản phẩm mới
const testCreateProduct = async () => {
  const { productsAPI } = await import('./services/supabaseService');
  
  const newProduct = {
    san_pham_id: 'TEST001',
    ten_san_pham: 'Sản phẩm test',
    kho_id: 'KHO1',
    ten_kho: 'Kho chính',
    dvt: 'Cái',
    sl_ton: 10,
    hien_thi: 'Có',
    ghi_chu: 'Sản phẩm test'
  };
  
  const result = await productsAPI.create(newProduct);
  console.log('Product created:', result);
};
```

### 3. Test realtime

1. Mở 2 tab browser
2. Tạo/sửa dữ liệu ở tab 1
3. Kiểm tra tab 2 có cập nhật tự động không

## 🔧 **Troubleshooting**

### Lỗi thường gặp:

1. **"Cannot find module '@supabase/supabase-js'"**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **"Invalid API key"**
   - Kiểm tra lại API key trong `.env.local`
   - Đảm bảo đã copy đúng anon public key

3. **"RLS policy error"**
   - Kiểm tra RLS policies trong Supabase dashboard
   - Hoặc tạm thời disable RLS cho testing

4. **"Realtime not working"**
   - Kiểm tra realtime settings trong Supabase dashboard
   - Đảm bảo đã enable realtime cho các bảng

### Debug mode:

```typescript
// Bật debug mode trong supabaseService.ts
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-debug': 'true'
    }
  }
});
```

## 📊 **Monitoring**

### Supabase Dashboard:
- **Database**: Xem logs và performance
- **Auth**: Quản lý users và sessions  
- **Storage**: Quản lý file uploads
- **Edge Functions**: Serverless functions

### Metrics quan trọng:
- Số lượng requests/giây
- Thời gian response
- Số lượng realtime connections
- Storage usage

## 🎯 **Kết luận**

Sau khi hoàn thành các bước trên:

1. ✅ **Database đã sẵn sàng**
2. ✅ **Code đã được cập nhật**
3. ✅ **Build thành công**
4. 🔄 **Cần cấu hình environment variables**
5. 🔄 **Cần test kết nối**
6. 🔄 **Cần migration dữ liệu**

Bạn đã sẵn sàng để chuyển sang Supabase với khả năng đồng bộ realtime tốt hơn! 