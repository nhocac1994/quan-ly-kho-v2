import React, { useState, useMemo } from 'react';
import {
    Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  LocalShipping as ShippingIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { 
  useInboundShipments, 
  useSuppliers, 
  useProducts,
  useCustomers,
  useAddShipmentHeader,
  useAddShipmentItems,
  useDeleteShipmentItems,
  useShipmentHeaders,
  useShipmentItems
} from '../hooks/useSupabaseQueries';
import { dataService } from '../services/dataService';
import { useSidebar } from '../contexts/SidebarContext';
import * as XLSX from 'xlsx';
import { generateInboundShipmentId, formatDate as formatDateUtil } from '../utils/shipmentUtils';

// Hàm chuyển đổi ngày Excel sang định dạng ISO
const convertExcelDate = (excelDate: any): string => {
  if (!excelDate) return new Date().toISOString().split('T')[0];
  
  // Nếu là số (Excel date number)
  if (typeof excelDate === 'number') {
    // Excel date là số ngày từ 1/1/1900
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Nếu là chuỗi ngày
  if (typeof excelDate === 'string') {
    // Thử parse chuỗi ngày
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Fallback về ngày hiện tại
  return new Date().toISOString().split('T')[0];
};

interface InboundShipmentFormData {
  xuat_kho_id: string;
  ngay_nhap: string;
  loai_nhap: string;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  tai_xe: string;
  noi_dung_nhap: string;
  ghi_chu: string;
}

interface ProductItem {
  id: string;
  product_id: string; // UUID của product
  san_pham_id: string; // Mã sản phẩm (như SP2000)
  ten_san_pham: string;
  ma_hang: string;
  dvt: string;
  sl_nhap: number;
  kien_hang: number; // Số kiện hàng
  ghi_chu: string;
}

const InboundShipments: React.FC = () => {
  const { data: inboundShipments, refetch: refreshInboundShipments } = useInboundShipments();
  const { data: shipmentHeaders, refetch: refreshShipmentHeaders } = useShipmentHeaders('inbound');
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  
  // State để lưu sản phẩm đã lọc theo nhà cung cấp
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const { currentDrawerWidth } = useSidebar();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [viewingShipment, setViewingShipment] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [isCopying, setIsCopying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [importSupplierData, setImportSupplierData] = useState({
    supplier_id: '',
    supplier_name: '',
    customer_id: '',
    customer_name: '',
    driver: '',
    content: '',
    notes: ''
  });


  const [formData, setFormData] = useState<InboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_nhap: new Date().toISOString().split('T')[0],
    loai_nhap: '',
    nha_cung_cap_id: '',
    ten_nha_cung_cap: '',
    khach_hang_id: '',
    ten_khach_hang: '',
    tai_xe: '',
    noi_dung_nhap: '',
    ghi_chu: '',
  });

  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: '',
    product_id: '',
    san_pham_id: '',
    ten_san_pham: '',
    ma_hang: '',
    dvt: '',
    sl_nhap: 1,
    kien_hang: 1,
    ghi_chu: '',
  });


  const filteredShipments = useMemo(() => {
    return (shipmentHeaders || []).filter((shipment: any) =>
      shipment.shipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentHeaders, searchTerm]);

  const formatDate = formatDateUtil;

  const generateShipmentId = generateInboundShipmentId;

  const handleOpenDialog = async (shipment?: any) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.shipment_id,
        ngay_nhap: shipment.shipment_date,
        loai_nhap: shipment.import_type || '',
        nha_cung_cap_id: shipment.supplier_id,
        ten_nha_cung_cap: shipment.supplier_name,
        khach_hang_id: shipment.customer_id || '',
        ten_khach_hang: shipment.customer_name || '',
        tai_xe: shipment.driver || '',
        noi_dung_nhap: shipment.content,
        ghi_chu: shipment.notes,
      });
      console.log('Opening edit dialog with shipment ID:', shipment.shipment_id);
      
      // Load items for editing
      try {
        const items = await dataService.shipmentItems.getByHeaderId(shipment.id);
        const formattedItems = items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          san_pham_id: item.product_code,
          ten_san_pham: item.product_name,
          ma_hang: item.product_code,
          dvt: item.unit,
          sl_nhap: item.quantity,
          kien_hang: item.kien_hang || 1,
          ghi_chu: item.notes || '',
        }));
        setProductItems(formattedItems);
      } catch (error) {
        console.error('Error loading shipment items:', error);
        setProductItems([]);
      }
      
      setIsEditing(true);
    } else {
      const newShipmentId = generateShipmentId();
      console.log('Generating new shipment ID:', newShipmentId);
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: newShipmentId,
        ngay_nhap: new Date().toISOString().split('T')[0],
        loai_nhap: '',
        nha_cung_cap_id: '',
        ten_nha_cung_cap: '',
        khach_hang_id: '',
        ten_khach_hang: '',
        tai_xe: '',
        noi_dung_nhap: '',
        ghi_chu: '',
      });
      setProductItems([]);
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
    setIsCopying(false); // Reset copy state
    setIsEditing(false); // Reset editing state
    setImportSupplierData({
      supplier_id: '',
      supplier_name: '',
      customer_id: '',
      customer_name: '',
      driver: '',
      content: '',
      notes: ''
    });
    setFormData({
      xuat_kho_id: '',
      ngay_nhap: new Date().toISOString().split('T')[0],
      loai_nhap: '',
      nha_cung_cap_id: '',
      ten_nha_cung_cap: '',
      khach_hang_id: '',
      ten_khach_hang: '',
      tai_xe: '',
      noi_dung_nhap: '',
      ghi_chu: '',
    });
    setProductItems([]);
    setCurrentProduct({
      id: '',
      product_id: '',
      san_pham_id: '',
      ten_san_pham: '',
      ma_hang: '',
      dvt: '',
      sl_nhap: 1,
      kien_hang: 1,
      ghi_chu: '',
    });
  };

  const addShipmentHeader = useAddShipmentHeader();
  const addShipmentItems = useAddShipmentItems();
  const deleteShipmentItems = useDeleteShipmentItems();

  const handleSubmit = async () => {
    if (productItems.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng thêm ít nhất một sản phẩm', severity: 'warning' });
      return;
    }

    if (formData.loai_nhap === 'Nhập dự án' && !formData.khach_hang_id) {
      setSnackbar({ open: true, message: 'Vui lòng chọn khách hàng cho loại nhập dự án', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Tính tổng số lượng
      const totalQuantity = productItems.reduce((sum, item) => sum + item.sl_nhap, 0);

      // Tạo dữ liệu header
      const headerData = {
        shipment_id: formData.xuat_kho_id,
        shipment_type: 'inbound',
        shipment_date: formData.ngay_nhap,
        supplier_id: formData.nha_cung_cap_id,
        supplier_name: formData.ten_nha_cung_cap,
        customer_id: formData.loai_nhap === 'Nhập dự án' ? formData.khach_hang_id : null,
        customer_name: formData.loai_nhap === 'Nhập dự án' ? formData.ten_khach_hang : null,
        driver: formData.tai_xe,
        import_type: formData.loai_nhap,
        content: formData.noi_dung_nhap,
        notes: formData.ghi_chu,
        total_quantity: totalQuantity,
        total_amount: 0,
        status: 'active',
        created_by: 'admin'
      };

      let headerId: string;

      if (editingShipment) {
        // Cập nhật header hiện có
        const updatedHeader = await dataService.shipmentHeaders.update(editingShipment.id, headerData);
        headerId = updatedHeader.id;
        
        // Xóa items cũ
        await deleteShipmentItems.mutateAsync(headerId);
      } else {
        // Tạo header mới
        const newHeader = await addShipmentHeader.mutateAsync(headerData);
        headerId = newHeader.id;
      }

      // Tạo items
      const itemsData = productItems.map(item => ({
        shipment_header_id: headerId,
        product_id: item.product_id, // Sử dụng UUID đã lưu
        product_name: item.ten_san_pham,
        product_code: item.ma_hang,
        unit: item.dvt,
        quantity: item.sl_nhap,
        kien_hang: item.kien_hang,
        unit_price: 0,
        total_price: 0,
        notes: item.ghi_chu
      }));

      await addShipmentItems.mutateAsync(itemsData);

      await refreshShipmentHeaders();
      setSnackbar({ 
        open: true, 
        message: editingShipment ? 'Cập nhật phiếu nhập thành công!' : (isCopying ? 'Tạo phiếu nhập mới từ bản sao thành công!' : 'Tạo phiếu nhập thành công!'), 
        severity: 'success' 
      });
      setIsCopying(false); // Reset copy state
      setIsEditing(false); // Reset editing state
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving shipment:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi lưu phiếu nhập', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) {
      try {
        // Xóa items trước
        await deleteShipmentItems.mutateAsync(shipmentId);
        // Sau đó xóa header
        await dataService.shipmentHeaders.delete(shipmentId);
        await refreshShipmentHeaders();
        setSnackbar({ open: true, message: 'Xóa phiếu nhập thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting shipment:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa phiếu nhập', severity: 'error' });
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    const shipment = (shipmentHeaders || []).find((s: any) => s.id === shipmentId);
    if (shipment) {
      setViewingShipment(shipment);
      setShowDetails(true);
    }
  };

  // Hook để lấy items của shipment đang xem
  const { data: shipmentItems } = useShipmentItems(viewingShipment?.id || '');

  const handleCloseDetails = () => {
    setShowDetails(false);
    setViewingShipment(null);
  };

  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, sl_nhap: newQuantity } : item
    ));
  };

  const handleUpdateItemNotes = (itemId: string, newNotes: string) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ghi_chu: newNotes } : item
    ));
  };

  const handleUpdateItemKienHang = (itemId: string, newKienHang: number) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, kien_hang: newKienHang } : item
    ));
  };

  // Hàm thêm sản phẩm
  const handleAddProduct = () => {
    if (currentProduct.san_pham_id && currentProduct.ten_san_pham) {
      setProductItems([...productItems, { ...currentProduct, id: Date.now().toString() }]);
      setCurrentProduct({
        id: '',
        product_id: '',
        san_pham_id: '',
        ten_san_pham: '',
        ma_hang: '',
        dvt: '',
        sl_nhap: 1,
        kien_hang: 1,
        ghi_chu: '',
      });
    }
  };

  // Hàm xử lý phím Enter
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddProduct();
    }
  };



  const handleCopyShipment = () => {
    if (!viewingShipment || !shipmentItems) return;

    // Tạo mã phiếu mới
    const newShipmentId = generateShipmentId();
    
    // Tạo form data mới với ngày hiện tại
    const newFormData = {
      xuat_kho_id: newShipmentId,
      ngay_nhap: new Date().toISOString().split('T')[0],
      loai_nhap: viewingShipment.import_type || '',
      nha_cung_cap_id: viewingShipment.supplier_id || '',
      ten_nha_cung_cap: viewingShipment.supplier_name || '',
      khach_hang_id: viewingShipment.customer_id || '',
      ten_khach_hang: viewingShipment.customer_name || '',
      tai_xe: viewingShipment.driver || '',
      noi_dung_nhap: viewingShipment.content || '',
      ghi_chu: viewingShipment.notes || '',
    };

    // Tạo product items mới từ shipment items hiện tại
            const newProductItems = shipmentItems.map((item: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          product_id: item.product_id,
          san_pham_id: item.product_code,
          ten_san_pham: item.product_name,
          ma_hang: item.product_code,
          dvt: item.unit,
          sl_nhap: item.quantity,
          kien_hang: item.kien_hang || 1,
          ghi_chu: item.notes || '',
        }));

    // Set form data và product items
    setFormData(newFormData);
    setProductItems(newProductItems);
    setEditingShipment(null); // Không phải edit, mà là tạo mới
    setIsCopying(true); // Đánh dấu đang copy
    
    // Đóng detail view và mở form
    setShowDetails(false);
    setViewingShipment(null);
    setOpenDialog(true);

    // Hiển thị thông báo
    setSnackbar({ 
      open: true, 
      message: 'Đã sao chép phiếu thành công! Vui lòng kiểm tra và lưu phiếu mới.', 
      severity: 'success' 
    });
  };

  const handlePrintShipment = () => {
    if (!viewingShipment) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Tạo bảng sản phẩm
    const itemsTable = shipmentItems && shipmentItems.length > 0 ? `
      <table class="table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Mã sản phẩm</th>
            <th>Đơn vị tính</th>
            <th>Số lượng nhập</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${shipmentItems.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.product_name}</td>
              <td>${item.product_code}</td>
              <td>${item.unit}</td>
              <td>${item.quantity?.toLocaleString()}</td>
              <td>${item.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p>Chưa có sản phẩm nào</p>';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PHIẾU NHẬP KHO</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .date-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
            min-width: 150px;
          }
          .info-value {
            flex: 1;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .table th, .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .total-row {
            font-weight: bold;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PHIẾU NHẬP KHO</div>
          <div class="date-info">
            <div>Ngày Tháng: ${formatDate(viewingShipment.shipment_date)}</div>
            <div>Số Phiếu: ${viewingShipment.shipment_id}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Nhà cung cấp:</div>
            <div class="info-value">${viewingShipment.supplier_name || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tài xế:</div>
            <div class="info-value">${viewingShipment.driver || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Loại nhập:</div>
            <div class="info-value">${viewingShipment.import_type || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Nội dung:</div>
            <div class="info-value">${viewingShipment.content || 'N/A'}</div>
          </div>
        </div>

        <div class="info-section">
          <h3>Danh sách sản phẩm</h3>
          ${itemsTable}
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Tổng số lượng:</div>
            <div class="info-value">${viewingShipment.total_quantity?.toLocaleString() || 0}</div>
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Người Nhập Hàng</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Người Giao Hàng</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Thủ Kho</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log('Raw Excel data:', jsonData);

        // Bỏ qua header row
        const rows = jsonData.slice(1) as any[][];
        
        console.log('Rows after removing header:', rows);
                const processedData = rows
          .filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== undefined))
          .map((row, index) => {
            // Validation cho từng row
            if (!row[0]) {
              console.warn(`Row ${index + 2} missing shipment ID, skipping`);
              return null;
            }
            
            const convertedDate = row[1] ? convertExcelDate(row[1]) : new Date().toISOString().split('T')[0];
            console.log(`Row ${index + 2}: Original date: ${row[1]} (${typeof row[1]}), Converted: ${convertedDate}`);
            
            return {
              id: `import_${index}`,
              'Mã phiếu': row[0] || `PNK${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
              'Ngày nhập': convertedDate,
              'Loại nhập': row[2] || 'Nhập hàng',
              'Mã sản phẩm': row[3] || '',
              'Tên sản phẩm': row[4] || '',
              'Đơn vị tính': row[5] || '',
              'Số lượng': parseInt(row[6]) || 1,
              'Ghi chú': row[7] || '',
              'Mã NCC': row[8] || '',
              'Tên NCC': row[9] || '',
              'Tài xế': row[10] || '',
              'Nội dung nhập': row[11] || '',
              nhom_san_pham: '',
              hang_sx: '',
              hinh_anh: '',
              thong_tin: '',
              quy_cach: '',
              dia_chi: '',
              so_dt: '',
              ngay_tao: new Date().toISOString(),
              nguoi_tao: 'admin',
              updated_at: new Date().toISOString(),
            };
          })
          .filter(item => item !== null);

        console.log('Processed import data:', processedData);
        setImportData(processedData);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setSnackbar({ 
          open: true, 
          message: 'Có lỗi khi đọc file Excel', 
          severity: 'error' 
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (importData.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Không có dữ liệu để import', 
        severity: 'warning' 
      });
      return;
    }

    setImportLoading(true);
    try {
      // Nhóm dữ liệu theo mã phiếu
      const groupedData = importData.reduce((groups: any, item: any) => {
        const key = item['Mã phiếu'];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
        return groups;
      }, {});
      
      console.log('Grouped data:', groupedData);

      let totalShipments = 0;
      let totalItems = 0;

      // Xử lý từng phiếu
      for (const [shipmentId, items] of Object.entries(groupedData)) {
        const itemsArray = items as any[];
        if (itemsArray.length > 0) {
          const firstItem = itemsArray[0];
          
          // Validation dữ liệu
          let shipmentId = firstItem['Mã phiếu'];
          if (!shipmentId) {
            console.error('Missing shipment_id for item:', firstItem);
            continue;
          }
          
          // Tạo mã phiếu mới nếu bị trùng bằng cách thêm timestamp
          const originalShipmentId = shipmentId;
          const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối của timestamp
          shipmentId = `${originalShipmentId}_${timestamp}`;
          console.log(`Using unique shipment ID: ${shipmentId}`);
          
          // Thông báo nếu mã phiếu đã được thay đổi
          if (originalShipmentId !== shipmentId) {
            console.log(`⚠️ Shipment ID changed from ${originalShipmentId} to ${shipmentId} to avoid duplicate`);
          }
          
          console.log('Processing shipment:', shipmentId);
          
          // Cập nhật mã phiếu cho tất cả items trong nhóm
          itemsArray.forEach((item: any) => {
            item['Mã phiếu'] = shipmentId;
          });
          
          // Tạo header cho phiếu
          const headerData = {
            shipment_id: shipmentId.toString().trim(),
            shipment_type: 'inbound',
            shipment_date: firstItem['Ngày nhập'] || new Date().toISOString().split('T')[0],
            supplier_id: importSupplierData.supplier_id || firstItem['Mã NCC'] || '',
            supplier_name: importSupplierData.supplier_name || firstItem['Tên NCC'] || '',
            customer_id: firstItem['Loại nhập'] === 'Nhập dự án' ? (importSupplierData.customer_id || firstItem['Mã KH'] || '') : null,
            customer_name: firstItem['Loại nhập'] === 'Nhập dự án' ? (importSupplierData.customer_name || firstItem['Tên KH'] || '') : null,
            driver: importSupplierData.driver || firstItem['Tài xế'] || '',
            import_type: firstItem['Loại nhập'] === 'Nhập dự án' ? 'Nhập dự án' : 'Nhập hàng',
            content: importSupplierData.content || firstItem['Nội dung nhập'] || '',
            notes: importSupplierData.notes || '',
            total_quantity: itemsArray.reduce((sum: number, item: any) => sum + (parseInt(item['Số lượng']) || 0), 0),
            total_amount: 0,
            status: 'active',
            created_by: 'admin'
          };
          
          console.log('Creating header with data:', headerData);

          try {
            // Tạo header
            const header = await dataService.shipmentHeaders.create(headerData);
            console.log('Header created successfully:', header);
            totalShipments++;

            // Tạo items cho phiếu
            const itemsData = itemsArray.map((item: any) => ({
              shipment_header_id: header.id,
              product_code: item['Mã sản phẩm'],
              product_name: item['Tên sản phẩm'],
              unit: item['Đơn vị tính'],
              quantity: parseInt(item['Số lượng']) || 0,
              notes: item['Ghi chú'] || ''
            }));

            console.log('Creating items for shipment:', itemsData);

            // Tạo items
            await dataService.shipmentItems.createMany(itemsData);
            totalItems += itemsArray.length;
            console.log(`Successfully processed shipment ${shipmentId} with ${itemsArray.length} items`);
          } catch (error) {
            console.error(`Error processing shipment ${shipmentId}:`, error);
            throw error; // Re-throw để dừng toàn bộ quá trình
          }
        }
      }

      await refreshShipmentHeaders();
      setSnackbar({ 
        open: true, 
        message: `Import thành công ${totalShipments} phiếu nhập kho với ${totalItems} sản phẩm!`, 
        severity: 'success' 
      });
      setOpenImportDialog(false);
      setImportData([]);
      setImportSupplierData({
        supplier_id: '',
        supplier_name: '',
        customer_id: '',
        customer_name: '',
        driver: '',
        content: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error importing data:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi import dữ liệu', 
        severity: 'error' 
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = (suppliers || []).find((s: any) => s.id === supplierId);
    setFormData({
      ...formData,
      nha_cung_cap_id: supplierId,
      ten_nha_cung_cap: supplier ? supplier.ten_ncc : '',
    });
    
    // Lọc sản phẩm theo nhà cung cấp
    if (supplierId && products && shipmentHeaders) {
      // Lấy danh sách sản phẩm đã từng nhập từ nhà cung cấp này
      const supplierShipments = shipmentHeaders.filter((header: any) => 
        header.supplier_id === supplierId && header.shipment_type === 'inbound'
      );
      
      if (supplierShipments.length > 0) {
        // Nếu có lịch sử nhập hàng, chỉ hiển thị sản phẩm đã từng nhập
        // Tạm thời hiển thị tất cả sản phẩm, sau này có thể lọc chính xác hơn
        setFilteredProducts(products);
      } else {
        // Nếu chưa có lịch sử, hiển thị tất cả sản phẩm
        setFilteredProducts(products);
      }
    } else {
      setFilteredProducts([]);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = (customers || []).find((c: any) => c.id === customerId);
    setFormData({
      ...formData,
      khach_hang_id: customerId,
      ten_khach_hang: customer ? (customer.ten_day_du || customer.ten_khach_hang) : '',
    });
  };

  const totalShipments = shipmentHeaders?.length || 0;
  const totalQuantity = (shipmentHeaders || []).reduce((sum: number, shipment: any) => sum + (shipment.total_quantity || 0), 0);
  const todayShipments = (shipmentHeaders || []).filter((shipment: any) => 
    new Date(shipment.shipment_date).toDateString() === new Date().toDateString()
  ).length;

  return (
    <Box sx={{       
    p: { xs: 1, sm: 2, md: 3 }, 
    width: '100%', 
    maxWidth: { xs: '100%', sm: '100%' }, 
    mx: 'auto',
    minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: { xs: 1, sm: 2, md: 3 },
        gap: 2,
        mt: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShippingIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, 
            color: 'primary.main' 
          }}>
            Quản Lý Nhập Kho
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <TextField
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ 
              minWidth: { xs: '100%', sm: 200, md: 200 },
              alignSelf: { xs: 'flex-start', sm: 'flex-start' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: '35px', sm: '35px' },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
          />
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: { xs: 'flex-end', sm: 'flex-end' },
            flexWrap: 'wrap'
          }}>
          <Tooltip title="Import Excel">
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenImportDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                borderColor: 'primary.main',
                color: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                width: 'auto',
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiButton-startIcon': {
                  margin: 0,
                  marginRight: { xs: 0, md: '8px' }
                },
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                }
              }}
            >
              <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
                Import Excel
              </Box>
            </Button>
          </Tooltip>
          <Tooltip title="Thêm Nhập Kho">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                boxShadow: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                width: 'auto',
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiButton-startIcon': {
                  margin: 0,
                  marginRight: { xs: 0, md: '8px' }
                },
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-1px)',
                }
              }}
            >
              <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
                Thêm Nhập Kho
              </Box>
            </Button>
          </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 1,
        gap: 2
      }}>
        <Alert severity="info" sx={{ py: 0, px: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
            Quản lý phiếu nhập kho và theo dõi hàng hóa nhập vào
          </Typography>
        </Alert>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'row', sm: 'row' },
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.65rem', sm: '0.875rem' },
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
            Tổng phiếu: {totalShipments}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
            Sản phẩm: {shipmentHeaders?.length || 0}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
            Số lượng: {totalQuantity.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
            Hôm nay: {todayShipments}
          </Typography>
        </Box>
      </Box>

      {/* InboundShipments Table - Desktop Only */}
      <Paper sx={{ width: '100%', overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 295px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: '#E3F2FD !important', 
                position: 'sticky', 
                top: 0, 
                zIndex: 1000,
                '& .MuiTableCell-root': {
                  backgroundColor: '#E3F2FD !important',
                  color: '#000 !important',
                  fontWeight: 'bold'
                } 
                }}>
                <TableCell>STT</TableCell>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Ngày Nhập</TableCell>
                <TableCell>Loại Nhập</TableCell>
                <TableCell>Tổng Số Lượng</TableCell>
                <TableCell>Nhà Cung Cấp</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell>Nội Dung</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((shipment, index) => (
                  <TableRow key={shipment.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>{shipment.shipment_id}</TableCell>
                    <TableCell>{formatDate(shipment.shipment_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={shipment.import_type || 'Nhập hàng'} 
                        size="small"
                        color={
                          shipment.import_type === 'Nhập hàng' ? 'success' :
                          shipment.import_type === 'Nhập dự án' ? 'info' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{shipment.total_quantity?.toLocaleString()}</TableCell>
                    <TableCell>{shipment.supplier_name}</TableCell>
                    <TableCell>{shipment.customer_name || '-'}</TableCell>
                    <TableCell>{shipment.content}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(shipment.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(shipment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(shipment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredShipments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
        />
      </Paper>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredShipments
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((shipment, index) => (
              <Card key={shipment.id} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                        {page * rowsPerPage + index + 1}.
                      </Typography>
                      <Chip
                        label={shipment.shipment_id}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Chip
                      label={shipment.import_type || 'Nhập hàng'}
                      color={
                        shipment.import_type === 'Nhập hàng' ? 'success' :
                        shipment.import_type === 'Nhập trả' ? 'warning' :
                        'default'
                      }
                      size="small"
                    />
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ 
                      cursor: 'pointer',
                      color: 'primary.main',
                      mb: 1,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.dark'
                      }
                    }}
                    onClick={() => handleViewDetails(shipment.id)}
                  >
                    Phiếu nhập kho
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Ngày:</Typography>
                      <Typography variant="body2">{formatDate(shipment.shipment_date)}</Typography>
                    </Box>
                    {shipment.supplier_name && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Nhà cung cấp:</Typography>
                        <Typography variant="body2">{shipment.supplier_name}</Typography>
                      </Box>
                    )}
                    {shipment.customer_name && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                        <Typography variant="body2">{shipment.customer_name}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                      <Typography variant="body2">{shipment.total_quantity?.toLocaleString() || 0}</Typography>
                    </Box>
                    {shipment.content && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Nội dung:</Typography>
                        <Typography variant="body2" sx={{ maxWidth: 150, textAlign: 'right' }}>
                          {shipment.content}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewDetails(shipment.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(shipment)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(shipment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredShipments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </Box>
      </Box>

      {/* Form Section - Hiển thị khi openDialog = true */}
      {openDialog && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: { xs: 0, md: currentDrawerWidth }, // Điều chỉnh theo trạng thái sidebar
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: { xs: 'none', md: '1px solid #e0e0e0' }
        }}>
          {/* Header nhỏ gọn */}
          <Box sx={{ 
            bgcolor: 'white', 
            color: 'text.primary',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0',
            mt: { xs: 8, md: 8 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ShippingIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {editingShipment ? 'Chỉnh Sửa Phiếu Nhập Kho' : (isCopying ? 'Tạo Phiếu Nhập Mới (Sao chép)' : 'Tạo Phiếu Nhập Mới')}
              </Typography>
            </Box>
            {/* Debug info */}
            <Typography variant="caption" sx={{ bgcolor: 'yellow', p: 0.5, fontSize: '0.6rem', position: 'absolute', top: 0, left: 0 }}>
              Mã phiếu: {formData.xuat_kho_id || 'Chưa có'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {/* Desktop version */}
              <Box sx={{ 
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center', 
                gap: 0.5,
                bgcolor: 'primary.main',
                color: 'white',
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                minWidth: 'fit-content'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: 'white'
                }}>
                  {formData.xuat_kho_id || 'Đang tạo mã...'}
                </Typography>
                <Tooltip title="Sao chép mã phiếu">
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.xuat_kho_id);
                      setSnackbar({ 
                        open: true, 
                        message: 'Đã sao chép mã phiếu vào clipboard!', 
                        severity: 'success' 
                      });
                    }}
                    sx={{ 
                      color: 'white',
                      p: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Mobile version */}
              <Box sx={{ 
                display: { xs: 'flex', sm: 'none' },
                alignItems: 'center', 
                gap: 0.5,
                bgcolor: 'primary.main',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <Typography variant="caption" sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  fontSize: '0.75rem'
                }}>
                  {formData.xuat_kho_id ? formData.xuat_kho_id.substring(0, 8) + '...' : 'Đang tạo...'}
                </Typography>
                <Tooltip title="Sao chép mã phiếu">
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.xuat_kho_id);
                      setSnackbar({ 
                        open: true, 
                        message: 'Đã sao chép mã phiếu!', 
                        severity: 'success' 
                      });
                    }}
                    sx={{ 
                      color: 'white',
                      p: 0.25,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    <CopyIcon sx={{ fontSize: '0.875rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <IconButton 
                onClick={handleCloseDialog}
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { bgcolor: '#f5f5f5' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content nhỏ gọn */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            bgcolor: '#f8f9fa'
          }}>
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: { xs: 0, sm: 1 }, 
              p: { xs: 1.5, sm: 2 }, 
              mb: 2,
              boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.1)' }
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                {/* Thông tin chung */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 1, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    Thông tin chung
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                    gap: { xs: 1.5, sm: 2 } 
                  }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Loại nhập</InputLabel>
                      <Select
                        value={formData.loai_nhap}
                        label="Loại nhập"
                        onChange={(e) => setFormData({ ...formData, loai_nhap: e.target.value })}
                      >
                        <MenuItem value="Nhập hàng">Nhập hàng</MenuItem>
                        <MenuItem value="Nhập dự án">Nhập dự án</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      fullWidth
                      label="Ngày nhập"
                      type="date"
                      value={formData.ngay_nhap}
                      onChange={(e) => setFormData({ ...formData, ngay_nhap: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Autocomplete
                      size="small"
                      options={suppliers || []}
                      getOptionLabel={(option: any) => option.ten_ncc || ''}
                      value={suppliers?.find(s => s.id === formData.nha_cung_cap_id) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          handleSupplierChange(newValue.id);
                        } else {
                          handleSupplierChange('');
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nhà cung cấp"
                          placeholder="Gõ để tìm nhà cung cấp..."
                        />
                      )}
                      renderOption={(props, option: any) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {option.ten_ncc}
                              </Typography>
                              {option.ten_day_du && option.ten_day_du !== option.ten_ncc && (
                                <Typography variant="caption" color="text.secondary">
                                  {option.ten_day_du}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      }}
                      filterOptions={(options, { inputValue }) => {
                        const filterValue = inputValue.toLowerCase();
                        return options.filter((option: any) =>
                          option.ten_ncc.toLowerCase().includes(filterValue) ||
                          (option.ten_day_du && option.ten_day_du.toLowerCase().includes(filterValue))
                        );
                      }}
                      noOptionsText="Không tìm thấy nhà cung cấp"
                      loading={!suppliers}
                      loadingText="Đang tải nhà cung cấp..."
                    />
                                          {formData.loai_nhap === 'Nhập dự án' && (
                        <Autocomplete
                          size="small"
                          options={customers || []}
                          getOptionLabel={(option: any) => option.ten_day_du || option.ten_khach_hang || ''}
                          value={customers?.find(c => c.id === formData.khach_hang_id) || null}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              handleCustomerChange(newValue.id);
                            } else {
                              handleCustomerChange('');
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Khách hàng"
                              placeholder="Gõ để tìm khách hàng..."
                            />
                          )}
                          renderOption={(props, option: any) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box component="li" key={key} {...otherProps}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {option.ten_day_du || option.ten_khach_hang}
                                  </Typography>
                                  {option.loai_khach_hang && (
                                    <Typography variant="caption" color="text.secondary">
                                      {option.loai_khach_hang}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          }}
                          filterOptions={(options, { inputValue }) => {
                            const filterValue = inputValue.toLowerCase();
                            return options.filter((option: any) =>
                              (option.ten_day_du && option.ten_day_du.toLowerCase().includes(filterValue)) ||
                              (option.ten_khach_hang && option.ten_khach_hang.toLowerCase().includes(filterValue)) ||
                              (option.loai_khach_hang && option.loai_khach_hang.toLowerCase().includes(filterValue))
                            );
                          }}
                          noOptionsText="Không tìm thấy khách hàng"
                          loading={!customers}
                          loadingText="Đang tải khách hàng..."
                        />
                      )}
                                          <TextField
                        size="small"
                        fullWidth
                        label="Tài xế"
                        value={formData.tai_xe}
                        onChange={(e) => setFormData({ ...formData, tai_xe: e.target.value })}
                        placeholder="Nhập tên tài xế..."
                      />
                    <TextField
                      size="small"
                      fullWidth
                      label="Nội dung nhập"
                      value={formData.noi_dung_nhap}
                      onChange={(e) => setFormData({ ...formData, noi_dung_nhap: e.target.value })}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Ghi chú"
                      value={formData.ghi_chu}
                      onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                    />
                  </Box>
                </Box>

                {/* Chi tiết sản phẩm */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 1, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    Chi tiết sản phẩm *
                  </Typography>
                  {formData.nha_cung_cap_id && (
                    <Typography variant="body2" color="info.main" sx={{ mb: 1, fontStyle: 'italic' }}>
                      💡 Đã chọn nhà cung cấp: {formData.ten_nha_cung_cap} - Danh sách sản phẩm sẽ được lọc theo nhà cung cấp này
                    </Typography>
                  )}
                  
                  {/* Product Entry Row - Desktop */}
                  <Box sx={{ 
                    display: { xs: 'none', lg: 'grid' },
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', 
                    gap: 1, 
                    alignItems: 'center',
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: '#fafafa'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', mb: 0.5, fontStyle: 'italic' }}>
                      💡 Tip: Nhấn Enter trong bất kỳ ô nào để thêm sản phẩm nhanh
                    </Typography>
                    <Autocomplete
                      size="small"
                      options={formData.nha_cung_cap_id ? (filteredProducts || []) : (products || [])}
                      getOptionLabel={(option: any) => `${option.san_pham_id} - ${option.ten_san_pham}`}
                      value={products?.find(p => p.san_pham_id === currentProduct.san_pham_id) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setCurrentProduct({
                            ...currentProduct,
                            product_id: newValue.id,
                            san_pham_id: newValue.san_pham_id,
                            ten_san_pham: newValue.ten_san_pham,
                            ma_hang: newValue.san_pham_id,
                            dvt: newValue.dvt,
                          });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sản phẩm"
                          placeholder={formData.nha_cung_cap_id ? "Gõ để tìm sản phẩm của nhà cung cấp..." : "Gõ để tìm sản phẩm..."}
                        />
                      )}
                      renderOption={(props, option: any) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {option.ten_san_pham}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Mã: {option.san_pham_id} | ĐVT: {option.dvt}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      filterOptions={(options, { inputValue }) => {
                        const filterValue = inputValue.toLowerCase();
                        return options.filter((option: any) =>
                          option.ten_san_pham.toLowerCase().includes(filterValue) ||
                          option.san_pham_id.toLowerCase().includes(filterValue)
                        );
                      }}
                      noOptionsText={formData.nha_cung_cap_id ? "Không tìm thấy sản phẩm của nhà cung cấp này" : "Không tìm thấy sản phẩm"}
                      loading={!products}
                      loadingText="Đang tải sản phẩm..."
                    />
                    <TextField
                      size="small"
                      label="Mã hàng"
                      value={currentProduct.ma_hang}
                      InputProps={{ readOnly: true }}
                      placeholder="Tự động điền"
                    />
                    <TextField
                      size="small"
                      label="ĐVT"
                      value={currentProduct.dvt}
                      InputProps={{ readOnly: true }}
                      placeholder="Tự động điền"
                    />
                    <TextField
                      size="small"
                      label="SL"
                      type="number"
                      value={currentProduct.sl_nhap}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, sl_nhap: parseInt(e.target.value) || 0 })}
                      onKeyPress={handleKeyPress}
                    />
                    <TextField
                      size="small"
                      label="Kiện hàng"
                      type="number"
                      value={currentProduct.kien_hang}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, kien_hang: parseInt(e.target.value) || 0 })}
                      onKeyPress={handleKeyPress}
                    />
                    <TextField
                      size="small"
                      label="Ghi chú"
                      value={currentProduct.ghi_chu}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, ghi_chu: e.target.value })}
                      onKeyPress={handleKeyPress}
                    />
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={handleAddProduct}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  {/* Product Entry Row - Mobile */}
                  <Box sx={{ 
                    display: { xs: 'flex', lg: 'none' },
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: '#fafafa'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      💡 Tip: Nhấn Enter trong bất kỳ ô nào để thêm sản phẩm nhanh
                    </Typography>
                    <Autocomplete
                      size="small"
                      options={formData.nha_cung_cap_id ? (filteredProducts || []) : (products || [])}
                      getOptionLabel={(option: any) => `${option.san_pham_id} - ${option.ten_san_pham}`}
                      value={products?.find(p => p.san_pham_id === currentProduct.san_pham_id) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setCurrentProduct({
                            ...currentProduct,
                            product_id: newValue.id,
                            san_pham_id: newValue.san_pham_id,
                            ten_san_pham: newValue.ten_san_pham,
                            ma_hang: newValue.san_pham_id,
                            dvt: newValue.dvt,
                          });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sản phẩm"
                          placeholder={formData.nha_cung_cap_id ? "Gõ để tìm sản phẩm của nhà cung cấp..." : "Gõ để tìm sản phẩm..."}
                        />
                      )}
                      renderOption={(props, option: any) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {option.ten_san_pham}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Mã: {option.san_pham_id} | ĐVT: {option.dvt}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      filterOptions={(options, { inputValue }) => {
                        const filterValue = inputValue.toLowerCase();
                        return options.filter((option: any) =>
                          option.ten_san_pham.toLowerCase().includes(filterValue) ||
                          option.san_pham_id.toLowerCase().includes(filterValue)
                        );
                      }}
                      noOptionsText={formData.nha_cung_cap_id ? "Không tìm thấy sản phẩm của nhà cung cấp này" : "Không tìm thấy sản phẩm"}
                      loading={!products}
                      loadingText="Đang tải sản phẩm..."
                    />
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField
                        size="small"
                        label="Mã hàng"
                        value={currentProduct.ma_hang}
                        InputProps={{ readOnly: true }}
                        placeholder="Tự động điền"
                      />
                      <TextField
                        size="small"
                        label="ĐVT"
                        value={currentProduct.dvt}
                        InputProps={{ readOnly: true }}
                        placeholder="Tự động điền"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <TextField
                        size="small"
                        label="Số lượng"
                        type="number"
                        value={currentProduct.sl_nhap}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, sl_nhap: parseInt(e.target.value) || 0 })}
                        onKeyPress={handleKeyPress}
                      />
                      <TextField
                        size="small"
                        label="Kiện hàng"
                        type="number"
                        value={currentProduct.kien_hang}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, kien_hang: parseInt(e.target.value) || 0 })}
                        onKeyPress={handleKeyPress}
                      />
                    </Box>
                    <TextField
                      size="small"
                      label="Ghi chú"
                      value={currentProduct.ghi_chu}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, ghi_chu: e.target.value })}
                      onKeyPress={handleKeyPress}
                    />
                    
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddProduct}
                      sx={{
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 0.75
                      }}
                    >
                      Thêm sản phẩm
                    </Button>
                  </Box>

                  {/* Product Items Table */}
                  {isEditing && productItems.length > 0 && (
                    <Box sx={{ mb: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        📝 Đang chỉnh sửa phiếu: {productItems.length} sản phẩm đã được tải
                      </Typography>
                    </Box>
                  )}
                  
                  {productItems.length > 0 && (
                    <>
                      {/* Desktop Table */}
                      <Paper sx={{ mb: 1, display: { xs: 'none', lg: 'block' } }}>
                        <TableContainer>
                          <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell size="small">STT</TableCell>
                              <TableCell size="small">Sản phẩm</TableCell>
                              <TableCell size="small">Mã hàng</TableCell>
                              <TableCell size="small">ĐVT</TableCell>
                              <TableCell size="small">Số lượng</TableCell>
                              <TableCell size="small">Kiện hàng</TableCell>
                              <TableCell size="small">Ghi chú</TableCell>
                              <TableCell size="small" align="center">Thao tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {productItems.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell size="small">{index + 1}</TableCell>
                                <TableCell size="small">{item.ten_san_pham}</TableCell>
                                <TableCell size="small">{item.ma_hang}</TableCell>
                                <TableCell size="small">{item.dvt}</TableCell>
                                <TableCell size="small">
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.sl_nhap}
                                    onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                    sx={{ 
                                      width: 80,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 32,
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                  />
                                </TableCell>
                                <TableCell size="small">
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.kien_hang}
                                    onChange={(e) => handleUpdateItemKienHang(item.id, parseInt(e.target.value) || 0)}
                                    sx={{ 
                                      width: 80,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 32,
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                  />
                                </TableCell>
                                <TableCell size="small">
                                  <TextField
                                    size="small"
                                    value={item.ghi_chu}
                                    onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                                    placeholder="Ghi chú..."
                                    sx={{ 
                                      width: 120,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 32,
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell size="small" align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setProductItems(productItems.filter(p => p.id !== item.id));
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        Danh sách sản phẩm ({productItems.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {productItems.map((item, index) => (
                          <Card key={item.id} sx={{ 
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              boxShadow: 2,
                              borderColor: 'primary.main'
                            }
                          }}>
                            <CardContent sx={{ p: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                                    {index + 1}.
                                  </Typography>
                                  <Chip
                                    label={item.ma_hang}
                                    color="primary"
                                    size="small"
                                  />
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setProductItems(productItems.filter(p => p.id !== item.id));
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                sx={{ 
                                  color: 'primary.main',
                                  mb: 1,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {item.ten_san_pham}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">ĐVT:</Typography>
                                  <Typography variant="body2">{item.dvt}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.sl_nhap}
                                    onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                    sx={{ 
                                      width: 80,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 28,
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Kiện hàng:</Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.kien_hang}
                                    onChange={(e) => handleUpdateItemKienHang(item.id, parseInt(e.target.value) || 0)}
                                    sx={{ 
                                      width: 80,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 28,
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Ghi chú:</Typography>
                                  <TextField
                                    size="small"
                                    value={item.ghi_chu}
                                    onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                                    placeholder="Ghi chú..."
                                    sx={{ 
                                      width: 120,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        height: 28,
                                      }
                                    }}
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  </>
                  )}

                  {/* Summary */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    mt: 1,
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Tổng cộng: {productItems.length} sản phẩm
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Tổng số lượng: {productItems.reduce((sum, item) => sum + item.sl_nhap, 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* Footer nhỏ gọn */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderTop: '1px solid #e0e0e0',
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: { xs: 0.5, sm: 1 },
            alignItems: 'center'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.75, sm: 0.5 },
                mb: { xs: 2, sm: 0 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                flex: { xs: 1, sm: 'none' },
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                }
              }}
            >
              HỦY
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              size="small"
              disabled={loading || productItems.length === 0}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.75, sm: 0.5 },
                mb: { xs: 2, sm: 0 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                flex: { xs: 1, sm: 'none' },
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {loading ? <CircularProgress size={16} /> : 'LƯU PHIẾU NHẬP'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Chi tiết phiếu nhập */}
      {showDetails && viewingShipment && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: { xs: 0, md: currentDrawerWidth }, // Điều chỉnh theo trạng thái sidebar
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
          mt: { xs: 8, md: 8 }
        }}>
          {/* Header chi tiết */}
          <Box sx={{ 
            bgcolor: 'white',
            color: 'primary.main',
            p: {xs:1,sm:2},
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShippingIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Chi tiết phiếu nhập kho
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ py: 0.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {viewingShipment.shipment_id}
            </Typography>
            <IconButton
              onClick={handleCloseDetails}
              sx={{ color: 'primary.main' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
            </Box>
          </Box>

          {/* Content chi tiết */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: { xs: 1, sm: 2 },
            bgcolor: '#f8f9fa'
          }}>

            {/* Header với nút quay lại và in */}
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'column' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'flex-end' },
              gap: { xs: 1, sm: 0 }
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyShipment}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    height: { xs: '35px', sm: '35px' },
                    px: { xs: 1, sm: 2 },
                    py: 1,
                    borderColor: 'success.main',
                    color: 'success.main',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    width: 'auto',
                    minWidth: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& .MuiButton-startIcon': {
                      margin: 0,
                      marginRight: { xs: 0, md: '8px' }
                    },
                    '&:hover': {
                      backgroundColor: 'success.light',
                      color: 'white',
                      borderColor: 'success.light',
                    }
                  }}
                >
                  Copy Phiếu
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintShipment}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    height: { xs: '35px', sm: '35px' },
                    px: { xs: 1, sm: 2 },
                    py: 1,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    width: 'auto',
                    minWidth: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                      '& .MuiButton-startIcon': {
                        margin: 0,
                        marginRight: { xs: 0, md: '8px' }
                      },
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      borderColor: 'primary.light',
                    }
                  }}
                >
                  In Phiếu Nhập
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: { xs: 0, sm: 2 }, 
              p: { xs: 1, sm: 2 }, 
              mb: 2,
              boxShadow: { xs: 0, sm: '0 1px 3px rgba(0,0,0,0.1)' }
            }}>
              {/* Thông tin chung */}
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Thông tin chung
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                gap: { xs: 1.5, sm: 2, lg: 3 }, 
                mb: 3 
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Mã phiếu
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.shipment_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Ngày nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(viewingShipment.shipment_date)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Loại nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.import_type || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Nhà cung cấp
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.supplier_name}
                  </Typography>
                </Box>
                {viewingShipment.customer_name && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Khách hàng
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.customer_name}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tài xế
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.driver || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Nội dung nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.content || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>

              {/* Thông tin sản phẩm */}
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Thông tin sản phẩm
              </Typography>
              
              {/* Desktop Table View */}
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Box sx={{ 
                  bgcolor: '#fafafa', 
                  p: 2, 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  {shipmentItems && shipmentItems.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              STT
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Tên sản phẩm
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Mã sản phẩm
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Đơn vị tính
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Số lượng nhập
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Kiện hàng
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                              Ghi chú
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shipmentItems.map((item: any, index: number) => (
                            <TableRow key={item.id} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {item.product_name}
                              </TableCell>
                              <TableCell>
                                {item.product_code}
                              </TableCell>
                              <TableCell>
                                {item.unit}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>
                                {item.quantity?.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {item.kien_hang || '-'}
                              </TableCell>
                              <TableCell>
                                {item.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có sản phẩm nào trong phiếu này
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Mobile Card View */}
              <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {shipmentItems && shipmentItems.length > 0 ? (
                    shipmentItems.map((item: any, index: number) => (
                      <Card key={item.id} sx={{ 
                        borderRadius: 2,
                        border: '3px solid #4caf50',
                        backgroundColor: '#f8fff8',
                        '&:hover': {
                          borderColor: '#2e7d32',
                          boxShadow: 4,
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                                {index + 1}.
                              </Typography>
                              <Chip
                                label={item.product_code}
                                color="primary"
                                size="small"
                              />
                            </Box>
                            <Chip
                              label={item.quantity?.toLocaleString()}
                              color="success"
                              size="small"
                            />
                          </Box>
                          
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            sx={{ 
                              color: 'primary.main',
                              mb: 1,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {item.product_name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Đơn vị:</Typography>
                              <Typography variant="body2">{item.unit}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                              <Chip label={item.quantity?.toLocaleString()} color="info" size="small" />
                            </Box>
                            {item.notes && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Ghi chú:</Typography>
                                <Typography variant="body2" sx={{ maxWidth: 150, textAlign: 'right' }}>
                                  {item.notes}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có sản phẩm nào trong phiếu này
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Thông tin bổ sung */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  Thông tin bổ sung
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                  gap: { xs: 1.5, sm: 2, lg: 3 } 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(viewingShipment.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Người tạo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.created_by}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Tổng số lượng
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {viewingShipment.total_quantity?.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Dialog Import Excel */}
      <Dialog 
        open={openImportDialog} 
        onClose={() => setOpenImportDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            maxWidth: { xs: '100%', sm: 'md' }
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <UploadIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
              Import Phiếu Nhập Kho từ Excel
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenImportDialog(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 4 } }}>
          {/* Hướng dẫn */}
          <Box sx={{ 
            bgcolor: '#e3f2fd', 
            p: { xs: 1.5, sm: 2 }, 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid #bbdefb'
          }}>
            <Typography variant="h6" sx={{ 
              mb: 1, 
              color: 'primary.main', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
              Hướng dẫn:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: { xs: 1.5, sm: 2 } }}>
              <Typography component="li" variant="body2" sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                File Excel phải có các cột: <strong>Mã phiếu, Ngày nhập, Loại nhập, Mã sản phẩm, Tên sản phẩm (bắt buộc)</strong>
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                Các cột khác: <strong>Đơn vị tính, Số lượng, Ghi chú, Mã NCC, Tên NCC, Tài xế, Nội dung nhập</strong>
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                <strong>Số lượng</strong> phải là số dương
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                <strong>Loại nhập</strong> phải là "Nhập hàng", "Nhập trả", hoặc "Nhập khác"
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                color: 'error.main', 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                Phiếu nhập có mã trùng sẽ được cập nhật thông tin mới
              </Typography>
            </Box>
          </Box>

          {/* Tải mẫu Excel */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: { xs: 1, sm: 2 } 
          }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {
                // Tạo file mẫu Excel
                const sampleData = [
                  ['Mã phiếu', 'Ngày nhập', 'Loại nhập', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Ghi chú', 'Mã NCC', 'Tên NCC', 'Tài xế', 'Nội dung nhập'],
                  ['PNK250802_001', '2025-08-02', 'Nhập hàng', 'SP001', 'Laptop Dell', 'cái', '10', 'Nhập hàng mới', 'NCC001', 'Dell Vietnam', 'Tài xế 1', 'Nhập hàng từ Dell'],
                  ['PNK250802_002', '2025-08-02', 'Nhập trả', 'SP002', 'Chuột Logitech', 'cái', '50', 'Nhập trả hàng', 'NCC002', 'Logitech VN', 'Tài xế 2', 'Nhập trả từ khách hàng']
                ];
                
                const ws = XLSX.utils.aoa_to_sheet(sampleData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Phiếu Nhập');
                
                XLSX.writeFile(wb, 'mau_phieu_nhap_kho.xlsx');
              }}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 0.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                }
              }}
            >
              TẢI MẪU EXCEL
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              Tải file mẫu để xem định dạng chuẩn
            </Typography>
          </Box>

          {/* Khu vực upload file */}
          <Box sx={{ 
            border: '2px dashed #1976d2', 
            borderRadius: 2, 
            p: { xs: 2, sm: 4 }, 
            textAlign: 'center',
            bgcolor: '#f8f9fa',
            mb: 3
          }}>
            <UploadIcon sx={{ 
              fontSize: { xs: 36, sm: 48 }, 
              color: 'primary.main', 
              mb: 2 
            }} />
            <Typography variant="h6" sx={{ 
              mb: 1, 
              color: 'primary.main',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              Chọn file Excel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 2,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Kéo thả file hoặc click để chọn
            </Typography>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
              id="import-excel-dialog-input"
            />
            <label htmlFor="import-excel-dialog-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                CHỌN FILE
              </Button>
            </label>
          </Box>

          {/* Form nhập thông tin nhà cung cấp */}
          {importData.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Thông tin bổ sung cho phiếu nhập
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: { xs: 1.5, sm: 2 } 
              }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Nhà cung cấp</InputLabel>
                  <Select
                    value={importSupplierData.supplier_id}
                    label="Nhà cung cấp"
                    onChange={(e) => {
                      const supplier = (suppliers || []).find((s: any) => s.id === e.target.value);
                      setImportSupplierData({
                        ...importSupplierData,
                        supplier_id: e.target.value,
                        supplier_name: supplier ? supplier.ten_ncc : ''
                      });
                    }}
                  >
                    {(suppliers || []).map((supplier: any) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.ten_ncc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Khách hàng (cho nhập dự án)</InputLabel>
                  <Select
                    value={importSupplierData.customer_id || ''}
                    label="Khách hàng (cho nhập dự án)"
                    onChange={(e) => {
                      const customer = (customers || []).find((c: any) => c.id === e.target.value);
                      setImportSupplierData({
                        ...importSupplierData,
                        customer_id: e.target.value,
                        customer_name: customer ? (customer.ten_day_du || customer.ten_khach_hang) : ''
                      });
                    }}
                  >
                    <MenuItem value="">Không chọn</MenuItem>
                    {(customers || []).map((customer: any) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.ten_day_du || customer.ten_khach_hang}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  fullWidth
                  label="Tài xế"
                  value={importSupplierData.driver}
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, driver: e.target.value })}
                  placeholder="Nhập tên tài xế"
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Nội dung nhập"
                  value={importSupplierData.content}
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, content: e.target.value })}
                  placeholder="Nhập nội dung"
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Ghi chú"
                  value={importSupplierData.notes}
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, notes: e.target.value })}
                  placeholder="Nhập ghi chú"
                />
              </Box>
            </Box>
          )}

          {/* Bảng xem trước */}
          {importData.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Bảng xem trước ({importData.length} phiếu nhập)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                mb: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Kiểm tra dữ liệu trước khi import. Các phiếu có cùng mã sẽ được nhóm lại.
                {(() => {
                  const uniqueShipments = new Set(importData.map(item => item['Mã phiếu']));
                  return ` (${uniqueShipments.size} phiếu duy nhất từ ${importData.length} dòng dữ liệu)`;
                })()}
              </Typography>
              <Box sx={{ 
                maxHeight: { xs: 300, sm: 400 }, 
                overflow: 'auto' 
              }}>
                <TableContainer component={Paper} sx={{ 
                  boxShadow: 1,
                  '& .MuiTableCell-root': {
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    padding: { xs: '4px 2px', sm: '6px 8px' }
                  }
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>STT</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày nhập</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Loại nhập</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Số lượng</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ĐVT</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tài xế</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importData.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{item['Mã phiếu']}</TableCell>
                          <TableCell>
                            {item['Ngày nhập'] ? new Date(item['Ngày nhập']).toLocaleDateString('vi-VN') : 'Chưa có'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: item['Loại nhập'] === 'Nhập hàng' ? '#e8f5e8' : 
                                       item['Loại nhập'] === 'Nhập trả' ? '#fff3e0' : '#f3e5f5',
                              color: item['Loại nhập'] === 'Nhập hàng' ? '#2e7d32' : 
                                     item['Loại nhập'] === 'Nhập trả' ? '#f57c00' : '#7b1fa2',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {item['Loại nhập']}
                            </Box>
                          </TableCell>
                          <TableCell>{item['Tên sản phẩm']}</TableCell>
                          <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>{item['Số lượng']}</TableCell>
                          <TableCell>{item['Đơn vị tính'] || 'Cái'}</TableCell>
                          <TableCell>{item['Tên NCC']}</TableCell>
                          <TableCell>{item['Tài xế']}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          gap: { xs: 0.5, sm: 1 },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            onClick={() => {
              setOpenImportDialog(false);
              setImportData([]);
            }}
            variant="outlined"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 0.5 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 'auto' },
              flex: { xs: 1, sm: 'none' },
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
              }
            }}
          >
            HỦY
          </Button>
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={importLoading || importData.length === 0}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 0.5 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 'auto' },
              flex: { xs: 1, sm: 'none' },
              boxShadow: 1,
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)',
              }
            }}
          >
            {importLoading ? <CircularProgress size={16} /> : `IMPORT (${importData.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InboundShipments; 