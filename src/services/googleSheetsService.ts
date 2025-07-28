// Google Sheets Service với Service Account JWT (đơn giản như ứng dụng cũ)
import * as jose from 'jose';
import {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment,
  CompanyInfo,
  User,
  InboundDetail,
  OutboundDetail
} from '../types';

// Re-export types
export type {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment,
  CompanyInfo,
  User,
  InboundDetail,
  OutboundDetail
};

// Cấu hình từ environment variables và file JSON
const SPREADSHEET_ID = process.env.REACT_APP_GOOGLE_SPREADSHEET_ID || '1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig';
const SERVICE_ACCOUNT_EMAIL = process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL || 'mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og';

// Private key từ file JSON Service Account
const PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCnS5RRIup2BvYN\nfhPkJvBVyD+tzJhn52ovKVlYjHzLOvHRR0pCjtModynaRNxEovwn8x+nxVkUStMj\np9DYAuwIBcXKqpViJtTDllyMHZo8zwuhvaGFDlbmYfvOD7Ek3w/OoT1VfGO0ktD4\neHFLQOfO6yaeAXIGnqlBFQE/s7L4xboZXZ9zSAEkWTX9nkW4wQe48OKc88rZ6ZK4\nJqt1UlaFC5xaxpsUiLwGYL6Uk5da2ZNDWplssiYlcfZXCnUmcNMIzllkVWh3Y06m\nWHnrK6KOJ9uvPBkj4DMw5uPXaDeTe1m0wD3fZOzKEwTcmeW7k467lMH1+9SSrDBi\n2XJzZ3wTAgMBAAECggEAFF5IK2K9ZMEEjHBTuqefrkoIWsA6CWMsU0aiWVIYJY7t\nKduXUn2HfvnshLsf4v7BsEQnuqpKkK/AKitV6t7cND6DrjZQ+WzHOHL3nJruuvBD\nDHOv6n5sR8tujXrtSJMcnmiU35zFROh1JzNUKTiN9ew9Ej1pz8gvIjyM9N+2RBcY\nTqWzrO9rgETSE1fkpWo7inBh4K7I9CaCKHKiSXaTAi2+gVDL+pKe4mg+Mgxg+uj/\nmVjsvTyCFzV2flNqGwTZRrQeq+d4PhijUGOAMv1SlHtnPlPbmiOlUex+Di9GlQ4U\n4JwAlA6iz14m2/3vhQ01+awRxkZ/tB6QtDkQZ+cecQKBgQDbYXPA+2RsjFXI1+Dv\nPrr5t0QBSliWHdCp9usbEVmYzrx0AuxPPBHHxlY+OclFQ0bhFvUY1FP9hF0RAtBT\n0FaeP8fqfvBply+G6ugf5K6H0ouBtLsSdvdkM6rf23DY8BMu2yaZCXfs3TfPkm+D\n+7ouN6Swe+kdIcns06MuaZRUcQKBgQDDOGsnxltgivomBK2yiS6CFa0w2xAmySwt\nGXrUomvfsPLQsx7of2iB1t33U8A9fDQqt12aBYYu4kdufjNePmZBkaGAmZ6MfY9U\nAYam+mG9gnnPyCwf40nV+y6HyziDGfHs9cX872dodsjhlEDH98+9ikBeqKeuYP/M\nENDJZmrKwwKBgBYnPyMrv7ZebYM8mZBPS15QLWPb+BogpKOlNZSkKeIObmVgrjBK\nJpl/49Gg0DxYUN4GDXYWauzc4vEG0bbFARo14qBBdVGUXM5JBmvCEgXRMxlEAOga\nb10FAqpcZIbjp2xB4SHvHNckd7BUX0J6txBXuh/AQ4gXk2aA8KeNLddhAoGAcsyb\nnuEzXPt9DJxVtJadJdwvY3p+7gABHWhNZfs5amq472dV9qztvOSo1MeIVd/TIYeA\n4JD9Dlb8YIqQFIynP0mvaltr8/vmLCVVlJ3KmlG+5iQ1Zm8XPWEfRLWJvvaj4I/K\n5Om3qqOnj5fJ3I3quPAy2Ddfm9jos4zz6mtyw1cCgYBy0JR+Od5da/GsF4rKM2ex\nJqFXxNsaETACPN5DfOmj2E0Q28Nvwyq7MSJRsqeBAiV3MxqroE+3dIg6is/8ACbq\ng9Q3j3vgfuqIOPZNeHbLlYoLIaX5rNuOyVKKaofnvGDov/t/iX+UeJiLLz/KH+LS\nsj9DG0yrfYwPhZxTNJb07w==\n-----END PRIVATE KEY-----\n";

// Kiểm tra xem có Service Account không
const hasServiceAccount = !!(SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY);

// JWT Authentication functions (đơn giản như ứng dụng cũ)
let accessToken: string = '';
let tokenExpiry: number | null = null;

