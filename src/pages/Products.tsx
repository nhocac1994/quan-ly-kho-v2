import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
  Chip,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Close as CloseIcon,
  CheckCircle,
  Warning,
  CloudUpload,
  TableChart,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useProducts, useRefreshProducts, useForceFetchProducts, useRefreshStockFromDatabase } from '../hooks/useSupabaseQueries';
import { Product } from '../types';
import * as XLSX from 'xlsx';


interface ProductFormData {
  san_pham_id: string;
  ten_san_pham: string;
  kho_id: string;
  ten_kho: string;
  dvt: string;
  sl_ton: number;
  hien_thi: string;
  ghi_chu: string;
}

const Products: React.FC = () => {
  const { data: products = [], refetch: refreshProducts } = useProducts();
  const refreshProductsManual = useRefreshProducts();
  const forceFetchProducts = useForceFetchProducts();
  const refreshStockFromDB = useRefreshStockFromDatabase();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  // Không cần state này nữa vì đã sử dụng sl_ton từ database

  const [formData, setFormData] = useState<ProductFormData>({
    san_pham_id: '',
    ten_san_pham: '',
    kho_id: '',
    ten_kho: '',
    dvt: '',
    sl_ton: 0,
    hien_thi: 'Có',
    ghi_chu: '',
  });

  // Không cần load shipment data nữa vì đã sử dụng sl_ton từ database

  // Không cần load shipment data nữa vì đã sử dụng sl_ton từ database

  const generateSampleFile = () => {
    try {
      const templateData = [
        {
          'Mã SP': 'SP001',
          'Tên Sản Phẩm': 'Sản phẩm mẫu',
          'Mã Kho': 'KHO001',
          'Tên Kho': 'Kho chính',
          'Đơn Vị': 'Cái',
          'Số Lượng Tồn': 100,
          'Hiển Thị': 'Có',
          'Ghi Chú': 'Ghi chú mẫu',
        },
        {
          'Mã SP': 'SP002',
          'Tên Sản Phẩm': 'Sản phẩm mẫu 2',
          'Mã Kho': 'KHO002',
          'Tên Kho': 'Kho phụ',
          'Đơn Vị': 'Kg',
          'Số Lượng Tồn': 50,
          'Hiển Thị': 'Có',
          'Ghi Chú': '',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // Mã SP
        { wch: 25 }, // Tên Sản Phẩm
        { wch: 12 }, // Mã Kho
        { wch: 15 }, // Tên Kho
        { wch: 12 }, // Đơn Vị
        { wch: 15 }, // Số Lượng Tồn
        { wch: 10 }, // Hiển Thị
        { wch: 25 }, // Ghi Chú
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'mau_san_pham.xlsx');
      
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
          if (!row['Tên Sản Phẩm']) {
            errors.push('Thiếu Tên Sản Phẩm');
          }
          if (!row['Mã SP']) {
            errors.push('Thiếu Mã SP');
          }

          // Kiểm tra Số Lượng Tồn
          const slTon = parseFloat(row['Số Lượng Tồn']) || 0;
          if (slTon < 0) {
            errors.push('Số Lượng Tồn phải là số dương');
          }

          // Kiểm tra Hiển Thị
          const hienThi = row['Hiển Thị'];
          if (hienThi && !['Có', 'Không'].includes(hienThi)) {
            errors.push('Hiển Thị phải là "Có" hoặc "Không"');
          }

          return {
            Ma_San_Pham: row['Mã SP'] || '',
            Ten_San_Pham: row['Tên Sản Phẩm'] || '',
            Ma_Kho: row['Mã Kho'] || '',
            Ten_Kho: row['Tên Kho'] || '',
            Dvt: row['Đơn Vị'] || '',
            Sl_Ton: slTon,
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

      // Lấy danh sách sản phẩm hiện tại để kiểm tra trùng lặp
      const existingProducts = await dataService.products.getAll();
      const existingProductIds = new Set(existingProducts.map(p => p.san_pham_id));

      for (const item of parsedData.filter(item => item.isValid)) {
        try {
          const productData = {
            san_pham_id: item.Ma_San_Pham,
            ten_san_pham: item.Ten_San_Pham,
            kho_id: item.Ma_Kho,
            ten_kho: item.Ten_Kho,
            dvt: item.Dvt,
            sl_ton: item.Sl_Ton,
            hien_thi: item.Hien_Thi,
            ghi_chu: item.Ghi_Chu,
            updated_at: new Date().toISOString(),
          };

          // Kiểm tra sản phẩm đã tồn tại
          if (existingProductIds.has(productData.san_pham_id)) {
            // Tìm sản phẩm hiện tại để update
            const existingProduct = existingProducts.find(p => p.san_pham_id === productData.san_pham_id);
            if (existingProduct) {
              // Update sản phẩm hiện tại
              await dataService.products.update(existingProduct.id, productData);
              updateCount++;
            } else {
              skipCount++;
            }
          } else {
            // Tạo sản phẩm mới
            await dataService.products.create(productData);
            successCount++;
          }
        } catch (error) {
          console.error('Error importing product:', error);
          errorCount++;
        }
      }

      await refreshProducts();
      
      let message = `Import hoàn tất: ${successCount} sản phẩm mới`;
      if (updateCount > 0) message += `, ${updateCount} sản phẩm được cập nhật (trùng mã)`;
      if (skipCount > 0) message += `, ${skipCount} sản phẩm bị bỏ qua`;
      if (errorCount > 0) message += `, ${errorCount} lỗi`;
      
      setSnackbar({ 
        open: true, 
        message: message, 
        severity: errorCount > 0 ? 'error' : (updateCount > 0 ? 'info' : 'success')
      });
      
      resetImportState();
    } catch (error) {
      console.error('Error during import:', error);
      setSnackbar({ 
        open: true, 
        message: 'Có lỗi khi import dữ liệu', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
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

  const generateProductId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SP${timestamp}${random}`;
  };

  const handleOpenDrawer = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        san_pham_id: product.san_pham_id,
        ten_san_pham: product.ten_san_pham,
        kho_id: product.kho_id,
        ten_kho: product.ten_kho,
        dvt: product.dvt,
        sl_ton: product.sl_ton,
        hien_thi: product.hien_thi,
        ghi_chu: product.ghi_chu || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        san_pham_id: generateProductId(),
        ten_san_pham: '',
        kho_id: '',
        ten_kho: '',
        dvt: '',
        sl_ton: 0,
        hien_thi: 'Có',
        ghi_chu: '',
      });
    }
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editingProduct) {
        // Update existing product
        await dataService.products.update(editingProduct.id, {
          san_pham_id: formData.san_pham_id,
          ten_san_pham: formData.ten_san_pham,
          kho_id: formData.kho_id,
          ten_kho: formData.ten_kho,
          dvt: formData.dvt,
          sl_ton: formData.sl_ton,
          hien_thi: formData.hien_thi,
          ghi_chu: formData.ghi_chu,
        });
        setSnackbar({ open: true, message: 'Cập nhật sản phẩm thành công!', severity: 'success' });
      } else {
        // Create new product
        await dataService.products.create({
          san_pham_id: formData.san_pham_id,
          ten_san_pham: formData.ten_san_pham,
          kho_id: formData.kho_id,
          ten_kho: formData.ten_kho,
          dvt: formData.dvt,
          sl_ton: formData.sl_ton,
          hien_thi: formData.hien_thi,
          ghi_chu: formData.ghi_chu,
          updated_at: new Date().toISOString(),
        });
        setSnackbar({ open: true, message: 'Thêm sản phẩm thành công!', severity: 'success' });
      }
      
      await refreshProducts();
      handleCloseDrawer();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi lưu sản phẩm', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setLoading(true);
      try {
        await dataService.products.delete(productId);
        await refreshProducts();
        setSnackbar({ open: true, message: 'Xóa sản phẩm thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting product:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa sản phẩm', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = products.map(product => ({
        'Mã SP': product.san_pham_id,
        'Tên Sản Phẩm': product.ten_san_pham,
        'Mã Kho': product.kho_id,
        'Tên Kho': product.ten_kho,
        'Đơn Vị': product.dvt,
        'Số Lượng Tồn': product.sl_ton,
        'Hiển Thị': product.hien_thi,
        'Ghi Chú': product.ghi_chu,
        'Ngày Tạo': new Date(product.ngay_tao).toLocaleDateString('vi-VN'),
        'Người Tạo': product.nguoi_tao,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sản Phẩm');
      
      const fileName = `Danh_Sach_San_Pham_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setSnackbar({ open: true, message: 'Xuất Excel thành công!', severity: 'success' });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi xuất Excel', severity: 'error' });
    }
  };

  // Calculate actual stock from products table (đã được tính toán từ database)
  const calculateActualStock = (productId: string) => {
    const product = products.find(p => p.san_pham_id === productId);
    return product ? product.sl_ton : 0;
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.san_pham_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ten_kho.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Pagination
  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%', 
      maxWidth: { xs: '100%', sm: '100%' }, 
      mx: 'auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: { xs: 1, sm: 2, md: 3 },
        gap: 2,
        mt: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InventoryIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: 'primary.main' }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' },
              color: 'primary.main' 
            }}
          >
            Quản Lý Sản Phẩm
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          {/* Search Bar */}
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 200, md: 200 },
              alignSelf: { xs: 'flex-start', sm: 'flex-start' },
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
          
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: { xs: 'flex-end', sm: 'flex-end' },
            flexWrap: 'wrap'
          }}>
          
          <Tooltip title="Cập nhật tồn kho">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
              try {
                setSnackbar({
                  open: true,
                  message: 'Đang cập nhật số lượng tồn kho...',
                  severity: 'info'
                });
                
                // Refresh stock từ database
                await refreshStockFromDB();
                
                // Refresh cache để hiển thị dữ liệu mới
                refreshProductsManual();
                
                setSnackbar({
                  open: true,
                  message: 'Đã cập nhật số lượng tồn kho từ database',
                  severity: 'success'
                });
              } catch (error) {
                console.error('Error refreshing stock:', error);
                setSnackbar({
                  open: true,
                  message: 'Lỗi khi cập nhật số lượng tồn kho',
                  severity: 'error'
                });
              }
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: { xs: '35px', sm: '35px' },
              px: { xs: 0, sm: 2 },
              py: 1,
              borderColor: 'success.main',
              color: 'success.main',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              width: { xs: '35px', sm: '35px', md: 'auto' },
              minWidth: { xs: '35px', sm: '35px', md: 'auto' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: { xs: 0, md: '8px' }
              },
              '&:hover': {
                backgroundColor: 'success.light',
                color: 'white',
                borderColor: 'success.light',
              }
            }}
                      >
            <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
              Cập Nhật Tồn Kho
            </Box>
          </Button>
          </Tooltip>
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
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: { xs: 0, md: '8px' }
              },
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
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
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: { xs: 0, md: '8px' }
              },
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
              }
            }}
          >
            <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
              Xuất Excel
            </Box>
          </Button>
          </Tooltip>
          <Tooltip title="Thêm sản phẩm">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDrawer()}
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
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: { xs: 0, md: '8px' }
              },
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              }
            }}
          >
            <Box sx={{ display: { xs: 'none', lg: 'inline' } }}>
              Thêm Sản Phẩm
            </Box>
          </Button>
          </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 1,
        gap: 2
      }}>
        <Alert severity="info" sx={{ py: 0, px: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Số lượng tồn kho được tính từ: Tổng nhập - Tổng xuất
          </Typography>
        </Alert>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'row', sm: 'row' },
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <Typography variant="body2">
            Tổng: {products.length}
          </Typography>
          <Typography variant="body2">
            Có hàng: {products.filter(p => calculateActualStock(p.san_pham_id) > 0).length}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Hết hàng: {products.filter(p => calculateActualStock(p.san_pham_id) === 0).length}
          </Typography>
        </Box>
      </Box>

            {/* Products Display */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: { xs: '100%', sm: '100%' }
      }}>
        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper sx={{ 
            width: '100%', 
            overflow: 'hidden',
            borderRadius: 2
          }}>
            <TableContainer sx={{ 
              maxHeight: 'calc(100vh - 295px)',
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { md: 1200 }
              }
            }}>
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
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      padding: 2
                    } 
                  }}>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã SP</TableCell>
                    <TableCell>Tên Sản Phẩm</TableCell>
                    <TableCell>Mã Kho</TableCell>
                    <TableCell>Tên Kho</TableCell>
                    <TableCell>Đơn Vị</TableCell>
                    <TableCell align="right">Số Lượng Tồn</TableCell>
                    <TableCell>Hiển Thị</TableCell>
                    <TableCell>Ghi Chú</TableCell>
                    <TableCell align="center">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product, index) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.san_pham_id}
                          color="primary"
                          size="small"
                        />
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
                          onClick={() => navigate(`/products/${product.san_pham_id}`)}
                        >
                          {product.ten_san_pham}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.kho_id}</TableCell>
                      <TableCell>{product.ten_kho}</TableCell>
                      <TableCell>{product.dvt}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={calculateActualStock(product.san_pham_id)}
                          color={calculateActualStock(product.san_pham_id) > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.hien_thi ? 'Có' : 'Không'}
                          color={product.hien_thi ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {product.ghi_chu}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/products/${product.san_pham_id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDrawer(product)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(product.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem'
                },
                '& .MuiTablePagination-select': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Paper>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {paginatedProducts.map((product, index) => (
              <Card key={product.id} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                        {page * rowsPerPage + index + 1}.
                      </Typography>
                      <Chip
                        label={product.san_pham_id}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Chip
                      label={calculateActualStock(product.san_pham_id)}
                      color={calculateActualStock(product.san_pham_id) > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ 
                      cursor: 'pointer',
                      color: 'primary.main',
                      mb: 1,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.dark'
                      }
                    }}
                    onClick={() => navigate(`/products/${product.san_pham_id}`)}
                  >
                    {product.ten_san_pham}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Kho:</Typography>
                      <Typography variant="body2">{product.ten_kho} ({product.kho_id})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Đơn vị:</Typography>
                      <Typography variant="body2">{product.dvt}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Hiển thị:</Typography>
                      <Chip
                        label={product.hien_thi ? 'Có' : 'Không'}
                        color={product.hien_thi ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    {product.ghi_chu && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Ghi chú:</Typography>
                        <Typography variant="body2" sx={{ maxWidth: 150, textAlign: 'right' }}>
                          {product.ghi_chu}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/products/${product.san_pham_id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDrawer(product)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(product.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem'
                },
                '& .MuiTablePagination-select': {
                  fontSize: '0.75rem'
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Add/Edit Product Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 }, 
            p: { xs: 2, sm: 3 } 
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Mã Sản Phẩm"
            value={formData.san_pham_id}
            onChange={(e) => setFormData({ ...formData, san_pham_id: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Tên Sản Phẩm"
            value={formData.ten_san_pham}
            onChange={(e) => setFormData({ ...formData, ten_san_pham: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Mã Kho"
            value={formData.kho_id}
            onChange={(e) => setFormData({ ...formData, kho_id: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Tên Kho"
            value={formData.ten_kho}
            onChange={(e) => setFormData({ ...formData, ten_kho: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Đơn Vị Tính"
            value={formData.dvt}
            onChange={(e) => setFormData({ ...formData, dvt: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Số Lượng Tồn"
            type="number"
            value={formData.sl_ton}
            onChange={(e) => setFormData({ ...formData, sl_ton: parseInt(e.target.value) || 0 })}
            fullWidth
            required
          />
          
          <FormControl fullWidth>
            <InputLabel>Hiển Thị</InputLabel>
            <Select
              value={formData.hien_thi}
              onChange={(e) => setFormData({ ...formData, hien_thi: e.target.value })}
              label="Hiển Thị"
            >
              <MenuItem value="Có">Có</MenuItem>
              <MenuItem value="Không">Không</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Ghi Chú"
            value={formData.ghi_chu}
            onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCloseDrawer}
            fullWidth
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </Box>
      </Drawer>



      {/* Import Excel Dialog */}
      <Dialog 
        open={openImportDialog} 
        onClose={resetImportState} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95%', sm: '90%', md: '80%' },
            maxWidth: '1200px',
            maxHeight: { xs: '90vh', sm: '85vh' }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {importStep === 'upload' ? 'Import Sản Phẩm từ Excel' : 'Xem trước dữ liệu'}
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
                  • File Excel phải có các cột: <strong>Mã Sản Phẩm, Tên Sản Phẩm</strong> (bắt buộc)
                </Typography>
                <Typography variant="body2" component="div">
                  • Các cột khác: Mã Kho, Tên Kho, Đơn Vị Tính, Số Lượng Tồn, Hiển Thị, Ghi Chú
                </Typography>
                <Typography variant="body2" component="div">
                  • Số Lượng Tồn phải là số dương
                </Typography>
                <Typography variant="body2" component="div">
                  • Hiển Thị phải là "Có" hoặc "Không"
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
                  • Sản phẩm có mã trùng sẽ được cập nhật thông tin mới
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
                  {validCount} sản phẩm hợp lệ
                </Alert>
                {invalidCount > 0 && (
                  <Alert severity="error" icon={<Warning />}>
                    {invalidCount} sản phẩm có lỗi
                  </Alert>
                )}
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Mã SP</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Tên Sản Phẩm</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Mã Kho</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Tên Kho</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Đơn Vị</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Số Lượng</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Hiển Thị</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Ghi Chú</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Ma_San_Pham}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Ten_San_Pham}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Ma_Kho}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Ten_Kho}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Dvt}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Sl_Ton}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Hien_Thi}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{item.Ghi_Chu}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                          {item.isValid ? (
                            <Alert severity="success" sx={{ py: 0, px: 1, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                              Hợp lệ
                            </Alert>
                          ) : (
                            <Alert severity="error" sx={{ py: 0, px: 1, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
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

        <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={resetImportState}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Hủy
          </Button>
          {importStep === 'preview' && (
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={validCount === 0}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Import {validCount} sản phẩm
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default Products; 