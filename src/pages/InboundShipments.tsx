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
import { useInventory } from '../context/InventoryContext';
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
  const { state, dispatch } = useInventory();
  const { inboundShipments, suppliers } = state;
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
        dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: shipmentData as InboundShipment });
        setSnackbar({ open: true, message: 'Cập nhật phiếu nhập kho thành công!', severity: 'success' });
      } else {
        const { id, ...createData } = shipmentData;
        const newShipment = await dataService.inboundShipments.create(createData);
        dispatch({ type: 'ADD_INBOUND_SHIPMENT', payload: newShipment });
        setSnackbar({ open: true, message: 'Tạo phiếu nhập kho thành công!', severity: 'success' });
      }
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
        dispatch({ type: 'DELETE_INBOUND_SHIPMENT', payload: shipmentId });
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header Section */}
      <Box sx={{ p: 2.5, pb: 2, bgcolor: 'white', boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <ShippingIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ fontSize: '1.5rem' }}>
              Quản Lý Nhập Kho
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Quản lý và theo dõi các phiếu nhập kho
            </Typography>
          </Box>
        </Box>
      
        {/* Thống kê */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
            <Fade in timeout={300}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        Tổng Phiếu Nhập
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                        {loading ? <Skeleton width={40} /> : totalShipments}
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 28, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
            <Fade in timeout={400}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        Tổng Sản Phẩm Nhập
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                        {loading ? <Skeleton width={40} /> : inboundShipments.length}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
            <Fade in timeout={500}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        Tổng Số Lượng
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                        {loading ? <Skeleton width={50} /> : totalQuantity.toLocaleString()}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
            <Fade in timeout={600}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        Nhập Hôm Nay
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                        {loading ? <Skeleton width={40} /> : todayShipments}
                      </Typography>
                    </Box>
                    <TodayIcon sx={{ fontSize: 28, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Box>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Tìm kiếm phiếu nhập, sản phẩm, nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
            size="small"
            sx={{ 
              flexGrow: 1, 
              minWidth: 250,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: 'background.paper',
                fontSize: '0.875rem'
              }
            }}
          />
          <Tooltip title="Làm mới dữ liệu">
            <IconButton 
              onClick={() => window.location.reload()}
              size="small"
              sx={{ 
                bgcolor: 'background.paper',
                width: 36,
                height: 36
              }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: 18 }} />}
            onClick={() => setOpenImportDialog(true)}
            size="small"
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2,
              py: 0.75
            }}
          >
            Nhập Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={() => handleOpenDialog()}
            size="small"
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2,
              py: 0.75,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            + Tạo Phiếu Nhập
          </Button>
        </Box>
      </Box>

      {/* Bảng phiếu nhập */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        mx: 3, 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 3
      }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 400px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Mã Phiếu</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ngày Nhập</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tên Sản Phẩm</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nhà Cung Cấp</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Số Lượng</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Đơn Vị</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nội Dung</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((shipment, index) => (
                  <Zoom in timeout={200 + index * 50}>
                    <TableRow 
                      key={shipment.id} 
                      hover 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'scale(1.01)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={shipment.xuat_kho_id || 'N/A'} 
                          color="primary" 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(shipment.ngay_nhap)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon color="primary" fontSize="small" />
                          <Typography variant="body2" fontWeight="medium">
                            {shipment.ten_san_pham || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {shipment.ten_nha_cung_cap || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={shipment.sl_nhap?.toLocaleString() || '0'}
                          color="info"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {shipment.dvt || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shipment.noi_dung_nhap || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(shipment.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenDialog(shipment)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(shipment.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </Zoom>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredShipments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{ 
            bgcolor: 'background.paper',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: 500
            }
          }}
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