const createJWT = async (): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 giờ

  try {
    // Xử lý private key - hỗ trợ nhiều format
    let pemKey = PRIVATE_KEY;

    // Nếu đã là PEM format, sử dụng trực tiếp
    if (PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('✅ Private key đã là PEM format');
      pemKey = PRIVATE_KEY
        .replace(/\\n/g, '\n')  // Thay thế \n thành xuống dòng thật
        .replace(/\\"/g, '"')   // Thay thế \" thành "
        .replace(/^"/, '')      // Loại bỏ dấu ngoặc kép đầu
        .replace(/"$/, '');     // Loại bỏ dấu ngoặc kép cuối
    }
    // Nếu là RSA PEM format, chuyển đổi
    else if (PRIVATE_KEY.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      console.log('✅ Chuyển đổi RSA PEM sang PKCS#8');
      pemKey = PRIVATE_KEY
        .replace(/-----BEGIN RSA PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----')
        .replace(/-----END RSA PRIVATE KEY-----/, '-----END PRIVATE KEY-----');
    }

    // Import key
    const key = await jose.importPKCS8(pemKey, 'RS256');

    // Tạo JWT
    const token = await new jose.SignJWT({
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);

    console.log('✅ JWT created successfully');
    return token;
  } catch (error) {
    console.error('❌ Error creating JWT:', error);
    throw new Error('Không thể tạo JWT token');
  }
};

const getAccessToken = async (): Promise<string> => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const jwt = await createJWT();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in * 1000);
      console.log('✅ Access token obtained successfully');
      return accessToken;
    } else {
      const errorData = await response.json();
      throw new Error(`Failed to get access token: ${response.status} - ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Khởi tạo Google Sheets API (đơn giản)
export const initializeGoogleSheets = async (): Promise<void> => {
  if (hasServiceAccount) {
    console.log('Google Sheets API initialized with Service Account');
    // Test connection với Service Account
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`
      );
      if (response.ok) {
        console.log('✅ Google Sheets connection successful');
      } else {
        console.warn('⚠️ Google Sheets connection failed, using mock data');
      }
    } catch (error) {
      console.warn('⚠️ Google Sheets connection failed, using mock data:', error);
    }
  } else {
    console.log('Google Sheets API initialized with mock data (no Service Account configured)');
  }
  return;
};

// Mock data cho development - phù hợp với cấu trúc Google Sheet thực tế
const mockData = {
  // DM_SAN_PHAM
  products: [
    ['1', 'SP001', 'Laptop Dell Inspiron', 'KHO1', 'Kho chính', 'Cái', '10', 'Có', 'Laptop gaming cao cấp', '2024-01-01', 'Admin', '2024-01-01'],
    ['2', 'SP002', 'Chuột Logitech MX Master', 'KHO1', 'Kho chính', 'Cái', '50', 'Có', 'Chuột không dây cao cấp', '2024-01-01', 'Admin', '2024-01-01'],
    ['3', 'SP003', 'Bàn phím cơ Cherry MX', 'KHO2', 'Kho phụ', 'Cái', '20', 'Có', 'Bàn phím mechanical', '2024-01-01', 'Admin', '2024-01-01']
  ],
  // NCC
  suppliers: [
    ['1', 'Dell Vietnam', 'Có', 'Dell Technologies Vietnam', 'Nhà sản xuất', '', 'Nguyễn Văn A', '0123456789', 'Hoạt động', 'NV001', 'Nhà cung cấp laptop chính hãng', '2024-01-01', 'Admin', '2024-01-01'],
    ['2', 'Logitech', 'Có', 'Logitech International', 'Nhà phân phối', '', 'Trần Thị B', '0987654321', 'Hoạt động', 'NV002', 'Nhà cung cấp phụ kiện cao cấp', '2024-01-01', 'Admin', '2024-01-01']
  ],
  // KHACH_HANG
  customers: [
    ['1', 'Công ty ABC', 'Có', 'Công ty TNHH ABC', 'Khách hàng doanh nghiệp', '', 'Lê Văn C', '0111222333', 'Hoạt động', 'NV003', 'Khách hàng VIP', '2024-01-01', 'Admin', '2024-01-01'],
    ['2', 'Cửa hàng XYZ', 'Có', 'Cửa hàng bán lẻ XYZ', 'Khách hàng cá nhân', '', 'Phạm Thị D', '0444555666', 'Hoạt động', 'NV004', 'Khách hàng thường', '2024-01-01', 'Admin', '2024-01-01']
  ],
  // NHAP_KHO
  inboundShipments: [
    ['1', 'Nhập mua', '2024-01-15', '1', 'Công ty ABC', 'HD001', '5', '0', 'Tài xế A', 'Nhập laptop Dell từ nhà cung cấp', 'Giao hàng đúng hẹn', '2024-01-15', 'Admin', '2024-01-15'],
    ['2', 'Nhập trả', '2024-01-16', '2', 'Cửa hàng XYZ', 'HD002', '10', '0', 'Tài xế B', 'Nhập chuột Logitech trả về', 'Hàng chất lượng tốt', '2024-01-16', 'Admin', '2024-01-16']
  ],
  // XUAT_KHO
  outboundShipments: [
    ['1', 'Xuất bán', '2024-01-20', '1', 'Công ty ABC', 'HD003', '2', '2', 'Tài xế C', 'Xuất laptop Dell cho khách hàng', 'Giao hàng thành công', '2024-01-20', 'Admin', '2024-01-20'],
    ['2', 'Xuất trả', '2024-01-21', '2', 'Cửa hàng XYZ', 'HD004', '5', '5', 'Tài xế D', 'Xuất chuột Logitech trả nhà cung cấp', 'Khách hàng hài lòng', '2024-01-21', 'Admin', '2024-01-21']
  ],
  // THONG_TIN_CTY
  companyInfo: [
    ['1', 'Công ty TNHH ABC', 'Có', 'Công ty TNHH ABC', 'Công ty công nghệ', '', 'Nguyễn Văn A', '0123456789', 'Hoạt động', 'NV001', 'Thông tin công ty chính', '2024-01-01', 'Admin', '2024-01-01']
  ],
  // NGUOI_DUNG
  users: [
    ['1', 'admin', 'admin@company.com', 'Quản trị viên', 'Admin', 'password123', 'Có', 'Có', 'Có', 'Có', 'Có', 'Có', 'Có', 'Có', '2024-01-01', 'Admin', '2024-01-01'],
    ['2', 'user1', 'user1@company.com', 'Nhân viên kho', 'User', 'password123', 'Có', 'Có', 'Có', 'Không', 'Có', 'Có', 'Có', 'Không', '2024-01-01', 'Admin', '2024-01-01']
  ],
  // NHAP_KHO_CT
  inboundDetails: [
    ['1', '1', 'SP001', 'Laptop Dell Inspiron', '5', '15000000', '75000000', 'Tốt', '2024-01-15', 'Admin', '2024-01-15'],
    ['2', '1', 'SP002', 'Chuột Logitech MX Master', '10', '2000000', '20000000', 'Tốt', '2024-01-15', 'Admin', '2024-01-15']
  ],
  // XUAT_KHO_CT
  outboundDetails: [
    ['1', '1', 'SP001', 'Laptop Dell Inspiron', '2', '15000000', '30000000', 'Tốt', '2024-01-20', 'Admin', '2024-01-20'],
    ['2', '1', 'SP002', 'Chuột Logitech MX Master', '5', '2000000', '10000000', 'Tốt', '2024-01-20', 'Admin', '2024-01-20']
  ]
};

