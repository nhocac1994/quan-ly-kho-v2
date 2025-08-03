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
  useOutboundShipments, 
  useCustomers, 
  useProducts,
  useAddShipmentHeader,
  useAddShipmentItems,
  useDeleteShipmentItems,
  useShipmentHeaders,
  useShipmentItems
} from '../hooks/useSupabaseQueries';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';

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
  don_gia: number;
  ghi_chu: string;
}

const OutboundShipments: React.FC = () => {
  const { data: outboundShipments, refetch: refreshOutboundShipments } = useOutboundShipments();
  const { data: shipmentHeaders, refetch: refreshShipmentHeaders } = useShipmentHeaders('outbound');
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  
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
    content: '',
    notes: ''
  });
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [bulkCreateMode, setBulkCreateMode] = useState(false);

  const [formData, setFormData] = useState<OutboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_xuat: new Date().toISOString().split('T')[0],
    khach_hang_id: '',
    ten_khach_hang: '',
    loai_xuat: '',
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
    don_gia: 0,
    ghi_chu: '',
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const generateShipmentId = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `PXK${day}${month}${year}_${random}`;
  };

  const handleOpenDialog = async (shipment?: any) => {
    if (shipment) {
      setEditingShipment(shipment);
              setFormData({
          xuat_kho_id: shipment.shipment_id || '',
          ngay_xuat: shipment.shipment_date || new Date().toISOString().split('T')[0],
          khach_hang_id: shipment.customer_id || '',
          ten_khach_hang: shipment.customer_name || '',
          loai_xuat: shipment.shipment_type || '',
          tai_xe: shipment.driver || '',
          noi_dung_xuat: shipment.content || '',
          ghi_chu: shipment.notes || '',
        });
      
      try {
        const items = await dataService.shipmentItems.getByHeaderId(shipment.id);
        const formattedItems = items.map((item: any) => ({
          id: item.id, product_id: item.product_id, san_pham_id: item.product_code,
          ten_san_pham: item.product_name, ma_hang: item.product_code, dvt: item.unit,
          sl_xuat: item.quantity, don_gia: item.unit_price || 0, ghi_chu: item.notes || '',
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
      don_gia: 0,
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
      tai_xe: '',
      noi_dung_xuat: '',
      ghi_chu: '',
    });
    setProductItems([]);
    setIsCopying(false);
    setIsEditing(false);
    setBulkCreateMode(false);
    setSelectedCustomers([]);
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
      don_gia: 0,
      ghi_chu: '',
    });
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
      }));
    }
  };

  const handleBulkCustomerSelect = () => {
    const customerList = (customers || []).map((customer: any) => ({
      id: customer.id,
      name: customer.ten_day_du || customer.ten_khach_hang || '',
      selected: false
    }));
    setSelectedCustomers(customerList);
    setShowCustomerSelector(true);
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, selected: !customer.selected }
          : customer
      )
    );
  };

  const handleSelectAllCustomers = () => {
    setSelectedCustomers(prev => 
      prev.map(customer => ({ ...customer, selected: true }))
    );
  };

  const handleDeselectAllCustomers = () => {
    setSelectedCustomers(prev => 
      prev.map(customer => ({ ...customer, selected: false }))
    );
  };

  const handleConfirmCustomerSelection = () => {
    const selectedCount = selectedCustomers.filter(c => c.selected).length;
    if (selectedCount === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn ít nhất một khách hàng',
        severity: 'warning'
      });
      return;
    }
    setBulkCreateMode(true);
    setShowCustomerSelector(false);
    setSnackbar({
      open: true,
      message: `Đã chọn ${selectedCount} khách hàng. Bạn có thể thêm sản phẩm và tạo phiếu hàng loạt.`,
      severity: 'success'
    });
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

    if (bulkCreateMode && selectedCustomers.filter(c => c.selected).length === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn ít nhất một khách hàng',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const selectedCustomerList = bulkCreateMode 
        ? selectedCustomers.filter(c => c.selected)
        : [{ id: formData.khach_hang_id, name: formData.ten_khach_hang }];

      let createdCount = 0;

      for (const customer of selectedCustomerList) {
        // Tính tổng số lượng
        const totalQuantity = productItems.reduce((sum, item) => sum + item.sl_xuat, 0);

        // Tạo header data cho từng khách hàng
        const headerData = {
          shipment_id: bulkCreateMode ? generateShipmentId() : formData.xuat_kho_id,
          shipment_type: 'outbound',
          shipment_date: formData.ngay_xuat,
          supplier_id: null,
          supplier_name: null,
          customer_id: customer.id,
          customer_name: customer.name,
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

        if (editingShipment && !bulkCreateMode) {
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

        // Tạo items cho từng khách hàng
        const itemsData = productItems.map(item => ({
          shipment_header_id: headerId,
          product_id: item.product_id,
          product_name: item.ten_san_pham,
          product_code: item.ma_hang,
          unit: item.dvt,
          quantity: item.sl_xuat,
          unit_price: item.don_gia,
          total_price: item.sl_xuat * item.don_gia,
          notes: item.ghi_chu
        }));

        await addShipmentItems.mutateAsync(itemsData);
        createdCount++;
      }

      await refreshShipmentHeaders();
      
      const message = bulkCreateMode 
        ? `Tạo thành công ${createdCount} phiếu xuất cho ${createdCount} khách hàng!`
        : (editingShipment ? 'Cập nhật phiếu xuất thành công!' : (isCopying ? 'Tạo phiếu xuất mới từ bản sao thành công!' : 'Tạo phiếu xuất thành công!'));
      
      setSnackbar({ 
        open: true, 
        message, 
        severity: 'success' 
      });
      
      setIsCopying(false);
      setIsEditing(false);
      setBulkCreateMode(false);
      setSelectedCustomers([]);
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

  const handleUpdateItemPrice = (itemId: string, newPrice: number) => {
    setProductItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, don_gia: newPrice } : item
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
      don_gia: item.unit_price || 0,
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
        const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối của timestamp
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
        
        // Tạo header cho phiếu
        const headerData = {
          shipment_id: shipmentIdFinal.toString().trim(),
          shipment_type: 'outbound',
          shipment_date: firstItem['Ngày xuất'] || new Date().toISOString().split('T')[0],
          supplier_id: null,
          supplier_name: null,
          customer_id: importSupplierData.customer_id || firstItem['Mã KH'] || '',
          customer_name: importSupplierData.customer_name || firstItem['Tên KH'] || '',
          driver: importSupplierData.driver || firstItem['Tài xế'] || '',
          import_type: '',
          content: importSupplierData.content || firstItem['Nội dung xuất'] || '',
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
          console.log(`Successfully processed shipment ${shipmentIdFinal} with ${itemsArray.length} items`);
        } catch (error) {
          console.error(`Error processing shipment ${shipmentIdFinal}:`, error);
          throw error; // Re-throw để dừng toàn bộ quá trình
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

  const handlePrintShipment = () => {
    if (!viewingShipment) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          <div class="title">PHIẾU XUẤT KHO</div>
          <div class="date-info">
            <div>Ngày Tháng: ${formatDate(viewingShipment.ngay_xuat)}</div>
            <div>Số Phiếu: ${viewingShipment.xuat_kho_id}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Người nhận hàng:</div>
            <div class="info-value">${viewingShipment.ten_khach_hang || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Địa chỉ:</div>
            <div class="info-value">${viewingShipment.dia_chi || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Số điện thoại:</div>
            <div class="info-value">${viewingShipment.so_dt || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Nội dung xuất:</div>
            <div class="info-value">${viewingShipment.noi_dung_xuat || 'N/A'}</div>
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
            <tr>
              <td>1</td>
              <td>${viewingShipment.san_pham_id || 'N/A'}</td>
              <td>${viewingShipment.ten_san_pham || 'N/A'}</td>
              <td>${viewingShipment.dvt || 'N/A'}</td>
              <td>${viewingShipment.sl_xuat || 0}</td>
              <td>${viewingShipment.ghi_chu || 'N/A'}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Tổng Cộng:</td>
              <td>${viewingShipment.dvt || 'N/A'}</td>
              <td>${viewingShipment.sl_xuat || 0}</td>
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

  const filteredShipments = useMemo(() => {
    return (shipmentHeaders || []).filter((shipment: any) =>
      shipment.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentHeaders, searchTerm]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShippingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
            Quản Lý Xuất Kho
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 1,
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              }
            }}
          >
            Thêm Xuất Kho
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Tổng phiếu: {filteredShipments.length}
          </Typography>
          <Typography variant="body2">
            Sản phẩm: {shipmentHeaders?.length || 0}
          </Typography>
          <Typography variant="body2">
            Số lượng: {filteredShipments.reduce((sum, shipment) => sum + (shipment.total_quantity || 0), 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Hôm nay: {filteredShipments.filter(s => formatDate(s.shipment_date) === new Date().toISOString().split('T')[0]).length}
          </Typography>
        </Box>
      </Box>

      {/* OutboundShipments Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
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

      {/* Form Dialog */}
      {openDialog && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 240,
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShippingIcon sx={{ fontSize: 24 }} />
              <Typography variant="h6">
                {editingShipment ? 'Chỉnh sửa phiếu xuất kho' : 'Tạo phiếu xuất kho mới'}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ py: 0.5 }}>
              {formData.xuat_kho_id}
            </Typography>
            <IconButton
              onClick={handleCloseDialog}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
            <Box sx={{ bgcolor: 'white', borderRadius: 1, p: 2, mb: 2, boxShadow: 1 }}>
              {/* Thông tin chung */}
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                Thông tin chung
              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Ngày xuất"
                    type="date"
                    value={formData.ngay_xuat}
                    onChange={(e) => setFormData({ ...formData, ngay_xuat: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Khách hàng</InputLabel>
                    <Select
                      value={formData.khach_hang_id}
                      label="Khách hàng"
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      disabled={bulkCreateMode}
                    >
                      {(customers || []).map((customer: any) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.ten_day_du || customer.ten_khach_hang}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {!bulkCreateMode && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleBulkCustomerSelect}
                      sx={{ mt: 1 }}
                    >
                      Chọn nhiều khách hàng
                    </Button>
                  )}
                  {bulkCreateMode && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        Chế độ tạo hàng loạt: {selectedCustomers.filter(c => c.selected).length} khách hàng đã chọn
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setBulkCreateMode(false);
                          setSelectedCustomers([]);
                        }}
                        sx={{ mt: 0.5 }}
                      >
                        Hủy chế độ hàng loạt
                      </Button>
                    </Box>
                  )}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Loại xuất</InputLabel>
                    <Select
                      value={formData.loai_xuat}
                      label="Loại xuất"
                      onChange={(e) => setFormData({ ...formData, loai_xuat: e.target.value })}
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
                      value={formData.tai_xe}
                      label="Tài xế"
                      onChange={(e) => setFormData({ ...formData, tai_xe: e.target.value })}
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
                    value={formData.noi_dung_xuat}
                    onChange={(e) => setFormData({ ...formData, noi_dung_xuat: e.target.value })}
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

            <Box sx={{ bgcolor: 'white', borderRadius: 1, p: 2, mb: 2, boxShadow: 1 }}>
              {/* Thêm sản phẩm */}
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                Chi tiết sản phẩm *
              </Typography>
              
              {/* Product Entry Row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', 
                gap: 1, 
                alignItems: 'center',
                p: 1,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                bgcolor: '#fafafa'
              }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Sản phẩm</InputLabel>
                  <Select
                    value={currentProduct.san_pham_id}
                    label="Sản phẩm"
                    onChange={(e) => {
                      const product = (products || []).find(p => p.san_pham_id === e.target.value);
                      if (product) {
                        setCurrentProduct({
                          ...currentProduct,
                          product_id: product.id, // UUID
                          san_pham_id: product.san_pham_id, // Mã sản phẩm
                          ten_san_pham: product.ten_san_pham,
                          ma_hang: product.san_pham_id,
                          dvt: product.dvt,
                        });
                      }
                    }}
                  >
                    {(products || []).map((product: any) => (
                      <MenuItem key={product.id} value={product.san_pham_id}>
                        {product.ten_san_pham}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                />
                <TextField
                  size="small"
                  label="Đơn giá"
                  type="number"
                  value={currentProduct.don_gia}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, don_gia: Number(e.target.value) })}
                />
                <TextField
                  size="small"
                  label="Ghi chú"
                  value={currentProduct.ghi_chu}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ghi_chu: e.target.value })}
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
                        don_gia: 0,
                        ghi_chu: '',
                      });
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Danh sách sản phẩm */}
              {productItems.length > 0 && (
                <Box sx={{ mb: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                    Danh sách sản phẩm đã thêm ({productItems.length} sản phẩm)
                  </Typography>
                  <TableContainer component={Paper} sx={{ mt: 1, boxShadow: 1, borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: 60 }}>STT</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Mã hàng</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 80 }}>ĐVT</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Số lượng</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Đơn giá</TableCell>
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
                                type="number"
                                size="small"
                                value={item.don_gia}
                                onChange={(e) => handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                sx={{ 
                                  width: 80,
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.75rem',
                                    height: 32,
                                  }
                                }}
                                inputProps={{ 
                                  min: 0,
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
            p: 2,
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseDialog} 
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                px: 2,
                py: 0.5,
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
                px: 2,
                py: 0.5,
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {loading ? <CircularProgress size={16} /> : 'LƯU PHIẾU XUẤT'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Detail View */}
      {showDetails && viewingShipment && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 240,
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShippingIcon sx={{ fontSize: 24 }} />
              <Typography variant="h6">
                Chi tiết phiếu xuất kho
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ py: 0.5 }}>
              {viewingShipment.shipment_id}
            </Typography>
            <IconButton
              onClick={handleCloseDetails}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            bgcolor: '#f8f9fa'
          }}>
            {/* Header với nút quay lại, copy và in */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseDetails}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderColor: 'primary.light',
                  }
                }}
              >
                ← Quay lại danh sách
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyShipment}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    borderColor: 'info.main',
                    color: 'info.main',
                    '&:hover': {
                      backgroundColor: 'info.light',
                      color: 'white',
                      borderColor: 'info.light',
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
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: 'success.light',
                      color: 'white',
                      borderColor: 'success.light',
                    }
                  }}
                >
                  In Phiếu Xuất
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: 1, 
              p: 2, 
              mb: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Thông tin chung */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                Thông tin chung
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mb: 3 }}>
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
                    Ngày xuất
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(viewingShipment.shipment_date)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Khách hàng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.customer_name || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Loại xuất
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.import_type || 'Chưa cập nhật'}
                  </Typography>
                </Box>
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
                    Nội dung xuất
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.content || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>

              {/* Thông tin sản phẩm */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                Thông tin sản phẩm
              </Typography>
              {/* Danh sách sản phẩm */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                  Danh sách sản phẩm xuất ({shipmentItems?.length || 0} sản phẩm)
                </Typography>
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

              {/* Thông tin bổ sung */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                  Thông tin bổ sung
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
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
                      Ghi chú
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.notes || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Customer Selector Dialog */}
      <Dialog
        open={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Chọn nhiều khách hàng
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chọn các khách hàng mà bạn muốn tạo phiếu xuất. Mỗi khách hàng sẽ có một phiếu riêng với cùng sản phẩm.
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAllCustomers}
            >
              Chọn tất cả
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDeselectAllCustomers}
            >
              Bỏ chọn tất cả
            </Button>
          </Box>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {selectedCustomers.map((customer) => (
              <Box
                key={customer.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: customer.selected ? '#e3f2fd' : 'white',
                  '&:hover': {
                    bgcolor: customer.selected ? '#bbdefb' : '#f5f5f5'
                  }
                }}
                onClick={() => handleCustomerToggle(customer.id)}
              >
                <input
                  type="checkbox"
                  checked={customer.selected}
                  onChange={() => handleCustomerToggle(customer.id)}
                  style={{ marginRight: '8px' }}
                />
                <Typography variant="body2">
                  {customer.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowCustomerSelector(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmCustomerSelection}
            variant="contained"
          >
            Xác nhận ({selectedCustomers.filter(c => c.selected).length} khách hàng)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Import Excel - Phiếu Xuất Kho
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vui lòng chọn file Excel chứa dữ liệu phiếu xuất kho. File phải có các cột: Mã phiếu, Ngày xuất, Mã sản phẩm, Tên sản phẩm, Đơn vị tính, Số lượng, Ghi chú, Mã KH, Tên KH, Tài xế, Nội dung xuất
          </Typography>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            style={{ marginBottom: '16px' }}
          />

          {/* Form bổ sung thông tin */}
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Thông tin bổ sung (nếu không có trong Excel)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <TextField
                size="small"
                label="Khách hàng"
                value={importSupplierData.customer_name}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, customer_name: e.target.value })}
              />
              <TextField
                size="small"
                label="Tài xế"
                value={importSupplierData.driver}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, driver: e.target.value })}
              />
              <TextField
                size="small"
                label="Nội dung xuất"
                value={importSupplierData.content}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, content: e.target.value })}
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                size="small"
                label="Ghi chú"
                value={importSupplierData.notes}
                onChange={(e) => setImportSupplierData({ ...importSupplierData, notes: e.target.value })}
                sx={{ gridColumn: 'span 2' }}
              />
            </Box>
          </Box>

          {/* Preview table */}
          {importData.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Kiểm tra dữ liệu trước khi import. Các phiếu có cùng mã sẽ được nhóm lại.
                {(() => {
                  const uniqueShipments = new Set(importData.map(item => item['Mã phiếu']));
                  return ` (${uniqueShipments.size} phiếu duy nhất từ ${importData.length} dòng dữ liệu)`;
                })()}
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  ... và {importData.length - 10} dòng khác
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImportDialog(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={importData.length === 0 || importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Import'}
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