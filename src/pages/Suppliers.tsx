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
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { Supplier } from '../types';
import { suppliersAPI } from '../services/googleSheetsService';

interface SupplierFormData {
  ten_ncc: string;
  hien_thi: string;
  ten_day_du: string;
  loai_ncc: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
}

const Suppliers: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { suppliers } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });
  const [formData, setFormData] = useState<SupplierFormData>({
    ten_ncc: '',
    hien_thi: 'Có',
    ten_day_du: '',
    loai_ncc: '',
    logo: '',
    nguoi_dai_dien: '',
    sdt: '',
    tinh_trang: 'Hoạt động',
    nv_phu_trach: '',
    ghi_chu: '',
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier: Supplier) =>
      supplier.ten_ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.sdt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        ten_ncc: supplier.ten_ncc,
        hien_thi: supplier.hien_thi,
        ten_day_du: supplier.ten_day_du,
        loai_ncc: supplier.loai_ncc,
        logo: supplier.logo,
        nguoi_dai_dien: supplier.nguoi_dai_dien,
        sdt: supplier.sdt,
        tinh_trang: supplier.tinh_trang,
        nv_phu_trach: supplier.nv_phu_trach,
        ghi_chu: supplier.ghi_chu,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        ten_ncc: '',
        hien_thi: 'Có',
        ten_day_du: '',
        loai_ncc: '',
        logo: '',
        nguoi_dai_dien: '',
        sdt: '',
        tinh_trang: 'Hoạt động',
        nv_phu_trach: '',
        ghi_chu: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const supplierData: Omit<Supplier, 'id'> = {
        ...formData,
        ngay_tao: editingSupplier?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingSupplier?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingSupplier) {
        const updatedSupplier = await suppliersAPI.update(editingSupplier.id, supplierData);
        dispatch({ type: 'UPDATE_SUPPLIER', payload: updatedSupplier });
        setSnackbar({ open: true, message: 'Cập nhật nhà cung cấp thành công!' });
      } else {
        const newSupplier = await suppliersAPI.create(supplierData);
        dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
        setSnackbar({ open: true, message: 'Thêm nhà cung cấp thành công!' });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi lưu nhà cung cấp!' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      setLoading(true);
      try {
        await suppliersAPI.delete(supplierId);
        dispatch({ type: 'DELETE_SUPPLIER', payload: supplierId });
        setSnackbar({ open: true, message: 'Xóa nhà cung cấp thành công!' });
      } catch (error) {
        console.error('Error deleting supplier:', error);
        setSnackbar({ open: true, message: 'Có lỗi xảy ra khi xóa nhà cung cấp!' });
      } finally {
        setLoading(false);
      }
    }
  };

  const activeSuppliers = useMemo(() => 
    suppliers.filter((supplier: Supplier) => supplier.tinh_trang === 'Hoạt động'), 
    [suppliers]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản Lý Nhà Cung Cấp
      </Typography>

      {/* Thống kê */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Nhà Cung Cấp
            </Typography>
            <Typography variant="h4">
              {suppliers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Nhà Cung Cấp Hoạt Động
            </Typography>
            <Typography variant="h4" color="success.main">
              {activeSuppliers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Nhà Cung Cấp Hiển Thị
            </Typography>
            <Typography variant="h4" color="primary.main">
              {suppliers.filter((s: Supplier) => s.hien_thi === 'Có').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Thanh tìm kiếm và thêm mới */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Tìm kiếm nhà cung cấp..."
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
          disabled={loading}
        >
          Thêm Nhà Cung Cấp
        </Button>
      </Box>

      {/* Bảng nhà cung cấp */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã NCC</TableCell>
                <TableCell>Tên NCC</TableCell>
                <TableCell>Tên Đầy Đủ</TableCell>
                <TableCell>Loại NCC</TableCell>
                <TableCell>Người Đại Diện</TableCell>
                <TableCell>Số Điện Thoại</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>NV Phụ Trách</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>{supplier.id}</TableCell>
                    <TableCell>{supplier.ten_ncc}</TableCell>
                    <TableCell>{supplier.ten_day_du}</TableCell>
                    <TableCell>{supplier.loai_ncc}</TableCell>
                    <TableCell>{supplier.nguoi_dai_dien}</TableCell>
                    <TableCell>{supplier.sdt}</TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.tinh_trang}
                        color={supplier.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{supplier.nv_phu_trach}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(supplier)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(supplier.id)}
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
          count={filteredSuppliers.length}
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

      {/* Dialog thêm/sửa nhà cung cấp */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Tên NCC"
                value={formData.ten_ncc}
                onChange={(e) => setFormData({ ...formData, ten_ncc: e.target.value })}
              />
              <TextField
                fullWidth
                label="Tên Đầy Đủ"
                value={formData.ten_day_du}
                onChange={(e) => setFormData({ ...formData, ten_day_du: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Loại NCC"
                value={formData.loai_ncc}
                onChange={(e) => setFormData({ ...formData, loai_ncc: e.target.value })}
              />
              <TextField
                fullWidth
                label="Logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Người Đại Diện"
                value={formData.nguoi_dai_dien}
                onChange={(e) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
              />
              <TextField
                fullWidth
                label="Số Điện Thoại"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Trạng Thái</InputLabel>
                <Select
                  value={formData.tinh_trang}
                  label="Trạng Thái"
                  onChange={(e) => setFormData({ ...formData, tinh_trang: e.target.value })}
                >
                  <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                  <MenuItem value="Tạm ngưng">Tạm ngưng</MenuItem>
                  <MenuItem value="Ngừng hoạt động">Ngừng hoạt động</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="NV Phụ Trách"
                value={formData.nv_phu_trach}
                onChange={(e) => setFormData({ ...formData, nv_phu_trach: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Hiển Thị</InputLabel>
                <Select
                  value={formData.hien_thi}
                  label="Hiển Thị"
                  onChange={(e) => setFormData({ ...formData, hien_thi: e.target.value })}
                >
                  <MenuItem value="Có">Có</MenuItem>
                  <MenuItem value="Không">Không</MenuItem>
                </Select>
              </FormControl>
            </Box>
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
          <Button onClick={handleCloseDialog} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingSupplier ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Suppliers; 