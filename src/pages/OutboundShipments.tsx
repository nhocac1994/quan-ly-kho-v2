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
  Tooltip,
  Card,
  CardContent,
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
  Group as GroupIcon,
} from '@mui/icons-material';
import { 
  useOutboundShipments, 
  useCustomers, 
  useProducts,
  useSuppliers,
  useAddShipmentHeader,
  useAddShipmentItems,
  useDeleteShipmentItems,
  useShipmentHeaders,
  useShipmentItems
} from '../hooks/useSupabaseQueries';
import { dataService } from '../services/dataService';
import { useSidebar } from '../contexts/SidebarContext';
import * as XLSX from 'xlsx';
import { generateOutboundShipmentId, formatDate as formatDateUtil } from '../utils/shipmentUtils';

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

interface OutboundShipmentFormData {
  xuat_kho_id: string;
  ngay_xuat: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  loai_xuat: string;
  nha_cung_cap_id: string; // Thêm cho xuất dự án
  ten_nha_cung_cap: string; // Thêm cho xuất dự án
  tai_xe: string;
  noi_dung_xuat: string;
  ghi_chu: string;
}


interface SelectedCustomer {
  id: string;
  name: string;
  selected: boolean;
}

interface ProductItem {
  id: string;
  product_id: string; // UUID của product
  san_pham_id: string; // Mã sản phẩm (như SP2000)
  ten_san_pham: string;
  ma_hang: string;
  dvt: string;
  sl_xuat: number;
  ghi_chu: string;
}

