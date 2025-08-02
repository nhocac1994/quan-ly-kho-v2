import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
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
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Snackbar,
  Tooltip,
  Fade,
  Zoom,
  Divider,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useInboundShipments, useSuppliers } from '../hooks/useSupabaseQueries';
import { InboundShipment } from '../types';
import ImportExcelDialog from '../components/ImportExcelDialog';
import { useNavigate } from 'react-router-dom';


interface InboundShipmentFormData {
  xuat_kho_id: string;
  ngay_nhap: string;
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
  dia_chi: string;
  so_dt: string;
  noi_dung_nhap: string;
}

const InboundShipments: React.FC = () => {
  const { data: inboundShipments = [], refetch: refreshInboundShipments } = useInboundShipments();
  const { data: suppliers = [] } = useSuppliers();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<InboundShipment | null>(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [formData, setFormData] = useState<InboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_nhap: new Date().toISOString().split('T')[0],
    san_pham_id: '',
    ten_san_pham: '',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: '',
    sl_nhap: 0,
    ghi_chu: '',
    nha_cung_cap_id: '',
    ten_nha_cung_cap: '',
    dia_chi: '',
    so_dt: '',
    noi_dung_nhap: '',
  });

  const filteredShipments = useMemo(() => {
    return inboundShipments.filter((shipment: InboundShipment) =>
      shipment.ten_san_pham?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ten_nha_cung_cap?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inboundShipments, searchTerm]);

  // Helper function để format ngày tháng an toàn
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper function để tạo mã phiếu tự động
  const generateShipmentId = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const count = inboundShipments.filter(s => 
      s.xuat_kho_id?.startsWith(`PNK_${month}${day}`)
    ).length + 1;
    return `PNK_${month}${day}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenDialog = (shipment?: InboundShipment) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.xuat_kho_id || '',
        ngay_nhap: shipment.ngay_nhap ? new Date(shipment.ngay_nhap).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        san_pham_id: shipment.san_pham_id || '',
        ten_san_pham: shipment.ten_san_pham || '',
        nhom_san_pham: shipment.nhom_san_pham || '',
        hang_sx: shipment.hang_sx || '',
        hinh_anh: shipment.hinh_anh || '',
        thong_tin: shipment.thong_tin || '',
        quy_cach: shipment.quy_cach || '',
        dvt: shipment.dvt || '',
        sl_nhap: shipment.sl_nhap || 0,
        ghi_chu: shipment.ghi_chu || '',
        nha_cung_cap_id: shipment.nha_cung_cap_id || '',
        ten_nha_cung_cap: shipment.ten_nha_cung_cap || '',
        dia_chi: shipment.dia_chi || '',
        so_dt: shipment.so_dt || '',
        noi_dung_nhap: shipment.noi_dung_nhap || '',
      });
    } else {
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: generateShipmentId(),
        ngay_nhap: new Date().toISOString().split('T')[0],
        san_pham_id: '',
        ten_san_pham: '',
        nhom_san_pham: '',
        hang_sx: '',
        hinh_anh: '',
        thong_tin: '',
        quy_cach: '',
        dvt: '',
        sl_nhap: 0,
        ghi_chu: '',
        nha_cung_cap_id: '',
        ten_nha_cung_cap: '',
        dia_chi: '',
        so_dt: '',
        noi_dung_nhap: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const shipmentData: Omit<InboundShipment, 'id'> & { id?: string } = {
        id: editingShipment?.id,
        ...formData,
        ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingShipment) {
        await dataService.inboundShipments.update(shipmentData.id!, shipmentData);
        setSnackbar({ open: true, message: 'Cập nhật phiếu nhập kho thành công!', severity: 'success' });
      } else {
        const { id, ...createData } = shipmentData;
        await dataService.inboundShipments.create(createData);
        setSnackbar({ open: true, message: 'Tạo phiếu nhập kho thành công!', severity: 'success' });
      }
      await refreshInboundShipments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving shipment:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi lưu phiếu nhập kho', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập kho này?')) {
      setLoading(true);
      try {
        await dataService.inboundShipments.delete(shipmentId);
        await refreshInboundShipments();
        setSnackbar({ open: true, message: 'Xóa phiếu nhập kho thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting shipment:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa phiếu nhập kho', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    navigate(`/inbound-details/${shipmentId}`);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        nha_cung_cap_id: supplier.id,
        ten_nha_cung_cap: supplier.ten_ncc,
        dia_chi: supplier.ghi_chu || '', // Sử dụng ghi_chu thay vì dia_chi
        so_dt: supplier.sdt,
      }));
    }
  };

  const handleImportExcel = (importedData: any[]) => {
    // TODO: Implement Excel import functionality
    console.log('Imported data:', importedData);
    setSnackbar({ open: true, message: 'Tính năng import Excel sẽ được phát triển sau', severity: 'info' });
  };

  // Group shipments by xuat_kho_id để tính toán thống kê chính xác
  const groupedShipments = useMemo(() => {
    const groups: { [key: string]: InboundShipment[] } = {};
    inboundShipments.forEach((shipment: InboundShipment) => {
      if (!groups[shipment.xuat_kho_id]) {
        groups[shipment.xuat_kho_id] = [];
      }
      groups[shipment.xuat_kho_id].push(shipment);
    });
    return groups;
  }, [inboundShipments]);

  const totalShipments = Object.keys(groupedShipments).length;
  const totalQuantity = inboundShipments.reduce((sum: number, shipment: InboundShipment) => sum + (shipment.sl_nhap || 0), 0);
  const todayShipments = inboundShipments.filter((shipment: InboundShipment) => 
    shipment.ngay_nhap === new Date().toISOString().split('T')[0]
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
            Sản phẩm: {inboundShipments.length}
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
                .map((shipment) => (
                  <TableRow key={shipment.id} hover>
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

      {/* Dialog thêm/sửa phiếu nhập */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ShippingIcon />
          {editingShipment ? 'Chỉnh Sửa Phiếu Nhập Kho' : 'Tạo Phiếu Nhập Kho Mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Mã Phiếu"
                value={formData.xuat_kho_id}
                onChange={(e) => setFormData({ ...formData, xuat_kho_id: e.target.value })}
                disabled={!!editingShipment}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
              <TextField
                fullWidth
                label="Ngày Nhập"
                type="date"
                value={formData.ngay_nhap}
                onChange={(e) => setFormData({ ...formData, ngay_nhap: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Mã Sản Phẩm"
                value={formData.san_pham_id}
                onChange={(e) => setFormData({ ...formData, san_pham_id: e.target.value })}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
              <TextField
                fullWidth
                label="Tên Sản Phẩm"
                value={formData.ten_san_pham}
                onChange={(e) => setFormData({ ...formData, ten_san_pham: e.target.value })}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl fullWidth sx={{ minWidth: 200, flex: '1 1 200px' }}>
                <InputLabel>Nhà Cung Cấp</InputLabel>
                <Select
                  value={formData.nha_cung_cap_id}
                  label="Nhà Cung Cấp"
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  {suppliers.map((supplier: any) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.ten_ncc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Số Lượng"
                type="number"
                value={formData.sl_nhap}
                onChange={(e) => setFormData({ ...formData, sl_nhap: parseInt(e.target.value) || 0 })}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Đơn Vị Tính"
                value={formData.dvt}
                onChange={(e) => setFormData({ ...formData, dvt: e.target.value })}
                sx={{ minWidth: 200, flex: '1 1 200px' }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Nội Dung Nhập"
              value={formData.noi_dung_nhap}
              onChange={(e) => setFormData({ ...formData, noi_dung_nhap: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            {loading ? 'Đang lưu...' : (editingShipment ? 'Cập Nhật' : 'Tạo')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Excel Dialog */}
      <ImportExcelDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={handleImportExcel}
        customers={suppliers}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default InboundShipments; 