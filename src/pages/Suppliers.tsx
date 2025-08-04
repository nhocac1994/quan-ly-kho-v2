import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService-supabase-only';
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
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle,
  Warning,
  CloudUpload,
  TableChart,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useSuppliers } from '../hooks/useSupabaseQueries';
import { Supplier } from '../types';

import * as XLSX from 'xlsx';

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
  const { data: suppliers = [], refetch: refreshSuppliers } = useSuppliers();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
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

  const handleOpenDrawer = (supplier?: Supplier) => {
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
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditingSupplier(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const supplierData: Omit<Supplier, 'id'> & { id?: string } = {
        id: editingSupplier?.id,
        ...formData,
        ngay_tao: editingSupplier?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingSupplier?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingSupplier) {
        await dataService.suppliers.update(supplierData.id!, supplierData);
        setSnackbar({ open: true, message: 'Cập nhật nhà cung cấp thành công!', severity: 'success' });
      } else {
        const { id, ...createData } = supplierData;
        await dataService.suppliers.create(createData);
        setSnackbar({ open: true, message: 'Thêm nhà cung cấp thành công!', severity: 'success' });
      }
      await refreshSuppliers();
      handleCloseDrawer();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi lưu nhà cung cấp', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      setLoading(true);
      try {
        await dataService.suppliers.delete(supplierId);
        await refreshSuppliers();
        setSnackbar({ open: true, message: 'Xóa nhà cung cấp thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting supplier:', error);
        setSnackbar({ open: true, message: 'Có lỗi xảy ra khi xóa nhà cung cấp!', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const resetImportState = () => {
    setOpenImportDialog(false);
    setImportStep('upload');
    setFile(null);
    setParsedData([]);
    setValidCount(0);
    setInvalidCount(0);
  };

  const generateSampleFile = () => {
    try {
      const templateData = [
        {
          'Mã NCC': 'NCC001',
          'Tên NCC': 'Công ty ABC',
          'Tên Đầy Đủ': 'Công ty TNHH ABC',
          'Loại NCC': 'Nhà cung cấp chính',
          'Logo': 'logo_abc.png',
          'Người Đại Diện': 'Nguyễn Văn A',
          'Số Điện Thoại': '0123456789',
          'Trạng Thái': 'Hoạt động',
          'NV Phụ Trách': 'NV001',
          'Hiển Thị': 'Có',
          'Ghi Chú': 'Nhà cung cấp uy tín'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mẫu');
      XLSX.writeFile(wb, 'mau_nha_cung_cap.xlsx');
      
      setSnackbar({ open: true, message: 'Tải template thành công!', severity: 'success' });
    } catch (error) {
      console.error('Error downloading template:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi tải template', severity: 'error' });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Kiểm tra định dạng file
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      setSnackbar({ 
        open: true, 
        message: 'Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV', 
        severity: 'error' 
      });
      event.target.value = '';
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setSnackbar({ 
        open: true, 
        message: 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB', 
        severity: 'error' 
      });
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
    parseExcelFile(selectedFile);
    setImportStep('preview');
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setSnackbar({ 
            open: true, 
            message: 'File không có dữ liệu hoặc định dạng không đúng', 
            severity: 'error' 
          });
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        const parsedData = rows.map((row, index) => {
          const item: any = {};
          headers.forEach((header, colIndex) => {
            item[header] = row[colIndex] || '';
          });

          // Validate required fields
          const isValid = item['Tên NCC'] && item['Tên NCC'].toString().trim() !== '';
          
          return {
            ...item,
            isValid,
            rowNumber: index + 2
          };
        });

        setParsedData(parsedData);
        setValidCount(parsedData.filter(item => item.isValid).length);
        setInvalidCount(parsedData.filter(item => !item.isValid).length);

      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setSnackbar({ 
          open: true, 
          message: 'Có lỗi khi đọc file Excel', 
          severity: 'error' 
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      let updateCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      // Lấy danh sách nhà cung cấp hiện tại để kiểm tra trùng lặp
      const existingSuppliers = await dataService.suppliers.getAll();
      const existingSupplierNames = new Set(existingSuppliers.map(s => s.ten_ncc));

      for (const item of parsedData.filter(item => item.isValid)) {
        try {
          const supplierData = {
            ten_ncc: item.Ten_NCC,
            hien_thi: item.Hien_Thi,
            ten_day_du: item.Ten_Day_Du,
            loai_ncc: item.Loai_NCC,
            logo: item.Logo,
            nguoi_dai_dien: item.Nguoi_Dai_Dien,
            sdt: item.SDT,
            tinh_trang: item.Tinh_Trang,
            nv_phu_trach: item.NV_Phu_Trach,
            ghi_chu: item.Ghi_Chu,
            updated_at: new Date().toISOString(),
          };

          // Kiểm tra nhà cung cấp đã tồn tại
          if (existingSupplierNames.has(supplierData.ten_ncc)) {
            // Tìm nhà cung cấp hiện tại để update
            const existingSupplier = existingSuppliers.find(s => s.ten_ncc === supplierData.ten_ncc);
            if (existingSupplier) {
              // Update nhà cung cấp hiện tại
              await dataService.suppliers.update(existingSupplier.id, supplierData);
              updateCount++;
            } else {
              skipCount++;
            }
          } else {
            // Tạo nhà cung cấp mới
            await dataService.suppliers.create(supplierData);
            successCount++;
          }
        } catch (error) {
          console.error('Error importing supplier:', error);
          errorCount++;
        }
      }

      await refreshSuppliers();
      
      let message = `Import hoàn tất: ${successCount} nhà cung cấp mới`;
      if (updateCount > 0) message += `, ${updateCount} nhà cung cấp được cập nhật (trùng tên)`;
      if (skipCount > 0) message += `, ${skipCount} nhà cung cấp bị bỏ qua`;
      if (errorCount > 0) message += `, ${errorCount} lỗi`;
      
      setSnackbar({ 
        open: true, 
        message: message, 
        severity: errorCount > 0 ? 'error' : (updateCount > 0 ? 'info' : 'success')
      });
      
      resetImportState();
    } catch (error) {
      console.error('Error importing suppliers:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi import dữ liệu', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const data = suppliers.map(supplier => ({
        'Mã NCC': supplier.id,
        'Tên NCC': supplier.ten_ncc,
        'Tên Đầy Đủ': supplier.ten_day_du,
        'Loại NCC': supplier.loai_ncc,
        'Logo': supplier.logo,
        'Người Đại Diện': supplier.nguoi_dai_dien,
        'Số Điện Thoại': supplier.sdt,
        'Trạng Thái': supplier.tinh_trang,
        'NV Phụ Trách': supplier.nv_phu_trach,
        'Hiển Thị': supplier.hien_thi,
        'Ghi Chú': supplier.ghi_chu,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Nhà Cung Cấp');
      XLSX.writeFile(wb, 'danh_sach_nha_cung_cap.xlsx');
      
      setSnackbar({ open: true, message: 'Xuất Excel thành công!', severity: 'success' });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi xuất Excel', severity: 'error' });
    }
  };

  const activeSuppliers = useMemo(() => 
    suppliers.filter((supplier: Supplier) => supplier.tinh_trang === 'Hoạt động'), 
    [suppliers]
  );

  const inactiveSuppliers = useMemo(() => 
    suppliers.filter((supplier: Supplier) => supplier.tinh_trang !== 'Hoạt động'), 
    [suppliers]
  );

  return (
    <Box sx={{ p: 3 , width: '100%', maxWidth: 1280, overflow: 'hidden', mx: 'auto',height: '100vh-80px' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600,fontSize: '1.5rem',color: 'primary.main' }}>
            Quản Lý Nhà Cung Cấp
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
                height: '35px',
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
              height: '35px',
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
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: '35px',
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
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDrawer()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: '35px',
              px: 2,
              py: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              }
            }}
          >
            Thêm NCC
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Tổng: {suppliers.length}
          </Typography>
          <Typography variant="body2">
            Hoạt động: {activeSuppliers.length}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Tạm ngưng: {inactiveSuppliers.length}
          </Typography>
        </Box>
      </Box>

      {/* Suppliers Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
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
                .map((supplier, index) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{ 
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.dark'
                          }
                        }}
                        onClick={() => navigate(`/suppliers/${supplier.ten_ncc}`)}
                      >
                        {supplier.ten_ncc}
                      </Typography>
                    </TableCell>
                    <TableCell>{supplier.ten_day_du || 'N/A'}</TableCell>
                    <TableCell>{supplier.loai_ncc || 'N/A'}</TableCell>
                    <TableCell>{supplier.nguoi_dai_dien || 'N/A'}</TableCell>
                    <TableCell>{supplier.sdt || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.tinh_trang}
                        color={supplier.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{supplier.nv_phu_trach || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/suppliers/${supplier.ten_ncc}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDrawer(supplier)}
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
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
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

      {/* Drawer thêm/sửa nhà cung cấp */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              {editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
            </Typography>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Tên Nhà Cung Cấp"
              value={formData.ten_ncc}
              onChange={(e) => setFormData({ ...formData, ten_ncc: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <TextField
              fullWidth
              label="Tên Đầy Đủ"
              value={formData.ten_day_du}
              onChange={(e) => setFormData({ ...formData, ten_day_du: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <TextField
              fullWidth
              label="Loại Nhà Cung Cấp"
              value={formData.loai_ncc}
              onChange={(e) => setFormData({ ...formData, loai_ncc: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <TextField
              fullWidth
              label="Logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <TextField
              fullWidth
              label="Người Đại Diện"
              value={formData.nguoi_dai_dien}
              onChange={(e) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <TextField
              fullWidth
              label="Số Điện Thoại"
              value={formData.sdt}
              onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
              sx={{
                height: '35px',
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={formData.tinh_trang}
                label="Trạng Thái"
                onChange={(e) => setFormData({ ...formData, tinh_trang: e.target.value })}
              >
                <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                <MenuItem value="Tạm ngưng">Tạm ngưng</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="NV Phụ Trách"
              value={formData.nv_phu_trach}
              onChange={(e) => setFormData({ ...formData, nv_phu_trach: e.target.value })}
            />
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
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi Chú"
              value={formData.ghi_chu}
              onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            />
          </Box>

          <Box sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseDrawer}
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : (editingSupplier ? 'Cập Nhật' : 'Thêm')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Import Excel */}
      <Dialog 
        open={openImportDialog} 
        onClose={resetImportState} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 1,
            boxShadow: 2
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {importStep === 'upload' ? 'Import Nhà Cung Cấp từ Excel' : 'Xem trước dữ liệu'}
            </Typography>
            <IconButton onClick={resetImportState}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {importStep === 'upload' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Hướng dẫn:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • File Excel phải có các cột: <strong>Mã NCC, Tên NCC</strong> (bắt buộc)
                </Typography>
                <Typography variant="body2" component="div">
                  • Các cột khác: Tên Đầy Đủ, Loại NCC, Logo, Người Đại Diện, Số Điện Thoại, Trạng Thái, NV Phụ Trách, Ghi Chú
                </Typography>
                <Typography variant="body2" component="div">
                  • Hiển Thị phải là "Có" hoặc "Không"
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
                  • Nhà cung cấp có tên trùng sẽ được cập nhật thông tin mới
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={generateSampleFile}
                >
                  Tải mẫu Excel
                </Button>
                <Typography variant="body2" color="textSecondary">
                  Tải file mẫu để xem định dạng chuẩn
                </Typography>
              </Box>

              <Box sx={{ border: '2px dashed', borderColor: 'primary.main', borderRadius: 2, p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main' }} />
                  <Typography variant="h6">Chọn file Excel</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Kéo thả file hoặc click để chọn
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<TableChart />}
                  >
                    Chọn File
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                  <Typography variant="body2" color="success.main">
                    Hợp lệ: {validCount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="warning.main">
                    Không hợp lệ: {invalidCount}
                  </Typography>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
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
                      <TableCell>Dòng</TableCell>
                      <TableCell>Tên NCC</TableCell>
                      <TableCell>Tên Đầy Đủ</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.slice(0, 10).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.rowNumber}</TableCell>
                        <TableCell>{item.Ten_NCC}</TableCell>
                        <TableCell>{item.Ten_Day_Du}</TableCell>
                        <TableCell>
                          {item.isValid ? (
                            <Chip label="Hợp lệ" color="success" size="small" />
                          ) : (
                            <Chip label="Thiếu tên" color="error" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={resetImportState}>
            Hủy
          </Button>
          {importStep === 'preview' && (
            <Button 
              onClick={handleImport} 
              variant="contained"
              disabled={loading || validCount === 0}
            >
              {loading ? 'Đang import...' : `Import ${validCount} nhà cung cấp`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Suppliers; 