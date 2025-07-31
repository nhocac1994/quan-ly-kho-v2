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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
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
  const { state, dispatch } = useInventory();
  const { companyInfo } = state;
  
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
        dispatch({ type: 'UPDATE_COMPANY_INFO', payload: companyData as CompanyInfo });
      } else {
        // Create
        const { id, ...createData } = companyData;
        const newCompany = await dataService.companyInfo.create(createData);
        dispatch({ type: 'ADD_COMPANY_INFO', payload: newCompany });
      }
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
        dispatch({ type: 'DELETE_COMPANY_INFO', payload: companyId });
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Quản Lý Thông Tin Công Ty
        </Typography>

        {/* Thống kê */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Công Ty
              </Typography>
              <Typography variant="h4">
                {companyInfo.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Công Ty Hoạt Động
              </Typography>
              <Typography variant="h4" color="success.main">
                {activeCompanies.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Công Ty Hiển Thị
              </Typography>
              <Typography variant="h4" color="primary.main">
                {companyInfo.filter((c: CompanyInfo) => c.hien_thi === 'Có').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Tìm kiếm công ty..."
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
            Thêm Công Ty
          </Button>
        </Box>
      </Box>

      {/* Bảng công ty */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã CT</TableCell>
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
                .map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>{company.id}</TableCell>
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
        />
      </Paper>

      {/* Dialog thêm/sửa công ty */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCompany ? 'Sửa Thông Tin Công Ty' : 'Thêm Công Ty Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Tên Công Ty"
                value={formData.ten_cong_ty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_cong_ty: e.target.value })}
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
                label="Loại Công Ty"
                value={formData.loai_cong_ty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, loai_cong_ty: e.target.value })}
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
            {editingCompany ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyInfoPage; 