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
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { InboundShipment } from '../types';
import ImportExcelDialog from '../components/ImportExcelDialog';
import { useNavigate } from 'react-router-dom';

interface InboundShipmentFormData {
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
}

const InboundShipments: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { inboundShipments, customers } = state;
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<InboundShipment | null>(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [formData, setFormData] = useState<InboundShipmentFormData>({
    loai_nhap: '',
    ngay_nhap: new Date().toISOString().split('T')[0],
    khach_hang_id: '',
    ten_khach_hang: '',
    ma_hoa_don: '',
    sl_san_pham: 0,
    sl_xuat: 0,
    tai_xe: '',
    noi_dung_nhap: '',
    ghi_chu: '',
  });

  const filteredShipments = useMemo(() => {
    return inboundShipments.filter((shipment: InboundShipment) =>
      shipment.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ma_hoa_don.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.loai_nhap.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inboundShipments, searchTerm]);

  const handleOpenDialog = (shipment?: InboundShipment) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        loai_nhap: shipment.loai_nhap,
        ngay_nhap: shipment.ngay_nhap,
        khach_hang_id: shipment.khach_hang_id,
        ten_khach_hang: shipment.ten_khach_hang,
        ma_hoa_don: shipment.ma_hoa_don,
        sl_san_pham: shipment.sl_san_pham,
        sl_xuat: shipment.sl_xuat,
        tai_xe: shipment.tai_xe,
        noi_dung_nhap: shipment.noi_dung_nhap,
        ghi_chu: shipment.ghi_chu,
      });
    } else {
      setEditingShipment(null);
      setFormData({
        loai_nhap: '',
        ngay_nhap: new Date().toISOString().split('T')[0],
        khach_hang_id: '',
        ten_khach_hang: '',
        ma_hoa_don: '',
        sl_san_pham: 0,
        sl_xuat: 0,
        tai_xe: '',
        noi_dung_nhap: '',
        ghi_chu: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
  };

  const handleSubmit = () => {
    const shipmentData: InboundShipment = {
      id: editingShipment?.id || Date.now().toString(),
      ...formData,
      ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
      nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
      update: new Date().toISOString(),
    };

    if (editingShipment) {
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: shipmentData });
    } else {
      dispatch({ type: 'ADD_INBOUND_SHIPMENT', payload: shipmentData });
    }
    handleCloseDialog();
  };

  const handleDelete = (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập kho này?')) {
      dispatch({ type: 'DELETE_INBOUND_SHIPMENT', payload: shipmentId });
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    navigate(`/inbound-details/${shipmentId}`);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      khach_hang_id: customerId,
      ten_khach_hang: customer ? customer.ten_khach_hang : '',
    });
  };

  const handleImportExcel = (importedData: any[]) => {
    // Convert imported data to InboundShipment format
    const shipments: InboundShipment[] = importedData.map((data) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      loai_nhap: data.loai_nhap,
      ngay_nhap: data.ngay_nhap,
      khach_hang_id: '',
      ten_khach_hang: data.ten_khach_hang,
      ma_hoa_don: data.ma_hoa_don,
      sl_san_pham: data.sl_san_pham,
      sl_xuat: data.sl_xuat,
      tai_xe: data.tai_xe,
      noi_dung_nhap: data.noi_dung_nhap,
      ghi_chu: data.ghi_chu,
      ngay_tao: new Date().toISOString(),
      nguoi_tao: 'Admin',
      update: new Date().toISOString(),
    }));

    // Add all imported shipments
    shipments.forEach((shipment) => {
      dispatch({ type: 'ADD_INBOUND_SHIPMENT', payload: shipment });
    });

    // Hiển thị thông báo thành công
    alert(`✅ Đã import thành công ${importedData.length} phiếu nhập kho!`);
  };

  const totalProducts = useMemo(() => 
    inboundShipments.reduce((sum: number, shipment: InboundShipment) => sum + shipment.sl_san_pham, 0), 
    [inboundShipments]
  );

  const totalQuantity = useMemo(() => 
    inboundShipments.reduce((sum: number, shipment: InboundShipment) => sum + shipment.sl_xuat, 0), 
    [inboundShipments]
  );

  const todayShipments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return inboundShipments.filter((shipment: InboundShipment) => 
      shipment.ngay_nhap === today
    );
  }, [inboundShipments]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Quản Lý Nhập Kho
        </Typography>
      
      {/* Thống kê */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Phiếu Nhập
            </Typography>
            <Typography variant="h4">
              {inboundShipments.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Sản Phẩm Nhập
            </Typography>
            <Typography variant="h4" color="primary.main">
              {totalProducts}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Số Lượng
            </Typography>
            <Typography variant="h4" color="success.main">
              {totalQuantity}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Nhập Hôm Nay
            </Typography>
            <Typography variant="h4" color="warning.main">
              {todayShipments.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Thanh tìm kiếm và thêm mới */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Tìm kiếm phiếu nhập..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Tạo Phiếu Nhập
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setOpenImportDialog(true)}
        >
          Nhập Excel
        </Button>
      </Box>

      {/* Bảng phiếu nhập */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Loại Nhập</TableCell>
                <TableCell>Ngày Nhập</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell>Mã Hóa Đơn</TableCell>
                <TableCell align="right">SL Sản Phẩm</TableCell>
                <TableCell align="right">SL Xuất</TableCell>
                <TableCell>Tài Xế</TableCell>
                <TableCell>Nội Dung</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((shipment) => (
                  <TableRow key={shipment.id} hover>
                    <TableCell>{shipment.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={shipment.loai_nhap}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(shipment.ngay_nhap).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{shipment.ten_khach_hang}</TableCell>
                    <TableCell>{shipment.ma_hoa_don}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={shipment.sl_san_pham}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={shipment.sl_xuat}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{shipment.tai_xe}</TableCell>
                    <TableCell>{shipment.noi_dung_nhap}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(shipment.id)}
                        title="Xem chi tiết"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(shipment)}
                        title="Sửa phiếu"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(shipment.id)}
                        title="Xóa phiếu"
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
          rowsPerPageOptions={[10, 25, 50, 100]}
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
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Paper>

      {/* Dialog thêm/sửa phiếu nhập */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingShipment ? 'Sửa Phiếu Nhập Kho' : 'Tạo Phiếu Nhập Kho Mới'}
            </Typography>
            {!editingShipment && (
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => {
                  setOpenImportDialog(true);
                  setOpenDialog(false); // Đóng form chính khi mở import dialog
                }}
                size="small"
              >
                Nhập Excel
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Loại Nhập</InputLabel>
                <Select
                  value={formData.loai_nhap}
                  label="Loại Nhập"
                  onChange={(e) => setFormData({ ...formData, loai_nhap: e.target.value })}
                >
                  <MenuItem value="Nhập hàng">Nhập hàng</MenuItem>
                  <MenuItem value="Nhập trả">Nhập trả</MenuItem>
                  <MenuItem value="Nhập khác">Nhập khác</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="date"
                label="Ngày Nhập"
                value={formData.ngay_nhap}
                onChange={(e) => setFormData({ ...formData, ngay_nhap: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Khách Hàng</InputLabel>
                <Select
                  value={formData.khach_hang_id}
                  label="Khách Hàng"
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.ten_khach_hang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Mã Hóa Đơn"
                value={formData.ma_hoa_don}
                onChange={(e) => setFormData({ ...formData, ma_hoa_don: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Số Lượng Sản Phẩm"
                value={formData.sl_san_pham}
                onChange={(e) => setFormData({ ...formData, sl_san_pham: parseInt(e.target.value) || 0 })}
              />
              <TextField
                fullWidth
                type="number"
                label="Số Lượng Xuất"
                value={formData.sl_xuat}
                onChange={(e) => setFormData({ ...formData, sl_xuat: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <TextField
              fullWidth
              label="Tài Xế"
              value={formData.tai_xe}
              onChange={(e) => setFormData({ ...formData, tai_xe: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Nội Dung Nhập"
              value={formData.noi_dung_nhap}
              onChange={(e) => setFormData({ ...formData, noi_dung_nhap: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi Chú"
              value={formData.ghi_chu}
              onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingShipment ? 'Cập Nhật' : 'Tạo Phiếu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Excel Dialog */}
      <ImportExcelDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={handleImportExcel}
        customers={customers}
      />
      </Box>
    </Box>
  );
};

export default InboundShipments; 