// Mock data for InboundShipments
const mockInboundShipments: InboundShipment[] = [
  {
    id: 'b9d6975e',
    xuat_kho_id: 'PNK_2807-001',
    ngay_nhap: '28-7-2025',
    san_pham_id: '201',
    ten_san_pham: 'Sản phẩm 002',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: 'Cai',
    SL_Nhap: 3523,
    ghi_chu: '',
    Nha_Cung_Cap_id: 'NCC_001',
    Ten_Nha_Cung_Cap: 'Hoàng Hà',
    Dia_Chi: 'Bình Thạnh - HCM',
    So_Dt: '0289999',
    Noi_Dung_Nhap: 'Nhập kho mua hàng',
    ngay_tao: '28-7',
    nguoi_tao: 'Admin',
    update: '28/07/2025 14:19:42'
  },
  {
    id: 'd99d3f95',
    xuat_kho_id: 'PNK_2807-001',
    ngay_nhap: '28-7-2025',
    san_pham_id: '202',
    ten_san_pham: 'Sản phẩm 003',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: 'Cai',
    SL_Nhap: 2674,
    ghi_chu: '',
    Nha_Cung_Cap_id: 'NCC_001',
    Ten_Nha_Cung_Cap: 'Hoàng Hà',
    Dia_Chi: 'Bình Thạnh - HCM',
    So_Dt: '0289999',
    Noi_Dung_Nhap: 'Nhập kho mua hàng',
    ngay_tao: '28-7',
    nguoi_tao: 'Admin',
    update: '28/07/2025 14:19:42'
  }
];

// Mock data for OutboundShipments
const mockOutboundShipments: OutboundShipment[] = [
  {
    id: 'c0808f13',
    xuat_kho_id: 'PXK_2807-001',
    ngay_xuat: '28-7-2025',
    san_pham_id: '201',
    ten_san_pham: 'Sản phẩm 002',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: 'Cai',
    sl_xuat: 3523,
    ghi_chu: '',
    So_HD: '',
    Ma_KH: 'KH_001',
    Ten_Khach_Hang: 'Anh Mạnh',
    Dia_Chi: '',
    So_Dt: '',
    Noi_Dung_Xuat: '',
    ngay_tao: '28-7',
    nguoi_tao: 'Admin',
    update: '28/07/2025 14:19:42'
  },
  {
    id: 'a1d4059f',
    xuat_kho_id: 'PXK_2807-001',
    ngay_xuat: '28-7-2025',
    san_pham_id: '202',
    ten_san_pham: 'Sản phẩm 003',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: 'Cai',
    sl_xuat: 2674,
    ghi_chu: '',
    So_HD: '',
    Ma_KH: 'KH_001',
    Ten_Khach_Hang: 'Anh Mạnh',
    Dia_Chi: '',
    So_Dt: '',
    Noi_Dung_Xuat: '',
    ngay_tao: '28-7',
    nguoi_tao: 'Admin',
    update: '28/07/2025 14:19:42'
  }
];

