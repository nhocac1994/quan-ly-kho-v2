import React, { useState, useMemo, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle,
  Warning,
  CloudUpload,
  TableChart,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useCustomers } from '../hooks/useSupabaseQueries';
import { Customer } from '../types';

import * as XLSX from 'xlsx';

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
  const { data: customers = [], refetch: refreshCustomers } = useCustomers();
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
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

  const handleOpenDrawer = (customer?: Customer) => {
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
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const customerData: Omit<Customer, 'id'> & { id?: string } = {
        id: editingCustomer?.id,
        ...formData,
        ngay_tao: editingCustomer?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingCustomer?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingCustomer) {
        await dataService.customers.update(customerData.id!, customerData);
        setSnackbar({ open: true, message: 'Cập nhật khách hàng thành công!', severity: 'success' });
      } else {
        const { id, ...createData } = customerData;
        await dataService.customers.create(createData);
        setSnackbar({ open: true, message: 'Thêm khách hàng thành công!', severity: 'success' });
      }
      await refreshCustomers();
      handleCloseDrawer();
    } catch (error) {
      console.error('Error saving customer:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi lưu khách hàng', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      setLoading(true);
      try {
        await dataService.customers.delete(customerId);
        await refreshCustomers();
        setSnackbar({ open: true, message: 'Xóa khách hàng thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting customer:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa khách hàng', severity: 'error' });
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
          'Mã KH': 'KH001',
          'Tên KH': 'Công ty XYZ',
          'Tên Đầy Đủ': 'Công ty TNHH XYZ',
          'Loại KH': 'Khách hàng VIP',
          'Logo': 'logo_xyz.png',
          'Người Đại Diện': 'Trần Thị B',
          'Số Điện Thoại': '0987654321',
          'Trạng Thái': 'Hoạt động',
          'NV Phụ Trách': 'NV002',
          'Hiển Thị': 'Có',
          'Ghi Chú': 'Khách hàng thân thiết'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mẫu');
      XLSX.writeFile(wb, 'mau_khach_hang.xlsx');
      
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
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          setSnackbar({ 
            open: true, 
            message: 'File Excel không có dữ liệu', 
            severity: 'error' 
          });
          return;
        }

        // Validate và parse dữ liệu
        const validatedData = jsonData.map((row: any, index: number) => {
          const errors: string[] = [];
          
          // Kiểm tra dữ liệu bắt buộc
          if (!row['Tên KH']) {
            errors.push('Thiếu Tên KH');
          }
          if (!row['Mã KH']) {
            errors.push('Thiếu Mã KH');
          }

          // Kiểm tra Hiển Thị
          const hienThi = row['Hiển Thị'];
          if (hienThi && !['Có', 'Không'].includes(hienThi)) {
            errors.push('Hiển Thị phải là "Có" hoặc "Không"');
          }

          return {
            Ma_KH: row['Mã KH'] || '',
            Ten_KH: row['Tên KH'] || '',
            Ten_Day_Du: row['Tên Đầy Đủ'] || '',
            Loai_KH: row['Loại KH'] || '',
            Logo: row['Logo'] || '',
            Nguoi_Dai_Dien: row['Người Đại Diện'] || '',
            SDT: row['Số Điện Thoại'] || '',
            Tinh_Trang: row['Trạng Thái'] || 'Hoạt động',
            NV_Phu_Trach: row['NV Phụ Trách'] || '',
            Hien_Thi: hienThi || 'Có',
            Ghi_Chu: row['Ghi Chú'] || '',
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedData(validatedData);
        setValidCount(validatedData.filter(item => item.isValid).length);
        setInvalidCount(validatedData.filter(item => !item.isValid).length);
        setImportStep('preview');

      } catch (error) {
        console.error('Error reading Excel file:', error);
        setSnackbar({ 
          open: true, 
          message: 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.', 
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

      // Lấy danh sách khách hàng hiện tại để kiểm tra trùng lặp
      const existingCustomers = await dataService.customers.getAll();
      const existingCustomerNames = new Set(existingCustomers.map(c => c.ten_khach_hang));

      for (const item of parsedData.filter(item => item.isValid)) {
        try {
          const customerData = {
            ten_khach_hang: item.Ten_KH,
            hien_thi: item.Hien_Thi,
            ten_day_du: item.Ten_Day_Du,
            loai_khach_hang: item.Loai_KH,
            logo: item.Logo,
            nguoi_dai_dien: item.Nguoi_Dai_Dien,
            sdt: item.SDT,
            tinh_trang: item.Tinh_Trang,
            nv_phu_trach: item.NV_Phu_Trach,
            ghi_chu: item.Ghi_Chu,
            updated_at: new Date().toISOString(),
          };

          // Kiểm tra khách hàng đã tồn tại
          if (existingCustomerNames.has(customerData.ten_khach_hang)) {
            // Tìm khách hàng hiện tại để update
            const existingCustomer = existingCustomers.find(c => c.ten_khach_hang === customerData.ten_khach_hang);
            if (existingCustomer) {
              // Update khách hàng hiện tại
              await dataService.customers.update(existingCustomer.id, customerData);
              updateCount++;
            } else {
              skipCount++;
            }
          } else {
            // Tạo khách hàng mới
            await dataService.customers.create(customerData);
            successCount++;
          }
        } catch (error) {
          console.error('Error importing customer:', error);
          errorCount++;
        }
      }

      await refreshCustomers();
      
      let message = `Import hoàn tất: ${successCount} khách hàng mới`;
      if (updateCount > 0) message += `, ${updateCount} khách hàng được cập nhật (trùng tên)`;
      if (skipCount > 0) message += `, ${skipCount} khách hàng bị bỏ qua`;
      if (errorCount > 0) message += `, ${errorCount} lỗi`;
      
      setSnackbar({ 
        open: true, 
        message: message, 
        severity: errorCount > 0 ? 'error' : (updateCount > 0 ? 'info' : 'success')
      });
      
      resetImportState();
    } catch (error) {
      console.error('Error importing customers:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi import dữ liệu', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Chức năng xuất Excel
  const handleExportExcel = () => {
    try {
      const data = customers.map(customer => ({
        'Mã KH': customer.id,
        'Tên KH': customer.ten_khach_hang,
        'Tên Đầy Đủ': customer.ten_day_du,
        'Loại KH': customer.loai_khach_hang,
        'Logo': customer.logo,
        'Người Đại Diện': customer.nguoi_dai_dien,
        'Số Điện Thoại': customer.sdt,
        'Trạng Thái': customer.tinh_trang,
        'NV Phụ Trách': customer.nv_phu_trach,
        'Hiển Thị': customer.hien_thi,
        'Ghi Chú': customer.ghi_chu,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khách Hàng');
      XLSX.writeFile(wb, 'danh_sach_khach_hang.xlsx');
      
      setSnackbar({ open: true, message: 'Xuất Excel thành công!', severity: 'success' });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi xuất Excel', severity: 'error' });
    }
  };



  const activeCustomers = useMemo(() => 
    customers.filter((customer: Customer) => customer.tinh_trang === 'Hoạt động'), 
    [customers]
  );

  const inactiveCustomers = useMemo(() => 
    customers.filter((customer: Customer) => customer.tinh_trang !== 'Hoạt động'), 
    [customers]
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', maxWidth: 1280, overflow: 'hidden', mx: 'auto',height: '100vh-80px' }}>
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
          <PeopleIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: 'primary.main' }} />
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
            Quản Lý Khách Hàng
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
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
          
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' }
          }}>
            <Tooltip title="Import Excel">
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setOpenImportDialog(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  height: { xs: '35px', sm: '35px' },
                  px: { xs: 0, sm: 2 },
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  width: { xs: '35px', sm: '35px', md: 'auto' },
                  minWidth: { xs: '35px', sm: '35px', md: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderColor: 'primary.light',
                  },
                  '& .MuiButton-startIcon': {
                    margin: 0,
                    marginRight: { xs: 0, md: '8px' }
                  }
                }}
              >
                <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
                  Import Excel
                </Box>
              </Button>
            </Tooltip>
            
            <Tooltip title="Xuất Excel">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  height: { xs: '35px', sm: '35px' },
                  px: { xs: 0, sm: 2 },
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  width: { xs: '35px', sm: '35px', md: 'auto' },
                  minWidth: { xs: '35px', sm: '35px', md: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    borderColor: 'primary.light',
                  },
                  '& .MuiButton-startIcon': {
                    margin: 0,
                    marginRight: { xs: 0, md: '8px' }
                  }
                }}
              >
                <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
                  Xuất Excel
                </Box>
              </Button>
            </Tooltip>
            
            <Tooltip title="Thêm Khách Hàng">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDrawer()}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  height: { xs: '35px', sm: '35px' },
                  px: { xs: 0, sm: 2 },
                  py: 1,
                  boxShadow: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  width: { xs: '35px', sm: '35px', md: 'auto' },
                  minWidth: { xs: '35px', sm: '35px', md: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)',
                  },
                  '& .MuiButton-startIcon': {
                    margin: 0,
                    marginRight: { xs: 0, md: '8px' }
                  }
                }}
              >
                <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
                  Thêm Khách Hàng
                </Box>
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'space-between', sm: 'flex-end' }, 
        mb: { xs: 1, sm: 2 },
        flexWrap: 'wrap',
        gap: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          justifyContent: { xs: 'space-between', sm: 'flex-start' }
        }}>
          <Typography variant="body2">
            Tổng: {customers.length}
          </Typography>
          <Typography variant="body2">
            Hoạt động: {activeCustomers.length}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Tạm ngưng: {inactiveCustomers.length}
          </Typography>
        </Box>
      </Box>

      {/* Customers Table */}
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
                .map((customer, index) => (
                  <TableRow key={customer.id} hover>
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
                        onClick={() => navigate(`/customers/${customer.ten_khach_hang}`)}
                      >
                        {customer.ten_khach_hang}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.ten_day_du || 'N/A'}</TableCell>
                    <TableCell>{customer.loai_khach_hang || 'N/A'}</TableCell>
                    <TableCell>{customer.nguoi_dai_dien || 'N/A'}</TableCell>
                    <TableCell>{customer.sdt || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.tinh_trang}
                        color={customer.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{customer.nv_phu_trach || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/customers/${customer.ten_khach_hang}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDrawer(customer)}
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
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
          sx={{
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem'
            }
          }}
        />
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {filteredCustomers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer, index) => (
                <Card key={customer.id} sx={{ 
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
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
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontSize: '0.875rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                          onClick={() => navigate(`/customers/${customer.ten_khach_hang}`)}
                        >
                          {customer.ten_khach_hang}
                        </Typography>
                      </Box>
                      <Chip
                        label={customer.tinh_trang}
                        color={customer.tinh_trang === 'Hoạt động' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Full Name */}
                    {customer.ten_day_du && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Tên đầy đủ: {customer.ten_day_du}
                        </Typography>
                      </Box>
                    )}

                    {/* Customer Type */}
                    {customer.loai_khach_hang && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Loại: {customer.loai_khach_hang}
                        </Typography>
                      </Box>
                    )}

                    {/* Representative */}
                    {customer.nguoi_dai_dien && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          Đại diện: {customer.nguoi_dai_dien}
                        </Typography>
                      </Box>
                    )}

                    {/* Phone */}
                    {customer.sdt && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          SĐT: {customer.sdt}
                        </Typography>
                      </Box>
                    )}

                    {/* Staff */}
                    {customer.nv_phu_trach && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          NV phụ trách: {customer.nv_phu_trach}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/customers/${customer.ten_khach_hang}`)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '& .MuiSvgIcon-root': { fontSize: '1rem' }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDrawer(customer)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '& .MuiSvgIcon-root': { fontSize: '1rem' }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(customer.id)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '& .MuiSvgIcon-root': { fontSize: '1rem' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
          </Box>
        </Box>
      </Paper>

      {/* Drawer thêm/sửa khách hàng */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '30%',
            minWidth: 400,
            maxWidth: 500,
          },
        }}
      >
        {/* Header Drawer */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PeopleIcon color="primary" />
          <Typography variant="h6" fontWeight="600">
            {editingCustomer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
          </Typography>
        </Box>

        {/* Form Content */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <TextField
            fullWidth
            label="Tên Khách Hàng"
            value={formData.ten_khach_hang}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_khach_hang: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Tên Đầy Đủ"
            value={formData.ten_day_du}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_day_du: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Loại Khách Hàng"
            value={formData.loai_khach_hang}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, loai_khach_hang: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Logo"
            value={formData.logo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logo: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Người Đại Diện"
            value={formData.nguoi_dai_dien}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nguoi_dai_dien: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Số Điện Thoại"
            value={formData.sdt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sdt: e.target.value })}
            size="small"
          />
          <FormControl fullWidth size="small">
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
            size="small"
          />
          <FormControl fullWidth size="small">
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ghi_chu: e.target.value })}
            size="small"
          />
        </Box>

        {/* Actions */}
        <Box sx={{ 
          p: 2, 
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
            {loading ? 'Đang lưu...' : (editingCustomer ? 'Cập Nhật' : 'Thêm')}
          </Button>
        </Box>
      </Drawer>

      {/* Dialog Import Excel - Tối ưu theo mẫu */}
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
              {importStep === 'upload' ? 'Import Khách Hàng từ Excel' : 'Xem trước dữ liệu'}
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
                  • File Excel phải có các cột: <strong>Mã KH, Tên KH</strong> (bắt buộc)
                </Typography>
                <Typography variant="body2" component="div">
                  • Các cột khác: Tên Đầy Đủ, Loại KH, Logo, Người Đại Diện, Số Điện Thoại, Trạng Thái, NV Phụ Trách, Ghi Chú
                </Typography>
                <Typography variant="body2" component="div">
                  • Hiển Thị phải là "Có" hoặc "Không"
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
                  • Khách hàng có tên trùng sẽ được cập nhật thông tin mới
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

              {file && (
                <Alert severity="success" icon={<CheckCircle />}>
                  Đã chọn file: {file.name}
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Alert severity="success" icon={<CheckCircle />}>
                  {validCount} khách hàng hợp lệ
                </Alert>
                {invalidCount > 0 && (
                  <Alert severity="error" icon={<Warning />}>
                    {invalidCount} khách hàng có lỗi
                  </Alert>
                )}
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã KH</TableCell>
                      <TableCell>Tên KH</TableCell>
                      <TableCell>Tên Đầy Đủ</TableCell>
                      <TableCell>Loại KH</TableCell>
                      <TableCell>Người Đại Diện</TableCell>
                      <TableCell>Số Điện Thoại</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                      <TableCell>Hiển Thị</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.Ma_KH}</TableCell>
                        <TableCell>{item.Ten_KH}</TableCell>
                        <TableCell>{item.Ten_Day_Du}</TableCell>
                        <TableCell>{item.Loai_KH}</TableCell>
                        <TableCell>{item.Nguoi_Dai_Dien}</TableCell>
                        <TableCell>{item.SDT}</TableCell>
                        <TableCell>{item.Tinh_Trang}</TableCell>
                        <TableCell>{item.Hien_Thi}</TableCell>
                        <TableCell>
                          {item.isValid ? (
                            <Alert severity="success" sx={{ py: 0, px: 1 }}>
                              Hợp lệ
                            </Alert>
                          ) : (
                            <Alert severity="error" sx={{ py: 0, px: 1 }}>
                              Lỗi
                            </Alert>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {invalidCount > 0 && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Chi tiết lỗi:</strong>
                  </Typography>
                  {parsedData
                    .filter(item => !item.isValid)
                    .map((item, index) => (
                      <Typography key={index} variant="body2" component="div">
                        • <strong>Dòng {index + 1}:</strong> {item.errors.join(', ')}
                      </Typography>
                    ))}
                </Alert>
              )}
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
              disabled={validCount === 0}
            >
              Import {validCount} khách hàng
            </Button>
          )}
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

export default Customers; 