/**
 * Utility functions for shipment management
 */

/**
 * Tạo mã phiếu theo format: PNK/PXK + ngày/tháng/năm + số thứ tự
 * @param type - Loại phiếu: 'inbound' hoặc 'outbound'
 * @returns Mã phiếu theo format: PNK250124_001 hoặc PXK250124_001
 */
export const generateShipmentId = (type: 'inbound' | 'outbound' = 'inbound'): string => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  
  const prefix = type === 'inbound' ? 'PNK' : 'PXK';
  return `${prefix}${day}${month}${year}_${random}`;
};

/**
 * Tạo mã phiếu nhập kho
 * @returns Mã phiếu nhập: PNK250124_001
 */
export const generateInboundShipmentId = (): string => {
  return generateShipmentId('inbound');
};

/**
 * Tạo mã phiếu xuất kho
 * @returns Mã phiếu xuất: PXK250124_001
 */
export const generateOutboundShipmentId = (): string => {
  return generateShipmentId('outbound');
};

/**
 * Format ngày tháng theo định dạng Việt Nam
 * @param dateString - Chuỗi ngày tháng
 * @returns Ngày tháng theo format dd/mm/yyyy
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}; 