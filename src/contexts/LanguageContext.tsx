import React, { createContext, useContext, useState, useEffect } from 'react';

// Định nghĩa các ngôn ngữ hỗ trợ
export type Language = 'vi' | 'en';

// Định nghĩa interface cho translations
interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

// Dữ liệu đa ngôn ngữ
const translations: Translations = {
  // Dashboard
  'dashboard': {
    vi: 'Dashboard',
    en: 'Dashboard'
  },
  'total_products': {
    vi: 'Tổng sản phẩm',
    en: 'Total Products'
  },
  'suppliers': {
    vi: 'Nhà cung cấp',
    en: 'Suppliers'
  },
  'customers': {
    vi: 'Khách hàng',
    en: 'Customers'
  },
  'total_value': {
    vi: 'Tổng giá trị',
    en: 'Total Value'
  },
  'low_stock_products': {
    vi: 'Sản phẩm gần hết hàng',
    en: 'Low Stock Products'
  },
  'quick_stats': {
    vi: 'Thống kê nhanh',
    en: 'Quick Statistics'
  },
  'total_product_types': {
    vi: 'Tổng số loại sản phẩm',
    en: 'Total Product Types'
  },
  'out_of_stock': {
    vi: 'Sản phẩm hết hàng',
    en: 'Out of Stock'
  },
  'low_stock': {
    vi: 'Sản phẩm sắp hết',
    en: 'Low Stock'
  },
  'remaining': {
    vi: 'Còn lại',
    en: 'Remaining'
  },

  // Navigation
  'products': {
    vi: 'Sản phẩm',
    en: 'Products'
  },
  'inbound_shipments': {
    vi: 'Nhập kho',
    en: 'Inbound Shipments'
  },
  'outbound_shipments': {
    vi: 'Xuất kho',
    en: 'Outbound Shipments'
  },
  'suppliers_management': {
    vi: 'Nhà cung cấp',
    en: 'Suppliers'
  },
  'customers_management': {
    vi: 'Khách hàng',
    en: 'Customers'
  },
  'company_info': {
    vi: 'Thông tin công ty',
    en: 'Company Info'
  },
  'users': {
    vi: 'Người dùng',
    en: 'Users'
  },

  'transaction_history': {
    vi: 'Lịch sử giao dịch',
    en: 'Transaction History'
  },

  // Common
  'add': {
    vi: 'Thêm',
    en: 'Add'
  },
  'edit': {
    vi: 'Sửa',
    en: 'Edit'
  },
  'delete': {
    vi: 'Xóa',
    en: 'Delete'
  },
  'save': {
    vi: 'Lưu',
    en: 'Save'
  },
  'cancel': {
    vi: 'Hủy',
    en: 'Cancel'
  },
  'close': {
    vi: 'Đóng',
    en: 'Close'
  },
  'search': {
    vi: 'Tìm kiếm',
    en: 'Search'
  },
  'loading': {
    vi: 'Đang tải...',
    en: 'Loading...'
  },
  'no_data': {
    vi: 'Không có dữ liệu',
    en: 'No data available'
  },
  'success': {
    vi: 'Thành công',
    en: 'Success'
  },
  'error': {
    vi: 'Lỗi',
    en: 'Error'
  },
  'warning': {
    vi: 'Cảnh báo',
    en: 'Warning'
  },
  'info': {
    vi: 'Thông tin',
    en: 'Information'
  },

  // Language
  'language': {
    vi: 'Ngôn ngữ',
    en: 'Language'
  },
  'vietnamese': {
    vi: 'Tiếng Việt',
    en: 'Vietnamese'
  },
  'english': {
    vi: 'English',
    en: 'English'
  },

  // Schedule/Booking
  'scheduled_history': {
    vi: 'Lịch đã đặt',
    en: 'Scheduled History'
  },
  'no_saved_data': {
    vi: 'Không tìm thấy dữ liệu đã lưu',
    en: 'No saved data found'
  },
  'schedule': {
    vi: 'Lịch trình',
    en: 'Schedule'
  },
  'booking': {
    vi: 'Đặt lịch',
    en: 'Booking'
  },
  'appointments': {
    vi: 'Cuộc hẹn',
    en: 'Appointments'
  },
  'date': {
    vi: 'Ngày',
    en: 'Date'
  },
  'time': {
    vi: 'Thời gian',
    en: 'Time'
  },
  'status': {
    vi: 'Trạng thái',
    en: 'Status'
  },
  'description': {
    vi: 'Mô tả',
    en: 'Description'
  },

  // Actions
  'import_excel': {
    vi: 'Import Excel',
    en: 'Import Excel'
  },
  'export_excel': {
    vi: 'Export Excel',
    en: 'Export Excel'
  },
  'download_template': {
    vi: 'Tải mẫu Excel',
    en: 'Download Template'
  },
  'choose_file': {
    vi: 'Chọn File',
    en: 'Choose File'
  },
  'preview_data': {
    vi: 'Xem trước dữ liệu',
    en: 'Preview Data'
  },
  'valid_data': {
    vi: 'dữ liệu hợp lệ',
    en: 'valid data'
  },
  'invalid_data': {
    vi: 'dữ liệu có lỗi',
    en: 'invalid data'
  },
  'import_success': {
    vi: 'Import thành công',
    en: 'Import successful'
  },
  'export_success': {
    vi: 'Xuất Excel thành công',
    en: 'Export successful'
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  // Lấy ngôn ngữ từ localStorage khi khởi tạo
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') as Language;
    if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Lưu ngôn ngữ vào localStorage khi thay đổi
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  // Hàm translate
  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 