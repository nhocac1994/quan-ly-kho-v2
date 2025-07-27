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

} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { Customer } from '../types';

interface CustomerFormData {
  ten_khach_hang: string;
  hien_thi: string;
  ten_day_du: string;
  loai_khach_hang: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
}

const Customers: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { customers } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    ten_khach_hang: '',
    hien_thi: 'Có',
    ten_day_du: '',
    loai_khach_hang: '',
    logo: '',
    nguoi_dai_dien: '',
    sdt: '',
    tinh_trang: 'Hoạt động',
    nv_phu_trach: '',
    ghi_chu: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: Customer) =>
      customer.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.sdt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        ten_khach_hang: customer.ten_khach_hang,
        hien_thi: customer.hien_thi,
        ten_day_du: customer.ten_day_du,
        loai_khach_hang: customer.loai_khach_hang,
        logo: customer.logo,
        nguoi_dai_dien: customer.nguoi_dai_dien,
        sdt: customer.sdt,
        tinh_trang: customer.tinh_trang,
        nv_phu_trach: customer.nv_phu_trach,
        ghi_chu: customer.ghi_chu,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        ten_khach_hang: '',
        hien_thi: 'Có',
        ten_day_du: '',
        loai_khach_hang: '',
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
    setEditingCustomer(null);
  };

  const handleSubmit = () => {
    const customerData: Customer = {
      id: editingCustomer?.id || Date.now().toString(),
      ...formData,
      ngay_tao: editingCustomer?.ngay_tao || new Date().toISOString(),
      nguoi_tao: editingCustomer?.nguoi_tao || 'Admin',
      update: new Date().toISOString(),
    };

    if (editingCustomer) {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: customerData });
    } else {
      dispatch({ type: 'ADD_CUSTOMER', payload: customerData });
    }
    handleCloseDialog();
  };

  const handleDelete = (customerId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });
    }
  };

  const activeCustomers = useMemo(() => 
    customers.filter((customer: Customer) => customer.tinh_trang === 'Hoạt động'), 
    [customers]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản Lý Khách Hàng
      </Typography>

      {/* Thống kê */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Khách Hàng
            </Typography>
            <Typography variant="h4">
              {customers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Khách Hàng Hoạt Động
            </Typography>
            <Typography variant="h4" color="success.main">
              {activeCustomers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Khách Hàng Hiển Thị
            </Typography>
            <Typography variant="h4" color="primary.main">
              {customers.filter((c: Customer) => c.hien_thi === 'Có').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Thanh tìm kiếm và thêm mới */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Tìm kiếm khách hàng..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
          Thêm Khách Hàng
        </Button>
      </Box>

      {/* Bảng khách hàng */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã KH</TableCell>
                <TableCell>Tên Khách Hàng</TableCell>
                <TableCell>Tên Đầy Đủ</TableCell>
                <TableCell>Loại KH</TableCell>
                <TableCell>Người Đại Diện</TableCell>
                <TableCell>Số Điện Thoại</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>NV Phụ Trách</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{customer.ten_khach_hang}</TableCell>
                    <TableCell>{customer.ten_day_du}</TableCell>
                    <TableCell>{customer.loai_khach_hang}</TableCell>
                    <TableCell>{customer.nguoi_dai_dien}</TableCell>
                    <TableCell>{customer.sdt}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.tinh_trang}
                        color={customer.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{customer.nv_phu_trach}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(customer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(customer.id)}
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
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
        />
      </Paper>

      {/* Dialog thêm/sửa khách hàng */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Tên Khách Hàng"
                value={formData.ten_khach_hang}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_khach_hang: e.target.value })}
              />
              <TextField
                fullWidth
                label="Tên Đầy Đủ"
                value={formData.ten_day_du}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_day_du: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Loại Khách Hàng"
                value={formData.loai_khach_hang}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, loai_khach_hang: e.target.value })}
              />
              <TextField
                fullWidth
                label="Logo"
                value={formData.logo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logo: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Người Đại Diện"
                value={formData.nguoi_dai_dien}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
              />
              <TextField
                fullWidth
                label="Số Điện Thoại"
                value={formData.sdt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sdt: e.target.value })}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nv_phu_trach: e.target.value })}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ghi_chu: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers; 