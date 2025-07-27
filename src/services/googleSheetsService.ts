// Google Sheets Service với Service Account JWT (đơn giản như ứng dụng cũ)
import * as jose from 'jose';
import {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment
} from '../types';

// Re-export types
export type {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment
};

// Cấu hình từ environment variables
const SPREADSHEET_ID = process.env.REACT_APP_GOOGLE_SPREADSHEET_ID || '1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig';
const SERVICE_ACCOUNT_EMAIL = process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL || 'mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com';
const PRIVATE_KEY = process.env.REACT_APP_GOOGLE_PRIVATE_KEY || '';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og';

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
  ]
};

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
    const [products, suppliers, customers, inboundShipments, outboundShipments] = await Promise.all([
      getSheetData('DM_SAN_PHAM!A2:L'),
      getSheetData('NCC!A2:N'),
      getSheetData('KHACH_HANG!A2:N'),
      getSheetData('NHAP_KHO!A2:N'),
      getSheetData('XUAT_KHO!A2:N')
    ]);

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
        loai_nhap: row[1] || '',
        ngay_nhap: row[2] || new Date().toISOString(),
        khach_hang_id: row[3] || '',
        ten_khach_hang: row[4] || '',
        ma_hoa_don: row[5] || '',
        sl_san_pham: parseInt(row[6]) || 0,
        sl_xuat: parseInt(row[7]) || 0,
        tai_xe: row[8] || '',
        noi_dung_nhap: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      outboundShipments: outboundShipments.map((row, index) => ({
        id: row[0] || `outbound_${index + 1}`,
        loai_xuat: row[1] || '',
        ngay_xuat: row[2] || new Date().toISOString(),
        khach_hang_id: row[3] || '',
        ten_khach_hang: row[4] || '',
        ma_hoa_don: row[5] || '',
        sl_san_pham: parseInt(row[6]) || 0,
        sl_xuat: parseInt(row[7]) || 0,
        tai_xe: row[8] || '',
        noi_dung_xuat: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
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
      inboundShipments: mockData.inboundShipments.map((row, index) => ({
        id: row[0] || `inbound_${index + 1}`,
        loai_nhap: row[1] || '',
        ngay_nhap: row[2] || new Date().toISOString(),
        khach_hang_id: row[3] || '',
        ten_khach_hang: row[4] || '',
        ma_hoa_don: row[5] || '',
        sl_san_pham: parseInt(row[6]) || 0,
        sl_xuat: parseInt(row[7]) || 0,
        tai_xe: row[8] || '',
        noi_dung_nhap: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
      })),
      outboundShipments: mockData.outboundShipments.map((row, index) => ({
        id: row[0] || `outbound_${index + 1}`,
        loai_xuat: row[1] || '',
        ngay_xuat: row[2] || new Date().toISOString(),
        khach_hang_id: row[3] || '',
        ten_khach_hang: row[4] || '',
        ma_hoa_don: row[5] || '',
        sl_san_pham: parseInt(row[6]) || 0,
        sl_xuat: parseInt(row[7]) || 0,
        tai_xe: row[8] || '',
        noi_dung_xuat: row[9] || '',
        ghi_chu: row[10] || '',
        ngay_tao: row[11] || new Date().toISOString(),
        nguoi_tao: row[12] || 'Admin',
        update: row[13] || new Date().toISOString(),
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
    return data.customers;
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
      shipment.loai_nhap,
      shipment.ngay_nhap,
      shipment.khach_hang_id,
      shipment.ten_khach_hang,
      shipment.ma_hoa_don,
      shipment.sl_san_pham,
      shipment.sl_xuat,
      shipment.tai_xe,
      shipment.noi_dung_nhap,
      shipment.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('NHAP_KHO!A:N', [newRow]);
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
      shipment.loai_xuat,
      shipment.ngay_xuat,
      shipment.khach_hang_id,
      shipment.ten_khach_hang,
      shipment.ma_hoa_don,
      shipment.sl_san_pham,
      shipment.sl_xuat,
      shipment.tai_xe,
      shipment.noi_dung_xuat,
      shipment.ghi_chu,
      now,
      'Admin',
      now
    ];
    await appendSheetData('XUAT_KHO!A:N', [newRow]);
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