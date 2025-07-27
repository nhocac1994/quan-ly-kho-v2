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
import { OutboundShipment } from '../types';

interface OutboundShipmentFormData {
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
}

const OutboundShipments: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { outboundShipments, customers } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OutboundShipment | null>(null);
  const [formData, setFormData] = useState<OutboundShipmentFormData>({
    loai_xuat: '',
    ngay_xuat: new Date().toISOString().split('T')[0],
    khach_hang_id: '',
    ten_khach_hang: '',
    ma_hoa_don: '',
    sl_san_pham: 0,
    sl_xuat: 0,
    tai_xe: '',
    noi_dung_xuat: '',
    ghi_chu: '',
  });

  const filteredShipments = useMemo(() => {
    return outboundShipments.filter((shipment: OutboundShipment) =>
      shipment.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ma_hoa_don.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.loai_xuat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [outboundShipments, searchTerm]);

  const handleOpenDialog = (shipment?: OutboundShipment) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        loai_xuat: shipment.loai_xuat,
        ngay_xuat: shipment.ngay_xuat,
        khach_hang_id: shipment.khach_hang_id,
        ten_khach_hang: shipment.ten_khach_hang,
        ma_hoa_don: shipment.ma_hoa_don,
        sl_san_pham: shipment.sl_san_pham,
        sl_xuat: shipment.sl_xuat,
        tai_xe: shipment.tai_xe,
        noi_dung_xuat: shipment.noi_dung_xuat,
        ghi_chu: shipment.ghi_chu,
      });
    } else {
      setEditingShipment(null);
      setFormData({
        loai_xuat: '',
        ngay_xuat: new Date().toISOString().split('T')[0],
        khach_hang_id: '',
        ten_khach_hang: '',
        ma_hoa_don: '',
        sl_san_pham: 0,
        sl_xuat: 0,
        tai_xe: '',
        noi_dung_xuat: '',
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
    const shipmentData: OutboundShipment = {
      id: editingShipment?.id || Date.now().toString(),
      ...formData,
      ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
      nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
      update: new Date().toISOString(),
    };

    if (editingShipment) {
      dispatch({ type: 'UPDATE_OUTBOUND_SHIPMENT', payload: shipmentData });
    } else {
      dispatch({ type: 'ADD_OUTBOUND_SHIPMENT', payload: shipmentData });
    }
    handleCloseDialog();
  };

  const handleDelete = (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu xuất kho này?')) {
      dispatch({ type: 'DELETE_OUTBOUND_SHIPMENT', payload: shipmentId });
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      khach_hang_id: customerId,
      ten_khach_hang: customer ? customer.ten_khach_hang : '',
    });
  };

  const totalProducts = useMemo(() => 
    outboundShipments.reduce((sum: number, shipment: OutboundShipment) => sum + shipment.sl_san_pham, 0), 
    [outboundShipments]
  );

  const totalQuantity = useMemo(() => 
    outboundShipments.reduce((sum: number, shipment: OutboundShipment) => sum + shipment.sl_xuat, 0), 
    [outboundShipments]
  );

  const todayShipments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return outboundShipments.filter((shipment: OutboundShipment) => 
      shipment.ngay_xuat === today
    );
  }, [outboundShipments]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản Lý Xuất Kho
      </Typography>

      {/* Thống kê */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Phiếu Xuất
            </Typography>
            <Typography variant="h4">
              {outboundShipments.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Sản Phẩm Xuất
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
              Xuất Hôm Nay
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
          placeholder="Tìm kiếm phiếu xuất..."
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
          Tạo Phiếu Xuất
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
        >
          Nhập Excel
        </Button>
      </Box>

      {/* Bảng phiếu xuất */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Loại Xuất</TableCell>
                <TableCell>Ngày Xuất</TableCell>
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
                        label={shipment.loai_xuat}
                        color="secondary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(shipment.ngay_xuat).toLocaleDateString('vi-VN')}</TableCell>
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
                    <TableCell>{shipment.noi_dung_xuat}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(shipment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                      >
                        <ViewIcon />
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
          rowsPerPageOptions={[5, 10, 25]}
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

      {/* Dialog thêm/sửa phiếu xuất */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingShipment ? 'Sửa Phiếu Xuất Kho' : 'Tạo Phiếu Xuất Kho Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Loại Xuất</InputLabel>
                <Select
                  value={formData.loai_xuat}
                  label="Loại Xuất"
                  onChange={(e) => setFormData({ ...formData, loai_xuat: e.target.value })}
                >
                  <MenuItem value="Xuất hàng">Xuất hàng</MenuItem>
                  <MenuItem value="Xuất trả">Xuất trả</MenuItem>
                  <MenuItem value="Xuất khác">Xuất khác</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="date"
                label="Ngày Xuất"
                value={formData.ngay_xuat}
                onChange={(e) => setFormData({ ...formData, ngay_xuat: e.target.value })}
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
              label="Nội Dung Xuất"
              value={formData.noi_dung_xuat}
              onChange={(e) => setFormData({ ...formData, noi_dung_xuat: e.target.value })}
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
    </Box>
  );
};

export default OutboundShipments; 