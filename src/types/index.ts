// Types for Quản lý kho application

export interface CompanyInfo {
  id: string;
  ten_cong_ty: string;
  hien_thi: string;
  ten_day_du: string;
  loai_cong_ty: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface User {
  id: string;
  ho_va_ten: string;
  email: string;
  chuc_vu: string;
  phan_quyen: string;
  password: string;
  quyen_xem: string;
  quyen_them: string;
  quyen_sua: string;
  quyen_xoa: string;
  quyen_xuat: string;
  quyen_nhap: string;
  quyen_bao_cao: string;
  quyen_cai_dat: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  ten_ncc: string;
  hien_thi: string;
  ten_day_du: string;
  loai_ncc: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  ten_khach_hang: string;
  hien_thi: string;
  ten_day_du: string;
  loai_khach_hang: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface Product {
  id: string;
  san_pham_id: string;
  ten_san_pham: string;
  kho_id: string;
  ten_kho: string;
  dvt: string;
  sl_ton: number;
  hien_thi: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface InboundShipment {
  id: string;
  xuat_kho_id: string; // Mã phiếu nhập kho
  ngay_nhap: string;
  loai_nhap: string;
  san_pham_id: string;
  ten_san_pham: string;
  nhom_san_pham: string;
  hang_sx: string;
  hinh_anh: string;
  thong_tin: string;
  quy_cach: string;
  dvt: string;
  sl_nhap: number;
  ghi_chu: string;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  tai_xe: string;
  dia_chi: string;
  so_dt: string;
  noi_dung_nhap: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface OutboundShipment {
  id: string;
  xuat_kho_id: string; // Mã phiếu xuất kho
  ngay_xuat: string;
  san_pham_id: string;
  ten_san_pham: string;
  nhom_san_pham: string;
  hang_sx: string;
  hinh_anh: string;
  thong_tin: string;
  quy_cach: string;
  dvt: string;
  sl_xuat: number;
  ghi_chu: string;
  so_hd: string;
  ma_kh: string;
  ten_khach_hang: string;
  dia_chi: string;
  so_dt: string;
  noi_dung_xuat: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface InboundDetail {
  id: string;
  xuat_kho_id: string;
  san_pham_id: string;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  chat_luong: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

export interface OutboundDetail {
  id: string;
  xuat_kho_id: string;
  san_pham_id: string;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  chat_luong: string;
  ngay_tao: string;
  nguoi_tao: string;
  updated_at: string;
}

// Legacy types for backward compatibility
export interface Transaction {
  id: string;
  type: 'inbound' | 'outbound';
  date: string;
  description: string;
  quantity: number;
  productId: string;
}

export interface InboundShipmentItem {
  productId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OutboundShipmentItem {
  productId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export type InboundStatus = 'Chờ Nhập' | 'Đã Nhập' | 'Hủy Bỏ';
export type OutboundStatus = 'Chờ Xuất' | 'Đã Xuất' | 'Hủy Bỏ';

export interface NxtData {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  inboundShipments: InboundShipment[];
  outboundShipments: OutboundShipment[];
  companyInfo: CompanyInfo[];
  users: User[];
  inboundDetails: InboundDetail[];
  outboundDetails: OutboundDetail[];
}

export interface ReportRow {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  value: number;
} 