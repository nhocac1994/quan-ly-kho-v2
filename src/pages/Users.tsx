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
  Card,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
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
    <Box sx={{ 
      p: { xs: 0, sm: 1, md: 2 }, 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden', 
      mx: 'auto',
      height: '100vh-80px' 
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: { xs: 1, sm: 2 },
        gap: { xs: 1.5, sm: 1 },
        mt: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          <PersonIcon sx={{ 
            fontSize: { xs: 24, sm: 28, md: 32 }, 
            color: 'primary.main' 
          }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }, 
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            Quản Lý Người Dùng
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1.5 }, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              maxWidth: { xs: '100%', sm: 300 },
              height: { xs: '35px', sm: '35px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: '35px', sm: '35px' },
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
              height: { xs: '50px', sm: '35px' },
              px: { xs: 1, sm: 2 },
              py: 1,
              boxShadow: 2,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              width: { xs: '50px', sm: '35px', md: 'auto' },
              minWidth: { xs: '50px', sm: '35px', md: 'auto' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: { xs: 'fixed', sm: 'static' },
              bottom: { xs: 20, sm: 'auto' },
              right: { xs: 10, sm: 'auto' },
              zIndex: { xs: 1000, sm: 'auto' },
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: { xs: 0, lg: '8px' }
              }
            }}
          >
            <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
              Thêm Người Dùng
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-end', sm: 'flex-end' }, 
        mb: { xs: 1, sm: 2 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1.5, sm: 2.5 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
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
        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 295px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#E3F2FD !important', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 1000,
                  '& .MuiTableCell-root': {
                    backgroundColor: '#E3F2FD !important',
                    color: '#000 !important',
                    fontWeight: 'bold'
                  } 
                }}>
                  <TableCell>STT</TableCell>
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
                  .map((user, index) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
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
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user, index) => (
                <Card key={user.id} sx={{ 
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: { xs: 2, sm: 3 },
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main'
                  }
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                        >
                          #{page * rowsPerPage + index + 1}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{ 
                            fontSize: '0.875rem',
                            color: 'primary.main'
                          }}
                        >
                          {user.ho_va_ten}
                        </Typography>
                      </Box>
                      <Chip
                        label={user.phan_quyen}
                        color={user.phan_quyen === 'Admin' ? 'error' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Email */}
                    {user.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Email: {user.email}
                        </Typography>
                      </Box>
                    )}

                    {/* Position */}
                    {user.chuc_vu && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Chức vụ: {user.chuc_vu}
                        </Typography>
                      </Box>
                    )}

                    {/* Permissions */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0 }}>
                      <Chip
                        label={`Xem: ${user.quyen_xem ? 'Có' : 'Không'}`}
                        color={user.quyen_xem ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                      <Chip
                        label={`Thêm: ${user.quyen_them ? 'Có' : 'Không'}`}
                        color={user.quyen_them ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                      <Chip
                        label={`Sửa: ${user.quyen_sua ? 'Có' : 'Không'}`}
                        color={user.quyen_sua ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                      <Chip
                        label={`Xóa: ${user.quyen_xoa ? 'Có' : 'Không'}`}
                        color={user.quyen_xoa ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        sx={{ 
                          p: 0.5,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1rem'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id)}
                        sx={{ 
                          p: 0.5,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1rem'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
          </Box>
          
          {/* Mobile Pagination */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 1, 
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              size="small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              sx={{ fontSize: '0.75rem' }}
            >
              Trước
            </Button>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              Trang {page + 1} / {Math.ceil(filteredUsers.length / rowsPerPage)}
            </Typography>
            <Button
              size="small"
              disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
              onClick={() => setPage(page + 1)}
              sx={{ fontSize: '0.75rem' }}
            >
              Sau
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Drawer thêm/sửa người dùng */}
      <Drawer
        anchor="right"
        open={openDialog}
        onClose={handleCloseDialog}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            boxSizing: 'border-box',
            background: '#f8f9fa',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <PersonIcon sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              {editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
            </Typography>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Họ Và Tên"
                placeholder="Nhập họ và tên"
                value={formData.ho_va_ten}
                onChange={(e) => setFormData({ ...formData, ho_va_ten: e.target.value })}
                sx={{
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
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{
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
              />
              <TextField
                fullWidth
                label="Chức Vụ"
                placeholder="Nhập chức vụ"
                value={formData.chuc_vu}
                onChange={(e) => setFormData({ ...formData, chuc_vu: e.target.value })}
                sx={{
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
              />
              <FormControl fullWidth>
                <InputLabel>Phân Quyền</InputLabel>
                <Select
                  value={formData.phan_quyen}
                  label="Phân Quyền"
                  onChange={(e) => setFormData({ ...formData, phan_quyen: e.target.value })}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
              {!editingUser && (
                <TextField
                  fullWidth
                  label="Mật Khẩu"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  sx={{
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
                />
              )}
              
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Quyền Hạn
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
          </Box>

          {/* Footer Buttons */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                onClick={handleCloseDialog}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  height: '35px',
                  py: 1,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  }
                }}
              >
                HỦY
              </Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  height: '35px',
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                {editingUser ? 'CẬP NHẬT' : 'THÊM'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Users; 