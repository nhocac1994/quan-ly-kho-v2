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
import { useOutboundShipments, useCustomers } from '../hooks/useSupabaseQueries';
import { OutboundShipment } from '../types';
import ImportExcelOutboundDialog from '../components/ImportExcelOutboundDialog';
import { useNavigate } from 'react-router-dom';


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
  so_hd: string;
  ma_kh: string;
  ten_khach_hang: string;
  dia_chi: string;
  so_dt: string;
  noi_dung_xuat: string;
}

const OutboundShipments: React.FC = () => {
  const { data: outboundShipments = [], refetch: refreshOutboundShipments } = useOutboundShipments();
  const { data: customers = [] } = useCustomers();
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
    so_hd: '',
    ma_kh: '',
    ten_khach_hang: '',
    dia_chi: '',
    so_dt: '',
    noi_dung_xuat: '',
  });

  const filteredShipments = useMemo(() => {
    return outboundShipments.filter((shipment: OutboundShipment) =>
      shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase())
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
        so_hd: shipment.so_hd,
        ma_kh: shipment.ma_kh,
        ten_khach_hang: shipment.ten_khach_hang,
        dia_chi: shipment.dia_chi,
        so_dt: shipment.so_dt,
        noi_dung_xuat: shipment.noi_dung_xuat,
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
        so_hd: '',
        ma_kh: '',
        ten_khach_hang: '',
        dia_chi: '',
        so_dt: '',
        noi_dung_xuat: '',
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
      const shipmentData: Omit<OutboundShipment, 'id'> & { id?: string } = {
        id: editingShipment?.id,
        ...formData,
        ngay_tao: editingShipment?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingShipment?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingShipment) {
        await dataService.outboundShipments.update(shipmentData.id!, shipmentData);
      } else {
        const { id, ...createData } = shipmentData;
        await dataService.outboundShipments.create(createData);
      }
      await refreshOutboundShipments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving outbound shipment:', error);
      alert('Có lỗi khi lưu phiếu xuất kho');
    }
  };

  const handleDelete = async (shipmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu xuất kho này?')) {
      try {
        await dataService.outboundShipments.delete(shipmentId);
        await refreshOutboundShipments();
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
        ma_kh: customer.id,
        ten_khach_hang: customer.ten_day_du || customer.ten_khach_hang || '',
        dia_chi: customer.ghi_chu || '', // Customer không có dia_chi field
        so_dt: customer.sdt || '',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DownloadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
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
            Tổng phiếu: {totalShipments}
          </Typography>
          <Typography variant="body2">
            Sản phẩm: {outboundShipments.length}
          </Typography>
          <Typography variant="body2">
            Số lượng: {totalQuantity.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Hôm nay: {todayShipments}
          </Typography>
        </Box>
      </Box>

      {/* OutboundShipments Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã XK</TableCell>
                <TableCell>Ngày Xuất</TableCell>
                <TableCell>Sản Phẩm</TableCell>
                <TableCell>Số Lượng</TableCell>
                <TableCell>Khách Hàng</TableCell>
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
                    <TableCell>{formatDate(shipment.ngay_xuat)}</TableCell>
                    <TableCell>{shipment.ten_san_pham}</TableCell>
                    <TableCell>{shipment.sl_xuat?.toLocaleString()}</TableCell>
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
                  value={formData.ma_kh}
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
                value={formData.ten_khach_hang}
                onChange={(e) => setFormData({ ...formData, ten_khach_hang: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Hóa Đơn"
                value={formData.so_hd}
                onChange={(e) => setFormData({ ...formData, so_hd: e.target.value })}
              />
              <TextField
                fullWidth
                label="Địa Chỉ"
                value={formData.dia_chi}
                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Điện Thoại"
                value={formData.so_dt}
                onChange={(e) => setFormData({ ...formData, so_dt: e.target.value })}
              />
            </Box>
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

      {/* Import Excel Dialog */}
      <ImportExcelOutboundDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={handleImportExcel}
        customers={customers}
      />
    </Box>
  );
};

export default OutboundShipments; 