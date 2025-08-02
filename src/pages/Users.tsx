import React, { useState, useMemo } from 'react';
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
import { useUsers } from '../hooks/useSupabaseQueries';
import { User } from '../types';

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
  const { data: users = [], refetch: refreshUsers } = useUsers();
  
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
      const userData: Omit<User, 'id'> & { id?: string } = {
        id: editingUser?.id,
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
        updated_at: new Date().toISOString(),
      };

      if (editingUser) {
        await dataService.users.update(userData.id!, userData);
      } else {
        const { id, ...createData } = userData;
        await dataService.users.create(createData);
      }
      await refreshUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Có lỗi khi lưu người dùng');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await dataService.users.delete(userId);
        await refreshUsers();
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
            Quản Lý Người Dùng
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
            Thêm Người Dùng
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Tổng: {users.length}
          </Typography>
          <Typography variant="body2">
            Hoạt động: {activeUsers.length}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Admin: {adminUsers.length}
          </Typography>
        </Box>
      </Box>

      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
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
                    <TableCell>{user.ho_va_ten}</TableCell>
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
                        label={user.quyen_xem ? 'Có' : 'Không'}
                        color={user.quyen_xem ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_them ? 'Có' : 'Không'}
                        color={user.quyen_them ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_sua ? 'Có' : 'Không'}
                        color={user.quyen_sua ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.quyen_xoa ? 'Có' : 'Không'}
                        color={user.quyen_xoa ? 'success' : 'default'}
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
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Paper>

      {/* Dialog thêm/sửa người dùng */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Họ Và Tên"
                value={formData.ho_va_ten}
                onChange={(e) => setFormData({ ...formData, ho_va_ten: e.target.value })}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Chức Vụ"
                value={formData.chuc_vu}
                onChange={(e) => setFormData({ ...formData, chuc_vu: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Phân Quyền</InputLabel>
                <Select
                  value={formData.phan_quyen}
                  label="Phân Quyền"
                  onChange={(e) => setFormData({ ...formData, phan_quyen: e.target.value })}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {!editingUser && (
              <TextField
                fullWidth
                label="Mật Khẩu"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Quyền Hạn</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
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
            {editingUser ? 'Cập Nhật' : 'Tạo Người Dùng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 