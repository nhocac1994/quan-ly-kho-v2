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
} from '@mui/icons-material';
import { useSupabase } from '../contexts/SupabaseContext';
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
  const { products, refreshProducts } = useSupabase();
  
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
          'Mã SP': 'SP001',
          'Tên Sản Phẩm': 'Sản phẩm mẫu',
          'Mã Kho': 'KHO001',
          'Tên Kho': 'Kho chính',
          'Đơn Vị': 'Cái',
          'Số Lượng Tồn': 100,
          'Hiển Thị': 'Có',
          'Ghi Chú': 'Sản phẩm mẫu để import'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mẫu');
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
      let errorCount = 0;

      for (const item of parsedData.filter(item => item.isValid)) {
        try {
          const productData: Product = {
            id: Date.now().toString() + Math.random(),
            san_pham_id: item.Ma_San_Pham,
            ten_san_pham: item.Ten_San_Pham,
            kho_id: item.Ma_Kho,
            ten_kho: item.Ten_Kho,
            dvt: item.Dvt,
            sl_ton: item.Sl_Ton,
            hien_thi: item.Hien_Thi,
            ghi_chu: item.Ghi_Chu,
            ngay_tao: new Date().toISOString(),
            nguoi_tao: 'Admin',
            updated_at: new Date().toISOString(),
          };

                  const newProduct = await dataService.products.create(productData);
        refreshProducts();
          successCount++;
        } catch (error) {
          console.error('Error importing product:', error);
          errorCount++;
        }
      }

      setSnackbar({ 
        open: true, 
        message: `Import thành công ${successCount} sản phẩm${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`, 
        severity: errorCount > 0 ? 'error' : 'success' 
      });
      
      resetImportState();
    } catch (error) {
      console.error('Error importing products:', error);
      setSnackbar({ 
        open: true, 
        message: 'Lỗi khi import vào Google Sheets', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };
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

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) =>
      (product.ten_san_pham?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.san_pham_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.ten_kho?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Helper function để tạo mã sản phẩm tự động
  const generateProductId = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const count = products.filter(p => 
      p.san_pham_id?.startsWith(`SP_${month}${day}`)
    ).length + 1;
    return `SP_${month}${day}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenDrawer = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        san_pham_id: product.san_pham_id || '',
        ten_san_pham: product.ten_san_pham || '',
        kho_id: product.kho_id || '',
        ten_kho: product.ten_kho || '',
        dvt: product.dvt || '',
        sl_ton: product.sl_ton || 0,
        hien_thi: product.hien_thi || 'Có',
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
      const productData: Omit<Product, 'id'> & { id?: string } = {
        id: editingProduct?.id,
        ...formData,
        ngay_tao: editingProduct?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingProduct?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        await dataService.products.update(productData.id!, productData);
        refreshProducts();
        setSnackbar({ open: true, message: 'Cập nhật sản phẩm thành công!', severity: 'success' });
      } else {
        const { id, ...createData } = productData;
        const newProduct = await dataService.products.create(createData);
        refreshProducts();
        setSnackbar({ open: true, message: 'Tạo sản phẩm thành công!', severity: 'success' });
      }
      handleCloseDrawer();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({ open: true, message: 'Có lỗi khi lưu sản phẩm', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setLoading(true);
      try {
        await dataService.products.delete(productId);
        refreshProducts();
        setSnackbar({ open: true, message: 'Xóa sản phẩm thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting product:', error);
        setSnackbar({ open: true, message: 'Có lỗi khi xóa sản phẩm', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  // Chức năng xuất Excel
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



  const totalStock = useMemo(() => 
    products.reduce((sum: number, product: Product) => sum + (product.sl_ton || 0), 0), 
    [products]
  );

  const lowStockProducts = useMemo(() => 
    products.filter((product: Product) => (product.sl_ton || 0) < 10), 
    [products]
  );





  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header Section - Tối ưu đơn giản */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Quản Lý Sản Phẩm
            </Typography>
          </Box>
          
          {/* Thống kê ngắn gọn */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Tổng: <strong>{products.length}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tồn: <strong>{totalStock.toLocaleString()}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hết: <strong style={{ color: '#f57c00' }}>{lowStockProducts.length}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Thanh công cụ gọn gàng */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />,
            }}
            size="small"
            sx={{ 
              flexGrow: 1, 
              minWidth: 180,
              maxWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                fontSize: '0.875rem'
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            size="small"
            sx={{ borderRadius: 1, textTransform: 'none', fontSize: '0.875rem' }}
          >
            Nhập Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            size="small"
            sx={{ borderRadius: 1, textTransform: 'none', fontSize: '0.875rem' }}
          >
            Xuất Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDrawer()}
            size="small"
            sx={{ borderRadius: 1, textTransform: 'none', fontSize: '0.875rem' }}
          >
            Thêm Sản Phẩm
          </Button>
        </Box>
      </Box>

      {/* Bảng sản phẩm - Tối ưu chuyên nghiệp */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        mx: 2, 
        mb: 2, 
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Mã SP</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Tên Sản Phẩm</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Kho</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Đơn Vị</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Số Lượng Tồn</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Trạng Thái</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Ghi Chú</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" fontWeight="600" color="primary.main">
                        {product.san_pham_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                        <Typography variant="body2" fontWeight="500">
                          {product.ten_san_pham}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {product.ten_kho || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2">
                        {product.dvt || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="600"
                        color={product.sl_ton && product.sl_ton > 0 ? 'success.main' : 'warning.main'}
                      >
                        {(product.sl_ton || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: product.hien_thi === 'Có' ? 'success.main' : 'text.secondary',
                          fontWeight: 500
                        }}
                      >
                        {product.hien_thi || 'Có'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          maxWidth: 120, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '0.75rem'
                        }}
                      >
                        {product.ghi_chu || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDrawer(product)}
                          sx={{ 
                            color: 'primary.main',
                            p: 0.5,
                            '&:hover': { bgcolor: 'primary.light', color: 'white' }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                          sx={{ 
                            p: 0.5,
                            '&:hover': { bgcolor: 'error.light', color: 'white' }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{ 
            bgcolor: 'background.paper',
            py: 1,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem'
            }
          }}
        />
      </Paper>

      {/* Drawer thêm/sửa sản phẩm - Chuyên nghiệp */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '30%',
            minWidth: 400,
            maxWidth: 500,
            bgcolor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 3, 
            pb: 2, 
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <InventoryIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Tạo Sản Phẩm Mới'}
            </Typography>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Mã Sản Phẩm"
              value={formData.san_pham_id}
              onChange={(e) => setFormData({ ...formData, san_pham_id: e.target.value })}
              disabled={!!editingProduct}
            />
            <TextField
              fullWidth
              size="small"
              label="Tên Sản Phẩm"
              value={formData.ten_san_pham}
              onChange={(e) => setFormData({ ...formData, ten_san_pham: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Mã Kho"
              value={formData.kho_id}
              onChange={(e) => setFormData({ ...formData, kho_id: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Tên Kho"
              value={formData.ten_kho}
              onChange={(e) => setFormData({ ...formData, ten_kho: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Đơn Vị Tính"
              value={formData.dvt}
              onChange={(e) => setFormData({ ...formData, dvt: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Số Lượng Tồn"
              type="number"
              value={formData.sl_ton}
              onChange={(e) => setFormData({ ...formData, sl_ton: parseInt(e.target.value) || 0 })}
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
              size="small"
              multiline
              rows={4}
              label="Ghi Chú"
              value={formData.ghi_chu}
              onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            pt: 3, 
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button 
              onClick={handleCloseDrawer}
              variant="outlined"
              fullWidth
              size="small"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={loading}
              fullWidth
              size="small"
            >
              {loading ? 'Đang lưu...' : (editingProduct ? 'Cập Nhật' : 'Tạo')}
            </Button>
          </Box>
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

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã SP</TableCell>
                      <TableCell>Tên Sản Phẩm</TableCell>
                      <TableCell>Mã Kho</TableCell>
                      <TableCell>Tên Kho</TableCell>
                      <TableCell>Đơn Vị</TableCell>
                      <TableCell align="right">Số Lượng</TableCell>
                      <TableCell>Hiển Thị</TableCell>
                      <TableCell>Ghi Chú</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.Ma_San_Pham}</TableCell>
                        <TableCell>{item.Ten_San_Pham}</TableCell>
                        <TableCell>{item.Ma_Kho}</TableCell>
                        <TableCell>{item.Ten_Kho}</TableCell>
                        <TableCell>{item.Dvt}</TableCell>
                        <TableCell align="right">{item.Sl_Ton}</TableCell>
                        <TableCell>{item.Hien_Thi}</TableCell>
                        <TableCell>{item.Ghi_Chu}</TableCell>
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