const OutboundShipments: React.FC = () => {
  const { data: outboundShipments, refetch: refreshOutboundShipments } = useOutboundShipments();
  const { data: shipmentHeaders, refetch: refreshShipmentHeaders } = useShipmentHeaders('outbound');
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();
  const { data: inboundShipmentHeaders } = useShipmentHeaders('inbound');
  const { currentDrawerWidth } = useSidebar();
  
  const addShipmentHeader = useAddShipmentHeader();
  const addShipmentItems = useAddShipmentItems();
  const deleteShipmentItems = useDeleteShipmentItems();
  
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
    customer_id: '',
    customer_name: '',
    driver: '',
    import_type: '',
    content: '',
    notes: ''
  });
  
  // State cho Import Excel với nhiều khách hàng
  const [importBulkCreateMode, setImportBulkCreateMode] = useState(false);
  const [importSelectedCustomers, setImportSelectedCustomers] = useState<SelectedCustomer[]>([]);

  const [formData, setFormData] = useState<OutboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_xuat: new Date().toISOString().split('T')[0],
    khach_hang_id: '',
    ten_khach_hang: '',
    loai_xuat: '',
    nha_cung_cap_id: '',
    ten_nha_cung_cap: '',
    tai_xe: '',
    noi_dung_xuat: '',
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
    sl_xuat: 0,
    ghi_chu: '',
  });

  const formatDate = formatDateUtil;

  const generateShipmentId = generateOutboundShipmentId;

  const handleOpenDialog = async (shipment?: any) => {
    if (shipment) {
      setEditingShipment(shipment);
              setFormData({
          xuat_kho_id: shipment.shipment_id || '',
          ngay_xuat: shipment.shipment_date || new Date().toISOString().split('T')[0],
          khach_hang_id: shipment.customer_id || '',
          ten_khach_hang: shipment.customer_name || '',
          loai_xuat: shipment.shipment_type || '',
          nha_cung_cap_id: shipment.supplier_id || '',
          ten_nha_cung_cap: shipment.supplier_name || '',
          tai_xe: shipment.driver || '',
          noi_dung_xuat: shipment.content || '',
          ghi_chu: shipment.notes || '',
        });
      
      try {
        const items = await dataService.shipmentItems.getByHeaderId(shipment.id);
        const formattedItems = items.map((item: any) => ({
          id: item.id, product_id: item.product_id, san_pham_id: item.product_code,
          ten_san_pham: item.product_name, ma_hang: item.product_code, dvt: item.unit,
          sl_xuat: item.quantity, ghi_chu: item.notes || '',
        }));
        setProductItems(formattedItems);
      } catch (error) {
        console.error('Error loading shipment items:', error);
        setProductItems([]);
      }
      setIsEditing(true);
    } else {
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: generateShipmentId(),
        ngay_xuat: new Date().toISOString().split('T')[0],
        khach_hang_id: '',
        ten_khach_hang: '',
        loai_xuat: '',
        nha_cung_cap_id: '',
        ten_nha_cung_cap: '',
        tai_xe: '',
        noi_dung_xuat: '',
        ghi_chu: '',
      });
      setProductItems([]);
      setIsEditing(false);
    }
    setCurrentProduct({
      id: '',
      product_id: '',
      san_pham_id: '',
      ten_san_pham: '',
      ma_hang: '',
      dvt: '',
      sl_xuat: 0,
      ghi_chu: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
    setFormData({
      xuat_kho_id: '',
      ngay_xuat: new Date().toISOString().split('T')[0],
      khach_hang_id: '',
      ten_khach_hang: '',
      loai_xuat: '',
      nha_cung_cap_id: '',
      ten_nha_cung_cap: '',
      tai_xe: '',
      noi_dung_xuat: '',
      ghi_chu: '',
    });
    setProductItems([]);
    setIsCopying(false);
    setIsEditing(false);
  };

  const handleAddProduct = () => {
    if (!currentProduct.san_pham_id || !currentProduct.ten_san_pham || currentProduct.sl_xuat <= 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin sản phẩm',
        severity: 'warning'
      });
      return;
    }

    const newProduct: ProductItem = {
      ...currentProduct,
      id: Date.now().toString(),
    };

    setProductItems(prev => [...prev, newProduct]);
    setCurrentProduct({
      id: '',
      product_id: '',
      san_pham_id: '',
      ten_san_pham: '',
      ma_hang: '',
      dvt: '',
      sl_xuat: 0,
      ghi_chu: '',
    });
  };

  // Hàm xử lý phím Enter
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddProduct();
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setProductItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleProductChange = (productId: string) => {
    const product = (products || []).find((p: any) => p.id === productId);
    if (product) {
      setCurrentProduct(prev => ({
        ...prev,
        product_id: product.id,
        san_pham_id: product.san_pham_id,
        ten_san_pham: product.ten_san_pham,
        ma_hang: product.san_pham_id || '',
        dvt: product.dvt || '',
      }));
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = (customers || []).find((c: any) => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        khach_hang_id: customer.id,
        ten_khach_hang: customer.ten_day_du || customer.ten_khach_hang || '',
        // Reset nhà cung cấp khi thay đổi khách hàng
        nha_cung_cap_id: '',
        ten_nha_cung_cap: '',
      }));
      // Reset sản phẩm khi thay đổi khách hàng
      setProductItems([]);
    }
  };

  // Hàm xử lý khi chọn nhà cung cấp trong xuất dự án
  const handleSupplierChange = (supplierId: string) => {
    const supplier = (suppliers || []).find((s: any) => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      nha_cung_cap_id: supplierId,
      ten_nha_cung_cap: supplier ? supplier.ten_ncc : '',
    }));

    // Tìm đơn nhập mới nhất của nhà cung cấp này
    if (supplierId && inboundShipmentHeaders) {
      const supplierInboundShipments = inboundShipmentHeaders.filter((header: any) => 
        header.supplier_id === supplierId && 
        header.shipment_type === 'inbound' &&
        header.customer_id === formData.khach_hang_id // Chỉ lấy đơn nhập của khách hàng này
      );

      if (supplierInboundShipments.length > 0) {
        // Sắp xếp theo ngày, lấy đơn mới nhất
        const latestShipment = supplierInboundShipments.sort((a: any, b: any) => 
          new Date(b.shipment_date).getTime() - new Date(a.shipment_date).getTime()
        )[0];

        // Load sản phẩm từ đơn nhập mới nhất
        loadProductsFromInboundShipment(latestShipment.id);
      } else {
        // Nếu không có đơn nhập cho khách hàng này, tìm đơn nhập mới nhất của nhà cung cấp (bất kỳ khách hàng nào)
        const allSupplierInboundShipments = inboundShipmentHeaders.filter((header: any) => 
          header.supplier_id === supplierId && 
          header.shipment_type === 'inbound'
        );

        if (allSupplierInboundShipments.length > 0) {
          const latestShipment = allSupplierInboundShipments.sort((a: any, b: any) => 
            new Date(b.shipment_date).getTime() - new Date(a.shipment_date).getTime()
          )[0];

          loadProductsFromInboundShipment(latestShipment.id);
        } else {
          // Nếu không có đơn nhập nào của nhà cung cấp này
          setProductItems([]);
          setSnackbar({
            open: true,
            message: 'Không tìm thấy đơn nhập nào của nhà cung cấp này',
            severity: 'warning'
          });
        }
      }
    }
  };

  // Hàm load sản phẩm từ đơn nhập
  const loadProductsFromInboundShipment = async (shipmentId: string) => {
    try {
      const items = await dataService.shipmentItems.getByHeaderId(shipmentId);
      const formattedItems = items.map((item: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        product_id: item.product_id,
        san_pham_id: item.product_code,
        ten_san_pham: item.product_name,
        ma_hang: item.product_code,
        dvt: item.unit,
        sl_xuat: item.quantity || 0, // Lấy số lượng từ đơn nhập
        ghi_chu: item.notes || '',
      }));
      setProductItems(formattedItems);
      
      setSnackbar({
        open: true,
        message: `Đã load ${formattedItems.length} sản phẩm từ đơn nhập mới nhất của nhà cung cấp với số lượng đầy đủ`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error loading products from inbound shipment:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi khi load sản phẩm từ đơn nhập',
        severity: 'error'
      });
    }
  };

  // Hàm xử lý cho Import Excel với nhiều khách hàng
  const handleImportBulkCustomerSelect = () => {
    if (!importBulkCreateMode) {
      // Chuyển sang chế độ nhiều khách hàng
      const customerList = (customers || []).map((customer: any) => ({
        id: customer.id,
        name: customer.ten_day_du || customer.ten_khach_hang || '',
        selected: false
      }));
      setImportSelectedCustomers(customerList);
      setImportBulkCreateMode(true);
    } else {
      // Chuyển về chế độ đơn lẻ
      setImportBulkCreateMode(false);
      setImportSelectedCustomers([]);
    }
  };









  const handleSubmit = async () => {
    if (productItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng thêm ít nhất một sản phẩm',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      // Tính tổng số lượng
      const totalQuantity = productItems.reduce((sum, item) => sum + item.sl_xuat, 0);

      // Tạo header data
      const headerData = {
        shipment_id: formData.xuat_kho_id,
        shipment_type: 'outbound',
        shipment_date: formData.ngay_xuat,
        supplier_id: formData.loai_xuat === 'Xuất dự án' ? formData.nha_cung_cap_id : null,
        supplier_name: formData.loai_xuat === 'Xuất dự án' ? formData.ten_nha_cung_cap : null,
        customer_id: formData.khach_hang_id,
        customer_name: formData.ten_khach_hang,
        driver: formData.tai_xe,
        import_type: formData.loai_xuat,
        content: formData.noi_dung_xuat,
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
        product_id: item.product_id,
        product_name: item.ten_san_pham,
        product_code: item.ma_hang,
        unit: item.dvt,
        quantity: item.sl_xuat,
        unit_price: 0,
        total_price: 0,
        notes: item.ghi_chu
      }));

      await addShipmentItems.mutateAsync(itemsData);

      await refreshShipmentHeaders();
      
      const message = editingShipment ? 'Cập nhật phiếu xuất thành công!' : (isCopying ? 'Tạo phiếu xuất mới từ bản sao thành công!' : 'Tạo phiếu xuất thành công!');
      
      setSnackbar({ 
        open: true, 
        message, 
        severity: 'success' 
      });
      
      setIsCopying(false);
      setIsEditing(false);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving shipment:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi lưu phiếu xuất', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu xuất kho này?')) {
      try {
        // Xóa items trước
        await deleteShipmentItems.mutateAsync(shipmentId);
        // Sau đó xóa header
        await dataService.shipmentHeaders.delete(shipmentId);
        await refreshShipmentHeaders();
        setSnackbar({ open: true, message: 'Xóa phiếu xuất thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting shipment:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa phiếu xuất', severity: 'error' });
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
      item.id === itemId ? { ...item, sl_xuat: newQuantity } : item
    ));
  };

  const handleUpdateItemNotes = (itemId: string, newNotes: string) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ghi_chu: newNotes } : item
    ));
  };



  const handleCopyShipment = () => {
    if (!viewingShipment || !shipmentItems) return;

    // Tạo mã phiếu mới
    const newShipmentId = generateShipmentId();
    
    // Tạo form data mới với ngày hiện tại
    const newFormData = {
      xuat_kho_id: newShipmentId,
      ngay_xuat: new Date().toISOString().split('T')[0],
      khach_hang_id: viewingShipment.customer_id || '',
      ten_khach_hang: viewingShipment.customer_name || '',
      loai_xuat: viewingShipment.shipment_type || '',
      nha_cung_cap_id: viewingShipment.supplier_id || '',
      ten_nha_cung_cap: viewingShipment.supplier_name || '',
      tai_xe: viewingShipment.driver || '',
      noi_dung_xuat: viewingShipment.content || '',
      ghi_chu: viewingShipment.notes || '',
    };

    // Tạo product items mới từ shipment hiện tại
    const newProductItems = shipmentItems.map((item: any) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      product_id: item.product_id,
      san_pham_id: item.product_code,
      ten_san_pham: item.product_name,
      ma_hang: item.product_code,
      dvt: item.unit,
      sl_xuat: item.quantity,
      
      ghi_chu: item.notes || '',
    }));

    // Cập nhật state
    setFormData(newFormData);
    setProductItems(newProductItems);
    setEditingShipment(null);
    setIsCopying(true);
    setShowDetails(false);
    setOpenDialog(true);

    setSnackbar({
      open: true,
      message: 'Đã sao chép phiếu xuất. Bạn có thể chỉnh sửa và lưu phiếu mới.',
      severity: 'success'
    });
  };

  const handlePrintShipment = () => {
    if (!viewingShipment) {
      console.log('No viewingShipment data found');
      return;
    }
    
    console.log('=== DEBUG PRINT SHIPMENT ===');
    console.log('ViewingShipment:', viewingShipment);
    console.log('ShipmentItems:', shipmentItems);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Tìm các trường có thể chứa thông tin
    const possibleDateFields = ['created_at', 'shipment_date', 'ngay_xuat', 'date', 'created_date'];
    const possibleIdFields = ['id', 'shipment_id', 'xuat_kho_id', 'ma_phieu'];
    const possibleCustomerFields = ['customer_name', 'ten_khach_hang', 'khach_hang'];
    const possibleContentFields = ['content', 'noi_dung_xuat', 'description', 'ghi_chu'];
    
    const foundDate = possibleDateFields.find(field => viewingShipment[field]);
    const foundId = possibleIdFields.find(field => viewingShipment[field]);
    const foundCustomer = possibleCustomerFields.find(field => viewingShipment[field]);
    const foundContent = possibleContentFields.find(field => viewingShipment[field]);
    
    console.log('Found date field:', foundDate, 'Value:', foundDate ? viewingShipment[foundDate] : 'Not found');
    console.log('Found ID field:', foundId, 'Value:', foundId ? viewingShipment[foundId] : 'Not found');
    console.log('Found customer field:', foundCustomer, 'Value:', foundCustomer ? viewingShipment[foundCustomer] : 'Not found');
    console.log('Found content field:', foundContent, 'Value:', foundContent ? viewingShipment[foundContent] : 'Not found');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PHIẾU XUẤT KHO</title>
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
            display: flex; justify-content: space-between; margin-top: 40px;
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
          <div class="title">PHIẾU XUẤT KHO</div>
          <div class="date-info">
            <div>Ngày Tháng: ${foundDate && viewingShipment[foundDate] ? formatDate(viewingShipment[foundDate]) : ''}</div>
            <div>Số Phiếu: ${foundId ? viewingShipment[foundId] : ''}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Người nhận hàng:</div>
            <div class="info-value">${foundCustomer ? viewingShipment[foundCustomer] : ''}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Địa chỉ:</div>
            <div class="info-value">${viewingShipment.dia_chi || viewingShipment.address || ''}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Số điện thoại:</div>
            <div class="info-value">${viewingShipment.so_dt || viewingShipment.phone || ''}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Nội dung xuất:</div>
            <div class="info-value">${foundContent ? viewingShipment[foundContent] : ''}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã Hàng</th>
              <th>Tên Hàng</th>
              <th>ĐVT</th>
              <th>Số Lượng</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            ${shipmentItems && shipmentItems.length > 0 ? 
              shipmentItems.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_code || item.product_id || ''}</td>
                  <td>${item.product_name || ''}</td>
                  <td>${item.unit || ''}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${item.notes || ''}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="6">Chưa có sản phẩm nào</td></tr>'
            }
            <tr class="total-row">
              <td colspan="4">Tổng Cộng:</td>
              <td>${shipmentItems ? shipmentItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) : 0}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Người Lập Phiếu</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Trưởng Bộ Phận</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Tài Xế</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Người Nhận Hàng</div>
            <div>(Ký, họ tên)</div>
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
              'Mã phiếu': row[0] || `PXK${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
              'Ngày xuất': convertedDate,
              'Loại xuất': row[2] || 'Xuất hàng',
              'Mã sản phẩm': row[3] || '',
              'Tên sản phẩm': row[4] || '',
              'Đơn vị tính': row[5] || '',
              'Số lượng': parseInt(row[6]) || 1,
              'Ghi chú': row[7] || '',
              'Mã KH': row[8] || '',
              'Tên KH': row[9] || '',
              'Tài xế': row[10] || '',
              'Nội dung xuất': row[11] || '',
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
        setOpenImportDialog(true);
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
      const groupedData: { [key: string]: any[] } = {};
      importData.forEach(item => {
        const shipmentId = item['Mã phiếu'];
        if (!groupedData[shipmentId]) {
          groupedData[shipmentId] = [];
        }
        groupedData[shipmentId].push(item);
      });

      console.log('Grouped data:', groupedData);

      let totalShipments = 0;
      let totalItems = 0;

      // Xử lý từng phiếu
      for (const [shipmentId, itemsArray] of Object.entries(groupedData)) {
        const firstItem = itemsArray[0];

        // Validation dữ liệu
        let shipmentIdFinal = firstItem['Mã phiếu'];
        if (!shipmentIdFinal) {
          console.error('Missing shipment_id for item:', firstItem);
          continue;
        }
        
        // Tạo mã phiếu mới nếu bị trùng bằng cách thêm timestamp
        const originalShipmentId = shipmentIdFinal;
        const timestamp = Date.now().toString().slice(-4); // Lấy 4 số cuối của timestamp
        shipmentIdFinal = `${originalShipmentId}_${timestamp}`;
        console.log(`Using unique shipment ID: ${shipmentIdFinal}`);
        
        // Thông báo nếu mã phiếu đã được thay đổi
        if (originalShipmentId !== shipmentIdFinal) {
          console.log(`⚠️ Shipment ID changed from ${originalShipmentId} to ${shipmentIdFinal} to avoid duplicate`);
        }
        
        console.log('Processing shipment:', shipmentIdFinal);
        
        // Cập nhật mã phiếu cho tất cả items trong nhóm
        itemsArray.forEach((item: any) => {
          item['Mã phiếu'] = shipmentIdFinal;
        });
        
        // Xác định danh sách khách hàng để tạo phiếu
        let customersToProcess = [];
        
        if (importBulkCreateMode && importSelectedCustomers.filter(c => c.selected).length > 0) {
          // Chế độ tạo hàng loạt: tạo phiếu cho tất cả khách hàng đã chọn
          customersToProcess = importSelectedCustomers.filter(c => c.selected);
        } else {
          // Chế độ thường: tạo phiếu cho khách hàng từ Excel hoặc form
          const customerName = firstItem['Tên KH'] || importSupplierData.customer_name || '';
          const customerId = firstItem['Mã KH'] || importSupplierData.customer_id || '';
          
          // Tìm customer_id từ tên khách hàng nếu có
          let finalCustomerId = customerId;
          if (customerName && !customerId) {
            const foundCustomer = (customers || []).find((c: any) => 
              c.ten_khach_hang === customerName || c.ten_day_du === customerName
            );
            if (foundCustomer) {
              finalCustomerId = foundCustomer.id;
            }
          }
          
          customersToProcess = [{
            id: finalCustomerId,
            name: customerName
          }];
        }
        
        // Tạo phiếu cho từng khách hàng
        for (const customer of customersToProcess) {
          // Validate customer.id
          if (!customer.id || customer.id.trim() === '') {
            console.error(`Invalid customer ID for customer: ${customer.name}`);
            continue;
          }
          
          // Tạo mã phiếu duy nhất cho từng khách hàng - sử dụng 8 ký tự đầu của customer.id
          const customerIdShort = customer.id.substring(0, 8);
          const customerShipmentId = `${shipmentIdFinal}_${customerIdShort}`;
          
          // Tạo header cho phiếu - với fallback cho customer_id
          const headerData = {
            shipment_id: customerShipmentId.toString().trim().substring(0, 50), // Giới hạn 50 ký tự
            shipment_type: 'outbound',
            shipment_date: firstItem['Ngày xuất'] || new Date().toISOString().split('T')[0],
            supplier_id: null,
            supplier_name: null,
            customer_id: customer.id && customer.id.trim() !== '' ? customer.id : null,
            customer_name: customer.name || '',
            driver: (importSupplierData.driver || firstItem['Tài xế'] || '').substring(0, 255),
            import_type: (firstItem['Loại xuất'] || '').substring(0, 100),
            content: importSupplierData.content || firstItem['Nội dung xuất'] || '',
            notes: importSupplierData.notes || firstItem['Ghi chú'] || '',
            total_quantity: itemsArray.reduce((sum: number, item: any) => sum + (parseInt(item['Số lượng']) || 0), 0),
            total_amount: 0,
            status: 'active',
            created_by: 'admin'
          };
          
          console.log(`Creating header for customer ${customer.name} with data:`, headerData);
          console.log('Customer details:', {
            id: customer.id,
            name: customer.name,
            idType: typeof customer.id,
            idLength: customer.id ? customer.id.length : 0
          });
          console.log('Shipment ID details:', {
            original: customerShipmentId,
            truncated: headerData.shipment_id,
            length: headerData.shipment_id.length
          });

          try {
            // Tạo header
            const header = await dataService.shipmentHeaders.create(headerData);
            console.log(`Header created successfully for customer ${customer.name}:`, header);
            totalShipments++;

            // Tạo items cho phiếu
            const itemsData = itemsArray.map((item: any) => {
              // Tìm product_id từ mã sản phẩm
              const product = (products || []).find((p: any) => p.san_pham_id === item['Mã sản phẩm']);
              if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với mã: ${item['Mã sản phẩm']}`);
              }
              
              return {
                shipment_header_id: header.id,
                product_id: product.id, // UUID của product
                product_code: item['Mã sản phẩm'],
                product_name: item['Tên sản phẩm'],
                unit: item['Đơn vị tính'],
                quantity: parseInt(item['Số lượng']) || 0,
                notes: item['Ghi chú'] || ''
              };
            });

            console.log(`Creating items for customer ${customer.name}:`, itemsData);

            // Tạo items
            await dataService.shipmentItems.createMany(itemsData);
            totalItems += itemsArray.length;
            console.log(`Successfully processed shipment ${customerShipmentId} for customer ${customer.name} with ${itemsArray.length} items`);
          } catch (error) {
            console.error(`Error processing shipment ${customerShipmentId} for customer ${customer.name}:`, error);
            throw error; // Re-throw để dừng toàn bộ quá trình
          }
        }
      }

      await refreshShipmentHeaders();
      setSnackbar({
        open: true,
        message: `Import thành công! Đã tạo ${totalShipments} phiếu xuất với ${totalItems} sản phẩm`,
        severity: 'success'
      });
      setOpenImportDialog(false);
      setImportData([]);
      setImportSupplierData({
        customer_id: '',
        customer_name: '',
        driver: '',
        import_type: '',
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



  const filteredShipments = useMemo(() => {
    return (shipmentHeaders || []).filter((shipment: any) =>
      shipment.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentHeaders, searchTerm]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', maxWidth: '100%', overflow: 'hidden', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 3,
        mt: { xs: 2, md: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShippingIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, 
            color: 'primary.main' 
          }}>
            Quản Lý Xuất Kho
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              flexGrow: { xs: 1, sm: 0 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: '35px', sm: '35px' },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'row', sm: 'row' },
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
                  height: { xs: '35px', sm: '35px', md: '35px' },
                  px: { xs: 1, sm: 2 },
                  py: 1,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  width: { xs: 'auto', sm: 'auto', md: 'auto' },
                  minWidth: { xs: 'auto', sm: 'auto', md: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderColor: 'primary.light',
                  }
                }}
              >
                Import Excel
              </Button>
            </Tooltip>
            <Tooltip title="Thêm xuất kho">
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
                  width: "auto",
                  minWidth: "auto",
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
                Thêm Xuất Kho
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-end', sm: 'flex-end' }, 
        mb: 2 
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.65rem', sm: '0.875rem' },
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
            Tổng phiếu: {filteredShipments.length}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
            Sản phẩm: {shipmentHeaders?.length || 0}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
            Số lượng: {filteredShipments.reduce((sum, shipment) => sum + (shipment.total_quantity || 0), 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'warning.main',
            fontSize: 'inherit'
          }}>
            Hôm nay: {filteredShipments.filter(s => formatDate(s.shipment_date) === new Date().toISOString().split('T')[0]).length}
          </Typography>
        </Box>
      </Box>

      {/* Desktop Table View */}
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
                <TableCell>Ngày Xuất</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell>Số Lượng</TableCell>
                <TableCell>Nội Dung</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((shipment, index) => (
                  <TableRow key={shipment.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{shipment.shipment_id}</TableCell>
                    <TableCell>{formatDate(shipment.shipment_date)}</TableCell>
                    <TableCell>{shipment.customer_name || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>{shipment.total_quantity || 0}</TableCell>
                    <TableCell>{shipment.content || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={shipment.status === 'active' ? 'Hoạt động' : 'Đã hủy'}
                        color={shipment.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
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
          component="div"
          count={filteredShipments.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredShipments
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((shipment, index) => (
              <Card key={shipment.id} sx={{ 
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}>
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
                      label={shipment.status === 'active' ? 'Hoạt động' : 'Đã hủy'}
                      color={shipment.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ 
                      color: 'primary.main',
                      mb: 1,
                      fontSize: '1rem'
                    }}
                  >
                    {shipment.customer_name || 'Chưa cập nhật'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Ngày xuất:</Typography>
                      <Typography variant="body2">{formatDate(shipment.shipment_date)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                      <Chip label={shipment.total_quantity || 0} color="info" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Nội dung:</Typography>
                      <Typography variant="body2" sx={{ 
                        maxWidth: '60%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {shipment.content || 'Chưa cập nhật'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(shipment.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
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
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
        
        {/* Mobile Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          gap: 1, 
          mt: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            sx={{ fontSize: '0.75rem' }}
          >
            Trước
          </Button>
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            Trang {page + 1} / {Math.ceil(filteredShipments.length / rowsPerPage)}
          </Typography>
          <Button
            size="small"
            disabled={page >= Math.ceil(filteredShipments.length / rowsPerPage) - 1}
            onClick={() => setPage(page + 1)}
            sx={{ fontSize: '0.75rem' }}
          >
            Sau
          </Button>
        </Box>
      </Box>

      {/* Form Dialog */}
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
          borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
          mt: { xs: 8, md: 8 }
        }}>
          {/* Header */}
          <Box sx={{
            bgcolor: 'white',
            color: 'primary.main',
            p: { xs: 1, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShippingIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {editingShipment ? 'Chỉnh sửa phiếu xuất kho' : 'Tạo phiếu xuất kho mới'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Desktop version */}
              <Box sx={{ 
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center', 
                gap: 0.5,
                bgcolor: 'primary.main',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
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
                sx={{ color: 'primary.main' }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: '#f8f9fa' 
          }}>
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: { xs: 0, sm: 1 }, 
              p: { xs: 1.5, sm: 2 }, 
              mb: 2, 
              boxShadow: { xs: 'none', sm: 1 },
              gap: { xs: 1.5, sm: 2 }
            }}>
              {/* Thông tin chung */}
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
                <TextField
                  size="small"
                  fullWidth
                  label="Ngày xuất"
                  type="date"
                  value={formData.ngay_xuat}
                  onChange={(e) => setFormData({ ...formData, ngay_xuat: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                />
                {/* Khách hàng */}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
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
                
                {/* Nhà cung cấp - chỉ hiển thị khi chọn "Xuất dự án" */}
                {formData.loai_xuat === 'Xuất dự án' && (
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }
                        }}
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
                )}
                

                <FormControl size="small" fullWidth>
                  <InputLabel>Loại xuất</InputLabel>
                  <Select
                    value={formData.loai_xuat}
                    label="Loại xuất"
                    onChange={(e) => setFormData({ ...formData, loai_xuat: e.target.value })}
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }}
                  >
                    <MenuItem value="Xuất hàng">Xuất hàng</MenuItem>
                    <MenuItem value="Xuất dự án">Xuất dự án</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  fullWidth
                  label="Tài xế"
                  value={formData.tai_xe}
                  onChange={(e) => setFormData({ ...formData, tai_xe: e.target.value })}
                  placeholder="Nhập tên tài xế"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Nội dung xuất"
                  value={formData.noi_dung_xuat}
                  onChange={(e) => setFormData({ ...formData, noi_dung_xuat: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Ghi chú"
                  value={formData.ghi_chu}
                  onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: { xs: 0, sm: 1 }, 
              p: { xs: 1.5, sm: 2 }, 
              mb: 2, 
              boxShadow: { xs: 'none', sm: 1 } 
            }}>
              {/* Thêm sản phẩm */}
              <Typography variant="subtitle1" sx={{ 
                mb: 1, 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Chi tiết sản phẩm *
              </Typography>
              

              
              {/* Thông báo khi chọn xuất dự án */}
              {formData.loai_xuat === 'Xuất dự án' && formData.nha_cung_cap_id && (
                <Box sx={{ 
                  mb: 2, 
                  p: 1.5, 
                  bgcolor: 'info.light', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.main'
                }}>
                  <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
                    💡 Đã chọn nhà cung cấp: <strong>{formData.ten_nha_cung_cap}</strong> - 
                    Sản phẩm sẽ được load từ đơn nhập mới nhất của nhà cung cấp này cho khách hàng <strong>{formData.ten_khach_hang}</strong> với số lượng đầy đủ
                  </Typography>
                </Box>
              )}
              
              {/* Desktop Product Entry Row - Luôn hiển thị để có thể thêm sản phẩm */}
                <Box sx={{ 
                  display: { xs: 'none', lg: 'grid' },
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', 
                  gap: 1, 
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: '#fafafa'
                }}>
                <Autocomplete
                  size="small"
                  options={products || []}
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
                      placeholder="Gõ để tìm sản phẩm..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option: any) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                            {option.ten_san_pham}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Mã: {option.san_pham_id} | ĐVT: {option.dvt} | Tồn: {option.sl_ton || 0}
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
                  noOptionsText="Không tìm thấy sản phẩm"
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
                  value={currentProduct.sl_xuat}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, sl_xuat: parseInt(e.target.value) || 0 })}
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
                  onClick={() => {
                    if (currentProduct.san_pham_id && currentProduct.ten_san_pham) {
                      setProductItems([...productItems, { ...currentProduct, id: Date.now().toString() }]);
                      setCurrentProduct({
                        id: '',
                        product_id: '',
                        san_pham_id: '',
                        ten_san_pham: '',
                        ma_hang: '',
                        dvt: '',
                        sl_xuat: 1,
                        ghi_chu: '',
                      });
                    }
                  }}
                  disabled={!currentProduct.san_pham_id || !currentProduct.ten_san_pham}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Mobile Product Entry Row - Luôn hiển thị để có thể thêm sản phẩm */}
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
                <Autocomplete
                  size="small"
                  options={products || []}
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
                      placeholder="Gõ để tìm sản phẩm..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option: any) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                            {option.ten_san_pham}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
                  noOptionsText="Không tìm thấy sản phẩm"
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                  <TextField
                    size="small"
                    label="ĐVT"
                    value={currentProduct.dvt}
                    InputProps={{ readOnly: true }}
                    placeholder="Tự động điền"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>
                
                
                
                <TextField
                  size="small"
                  label="SL"
                  type="number"
                  value={currentProduct.sl_xuat}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, sl_xuat: parseInt(e.target.value) || 0 })}
                  onKeyPress={handleKeyPress}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
                
                <TextField
                  size="small"
                  label="Ghi chú"
                  value={currentProduct.ghi_chu}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ghi_chu: e.target.value })}
                  onKeyPress={handleKeyPress}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
                
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    if (currentProduct.san_pham_id && currentProduct.ten_san_pham) {
                      setProductItems([...productItems, { ...currentProduct, id: Date.now().toString() }]);
                      setCurrentProduct({
                        id: '',
                        product_id: '',
                        san_pham_id: '',
                        ten_san_pham: '',
                        ma_hang: '',
                        dvt: '',
                        sl_xuat: 1,
                        ghi_chu: '',  
                      });
                    }
                  }}
                  disabled={!currentProduct.san_pham_id || !currentProduct.ten_san_pham}
                  sx={{
                    fontSize: '0.875rem',
                    height: '40px'
                  }}
                >
                  Thêm sản phẩm
                </Button>
              </Box>

              {/* Danh sách sản phẩm */}
              {productItems.length > 0 && (
                <Box sx={{ mb: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                  <Typography variant="body2" color="primary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Danh sách sản phẩm đã thêm ({productItems.length} sản phẩm)
                  </Typography>
                  
                  {/* Desktop Table View */}
                  <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                    <TableContainer component={Paper} sx={{ mt: 1, boxShadow: 1, borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 60 }}>STT</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Mã hàng</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>ĐVT</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Số lượng</TableCell>

                            <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">Thao tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productItems.map((item, index) => (
                            <TableRow key={item.id} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{item.ten_san_pham}</TableCell>
                              <TableCell>{item.ma_hang}</TableCell>
                              <TableCell>{item.dvt}</TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.sl_xuat}
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

                              <TableCell>
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
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveProduct(item.id)}
                                  sx={{ 
                                    '&:hover': { 
                                      bgcolor: 'error.light',
                                      color: 'white'
                                    }
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
                  </Box>

                  {/* Mobile Card View */}
                  <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
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
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 25, fontSize: '0.75rem' }}>
                                  {index + 1}.
                                </Typography>
                                <Chip
                                  label={item.ma_hang}
                                  color="primary"
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveProduct(item.id)}
                                sx={{ 
                                  '&:hover': { 
                                    bgcolor: 'error.light',
                                    color: 'white'
                                  }
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
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>ĐVT:</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{item.dvt}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Số lượng:</Typography>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.sl_xuat}
                                  onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                  sx={{ 
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                      fontSize: '0.7rem',
                                      height: 28,
                                    }
                                  }}
                                  inputProps={{ 
                                    min: 1,
                                    style: { textAlign: 'center' }
                                  }}
                                />
                              </Box>
                            </Box>
                            
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Ghi chú:</Typography>
                              <TextField
                                size="small"
                                value={item.ghi_chu}
                                onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                                placeholder="Ghi chú..."
                                sx={{ 
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.7rem',
                                    height: 28,
                                  }
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
              

              
              {/* Thông báo khi chưa có sản phẩm */}
              {productItems.length === 0 && (
                <Box sx={{ 
                  mt: 2, 
                  p: 3, 
                  textAlign: 'center', 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1,
                  border: '1px dashed #ccc'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có sản phẩm nào. Vui lòng thêm sản phẩm vào phiếu xuất kho.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.75, sm: 0.5 },
                mb: {xs:2,sm:0},
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                borderColor: 'primary.main',
                color: 'primary.main',
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 'auto', sm: 'auto' },
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
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.75, sm: 0.5 },
                mb:{xs:2,sm:0},
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                boxShadow: 1,
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 'auto', sm: 'auto' },
                bgcolor: 'primary.main',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-1px)',
                  bgcolor: 'primary.dark',
                }
              }}
            >
              {loading ? (
                <CircularProgress size={16} />
              ) : (
                'LƯU PHIẾU XUẤT'
              )}
            </Button>
          </Box>
        </Box>
      )}

      {/* Detail View */}
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
          {/* Header */}
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
                Chi tiết phiếu xuất kho
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ py: 0.5, fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 500 }}>
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

          {/* Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: { xs: 1, sm: 2 },
            bgcolor: '#f8f9fa'
          }}>
            {/* Header với nút quay lại, copy và in */}
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
                gap: { xs: 0.5, sm: 1 },
                justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                flexWrap: 'nowrap',
                width: { xs: '100%', sm: 'auto' }
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
                  In Phiếu Xuất
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: { xs: 0, sm: 1 }, 
              p: { xs: 1.5, sm: 2 }, 
              mb: 2,
              boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.1)' }
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Mã phiếu
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {viewingShipment.shipment_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Ngày xuất
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {formatDate(viewingShipment.shipment_date)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Khách hàng
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {viewingShipment.customer_name || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Loại xuất
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {viewingShipment.import_type || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                {/* Hiển thị nhà cung cấp cho xuất dự án */}
                {viewingShipment.import_type === 'Xuất dự án' && viewingShipment.supplier_name && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Nhà cung cấp
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {viewingShipment.supplier_name}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Tài xế
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {viewingShipment.driver || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Nội dung xuất
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
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
              {/* Danh sách sản phẩm */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  fontSize: { xs: '0.875rem', sm: '1.25rem' }
                }}>
                  Danh sách sản phẩm xuất ({shipmentItems?.length || 0} sản phẩm)
                </Typography>
                
                {/* Desktop Table View */}
                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                  {shipmentItems && shipmentItems.length > 0 ? (
                    <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>STT</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã sản phẩm</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ĐVT</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Số lượng</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ghi chú</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shipmentItems.map((item, index) => (
                            <TableRow key={item.id} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{item.product_code}</TableCell>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>{item.quantity}</TableCell>
                              <TableCell>{item.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      border: '1px dashed #ccc'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có sản phẩm nào trong phiếu này
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Mobile Card View */}
                <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                  {shipmentItems && shipmentItems.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {shipmentItems.map((item, index) => (
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
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 25, fontSize: '0.75rem' }}>
                                  {index + 1}.
                                </Typography>
                                <Chip
                                  label={item.product_code}
                                  color="primary"
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>
                              <Chip
                                label={item.quantity}
                                color="info"
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
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
                              {item.product_name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>ĐVT:</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{item.unit}</Typography>
                              </Box>
                              {item.notes && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Ghi chú:</Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontSize: '0.7rem',
                                    maxWidth: '60%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      border: '1px dashed #ccc'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
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
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                  gap: { xs: 1.5, sm: 3 } 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 0.5,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {formatDate(viewingShipment.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 0.5,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Ghi chú
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {viewingShipment.notes || 'Chưa cập nhật'}
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
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxWidth: { xs: '100%', sm: '1400px' }
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 1, sm: 1 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <UploadIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
              Import Phiếu Xuất Kho từ Excel
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
                File Excel phải có các cột: <strong>Mã phiếu, Ngày xuất, Loại xuất, Mã sản phẩm, Tên sản phẩm (bắt buộc)</strong>
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                Các cột khác: <strong>Đơn vị tính, Số lượng, Ghi chú, Mã KH, Tên KH, Tài xế, Nội dung xuất</strong>
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
                <strong>Loại xuất</strong> phải là "Xuất hàng" hoặc "Xuất dự án"
              </Typography>
              <Typography component="li" variant="body2" sx={{ 
                color: 'error.main', 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' } 
              }}>
                Phiếu xuất có mã trùng sẽ được cập nhật thông tin mới
              </Typography>
              <Typography component="li" variant="body2" sx={{
                mb: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: 'success.main',
                fontWeight: 'bold'
              }}>
                🚀 Có thể tạo phiếu cho nhiều khách hàng khác nhau trong cùng file Excel
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
                // Tạo file mẫu Excel với nhiều khách hàng
                const sampleData = [
                  ['Mã phiếu', 'Ngày xuất', 'Loại xuất', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Ghi chú', 'Mã KH', 'Tên KH', 'Tài xế', 'Nội dung xuất'],
                  ['PXK250802_001', '2025-08-02', 'Xuất hàng', 'SP001', 'Laptop Dell', 'cái', '5', 'Xuất hàng bán', 'KH001', 'Công ty ABC', 'Tài xế 1', 'Xuất hàng cho khách hàng ABC'],
                  ['PXK250802_001', '2025-08-02', 'Xuất hàng', 'SP002', 'Chuột Logitech', 'cái', '10', 'Xuất hàng bán', 'KH001', 'Công ty ABC', 'Tài xế 1', 'Xuất hàng cho khách hàng ABC'],
                  ['PXK250802_002', '2025-08-02', 'Xuất dự án', 'SP003', 'Bàn phím cơ', 'cái', '3', 'Xuất dự án', 'KH002', 'Công ty XYZ', 'Tài xế 2', 'Xuất cho dự án XYZ'],
                  ['PXK250802_003', '2025-08-02', 'Xuất dự án', 'SP004', 'Màn hình 24 inch', 'cái', '2', 'Xuất dự án', 'KH003', 'Công ty DEF', 'Tài xế 3', 'Xuất cho dự án đặc biệt']
                ];
                
                const ws = XLSX.utils.aoa_to_sheet(sampleData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Phiếu Xuất');
                
                XLSX.writeFile(wb, 'mau_phieu_xuat_kho.xlsx');
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
            p: { xs: 2, sm: 3 }, 
            textAlign: 'center',
            mb: 3,
            bgcolor: '#f8f9fa',
            '&:hover': {
              borderColor: '#1565c0',
              bgcolor: '#e3f2fd'
            }
          }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ 
                display: 'none' 
              }}
              id="excel-upload-outbound"
            />
            <label htmlFor="excel-upload-outbound">
              <Box sx={{ cursor: 'pointer' }}>
                <UploadIcon sx={{ 
                  fontSize: { xs: '2rem', sm: '3rem' }, 
                  color: 'primary.main',
                  mb: 1
                }} />
                <Typography variant="h6" sx={{ 
                  mb: 1, 
                  color: 'primary.main',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  Chọn File Excel
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                }}>
                  Hoặc kéo thả file vào đây
                </Typography>
              </Box>
            </label>
          </Box>

          {/* Form bổ sung thông tin */}
          <Box sx={{ 
            mb: 3, 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 1, 
              fontWeight: 'bold', 
              color: 'primary.main',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              Thông tin bổ sung (nếu không có trong Excel)
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
              gap: { xs: 1.5, sm: 2 } 
            }}>
              {/* Khách hàng đơn lẻ hoặc nhiều khách hàng */}
              {!importBulkCreateMode ? (
                <TextField
                  size="small"
                  fullWidth
                  label="Khách hàng"
                  value={importSupplierData.customer_name}
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, customer_name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                />
              ) : (
                <Autocomplete
                  multiple
                  size="small"
                  options={customers || []}
                  getOptionLabel={(option: any) => option.ten_day_du || option.ten_khach_hang}
                  value={importSelectedCustomers.filter(c => c.selected).map(c => 
                    (customers || []).find(cust => cust.id === c.id)
                  ).filter(Boolean)}
                  onChange={(event, newValue) => {
                    const selectedIds = newValue.map((item: any) => item.id);
                    setImportSelectedCustomers(prev => 
                      prev.map(customer => ({
                        ...customer,
                        selected: selectedIds.includes(customer.id)
                      }))
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn nhiều khách hàng"
                      placeholder="Chọn khách hàng..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option: any) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {option.ten_day_du || option.ten_khach_hang}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index: number) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.ten_day_du || option.ten_khach_hang}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))
                  }
                />
              )}
              
              {/* Nút chuyển đổi chế độ */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<GroupIcon />}
                onClick={handleImportBulkCustomerSelect}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  height: { xs: '35px', sm: '40px' },
                  borderColor: importBulkCreateMode ? 'success.main' : 'primary.main',
                  color: importBulkCreateMode ? 'success.main' : 'primary.main',
                  '&:hover': {
                    backgroundColor: importBulkCreateMode ? 'success.light' : 'primary.light',
                    color: 'white',
                    borderColor: importBulkCreateMode ? 'success.light' : 'primary.light',
                  }
                }}
              >
                {importBulkCreateMode ? 'Chế độ đơn lẻ' : 'Tạo cho nhiều KH'}
              </Button>
              
              <FormControl size="small" fullWidth>
                <InputLabel>Loại xuất</InputLabel>
                <Select
                  value={importSupplierData.import_type || ''}
                  label="Loại xuất"
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, import_type: e.target.value })}
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                >
                  <MenuItem value="Xuất hàng">Xuất hàng</MenuItem>
                  <MenuItem value="Xuất bán">Xuất bán</MenuItem>
                  <MenuItem value="Xuất chuyển kho">Xuất chuyển kho</MenuItem>
                  <MenuItem value="Xuất trả hàng">Xuất trả hàng</MenuItem>
                  <MenuItem value="Xuất hủy">Xuất hủy</MenuItem>
                  <MenuItem value="Xuất khác">Xuất khác</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Tài xế</InputLabel>
                <Select
                  value={importSupplierData.driver || ''}
                  label="Tài xế"
                  onChange={(e) => setImportSupplierData({ ...importSupplierData, driver: e.target.value })}
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                >
                  <MenuItem value="Tài xế 1">Tài xế 1</MenuItem>
                  <MenuItem value="Tài xế 2">Tài xế 2</MenuItem>
                  <MenuItem value="Tài xế 3">Tài xế 3</MenuItem>
                  <MenuItem value="Tài xế 4">Tài xế 4</MenuItem>
                  <MenuItem value="Tài xế 5">Tài xế 5</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                fullWidth
                label="Nội dung xuất"
                value={importSupplierData.content}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, content: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
              <TextField
                size="small"
                fullWidth
                label="Ghi chú"
                value={importSupplierData.notes}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, notes: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Box>
            

                      </Box>
            
            {/* Hiển thị chế độ tạo hàng loạt cho Import Excel */}
            {importBulkCreateMode && (
              <Box sx={{ 
                mt: 2, 
                p: 1.5, 
                bgcolor: '#e8f5e8', 
                borderRadius: 1,
                border: '1px solid #4caf50',
                gridColumn: { xs: '1 / -1', sm: '1 / -1' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="success.main" sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    🚀 Chế độ Import hàng loạt
                  </Typography>
                  <Chip 
                    label={`${importSelectedCustomers.filter(c => c.selected).length} khách hàng`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'block',
                  mb: 1,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}>
                  Sẽ tạo {importSelectedCustomers.filter(c => c.selected).length} phiếu xuất cho mỗi dòng dữ liệu Excel
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setImportBulkCreateMode(false);
                      setImportSelectedCustomers([]);
                    }}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      color: 'error.main'
                    }}
                  >
                    Hủy chế độ hàng loạt
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Preview table */}
          {importData.length > 0 && (
            <Box>
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
              <TableContainer component={Paper} sx={{ 
                maxHeight: 300,
                '& .MuiTableCell-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: '4px 8px', sm: '8px 16px' }
                }
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày xuất</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã SP</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên SP</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ĐVT</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Số lượng</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khách hàng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importData.slice(0, 10).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item['Mã phiếu']}</TableCell>
                        <TableCell>{item['Ngày xuất'] ? new Date(item['Ngày xuất']).toLocaleDateString('vi-VN') : 'Chưa có'}</TableCell>
                        <TableCell>{item['Mã sản phẩm']}</TableCell>
                        <TableCell>{item['Tên sản phẩm']}</TableCell>
                        <TableCell>{item['Đơn vị tính'] || 'Cái'}</TableCell>
                        <TableCell>{item['Số lượng']}</TableCell>
                        <TableCell>{item['Tên KH']}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {importData.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mt: 1, 
                  textAlign: 'center',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  ... và {importData.length - 10} dòng khác
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setOpenImportDialog(false)}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            HỦY
          </Button>
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={importData.length === 0 || importLoading}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {importLoading ? <CircularProgress size={20} /> : 'IMPORT'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OutboundShipments; 