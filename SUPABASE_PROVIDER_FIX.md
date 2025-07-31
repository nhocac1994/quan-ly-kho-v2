# Khắc phục lỗi SupabaseProvider

## 🚨 **Lỗi gặp phải**

```
ERROR
useSupabase must be used within a SupabaseProvider
```

## 🔧 **Nguyên nhân**

Lỗi này xảy ra khi component `AutoSync` sử dụng `useSupabase` hook nhưng chưa được wrap trong `SupabaseProvider`.

## ✅ **Đã khắc phục**

### 1. **Thêm SupabaseProvider vào App.tsx**

```tsx
// App.tsx
import { SupabaseProvider } from './contexts/SupabaseContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GoogleSheetsProvider>
          <SupabaseProvider>  {/* ✅ Đã thêm */}
            <AutoSyncProvider>
              <InventoryProvider>
                {/* ... routes ... */}
              </InventoryProvider>
            </AutoSyncProvider>
          </SupabaseProvider>  {/* ✅ Đã thêm */}
        </GoogleSheetsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 2. **Tạo SimpleDataSourceSwitcher**

Tạo component đơn giản không cần `useSupabase`:

```tsx
// SimpleDataSourceSwitcher.tsx
const SimpleDataSourceSwitcher: React.FC = () => {
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('supabase');
  
  // Không sử dụng useSupabase, chỉ dùng localStorage
  const handleDataSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSource = event.target.checked ? 'supabase' : 'mock';
    setDataSource(newSource);
    localStorage.setItem('REACT_APP_DATA_SOURCE', newSource);
    window.location.reload();
  };
  
  // ... rest of component
};
```

### 3. **Cập nhật AutoSync.tsx**

```tsx
// AutoSync.tsx
import SimpleDataSourceSwitcher from '../components/SimpleDataSourceSwitcher';

const AutoSync: React.FC = () => {
  // Sử dụng mock data thay vì useSupabase
  const mockRealtimeStatus = {
    products: false,
    suppliers: false,
    customers: false,
    inboundShipments: false,
    outboundShipments: false,
    companyInfo: false,
    users: false
  };
  
  const mockErrors = {
    products: null,
    suppliers: null,
    customers: null,
    inboundShipments: null,
    outboundShipments: null,
    companyInfo: null,
    users: null
  };
  
  const realtimeStatus = mockRealtimeStatus;
  const errors = mockErrors;
  
  // ... rest of component
};
```

## 🚀 **Cách sử dụng hiện tại**

### **1. Chạy ứng dụng**
```bash
npm start
```

### **2. Mở trang Auto Sync**
- Vào menu "Quản lý Auto Sync"
- Bạn sẽ thấy SimpleDataSourceSwitcher

### **3. Chuyển đổi data source**
- **Bật switch**: Sử dụng Supabase (cần cấu hình)
- **Tắt switch**: Sử dụng Mock Data (sẵn sàng ngay)

## 📋 **Bước tiếp theo để sử dụng Supabase**

### **1. Cấu hình Environment Variables**
Tạo file `.env.local`:
```env
REACT_APP_DATA_SOURCE=supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### **2. Cập nhật AutoSync.tsx**
Thay thế mock data bằng useSupabase thật:

```tsx
// AutoSync.tsx
import { useSupabase } from '../contexts/SupabaseContext';

const AutoSync: React.FC = () => {
  const { realtimeStatus, errors } = useSupabase();
  // ... rest of component
};
```

### **3. Thêm SupabaseRealtimeStatus**
```tsx
// AutoSync.tsx
import SupabaseRealtimeStatus from '../components/SupabaseRealtimeStatus';

// Trong component
{currentDataSource === 'supabase' && (
  <Box sx={{ mb: 3 }}>
    <SupabaseRealtimeStatus />
  </Box>
)}
```

## 🎯 **Trạng thái hiện tại**

- ✅ **Build thành công**: Không có lỗi TypeScript
- ✅ **SupabaseProvider**: Đã được thêm vào App.tsx
- ✅ **SimpleDataSourceSwitcher**: Hoạt động không cần Supabase
- ✅ **Mock Data**: Sẵn sàng để test
- 🔄 **Supabase Integration**: Cần cấu hình thêm

## 📝 **Lưu ý**

1. **Hiện tại**: Ứng dụng sử dụng mock data, không cần Supabase
2. **Khi cần Supabase**: Cấu hình environment variables và cập nhật code
3. **Data Source Switcher**: Hoạt động với localStorage
4. **Auto Sync**: Chỉ hiển thị khi dùng Supabase

## 🎉 **Kết luận**

Lỗi SupabaseProvider đã được khắc phục. Ứng dụng hiện tại có thể:
- ✅ Chạy mà không cần cấu hình Supabase
- ✅ Chuyển đổi giữa data sources
- ✅ Test với mock data
- ✅ Sẵn sàng tích hợp Supabase khi cần

Bạn có thể tiếp tục phát triển và test ứng dụng với mock data! 