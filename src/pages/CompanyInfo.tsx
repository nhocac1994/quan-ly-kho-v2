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
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useCompanyInfo } from '../hooks/useSupabaseQueries';
import { CompanyInfo } from '../types';


interface CompanyInfoFormData {
  ten_cong_ty: string;
  hien_thi: string;
  ten_day_du: string;
  loai_cong_ty: string;
  logo: string;
  nguoi_dai_dien: string;
  sdt: string;
  tinh_trang: string;
  nv_phu_trach: string;
  ghi_chu: string;
}

const CompanyInfoPage: React.FC = () => {
  const { data: companyInfo = [], refetch: refreshCompanyInfo } = useCompanyInfo();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null);
  const [formData, setFormData] = useState<CompanyInfoFormData>({
    ten_cong_ty: '',
    hien_thi: 'Có',
    ten_day_du: '',
    loai_cong_ty: '',
    logo: '',
    nguoi_dai_dien: '',
    sdt: '',
    tinh_trang: 'Hoạt động',
    nv_phu_trach: '',
    ghi_chu: '',
  });

  const filteredCompanies = useMemo(() => {
    return companyInfo.filter((company: CompanyInfo) =>
      company.ten_cong_ty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.ten_day_du.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.sdt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyInfo, searchTerm]);

  const handleOpenDialog = (company?: CompanyInfo) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        ten_cong_ty: company.ten_cong_ty,
        hien_thi: company.hien_thi,
        ten_day_du: company.ten_day_du,
        loai_cong_ty: company.loai_cong_ty,
        logo: company.logo,
        nguoi_dai_dien: company.nguoi_dai_dien,
        sdt: company.sdt,
        tinh_trang: company.tinh_trang,
        nv_phu_trach: company.nv_phu_trach,
        ghi_chu: company.ghi_chu,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        ten_cong_ty: '',
        hien_thi: 'Có',
        ten_day_du: '',
        loai_cong_ty: '',
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
    setEditingCompany(null);
  };

  const handleSubmit = async () => {
    try {
      const companyData: Omit<CompanyInfo, 'id'> & { id?: string } = {
        id: editingCompany?.id,
        ...formData,
        ngay_tao: editingCompany?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingCompany?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingCompany) {
        // Update
        await dataService.companyInfo.update(companyData.id!, companyData);
      } else {
        // Create
        const { id, ...createData } = companyData;
        await dataService.companyInfo.create(createData);
      }
      await refreshCompanyInfo();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving company info:', error);
      alert('Có lỗi khi lưu thông tin công ty');
    }
  };

  const handleDelete = async (companyId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông tin công ty này?')) {
      try {
        await dataService.companyInfo.delete(companyId);
        await refreshCompanyInfo();
      } catch (error) {
        console.error('Error deleting company info:', error);
        alert('Có lỗi khi xóa thông tin công ty');
      }
    }
  };

  const activeCompanies = useMemo(() => 
    companyInfo.filter((company: CompanyInfo) => company.tinh_trang === 'Hoạt động'), 
    [companyInfo]
  );

    return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden', 
      mx: 'auto' 
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 },
        mt: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <BusinessIcon sx={{ 
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
            Quản Lý Thông Tin Công Ty
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' },
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
              Thêm Công Ty
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-end', sm: 'flex-end' }, 
        mb: { xs: 2, sm: 2 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <Typography variant="body2">
            Tổng: {companyInfo.length}
          </Typography>
          <Typography variant="body2">
            Hoạt động: {activeCompanies.length}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Hiển thị: {companyInfo.filter((c: CompanyInfo) => c.hien_thi === 'Có').length}
          </Typography>
        </Box>
      </Box>

      {/* CompanyInfo Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer sx={{ maxHeight: 600 }}>
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
                  <TableCell>Tên Công Ty</TableCell>
                  <TableCell>Tên Đầy Đủ</TableCell>
                  <TableCell>Loại CT</TableCell>
                  <TableCell>Người Đại Diện</TableCell>
                  <TableCell>Số Điện Thoại</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>NV Phụ Trách</TableCell>
                  <TableCell align="center">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((company, index) => (
                    <TableRow key={company.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>{company.ten_cong_ty}</TableCell>
                      <TableCell>{company.ten_day_du}</TableCell>
                      <TableCell>{company.loai_cong_ty}</TableCell>
                      <TableCell>{company.nguoi_dai_dien}</TableCell>
                      <TableCell>{company.sdt}</TableCell>
                      <TableCell>
                        <Chip
                          label={company.tinh_trang}
                          color={company.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{company.nv_phu_trach}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(company)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(company.id)}
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
            count={filteredCompanies.length}
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
            {filteredCompanies
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((company, index) => (
                <Card key={company.id} sx={{ 
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
                          {company.ten_cong_ty}
                        </Typography>
                      </Box>
                      <Chip
                        label={company.tinh_trang}
                        color={company.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Full Name */}
                    {company.ten_day_du && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Tên đầy đủ: {company.ten_day_du}
                        </Typography>
                      </Box>
                    )}

                    {/* Type */}
                    {company.loai_cong_ty && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Loại: {company.loai_cong_ty}
                        </Typography>
                      </Box>
                    )}

                    {/* Representative */}
                    {company.nguoi_dai_dien && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Đại diện: {company.nguoi_dai_dien}
                        </Typography>
                      </Box>
                    )}

                    {/* Phone */}
                    {company.sdt && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          SĐT: {company.sdt}
                        </Typography>
                      </Box>
                    )}

                    {/* Staff */}
                    {company.nv_phu_trach && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          NV phụ trách: {company.nv_phu_trach}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(company)}
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
                        onClick={() => handleDelete(company.id)}
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
              Trang {page + 1} / {Math.ceil(filteredCompanies.length / rowsPerPage)}
            </Typography>
            <Button
              size="small"
              disabled={page >= Math.ceil(filteredCompanies.length / rowsPerPage) - 1}
              onClick={() => setPage(page + 1)}
              sx={{ fontSize: '0.75rem' }}
            >
              Sau
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Drawer thêm/sửa công ty */}
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
           background: '#667eea',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <BusinessIcon sx={{ fontSize: {xs:'1.5rem',sm:'2rem'}}} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              {editingCompany ? 'Sửa Thông Tin Công Ty' : 'Thêm Công Ty Mới'}
            </Typography>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Tên Công Ty"
                placeholder="Nhập tên công ty"
                value={formData.ten_cong_ty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_cong_ty: e.target.value })}
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
                label="Tên Đầy Đủ"
                placeholder="Nhập tên đầy đủ"
                value={formData.ten_day_du}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_day_du: e.target.value })}
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
                label="Loại Công Ty"
                placeholder="Nhập loại công ty"
                value={formData.loai_cong_ty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, loai_cong_ty: e.target.value })}
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
                label="Logo"
                placeholder="Nhập đường dẫn logo"
                value={formData.logo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logo: e.target.value })}
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
                label="Người Đại Diện"
                placeholder="Nhập tên người đại diện"
                value={formData.nguoi_dai_dien}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
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
                label="Số Điện Thoại"
                placeholder="Nhập số điện thoại"
                value={formData.sdt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sdt: e.target.value })}
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
                <InputLabel>Trạng Thái</InputLabel>
                <Select
                  value={formData.tinh_trang}
                  label="Trạng Thái"
                  onChange={(e) => setFormData({ ...formData, tinh_trang: e.target.value })}
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
                  <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                  <MenuItem value="Tạm ngưng">Tạm ngưng</MenuItem>
                  <MenuItem value="Ngừng hoạt động">Ngừng hoạt động</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="NV Phụ Trách"
                placeholder="Nhập tên nhân viên phụ trách"
                value={formData.nv_phu_trach}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nv_phu_trach: e.target.value })}
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
                <InputLabel>Hiển Thị</InputLabel>
                <Select
                  value={formData.hien_thi}
                  label="Hiển Thị"
                  onChange={(e) => setFormData({ ...formData, hien_thi: e.target.value })}
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
                  <MenuItem value="Có">Có</MenuItem>
                  <MenuItem value="Không">Không</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi Chú"
                placeholder="Nhập ghi chú (nếu có)"
                value={formData.ghi_chu}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ghi_chu: e.target.value })}
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
                  mb:{xs:2,sm:0},
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
                  mb:{xs:2,sm:0},
                  py: 1,
                  background: '#667eea',
                  '&:hover': {
                    background: '#667eea',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                {editingCompany ? 'CẬP NHẬT' : 'THÊM'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CompanyInfoPage; 