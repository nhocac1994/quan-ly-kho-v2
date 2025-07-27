// Types for Quản lý kho application

export interface CompanyInfo {
  id: string;
  ten_cong_ty: string;
  ten_day_du: string;
  nguoi_dai_dien: string;
  dia_chi: string;
  sdt: string;
  email: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
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
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
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
  update: string;
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
  update: string;
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
  update: string;
}

export interface InboundShipment {
  id: string;
  loai_nhap: string;
  ngay_nhap: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  ma_hoa_don: string;
  sl_san_pham: number;
  sl_xuat: number;
  tai_xe: string;
  noi_dung_nhap: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
}

export interface InboundShipmentDetail {
  id: string;
  nhap_kho_id: string;
  ngay_nhap: string;
  san_pham_id: string;
  ten_san_pham: string;
  nhom_san_pham: string;
  hang_sx: string;
  hinh_anh: string;
  thong_tin: string;
  quy_cach: string;
  dvt: string;
  sl_ton: number;
  kho_id: string;
  sl_xuat: number;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
}

export interface OutboundShipment {
  id: string;
  loai_xuat: string;
  ngay_xuat: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  ma_hoa_don: string;
  sl_san_pham: number;
  sl_xuat: number;
  tai_xe: string;
  noi_dung_xuat: string;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
}

export interface OutboundShipmentDetail {
  id: string;
  xuat_kho_id: string;
  ngay_xuat: string;
  san_pham_id: string;
  ten_san_pham: string;
  nhom_san_pham: string;
  hang_sx: string;
  hinh_anh: string;
  thong_tin: string;
  quy_cach: string;
  dvt: string;
  sl_ton: number;
  kho_id: string;
  sl_xuat: number;
  ghi_chu: string;
  ngay_tao: string;
  nguoi_tao: string;
  update: string;
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