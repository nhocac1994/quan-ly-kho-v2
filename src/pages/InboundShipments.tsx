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
import { useInboundShipments, useSuppliers, useProducts } from '../hooks/useSupabaseQueries';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';

interface InboundShipmentFormData {
  xuat_kho_id: string;
  ngay_nhap: string;
  loai_nhap: string;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  tai_xe: string;
  noi_dung_nhap: string;
  ghi_chu: string;
}

interface ProductItem {
  id: string;
  san_pham_id: string;
  ten_san_pham: string;
  ma_hang: string;
  dvt: string;
  sl_nhap: number;
  ghi_chu: string;
}

const InboundShipments: React.FC = () => {
  const { data: inboundShipments, refetch: refreshInboundShipments } = useInboundShipments();
  const { data: suppliers } = useSuppliers();
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

  const [formData, setFormData] = useState<InboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_nhap: new Date().toISOString().split('T')[0],
    loai_nhap: '',
    nha_cung_cap_id: '',
    ten_nha_cung_cap: '',
    tai_xe: '',
    noi_dung_nhap: '',
    ghi_chu: '',
  });

  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductItem>({
    id: '',
    san_pham_id: '',
    ten_san_pham: '',
    ma_hang: '',
    dvt: '',
    sl_nhap: 1,
    ghi_chu: '',
  });


  const filteredShipments = useMemo(() => {
    return (inboundShipments || []).filter((shipment: any) =>
      shipment.ten_san_pham?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ten_nha_cung_cap?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inboundShipments, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const generateShipmentId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PNK${year}${month}${day}_${random}`;
  };

  const handleOpenDialog = (shipment?: any) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.xuat_kho_id,
        ngay_nhap: shipment.ngay_nhap,
        loai_nhap: shipment.loai_nhap || '',
        nha_cung_cap_id: shipment.nha_cung_cap_id,
        ten_nha_cung_cap: shipment.ten_nha_cung_cap,
        tai_xe: shipment.tai_xe || '',
        noi_dung_nhap: shipment.noi_dung_nhap,
        ghi_chu: shipment.ghi_chu,
      });
      setProductItems([{
        id: shipment.id,
        san_pham_id: shipment.san_pham_id,
        ten_san_pham: shipment.ten_san_pham,
        ma_hang: shipment.san_pham_id,
        dvt: shipment.dvt,
        sl_nhap: shipment.sl_nhap,
        ghi_chu: shipment.ghi_chu,
      }]);
    } else {
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: generateShipmentId(),
        ngay_nhap: new Date().toISOString().split('T')[0],
        loai_nhap: '',
        nha_cung_cap_id: '',
        ten_nha_cung_cap: '',
        tai_xe: '',
        noi_dung_nhap: '',
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
      ngay_nhap: new Date().toISOString().split('T')[0],
      loai_nhap: '',
      nha_cung_cap_id: '',
      ten_nha_cung_cap: '',
      tai_xe: '',
      noi_dung_nhap: '',
      ghi_chu: '',
    });
    setProductItems([]);
    setCurrentProduct({
      id: '',
      san_pham_id: '',
      ten_san_pham: '',
      ma_hang: '',
      dvt: '',
      sl_nhap: 1,
      ghi_chu: '',
    });
  };

  const handleSubmit = async () => {
    if (productItems.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng thêm ít nhất một sản phẩm', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      for (const productItem of productItems) {
        const shipmentData = {
          xuat_kho_id: formData.xuat_kho_id,
          ngay_nhap: formData.ngay_nhap,
          loai_nhap: formData.loai_nhap,
          san_pham_id: productItem.san_pham_id,
          ten_san_pham: productItem.ten_san_pham,
          dvt: productItem.dvt,
          sl_nhap: productItem.sl_nhap,
          ghi_chu: productItem.ghi_chu,
          nha_cung_cap_id: formData.nha_cung_cap_id,
          ten_nha_cung_cap: formData.ten_nha_cung_cap,
          tai_xe: formData.tai_xe,
          noi_dung_nhap: formData.noi_dung_nhap,
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

        if (editingShipment) {
          await dataService.inboundShipments.update(editingShipment.id, shipmentData);
        } else {
          await dataService.inboundShipments.create(shipmentData);
        }
      }

      await refreshInboundShipments();
      setSnackbar({ 
        open: true, 
        message: editingShipment ? 'Cập nhật phiếu nhập thành công!' : 'Tạo phiếu nhập thành công!', 
        severity: 'success' 
      });
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
        await dataService.inboundShipments.delete(shipmentId);
        await refreshInboundShipments();
        setSnackbar({ open: true, message: 'Xóa phiếu nhập thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting shipment:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa phiếu nhập', severity: 'error' });
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    const shipment = (inboundShipments || []).find((s: any) => s.id === shipmentId);
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
            <div>Ngày Tháng: ${formatDate(viewingShipment.ngay_nhap)}</div>
            <div>Số Phiếu: ${viewingShipment.xuat_kho_id}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Nhà cung cấp:</div>
            <div class="info-value">${viewingShipment.ten_nha_cung_cap || 'N/A'}</div>
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
            <div class="info-label">Tài xế:</div>
            <div class="info-value">${viewingShipment.tai_xe || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Nội dung nhập:</div>
            <div class="info-value">${viewingShipment.noi_dung_nhap || 'N/A'}</div>
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
              <td>${viewingShipment.sl_nhap || 0}</td>
              <td>${viewingShipment.ghi_chu || 'N/A'}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Tổng Cộng:</td>
              <td>${viewingShipment.dvt || 'N/A'}</td>
              <td>${viewingShipment.sl_nhap || 0}</td>
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
            <div class="signature-line">Người Giao Hàng</div>
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

        // Bỏ qua header row
        const rows = jsonData.slice(1) as any[][];
        const processedData = rows
          .filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== undefined))
          .map((row, index) => ({
            id: `import_${index}`,
            xuat_kho_id: row[0] || `PNK${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
            ngay_nhap: row[1] || new Date().toISOString().split('T')[0],
            loai_nhap: row[2] || 'Nhập hàng',
            san_pham_id: row[3] || '',
            ten_san_pham: row[4] || '',
            dvt: row[5] || '',
            sl_nhap: parseInt(row[6]) || 1,
            ghi_chu: row[7] || '',
            nha_cung_cap_id: row[8] || '',
            ten_nha_cung_cap: row[9] || '',
            tai_xe: row[10] || '',
            noi_dung_nhap: row[11] || '',
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
          }));

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
      for (const item of importData) {
        await dataService.inboundShipments.create(item);
      }

      await refreshInboundShipments();
      setSnackbar({ 
        open: true, 
        message: `Import thành công ${importData.length} phiếu nhập kho!`, 
        severity: 'success' 
      });
      setOpenImportDialog(false);
      setImportData([]);
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
  };

  const totalShipments = inboundShipments?.length || 0;
  const totalQuantity = (inboundShipments || []).reduce((sum: number, shipment: any) => sum + (shipment.sl_nhap || 0), 0);
  const todayShipments = (inboundShipments || []).filter((shipment: any) => 
    new Date(shipment.ngay_nhap).toDateString() === new Date().toDateString()
  ).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShippingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
            Quản Lý Nhập Kho
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
            Thêm Nhập Kho
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Tổng phiếu: {totalShipments}
          </Typography>
          <Typography variant="body2">
            Sản phẩm: {inboundShipments?.length || 0}
          </Typography>
          <Typography variant="body2">
            Số lượng: {totalQuantity.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Hôm nay: {todayShipments}
          </Typography>
        </Box>
      </Box>

      {/* InboundShipments Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>STT</TableCell>
                <TableCell>Mã NK</TableCell>
                <TableCell>Ngày Nhập</TableCell>
                <TableCell>Sản Phẩm</TableCell>
                <TableCell>Số Lượng</TableCell>
                <TableCell>Nhà Cung Cấp</TableCell>
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
                    <TableCell>{shipment.xuat_kho_id}</TableCell>
                    <TableCell>{formatDate(shipment.ngay_nhap)}</TableCell>
                    <TableCell>{shipment.ten_san_pham}</TableCell>
                    <TableCell>{shipment.sl_nhap?.toLocaleString()}</TableCell>
                    <TableCell>{shipment.ten_nha_cung_cap}</TableCell>
                    <TableCell>{shipment.noi_dung_nhap}</TableCell>
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

      {/* Form Section - Hiển thị khi openDialog = true */}
      {openDialog && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 240, // Khoảng cách với sidebar
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e0e0e0'
        }}>
          {/* Header nhỏ gọn */}
          <Box sx={{ 
            bgcolor: 'white', 
            color: 'text.primary',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ShippingIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {editingShipment ? 'Chỉnh Sửa Phiếu Nhập Kho' : 'Tạo Phiếu Nhập Mới'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                {formData.xuat_kho_id}
              </Typography>
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
              borderRadius: 1, 
              p: 2, 
              mb: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Thông tin chung */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Thông tin chung
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Loại nhập</InputLabel>
                      <Select
                        value={formData.loai_nhap}
                        label="Loại nhập"
                        onChange={(e) => setFormData({ ...formData, loai_nhap: e.target.value })}
                      >
                        <MenuItem value="Nhập hàng">Nhập hàng</MenuItem>
                        <MenuItem value="Nhập trả">Nhập trả</MenuItem>
                        <MenuItem value="Nhập khác">Nhập khác</MenuItem>
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
                    <FormControl size="small" fullWidth>
                      <InputLabel>Nhà cung cấp</InputLabel>
                      <Select
                        value={formData.nha_cung_cap_id}
                        label="Nhà cung cấp"
                        onChange={(e) => handleSupplierChange(e.target.value)}
                      >
                        {(suppliers || []).map((supplier: any) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.ten_ncc}
                          </MenuItem>
                        ))}
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
                      </Select>
                    </FormControl>
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
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Chi tiết sản phẩm *
                  </Typography>
                  
                  {/* Product Entry Row */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', 
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
                              san_pham_id: product.san_pham_id,
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
                      value={currentProduct.sl_nhap}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, sl_nhap: parseInt(e.target.value) || 0 })}
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
                            san_pham_id: '',
                            ten_san_pham: '',
                            ma_hang: '',
                            dvt: '',
                            sl_nhap: 1,
                            ghi_chu: '',
                          });
                        }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  {/* Product Items Table */}
                  {productItems.length > 0 && (
                    <Paper sx={{ mb: 1 }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell size="small">STT</TableCell>
                              <TableCell size="small">Sản phẩm</TableCell>
                              <TableCell size="small">Mã hàng</TableCell>
                              <TableCell size="small">ĐVT</TableCell>
                              <TableCell size="small">Số lượng</TableCell>
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
                                <TableCell size="small">{item.sl_nhap}</TableCell>
                                <TableCell size="small">{item.ghi_chu}</TableCell>
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
                  )}

                  {/* Summary */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng cộng: {productItems.length} sản phẩm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
            p: 2,
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
          left: 240, // Khoảng cách với sidebar
          right: 0,
          bottom: 0,
          bgcolor: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e0e0e0'
        }}>
          {/* Header chi tiết */}
          <Box sx={{ 
            bgcolor: 'white', 
            color: 'text.primary',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                ← Quay lại
              </Button>
              <ShippingIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Chi Tiết Phiếu Nhập Kho
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                {viewingShipment.xuat_kho_id}
              </Typography>
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
                Đóng
              </Button>
            </Box>
          </Box>

          {/* Content chi tiết */}
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
                In Phiếu Nhập
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
                    Ngày nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(viewingShipment.ngay_nhap)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Loại nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.loai_nhap || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Nhà cung cấp
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.ten_nha_cung_cap}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tài xế
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.tai_xe || 'Chưa cập nhật'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Nội dung nhập
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingShipment.noi_dung_nhap || 'Chưa cập nhật'}
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
                      Số lượng nhập
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {viewingShipment.sl_nhap}
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

      {/* Dialog Import Excel */}
      <Dialog 
        open={openImportDialog} 
        onClose={() => setOpenImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon />
            Import Phiếu Nhập Kho từ Excel
          </Box>
          <IconButton 
            onClick={() => setOpenImportDialog(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Hướng dẫn */}
          <Box sx={{ 
            bgcolor: '#e3f2fd', 
            p: 2, 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid #bbdefb'
          }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
              Hướng dẫn:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                File Excel phải có các cột: <strong>Mã phiếu, Ngày nhập, Loại nhập, Mã sản phẩm, Tên sản phẩm (bắt buộc)</strong>
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Các cột khác: <strong>Đơn vị tính, Số lượng, Ghi chú, Mã NCC, Tên NCC, Tài xế, Nội dung nhập</strong>
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                <strong>Số lượng</strong> phải là số dương
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                <strong>Loại nhập</strong> phải là "Nhập hàng", "Nhập trả", hoặc "Nhập khác"
              </Typography>
              <Typography component="li" variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                Phiếu nhập có mã trùng sẽ được cập nhật thông tin mới
              </Typography>
            </Box>
          </Box>

          {/* Tải mẫu Excel */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
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
              TẢI MẪU EXCEL
            </Button>
            <Typography variant="body2" color="text.secondary">
              Tải file mẫu để xem định dạng chuẩn
            </Typography>
          </Box>

          {/* Khu vực upload file */}
          <Box sx={{ 
            border: '2px dashed #1976d2', 
            borderRadius: 2, 
            p: 4, 
            textAlign: 'center',
            bgcolor: '#f8f9fa',
            mb: 3
          }}>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
              Chọn file Excel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                  px: 3,
                  py: 1,
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

          {/* Bảng xem trước */}
          {importData.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Bảng xem trước ({importData.length} phiếu nhập)
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>STT</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày nhập</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Loại nhập</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Số lượng</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tài xế</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importData.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{item.xuat_kho_id}</TableCell>
                          <TableCell>{item.ngay_nhap}</TableCell>
                          <TableCell>
                            <Box sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: item.loai_nhap === 'Nhập hàng' ? '#e8f5e8' : 
                                       item.loai_nhap === 'Nhập trả' ? '#fff3e0' : '#f3e5f5',
                              color: item.loai_nhap === 'Nhập hàng' ? '#2e7d32' : 
                                     item.loai_nhap === 'Nhập trả' ? '#f57c00' : '#7b1fa2',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {item.loai_nhap}
                            </Box>
                          </TableCell>
                          <TableCell>{item.ten_san_pham}</TableCell>
                          <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>{item.sl_nhap}</TableCell>
                          <TableCell>{item.ten_nha_cung_cap}</TableCell>
                          <TableCell>{item.tai_xe}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
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
            onClick={handleImportSubmit}
            variant="contained"
            disabled={importLoading || importData.length === 0}
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