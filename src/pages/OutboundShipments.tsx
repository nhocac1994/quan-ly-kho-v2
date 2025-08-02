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
} from '@mui/icons-material';
import { useOutboundShipments, useCustomers, useProducts } from '../hooks/useSupabaseQueries';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';

interface OutboundShipmentFormData {
  xuat_kho_id: string;
  ngay_xuat: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  noi_dung_xuat: string;
  ghi_chu: string;
}

interface ProductItem {
  id: string;
  san_pham_id: string;
  ten_san_pham: string;
  ma_hang: string;
  dvt: string;
  sl_xuat: number;
  ghi_chu: string;
}

const OutboundShipments: React.FC = () => {
  const { data: outboundShipments, refetch: refreshOutboundShipments } = useOutboundShipments();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  
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

  const [formData, setFormData] = useState<OutboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_xuat: new Date().toISOString().split('T')[0],
    khach_hang_id: '',
    ten_khach_hang: '',
    noi_dung_xuat: '',
    ghi_chu: '',
  });

  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: '',
    san_pham_id: '',
    ten_san_pham: '',
    ma_hang: '',
    dvt: '',
    sl_xuat: 0,
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

  const handleOpenDialog = (shipment?: any) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.xuat_kho_id,
        ngay_xuat: shipment.ngay_xuat,
        khach_hang_id: shipment.ma_kh || '',
        ten_khach_hang: shipment.ten_khach_hang,
        noi_dung_xuat: shipment.noi_dung_xuat,
        ghi_chu: shipment.ghi_chu,
      });
    } else {
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: generateShipmentId(),
        ngay_xuat: new Date().toISOString().split('T')[0],
        khach_hang_id: '',
        ten_khach_hang: '',
        noi_dung_xuat: '',
        ghi_chu: '',
      });
      setProductItems([]);
    }
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
      noi_dung_xuat: '',
      ghi_chu: '',
    });
    setProductItems([]);
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
      san_pham_id: '',
      ten_san_pham: '',
      ma_hang: '',
      dvt: '',
      sl_xuat: 0,
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
        san_pham_id: product.id,
        ten_san_pham: product.ten_san_pham,
        ma_hang: (product as any).ma_hang || '',
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
      for (const productItem of productItems) {
        const shipmentData = {
          xuat_kho_id: formData.xuat_kho_id,
          ngay_xuat: formData.ngay_xuat,
          san_pham_id: productItem.san_pham_id,
          ten_san_pham: productItem.ten_san_pham,
          dvt: productItem.dvt,
          sl_xuat: productItem.sl_xuat,
          ghi_chu: productItem.ghi_chu,
          ma_kh: formData.khach_hang_id,
          ten_khach_hang: formData.ten_khach_hang,
          noi_dung_xuat: formData.noi_dung_xuat,
          nhom_san_pham: '',
          hang_sx: '',
          hinh_anh: '',
          thong_tin: '',
          quy_cach: '',
          so_hd: '',
          dia_chi: '',
          so_dt: '',
          ngay_tao: new Date().toISOString(),
          nguoi_tao: 'admin',
          updated_at: new Date().toISOString(),
        };

        if (editingShipment) {
          await dataService.outboundShipments.update(editingShipment.id, shipmentData);
        } else {
          await dataService.outboundShipments.create(shipmentData);
        }
      }

      await refreshOutboundShipments();
      setSnackbar({ 
        open: true, 
        message: editingShipment ? 'Cập nhật phiếu xuất thành công!' : 'Tạo phiếu xuất thành công!', 
        severity: 'success' 
      });
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
        await dataService.outboundShipments.delete(shipmentId);
        await refreshOutboundShipments();
        setSnackbar({ open: true, message: 'Xóa phiếu xuất thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting shipment:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa phiếu xuất', severity: 'error' });
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    const shipment = (outboundShipments || []).find((s: any) => s.id === shipmentId);
    if (shipment) {
      setViewingShipment(shipment);
      setShowDetails(true);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setViewingShipment(null);
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
    return (outboundShipments || []).filter((shipment: any) =>
      shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [outboundShipments, searchTerm]);

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
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
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
            Tạo Phiếu Xuất
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>STT</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày xuất</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Số lượng</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khách hàng</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nội dung xuất</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Thao tác</TableCell>
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
                    <TableCell>{shipment.xuat_kho_id}</TableCell>
                    <TableCell>{formatDate(shipment.ngay_xuat)}</TableCell>
                    <TableCell>{shipment.ten_san_pham}</TableCell>
                    <TableCell>{shipment.sl_xuat}</TableCell>
                    <TableCell>{shipment.ten_khach_hang}</TableCell>
                    <TableCell>{shipment.noi_dung_xuat}</TableCell>
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
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
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
                  >
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
                Thêm sản phẩm
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, p: 1, mb: 1, bgcolor: '#fafafa' }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Sản phẩm</InputLabel>
                  <Select
                    value={currentProduct.san_pham_id}
                    label="Sản phẩm"
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    {(products || []).map((product: any) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.ten_san_pham}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Mã hàng"
                  value={currentProduct.ma_hang}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ma_hang: e.target.value })}
                />
                <TextField
                  size="small"
                  label="Đơn vị tính"
                  value={currentProduct.dvt}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, dvt: e.target.value })}
                />
                <TextField
                  size="small"
                  label="Số lượng"
                  type="number"
                  value={currentProduct.sl_xuat}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, sl_xuat: Number(e.target.value) })}
                />
                <TextField
                  size="small"
                  label="Ghi chú"
                  value={currentProduct.ghi_chu}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ghi_chu: e.target.value })}
                  sx={{ gridColumn: 'span 3' }}
                />
                <IconButton
                  onClick={handleAddProduct}
                  sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Danh sách sản phẩm */}
              {productItems.length > 0 && (
                <Paper sx={{ mb: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                        <TableCell>Mã hàng</TableCell>
                        <TableCell>ĐVT</TableCell>
                        <TableCell>Số lượng</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.ten_san_pham}</TableCell>
                          <TableCell>{item.ma_hang}</TableCell>
                          <TableCell>{item.dvt}</TableCell>
                          <TableCell>{item.sl_xuat}</TableCell>
                          <TableCell>{item.ghi_chu}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveProduct(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
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
              {viewingShipment.xuat_kho_id}
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
            {/* Header với nút quay lại và in */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleCloseDetails}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                ← Quay lại danh sách
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
                  borderColor: 'primary.main',
                  color: 'primary.main',
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
                    {viewingShipment.xuat_kho_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Ngày xuất
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(viewingShipment.ngay_xuat)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Khách hàng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.ten_khach_hang}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Nội dung xuất
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.noi_dung_xuat || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>

              {/* Thông tin sản phẩm */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                Thông tin sản phẩm
              </Typography>
              <Box sx={{ 
                bgcolor: '#fafafa', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Tên sản phẩm
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.ten_san_pham}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Mã sản phẩm
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.san_pham_id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Đơn vị tính
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.dvt}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Số lượng xuất
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {viewingShipment.sl_xuat}
                    </Typography>
                  </Box>
                </Box>
                {viewingShipment.ghi_chu && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Ghi chú
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      {viewingShipment.ghi_chu}
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
                      {formatDate(viewingShipment.ngay_tao)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Người tạo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingShipment.nguoi_tao}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

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