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
import { OutboundShipment } from '../types';
import ImportExcelOutboundDialog from '../components/ImportExcelOutboundDialog';
import { useNavigate } from 'react-router-dom';
import { outboundShipmentsAPI } from '../services/googleSheetsService';

interface OutboundShipmentFormData {
  xuat_kho_id: string;
  ngay_xuat: string;
  san_pham_id: string;
  ten_san_pham: string;
  nhom_san_pham: string;
  hang_sx: string;
  hinh_anh: string;
  thong_tin: string;
  quy_cach: string;
  dvt: string;
  sl_xuat: number;
  ghi_chu: string;
  So_HD: string;
  Ma_KH: string;
  Ten_Khach_Hang: string;
  Dia_Chi: string;
  So_Dt: string;
  Noi_Dung_Xuat: string;
}

const OutboundShipments: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { outboundShipments, customers } = state;
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState<OutboundShipment | null>(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [formData, setFormData] = useState<OutboundShipmentFormData>({
    xuat_kho_id: '',
    ngay_xuat: new Date().toISOString().split('T')[0],
    san_pham_id: '',
    ten_san_pham: '',
    nhom_san_pham: '',
    hang_sx: '',
    hinh_anh: '',
    thong_tin: '',
    quy_cach: '',
    dvt: '',
    sl_xuat: 0,
    ghi_chu: '',
    So_HD: '',
    Ma_KH: '',
    Ten_Khach_Hang: '',
    Dia_Chi: '',
    So_Dt: '',
    Noi_Dung_Xuat: '',
  });

  const filteredShipments = useMemo(() => {
    return outboundShipments.filter((shipment: OutboundShipment) =>
      shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.Ten_Khach_Hang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [outboundShipments, searchTerm]);

  const handleOpenDialog = (shipment?: OutboundShipment) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.xuat_kho_id,
        ngay_xuat: shipment.ngay_xuat,
        san_pham_id: shipment.san_pham_id,
        ten_san_pham: shipment.ten_san_pham,
        nhom_san_pham: shipment.nhom_san_pham,
        hang_sx: shipment.hang_sx,
        hinh_anh: shipment.hinh_anh,
        thong_tin: shipment.thong_tin,
        quy_cach: shipment.quy_cach,
        dvt: shipment.dvt,
        sl_xuat: shipment.sl_xuat,
        ghi_chu: shipment.ghi_chu,
        So_HD: shipment.So_HD,
        Ma_KH: shipment.Ma_KH,
        Ten_Khach_Hang: shipment.Ten_Khach_Hang,
        Dia_Chi: shipment.Dia_Chi,
        So_Dt: shipment.So_Dt,
        Noi_Dung_Xuat: shipment.Noi_Dung_Xuat,
      });
    } else {
      setEditingShipment(null);
      setFormData({
        xuat_kho_id: '',
        ngay_xuat: new Date().toISOString().split('T')[0],
        san_pham_id: '',
        ten_san_pham: '',
        nhom_san_pham: '',
        hang_sx: '',
        hinh_anh: '',
        thong_tin: '',
        quy_cach: '',
        dvt: '',
        sl_xuat: 0,
        ghi_chu: '',
        So_HD: '',
        Ma_KH: '',
        Ten_Khach_Hang: '',
        Dia_Chi: '',
        So_Dt: '',
        Noi_Dung_Xuat: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
  };

  const handleSubmit = async () => {
    try {
      const shipmentData: OutboundShipment = {
        id: editingShipment?.id || Date.now().toString(),
        ...formData,
        ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingShipment) {
        await outboundShipmentsAPI.update(shipmentData.id, shipmentData);
        dispatch({ type: 'UPDATE_OUTBOUND_SHIPMENT', payload: shipmentData });
      } else {
        const newShipment = await outboundShipmentsAPI.create(shipmentData);
        dispatch({ type: 'ADD_OUTBOUND_SHIPMENT', payload: newShipment });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving outbound shipment:', error);
      alert('Có lỗi khi lưu phiếu xuất kho');
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu xuất kho này?')) {
      try {
        await outboundShipmentsAPI.delete(shipmentId);
        dispatch({ type: 'DELETE_OUTBOUND_SHIPMENT', payload: shipmentId });
      } catch (error) {
        console.error('Error deleting outbound shipment:', error);
        alert('Có lỗi khi xóa phiếu xuất kho');
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    // TODO: Implement view details functionality if needed
    console.log('View details for shipment:', shipmentId);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        Ma_KH: customer.id,
        Ten_Khach_Hang: customer.ten_day_du || customer.ten_khach_hang || '',
        Dia_Chi: customer.ghi_chu || '', // Customer không có dia_chi field
        So_Dt: customer.sdt || '',
      }));
    }
  };

  const handleImportExcel = (importedData: any[]) => {
    // TODO: Implement Excel import logic
    console.log('Import data:', importedData);
    setOpenImportDialog(false);
  };

  // Group shipments by xuat_kho_id for statistics
  const groupedShipments = useMemo(() => {
    const groups: { [key: string]: OutboundShipment[] } = {};
    outboundShipments.forEach((shipment: OutboundShipment) => {
      if (!groups[shipment.xuat_kho_id]) {
        groups[shipment.xuat_kho_id] = [];
      }
      groups[shipment.xuat_kho_id].push(shipment);
    });
    return groups;
  }, [outboundShipments]);

  const totalShipments = Object.keys(groupedShipments).length;
  const totalQuantity = outboundShipments.reduce((sum: number, shipment: OutboundShipment) => sum + shipment.sl_xuat, 0);
  const todayShipments = outboundShipments.filter((shipment: OutboundShipment) => 
    shipment.ngay_xuat === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
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
              {totalShipments}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Sản Phẩm Xuất
            </Typography>
            <Typography variant="h4" color="primary.main">
              {outboundShipments.length}
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
              {todayShipments}
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
          onClick={() => setOpenImportDialog(true)}
        >
          Nhập Excel
        </Button>
      </Box>

      {/* Bảng phiếu xuất */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Ngày Xuất</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell align="right">Số Lượng</TableCell>
                <TableCell>Đơn Vị</TableCell>
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
                    <TableCell>{new Date(shipment.ngay_xuat).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{shipment.ten_san_pham}</TableCell>
                    <TableCell>{shipment.Ten_Khach_Hang}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={shipment.sl_xuat}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{shipment.dvt}</TableCell>
                    <TableCell>{shipment.Noi_Dung_Xuat}</TableCell>
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

      {/* Dialog thêm/sửa phiếu xuất */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingShipment ? 'Sửa Phiếu Xuất Kho' : 'Tạo Phiếu Xuất Kho Mới'}
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
              <TextField
                fullWidth
                label="Mã Phiếu Xuất"
                value={formData.xuat_kho_id}
                onChange={(e) => setFormData({ ...formData, xuat_kho_id: e.target.value })}
              />
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
              <TextField
                fullWidth
                label="Mã Sản Phẩm"
                value={formData.san_pham_id}
                onChange={(e) => setFormData({ ...formData, san_pham_id: e.target.value })}
              />
              <TextField
                fullWidth
                label="Tên Sản Phẩm"
                value={formData.ten_san_pham}
                onChange={(e) => setFormData({ ...formData, ten_san_pham: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Nhóm Sản Phẩm"
                value={formData.nhom_san_pham}
                onChange={(e) => setFormData({ ...formData, nhom_san_pham: e.target.value })}
              />
              <TextField
                fullWidth
                label="Hãng Sản Xuất"
                value={formData.hang_sx}
                onChange={(e) => setFormData({ ...formData, hang_sx: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Đơn Vị Tính"
                value={formData.dvt}
                onChange={(e) => setFormData({ ...formData, dvt: e.target.value })}
              />
              <TextField
                fullWidth
                type="number"
                label="Số Lượng Xuất"
                value={formData.sl_xuat}
                onChange={(e) => setFormData({ ...formData, sl_xuat: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Khách Hàng</InputLabel>
                <Select
                  value={formData.Ma_KH}
                  label="Khách Hàng"
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  {customers.map((customer: any) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.ten_day_du || customer.ten_khach_hang || customer.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tên Khách Hàng"
                value={formData.Ten_Khach_Hang}
                onChange={(e) => setFormData({ ...formData, Ten_Khach_Hang: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Hóa Đơn"
                value={formData.So_HD}
                onChange={(e) => setFormData({ ...formData, So_HD: e.target.value })}
              />
              <TextField
                fullWidth
                label="Địa Chỉ"
                value={formData.Dia_Chi}
                onChange={(e) => setFormData({ ...formData, Dia_Chi: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Điện Thoại"
                value={formData.So_Dt}
                onChange={(e) => setFormData({ ...formData, So_Dt: e.target.value })}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Nội Dung Xuất"
              value={formData.Noi_Dung_Xuat}
              onChange={(e) => setFormData({ ...formData, Noi_Dung_Xuat: e.target.value })}
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
      <ImportExcelOutboundDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={handleImportExcel}
        customers={customers}
      />
      </Box>
    </Box>
  );
};

export default OutboundShipments; 