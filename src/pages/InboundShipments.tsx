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
import { inboundShipmentsAPI } from '../services/googleSheetsService';

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
  SL_Nhap: number;
  ghi_chu: string;
  Nha_Cung_Cap_id: string;
  Ten_Nha_Cung_Cap: string;
  Dia_Chi: string;
  So_Dt: string;
  Noi_Dung_Nhap: string;
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
    SL_Nhap: 0,
    ghi_chu: '',
    Nha_Cung_Cap_id: '',
    Ten_Nha_Cung_Cap: '',
    Dia_Chi: '',
    So_Dt: '',
    Noi_Dung_Nhap: '',
  });

  const filteredShipments = useMemo(() => {
    return inboundShipments.filter((shipment: InboundShipment) =>
      shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.Ten_Nha_Cung_Cap.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inboundShipments, searchTerm]);

  const handleOpenDialog = (shipment?: InboundShipment) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        xuat_kho_id: shipment.xuat_kho_id,
        ngay_nhap: shipment.ngay_nhap,
        san_pham_id: shipment.san_pham_id,
        ten_san_pham: shipment.ten_san_pham,
        nhom_san_pham: shipment.nhom_san_pham,
        hang_sx: shipment.hang_sx,
        hinh_anh: shipment.hinh_anh,
        thong_tin: shipment.thong_tin,
        quy_cach: shipment.quy_cach,
        dvt: shipment.dvt,
        SL_Nhap: shipment.SL_Nhap,
        ghi_chu: shipment.ghi_chu,
        Nha_Cung_Cap_id: shipment.Nha_Cung_Cap_id,
        Ten_Nha_Cung_Cap: shipment.Ten_Nha_Cung_Cap,
        Dia_Chi: shipment.Dia_Chi,
        So_Dt: shipment.So_Dt,
        Noi_Dung_Nhap: shipment.Noi_Dung_Nhap,
      });
    } else {
      setEditingShipment(null);
      setFormData({
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
        SL_Nhap: 0,
        ghi_chu: '',
        Nha_Cung_Cap_id: '',
        Ten_Nha_Cung_Cap: '',
        Dia_Chi: '',
        So_Dt: '',
        Noi_Dung_Nhap: '',
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
      const shipmentData: InboundShipment = {
        id: editingShipment?.id || Date.now().toString(),
        ...formData,
        ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingShipment) {
        await inboundShipmentsAPI.update(shipmentData.id, shipmentData);
        dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: shipmentData });
      } else {
        const newShipment = await inboundShipmentsAPI.create(shipmentData);
        dispatch({ type: 'ADD_INBOUND_SHIPMENT', payload: newShipment });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inbound shipment:', error);
      alert('Có lỗi khi lưu phiếu nhập kho');
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập kho này?')) {
      try {
        await inboundShipmentsAPI.delete(shipmentId);
        dispatch({ type: 'DELETE_INBOUND_SHIPMENT', payload: shipmentId });
      } catch (error) {
        console.error('Error deleting inbound shipment:', error);
        alert('Có lỗi khi xóa phiếu nhập kho');
      }
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    // TODO: Implement view details functionality if needed
    console.log('View details for shipment:', shipmentId);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        Nha_Cung_Cap_id: supplier.id,
        Ten_Nha_Cung_Cap: supplier.ten_day_du || supplier.ten_ncc || '',
        Dia_Chi: supplier.ghi_chu || '', // Supplier không có dia_chi field
        So_Dt: supplier.sdt || '',
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
  const totalQuantity = inboundShipments.reduce((sum: number, shipment: InboundShipment) => sum + shipment.SL_Nhap, 0);
  const todayShipments = inboundShipments.filter((shipment: InboundShipment) => 
    shipment.ngay_nhap === new Date().toISOString().split('T')[0]
  ).length;

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
              {totalShipments}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Sản Phẩm Nhập
            </Typography>
            <Typography variant="h4" color="primary.main">
              {inboundShipments.length}
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
              {todayShipments}
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
        <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Ngày Nhập</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>Nhà Cung Cấp</TableCell>
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
                    <TableCell>{new Date(shipment.ngay_nhap).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{shipment.ten_san_pham}</TableCell>
                    <TableCell>{shipment.Ten_Nha_Cung_Cap}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={shipment.SL_Nhap}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{shipment.dvt}</TableCell>
                    <TableCell>{shipment.Noi_Dung_Nhap}</TableCell>
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
              <TextField
                fullWidth
                label="Mã Phiếu Nhập"
                value={formData.xuat_kho_id}
                onChange={(e) => setFormData({ ...formData, xuat_kho_id: e.target.value })}
              />
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
                label="Số Lượng Nhập"
                value={formData.SL_Nhap}
                onChange={(e) => setFormData({ ...formData, SL_Nhap: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Nhà Cung Cấp</InputLabel>
                <Select
                  value={formData.Nha_Cung_Cap_id}
                  label="Nhà Cung Cấp"
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  {suppliers.map((supplier: any) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.ten_day_du || supplier.ten_ncc || supplier.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tên Nhà Cung Cấp"
                value={formData.Ten_Nha_Cung_Cap}
                onChange={(e) => setFormData({ ...formData, Ten_Nha_Cung_Cap: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Địa Chỉ"
                value={formData.Dia_Chi}
                onChange={(e) => setFormData({ ...formData, Dia_Chi: e.target.value })}
              />
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
              label="Nội Dung Nhập"
              value={formData.Noi_Dung_Nhap}
              onChange={(e) => setFormData({ ...formData, Noi_Dung_Nhap: e.target.value })}
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
        customers={suppliers} // Sử dụng suppliers thay vì customers cho nhập kho
      />
      </Box>
    </Box>
  );
};

export default InboundShipments; 