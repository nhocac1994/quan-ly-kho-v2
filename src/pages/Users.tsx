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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { User } from '../types';
import { usersAPI } from '../services/googleSheetsService';

interface UserFormData {
  ho_va_ten: string;
  email: string;
  chuc_vu: string;
  phan_quyen: string;
  password: string;
  quyen_xem: boolean;
  quyen_them: boolean;
  quyen_sua: boolean;
  quyen_xoa: boolean;
  quyen_xuat: boolean;
  quyen_nhap: boolean;
  quyen_bao_cao: boolean;
  quyen_cai_dat: boolean;
}

const Users: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { users } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    ho_va_ten: '',
    email: '',
    chuc_vu: '',
    phan_quyen: 'User',
    password: '',
    quyen_xem: true,
    quyen_them: false,
    quyen_sua: false,
    quyen_xoa: false,
    quyen_xuat: false,
    quyen_nhap: false,
    quyen_bao_cao: false,
    quyen_cai_dat: false,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user: User) =>
      user.ho_va_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.chuc_vu.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        ho_va_ten: user.ho_va_ten,
        email: user.email,
        chuc_vu: user.chuc_vu,
        phan_quyen: user.phan_quyen,
        password: '', // Không hiển thị password cũ
        quyen_xem: user.quyen_xem === 'Có',
        quyen_them: user.quyen_them === 'Có',
        quyen_sua: user.quyen_sua === 'Có',
        quyen_xoa: user.quyen_xoa === 'Có',
        quyen_xuat: user.quyen_xuat === 'Có',
        quyen_nhap: user.quyen_nhap === 'Có',
        quyen_bao_cao: user.quyen_bao_cao === 'Có',
        quyen_cai_dat: user.quyen_cai_dat === 'Có',
      });
    } else {
      setEditingUser(null);
      setFormData({
        ho_va_ten: '',
        email: '',
        chuc_vu: '',
        phan_quyen: 'User',
        password: '',
        quyen_xem: true,
        quyen_them: false,
        quyen_sua: false,
        quyen_xoa: false,
        quyen_xuat: false,
        quyen_nhap: false,
        quyen_bao_cao: false,
        quyen_cai_dat: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      const userData: User = {
        id: editingUser?.id || Date.now().toString(),
        ho_va_ten: formData.ho_va_ten,
        email: formData.email,
        chuc_vu: formData.chuc_vu,
        phan_quyen: formData.phan_quyen,
        password: editingUser?.password || formData.password, // Giữ password cũ nếu edit
        quyen_xem: formData.quyen_xem ? 'Có' : 'Không',
        quyen_them: formData.quyen_them ? 'Có' : 'Không',
        quyen_sua: formData.quyen_sua ? 'Có' : 'Không',
        quyen_xoa: formData.quyen_xoa ? 'Có' : 'Không',
        quyen_xuat: formData.quyen_xuat ? 'Có' : 'Không',
        quyen_nhap: formData.quyen_nhap ? 'Có' : 'Không',
        quyen_bao_cao: formData.quyen_bao_cao ? 'Có' : 'Không',
        quyen_cai_dat: formData.quyen_cai_dat ? 'Có' : 'Không',
        ngay_tao: editingUser?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingUser?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingUser) {
        await usersAPI.update(userData.id, userData);
        dispatch({ type: 'UPDATE_USER', payload: userData });
      } else {
        const newUser = await usersAPI.create(userData);
        dispatch({ type: 'ADD_USER', payload: newUser });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Có lỗi khi lưu người dùng');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await usersAPI.delete(userId);
        dispatch({ type: 'DELETE_USER', payload: userId });
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Có lỗi khi xóa người dùng');
      }
    }
  };

  const activeUsers = useMemo(() => 
    users.filter((user: User) => user.phan_quyen !== 'Inactive'), 
    [users]
  );

  const adminUsers = useMemo(() => 
    users.filter((user: User) => user.phan_quyen === 'Admin'), 
    [users]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Quản Lý Người Dùng
        </Typography>

        {/* Thống kê */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Người Dùng
              </Typography>
              <Typography variant="h4">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Người Dùng Hoạt Động
              </Typography>
              <Typography variant="h4" color="success.main">
                {activeUsers.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Quản Trị Viên
              </Typography>
              <Typography variant="h4" color="primary.main">
                {adminUsers.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Tìm kiếm người dùng..."
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
            Thêm Người Dùng
          </Button>
        </Box>
      </Box>

      {/* Bảng người dùng */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã ND</TableCell>
                <TableCell>Họ Và Tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Chức Vụ</TableCell>
                <TableCell>Phân Quyền</TableCell>
                <TableCell>Quyền Xem</TableCell>
                <TableCell>Quyền Thêm</TableCell>
                <TableCell>Quyền Sửa</TableCell>
                <TableCell>Quyền Xóa</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {user.ho_va_ten}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.chuc_vu}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.phan_quyen}
                        color={user.phan_quyen === 'Admin' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_xem}
                        color={user.quyen_xem === 'Có' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_them}
                        color={user.quyen_them === 'Có' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_sua}
                        color={user.quyen_sua === 'Có' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_xoa}
                        color={user.quyen_xoa === 'Có' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id)}
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
          count={filteredUsers.length}
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

      {/* Dialog thêm/sửa người dùng */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Họ Và Tên"
                value={formData.ho_va_ten}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ho_va_ten: e.target.value })}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Chức Vụ"
                value={formData.chuc_vu}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, chuc_vu: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Phân Quyền</InputLabel>
                <Select
                  value={formData.phan_quyen}
                  label="Phân Quyền"
                  onChange={(e) => setFormData({ ...formData, phan_quyen: e.target.value })}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Guest">Guest</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Mật Khẩu"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
              helperText={editingUser ? "Để trống nếu không muốn thay đổi mật khẩu" : ""}
            />
            
            {/* Phần quyền */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Phân Quyền Chi Tiết
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_xem}
                    onChange={(e) => setFormData({ ...formData, quyen_xem: e.target.checked })}
                  />
                }
                label="Quyền Xem"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_them}
                    onChange={(e) => setFormData({ ...formData, quyen_them: e.target.checked })}
                  />
                }
                label="Quyền Thêm"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_sua}
                    onChange={(e) => setFormData({ ...formData, quyen_sua: e.target.checked })}
                  />
                }
                label="Quyền Sửa"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_xoa}
                    onChange={(e) => setFormData({ ...formData, quyen_xoa: e.target.checked })}
                  />
                }
                label="Quyền Xóa"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_xuat}
                    onChange={(e) => setFormData({ ...formData, quyen_xuat: e.target.checked })}
                  />
                }
                label="Quyền Xuất"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_nhap}
                    onChange={(e) => setFormData({ ...formData, quyen_nhap: e.target.checked })}
                  />
                }
                label="Quyền Nhập"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_bao_cao}
                    onChange={(e) => setFormData({ ...formData, quyen_bao_cao: e.target.checked })}
                  />
                }
                label="Quyền Báo Cáo"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.quyen_cai_dat}
                    onChange={(e) => setFormData({ ...formData, quyen_cai_dat: e.target.checked })}
                  />
                }
                label="Quyền Cài Đặt"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 