// Lấy dữ liệu từ Google Sheets hoặc mock data
export const getSheetData = async (range: string): Promise<any[]> => {
  if (hasServiceAccount) {
    try {
      console.log('Fetching real data from Google Sheets for range:', range);
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real data fetched successfully:', data.values?.length || 0, 'rows');
        return data.values || [];
      } else {
        console.warn('⚠️ Failed to fetch real data, using mock data for range:', range);
        
        // Kiểm tra rate limiting
        if (response.status === 429) {
          const error = new Error(`Rate limited: ${response.status} - ${response.statusText}`);
          (error as any).status = 429;
          throw error;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error fetching real data, using mock data for range:', range, error);
      
      // Re-throw rate limiting errors
      if ((error as any)?.status === 429) {
        throw error;
      }
    }
  }
  
  // Fallback to mock data
  console.log('Using mock data for range:', range);
  
  // Trả về mock data dựa trên range - phù hợp với tên sheet thực tế
  if (range.includes('DM_SAN_PHAM') || range.includes('Products')) return mockData.products;
  if (range.includes('NCC') || range.includes('Suppliers')) return mockData.suppliers;
  if (range.includes('KHACH_HANG') || range.includes('Customers')) return mockData.customers;
  if (range.includes('NHAP_KHO') || range.includes('InboundShipments')) return mockData.inboundShipments;
  if (range.includes('XUAT_KHO') || range.includes('OutboundShipments')) return mockData.outboundShipments;
  if (range.includes('THONG_TIN_CTY') || range.includes('CompanyInfo')) return mockData.companyInfo;
  if (range.includes('NGUOI_DUNG') || range.includes('Users')) return mockData.users;
  if (range.includes('NHAP_KHO_CT') || range.includes('InboundDetails')) return mockData.inboundDetails;
  if (range.includes('XUAT_KHO_CT') || range.includes('OutboundDetails')) return mockData.outboundDetails;
  return [];
};

// Thêm dữ liệu vào Google Sheets
const appendSheetData = async (range: string, values: any[][]): Promise<void> => {
  if (!hasServiceAccount) {
    console.warn('⚠️ No Service Account configured, using mock data');
    console.log('✅ Data would be written to Google Sheets (mock mode)');
    return;
  }

  try {
    console.log('Writing data to Google Sheets with Service Account:', { range, values });
    
    // Get access token for authentication
    const accessToken = await getAccessToken();
    
    // Use access token for write operation
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          values: values
        })
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Data written successfully to Google Sheets:', result);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to write data:', errorData);
      throw new Error(`Failed to write data: ${response.status} - ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
};

// Đồng bộ dữ liệu từ Google Sheets
export const syncDataFromGoogleSheets = async () => {
  try {
    // Thêm delay giữa các request để tránh rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Gọi từng sheet một thay vì Promise.all để tránh rate limiting
    console.log('🔄 Bắt đầu đồng bộ từng sheet...');
    
    const products = await getSheetData('DM_SAN_PHAM!A2:L');
    await delay(1000); // Delay 1 giây
    
    const suppliers = await getSheetData('NCC!A2:N');
    await delay(1000);
    
    const customers = await getSheetData('KHACH_HANG!A2:N');
    await delay(1000);
    
    const inboundShipments = await getSheetData('NHAP_KHO!A2:U');
    await delay(1000);
    
    const outboundShipments = await getSheetData('XUAT_KHO!A2:V');
    await delay(1000);
    
    const companyInfo = await getSheetData('THONG_TIN_CTY!A2:N');
    await delay(1000);
    
    const users = await getSheetData('NGUOI_DUNG!A2:Q');
    await delay(1000);
    
    const inboundDetails = await getSheetData('NHAP_KHO_CT!A2:K');
    await delay(1000);
    
    const outboundDetails = await getSheetData('XUAT_KHO_CT!A2:K');
    
    console.log('✅ Đã đồng bộ tất cả 9 sheet thành công');

    return {
      products: products.map((row, index) => ({
        id: row[0] || `product_${index + 1}`,
        san_pham_id: row[1] || '',
        ten_san_pham: row[2] || '',
        kho_id: row[3] || '',
        ten_kho: row[4] || '',
        dvt: row[5] || '',
        sl_ton: parseInt(row[6]) || 0,
        hien_thi: row[7] || 'Có',
        ghi_chu: row[8] || '',
        ngay_tao: row[9] || new Date().toISOString(),
        nguoi_tao: row[10] || 'Admin',
        update: row[11] || new Date().toISOString(),
      })),
      suppliers: suppliers.map((row, index) => ({
        id: row[0] || `supplier_${index + 1}`,
        ten_ncc: row[1] || '',
        hien_thi: row[2] || 'Có',
        ten_day_du: row[3] || '',
        loai_ncc: row[4] || '',
        logo: row[5] || '',
        nguoi_dai_dien: row[6] || '',
        sdt: row[7] || '',
        tinh_trang: row[8] || 'Hoạt động',
        nv_phu_trach: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      customers: customers.map((row, index) => ({
        id: row[0] || `customer_${index + 1}`,
        ten_khach_hang: row[1] || '',
        hien_thi: row[2] || 'Có',
        ten_day_du: row[3] || '',
        loai_khach_hang: row[4] || '',
        logo: row[5] || '',
        nguoi_dai_dien: row[6] || '',
        sdt: row[7] || '',
        tinh_trang: row[8] || 'Hoạt động',
        nv_phu_trach: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      inboundShipments: inboundShipments.map((row, index) => ({
        id: row[0] || `inbound_${index + 1}`,
        xuat_kho_id: row[1] || '',
        ngay_nhap: row[2] || new Date().toISOString(),
        san_pham_id: row[3] || '',
        ten_san_pham: row[4] || '',
        nhom_san_pham: row[5] || '',
        hang_sx: row[6] || '',
        hinh_anh: row[7] || '',
        thong_tin: row[8] || '',
        quy_cach: row[9] || '',
        dvt: row[10] || '',
        SL_Nhap: parseInt(row[11]) || 0,
        ghi_chu: row[12] || '',
        Nha_Cung_Cap_id: row[13] || '',
        Ten_Nha_Cung_Cap: row[14] || '',
        Dia_Chi: row[15] || '',
        So_Dt: row[16] || '',
        Noi_Dung_Nhap: row[17] || '',
        ngay_tao: row[18] || new Date().toISOString(),
        nguoi_tao: row[19] || 'Admin',
        update: row[20] || new Date().toISOString(),
      })),
      outboundShipments: outboundShipments.map((row, index) => ({
        id: row[0] || `outbound_${index + 1}`,
        xuat_kho_id: row[1] || '',
        ngay_xuat: row[2] || new Date().toISOString(),
        san_pham_id: row[3] || '',
        ten_san_pham: row[4] || '',
        nhom_san_pham: row[5] || '',
        hang_sx: row[6] || '',
        hinh_anh: row[7] || '',
        thong_tin: row[8] || '',
        quy_cach: row[9] || '',
        dvt: row[10] || '',
        sl_xuat: parseInt(row[11]) || 0,
        ghi_chu: row[12] || '',
        So_HD: row[13] || '',
        Ma_KH: row[14] || '',
        Ten_Khach_Hang: row[15] || '',
        Dia_Chi: row[16] || '',
        So_Dt: row[17] || '',
        Noi_Dung_Xuat: row[18] || '',
        ngay_tao: row[19] || new Date().toISOString(),
        nguoi_tao: row[20] || 'Admin',
        update: row[21] || new Date().toISOString(),
      })),
      companyInfo: companyInfo.map((row, index) => ({
        id: row[0] || `company_${index + 1}`,
        ten_cong_ty: row[1] || '',
        hien_thi: row[2] || 'Có',
        ten_day_du: row[3] || '',
        loai_cong_ty: row[4] || '',
        logo: row[5] || '',
        nguoi_dai_dien: row[6] || '',
        sdt: row[7] || '',
        tinh_trang: row[8] || 'Hoạt động',
        nv_phu_trach: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      users: users.map((row, index) => ({
        id: row[0] || `user_${index + 1}`,
        ho_va_ten: row[1] || '',
        email: row[2] || '',
        chuc_vu: row[3] || '',
        phan_quyen: row[4] || '',
        password: row[5] || '',
        quyen_xem: row[6] || 'Có',
        quyen_them: row[7] || 'Có',
        quyen_sua: row[8] || 'Có',
        quyen_xoa: row[9] || 'Có',
        quyen_xuat: row[10] || 'Có',
        quyen_nhap: row[11] || 'Có',
        quyen_bao_cao: row[12] || 'Có',
        quyen_cai_dat: row[13] || 'Có',
        ngay_tao: row[14] || new Date().toISOString(),
        nguoi_tao: row[15] || 'Admin',
        update: row[16] || new Date().toISOString(),
      })),
      inboundDetails: inboundDetails.map((row, index) => ({
        id: row[0] || `inbound_detail_${index + 1}`,
        xuat_kho_id: row[1] || '',
        san_pham_id: row[2] || '',
        ten_san_pham: row[3] || '',
        so_luong: parseInt(row[4]) || 0,
        don_gia: parseFloat(row[5]) || 0,
        thanh_tien: parseFloat(row[6]) || 0,
        chat_luong: row[7] || '',
        ngay_tao: row[8] || new Date().toISOString(),
        nguoi_tao: row[9] || 'Admin',
        update: row[10] || new Date().toISOString(),
      })),
      outboundDetails: outboundDetails.map((row, index) => ({
        id: row[0] || `outbound_detail_${index + 1}`,
        xuat_kho_id: row[1] || '',
        san_pham_id: row[2] || '',
        ten_san_pham: row[3] || '',
        so_luong: parseInt(row[4]) || 0,
        don_gia: parseFloat(row[5]) || 0,
        thanh_tien: parseFloat(row[6]) || 0,
        chat_luong: row[7] || '',
        ngay_tao: row[8] || new Date().toISOString(),
        nguoi_tao: row[9] || 'Admin',
        update: row[10] || new Date().toISOString(),
      }))
    };
  } catch (error) {
    console.error('Error syncing data from Google Sheets:', error);
    // Fallback to mock data if error
    console.log('Falling back to mock data due to error');
    return {
      products: mockData.products.map((row, index) => ({
        id: row[0] || `product_${index + 1}`,
        san_pham_id: row[1] || '',
        ten_san_pham: row[2] || '',
        kho_id: row[3] || '',
        ten_kho: row[4] || '',
        dvt: row[5] || '',
        sl_ton: parseInt(row[6]) || 0,
        hien_thi: row[7] || 'Có',
        ghi_chu: row[8] || '',
        ngay_tao: row[9] || new Date().toISOString(),
        nguoi_tao: row[10] || 'Admin',
        update: row[11] || new Date().toISOString(),
      })),
      suppliers: mockData.suppliers.map((row, index) => ({
        id: row[0] || `supplier_${index + 1}`,
        ten_ncc: row[1] || '',
        hien_thi: row[2] || 'Có',
        ten_day_du: row[3] || '',
        loai_ncc: row[4] || '',
        logo: row[5] || '',
        nguoi_dai_dien: row[6] || '',
        sdt: row[7] || '',
        tinh_trang: row[8] || 'Hoạt động',
        nv_phu_trach: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      customers: mockData.customers.map((row, index) => ({
        id: row[0] || `customer_${index + 1}`,
        ten_khach_hang: row[1] || '',
        hien_thi: row[2] || 'Có',
        ten_day_du: row[3] || '',
        loai_khach_hang: row[4] || '',
        logo: row[5] || '',
        nguoi_dai_dien: row[6] || '',
        sdt: row[7] || '',
        tinh_trang: row[8] || 'Hoạt động',
        nv_phu_trach: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      inboundShipments: mockInboundShipments.map((row, index) => ({
        id: row.id || `inbound_${index + 1}`,
        xuat_kho_id: row.xuat_kho_id || '',
        ngay_nhap: row.ngay_nhap || new Date().toISOString(),
        san_pham_id: row.san_pham_id || '',
        ten_san_pham: row.ten_san_pham || '',
        nhom_san_pham: row.nhom_san_pham || '',
        hang_sx: row.hang_sx || '',
        hinh_anh: row.hinh_anh || '',
        thong_tin: row.thong_tin || '',
        quy_cach: row.quy_cach || '',
        dvt: row.dvt || '',
        SL_Nhap: row.SL_Nhap || 0,
        ghi_chu: row.ghi_chu || '',
        Nha_Cung_Cap_id: row.Nha_Cung_Cap_id || '',
        Ten_Nha_Cung_Cap: row.Ten_Nha_Cung_Cap || '',
        Dia_Chi: row.Dia_Chi || '',
        So_Dt: row.So_Dt || '',
        Noi_Dung_Nhap: row.Noi_Dung_Nhap || '',
        ngay_tao: row.ngay_tao || new Date().toISOString(),
        nguoi_tao: row.nguoi_tao || 'Admin',
        update: row.update || new Date().toISOString(),
      })),
      outboundShipments: mockOutboundShipments.map((row, index) => ({
        id: row.id || `outbound_${index + 1}`,
        xuat_kho_id: row.xuat_kho_id || '',
        ngay_xuat: row.ngay_xuat || new Date().toISOString(),
        san_pham_id: row.san_pham_id || '',
        ten_san_pham: row.ten_san_pham || '',
        nhom_san_pham: row.nhom_san_pham || '',
        hang_sx: row.hang_sx || '',
        hinh_anh: row.hinh_anh || '',
        thong_tin: row.thong_tin || '',
        quy_cach: row.quy_cach || '',
        dvt: row.dvt || '',
        sl_xuat: row.sl_xuat || 0,
        ghi_chu: row.ghi_chu || '',
        So_HD: row.So_HD || '',
        Ma_KH: row.Ma_KH || '',
        Ten_Khach_Hang: row.Ten_Khach_Hang || '',
        Dia_Chi: row.Dia_Chi || '',
        So_Dt: row.So_Dt || '',
        Noi_Dung_Xuat: row.Noi_Dung_Xuat || '',
        ngay_tao: row.ngay_tao || new Date().toISOString(),
        nguoi_tao: row.nguoi_tao || 'Admin',
        update: row.update || new Date().toISOString(),
      }))
    };
  }
};

// Đồng bộ dữ liệu lên Google Sheets
export const syncDataToGoogleSheets = async (data: any) => {
  try {
    console.log('Syncing data to Google Sheets:', data);
    throw new Error('Write operations require OAuth 2.0 or Service Account');
  } catch (error) {
    console.error('Error syncing data to Google Sheets:', error);
    throw error;
  }
};

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.products;
  },
  create: async (product: Omit<Product, 'id'>): Promise<Product> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockProduct = { ...product, id: Date.now().toString(), update: new Date().toISOString() };
      return mockProduct as Product;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      product.san_pham_id,
      product.ten_san_pham,
      product.kho_id,
      product.ten_kho,
      product.dvt,
      product.sl_ton,
      product.hien_thi,
      product.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('DM_SAN_PHAM!A:L', [newRow]);
    return { ...product, id, update: now };
  },
  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...product, id, update: new Date().toISOString() } as Product;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Suppliers API
export const suppliersAPI = {
  getAll: async (): Promise<Supplier[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.suppliers;
  },
  create: async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockSupplier = { ...supplier, id: Date.now().toString(), update: new Date().toISOString() };
      return mockSupplier as Supplier;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      supplier.ten_ncc,
      supplier.hien_thi,
      supplier.ten_day_du,
      supplier.loai_ncc,
      supplier.logo,
      supplier.nguoi_dai_dien,
      supplier.sdt,
      supplier.tinh_trang,
      supplier.nv_phu_trach,
      supplier.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('NCC!A:N', [newRow]);
    return { ...supplier, id, update: now };
  },
  update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...supplier, id, update: new Date().toISOString() } as Supplier;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Customers API
export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.customers || [];
  },
  create: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockCustomer = { ...customer, id: Date.now().toString(), update: new Date().toISOString() };
      return mockCustomer as Customer;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      customer.ten_khach_hang,
      customer.hien_thi,
      customer.ten_day_du,
      customer.loai_khach_hang,
      customer.logo,
      customer.nguoi_dai_dien,
      customer.sdt,
      customer.tinh_trang,
      customer.nv_phu_trach,
      customer.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('KHACH_HANG!A:N', [newRow]);
    return { ...customer, id, update: now };
  },
  update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...customer, id, update: new Date().toISOString() } as Customer;
    }
    // TODO: Implement actual Google Sheets update
    console.warn('Update operation not fully implemented yet. Using mock data.');
    return { ...customer, id, update: new Date().toISOString() } as Customer;
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    // TODO: Implement actual Google Sheets delete
    console.warn('Delete operation not fully implemented yet. Using mock data.');
  },
};

// Inbound Shipments API
export const inboundShipmentsAPI = {
  getAll: async (): Promise<InboundShipment[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.inboundShipments;
  },
  create: async (shipment: Omit<InboundShipment, 'id'>): Promise<InboundShipment> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockShipment = { ...shipment, id: Date.now().toString(), update: new Date().toISOString() };
      return mockShipment as InboundShipment;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      shipment.xuat_kho_id,
      shipment.ngay_nhap,
      shipment.san_pham_id,
      shipment.ten_san_pham,
      shipment.nhom_san_pham,
      shipment.hang_sx,
      shipment.hinh_anh,
      shipment.thong_tin,
      shipment.quy_cach,
      shipment.dvt,
      shipment.SL_Nhap,
      shipment.ghi_chu,
      shipment.Nha_Cung_Cap_id,
      shipment.Ten_Nha_Cung_Cap,
      shipment.Dia_Chi,
      shipment.So_Dt,
      shipment.Noi_Dung_Nhap,
      now,
      'Admin',
      now
    ];
    await appendSheetData('NHAP_KHO!A:U', [newRow]);
    return { ...shipment, id, update: now };
  },
  update: async (id: string, shipment: Partial<InboundShipment>): Promise<InboundShipment> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...shipment, id, update: new Date().toISOString() } as InboundShipment;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Outbound Shipments API
export const outboundShipmentsAPI = {
  getAll: async (): Promise<OutboundShipment[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.outboundShipments;
  },
  create: async (shipment: Omit<OutboundShipment, 'id'>): Promise<OutboundShipment> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockShipment = { ...shipment, id: Date.now().toString(), update: new Date().toISOString() };
      return mockShipment as OutboundShipment;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      shipment.xuat_kho_id,
      shipment.ngay_xuat,
      shipment.san_pham_id,
      shipment.ten_san_pham,
      shipment.nhom_san_pham,
      shipment.hang_sx,
      shipment.hinh_anh,
      shipment.thong_tin,
      shipment.quy_cach,
      shipment.dvt,
      shipment.sl_xuat,
      shipment.ghi_chu,
      shipment.So_HD,
      shipment.Ma_KH,
      shipment.Ten_Khach_Hang,
      shipment.Dia_Chi,
      shipment.So_Dt,
      shipment.Noi_Dung_Xuat,
      now,
      'Admin',
      now
    ];
    await appendSheetData('XUAT_KHO!A:V', [newRow]);
    return { ...shipment, id, update: now };
  },
  update: async (id: string, shipment: Partial<OutboundShipment>): Promise<OutboundShipment> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...shipment, id, update: new Date().toISOString() } as OutboundShipment;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Company Info API
export const companyInfoAPI = {
  getAll: async (): Promise<CompanyInfo[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.companyInfo || [];
  },
  create: async (company: Omit<CompanyInfo, 'id'>): Promise<CompanyInfo> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockCompany = { ...company, id: Date.now().toString(), update: new Date().toISOString() };
      return mockCompany as CompanyInfo;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      company.ten_cong_ty,
      company.hien_thi,
      company.ten_day_du,
      company.loai_cong_ty,
      company.logo,
      company.nguoi_dai_dien,
      company.sdt,
      company.tinh_trang,
      company.nv_phu_trach,
      company.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('THONG_TIN_CTY!A:N', [newRow]);
    return { ...company, id, update: now };
  },
  update: async (id: string, company: Partial<CompanyInfo>): Promise<CompanyInfo> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...company, id, update: new Date().toISOString() } as CompanyInfo;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.users || [];
  },
  create: async (user: Omit<User, 'id'>): Promise<User> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockUser = { ...user, id: Date.now().toString(), update: new Date().toISOString() };
      return mockUser as User;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      user.ho_va_ten,
      user.email,
      user.chuc_vu,
      user.phan_quyen,
      user.password,
      user.quyen_xem,
      user.quyen_them,
      user.quyen_sua,
      user.quyen_xoa,
      user.quyen_xuat,
      user.quyen_nhap,
      user.quyen_bao_cao,
      user.quyen_cai_dat,
      now,
      'Admin',
      now
    ];
    await appendSheetData('NGUOI_DUNG!A:Q', [newRow]);
    return { ...user, id, update: now };
  },
  update: async (id: string, user: Partial<User>): Promise<User> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...user, id, update: new Date().toISOString() } as User;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Inbound Details API
export const inboundDetailsAPI = {
  getAll: async (): Promise<InboundDetail[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.inboundDetails || [];
  },
  create: async (detail: Omit<InboundDetail, 'id'>): Promise<InboundDetail> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockDetail = { ...detail, id: Date.now().toString(), update: new Date().toISOString() };
      return mockDetail as InboundDetail;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      detail.xuat_kho_id,
      detail.san_pham_id,
      detail.ten_san_pham,
      detail.so_luong,
      detail.don_gia,
      detail.thanh_tien,
      detail.chat_luong,
      now,
      'Admin',
      now
    ];
    await appendSheetData('NHAP_KHO_CT!A:K', [newRow]);
    return { ...detail, id, update: now };
  },
  update: async (id: string, detail: Partial<InboundDetail>): Promise<InboundDetail> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...detail, id, update: new Date().toISOString() } as InboundDetail;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
};

// Outbound Details API
export const outboundDetailsAPI = {
  getAll: async (): Promise<OutboundDetail[]> => {
    const data = await syncDataFromGoogleSheets();
    return data.outboundDetails || [];
  },
  create: async (detail: Omit<OutboundDetail, 'id'>): Promise<OutboundDetail> => {
    if (!hasServiceAccount) {
      console.warn('Create operation requires Service Account. Using mock data.');
      const mockDetail = { ...detail, id: Date.now().toString(), update: new Date().toISOString() };
      return mockDetail as OutboundDetail;
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newRow = [
      id,
      detail.xuat_kho_id,
      detail.san_pham_id,
      detail.ten_san_pham,
      detail.so_luong,
      detail.don_gia,
      detail.thanh_tien,
      detail.chat_luong,
      now,
      'Admin',
      now
    ];
    await appendSheetData('XUAT_KHO_CT!A:K', [newRow]);
    return { ...detail, id, update: now };
  },
  update: async (id: string, detail: Partial<OutboundDetail>): Promise<OutboundDetail> => {
    if (!hasServiceAccount) {
      console.warn('Update operation requires Service Account. Using mock data.');
      return { ...detail, id, update: new Date().toISOString() } as OutboundDetail;
    }
    throw new Error('Update operation not implemented yet');
  },
  delete: async (id: string): Promise<void> => {
    if (!hasServiceAccount) {
      console.warn('Delete operation requires Service Account. Using mock data.');
      return;
    }
    throw new Error('Delete operation not implemented yet');
  },
}; 