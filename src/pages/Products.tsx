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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { productsAPI } from '../services/googleSheetsService';

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
  const { state, dispatch } = useInventory();
  const { products } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
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

  const handleOpenDialog = (product?: Product) => {
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
        ghi_chu: product.ghi_chu,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        san_pham_id: '',
        ten_san_pham: '',
        kho_id: '',
        ten_kho: '',
        dvt: '',
        sl_ton: 0,
        hien_thi: 'Có',
        ghi_chu: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const productData: Omit<Product, 'id'> = {
        ...formData,
        ngay_tao: editingProduct?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingProduct?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingProduct) {
        const updatedProduct = await productsAPI.update(editingProduct.id, productData);
        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        setSnackbar({ open: true, message: 'Cập nhật sản phẩm thành công!', severity: 'success' });
      } else {
        const newProduct = await productsAPI.create(productData);
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        setSnackbar({ open: true, message: 'Thêm sản phẩm thành công!', severity: 'success' });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi lưu sản phẩm!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setLoading(true);
      try {
        await productsAPI.delete(productId);
        dispatch({ type: 'DELETE_PRODUCT', payload: productId });
        setSnackbar({ open: true, message: 'Xóa sản phẩm thành công!', severity: 'success' });
      } catch (error) {
        console.error('Error deleting product:', error);
        setSnackbar({ open: true, message: 'Có lỗi xảy ra khi xóa sản phẩm!', severity: 'error' });
      } finally {
        setLoading(false);
      }
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản Lý Sản Phẩm
      </Typography>

      {/* Thống kê */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Sản Phẩm
            </Typography>
            <Typography variant="h4">
              {products.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng Tồn Kho
            </Typography>
            <Typography variant="h4">
              {totalStock}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Sản Phẩm Sắp Hết
            </Typography>
            <Typography variant="h4" color="warning.main">
              {lowStockProducts.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Sản Phẩm Hoạt Động
            </Typography>
            <Typography variant="h4" color="success.main">
              {products.filter((p: Product) => p.hien_thi === 'Có').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Thanh tìm kiếm và thêm mới */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Tìm kiếm sản phẩm..."
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
          disabled={loading}
        >
          Thêm Sản Phẩm
        </Button>
      </Box>

      {/* Bảng sản phẩm */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã SP</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>Kho</TableCell>
                <TableCell>Đơn Vị</TableCell>
                <TableCell align="right">Số Lượng Tồn</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>Ghi Chú</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product, index) => (
                  <TableRow key={product.id || `product-${index}`} hover>
                    <TableCell>{product.san_pham_id}</TableCell>
                    <TableCell>{product.ten_san_pham}</TableCell>
                    <TableCell>{product.ten_kho}</TableCell>
                    <TableCell>{product.dvt}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.sl_ton || 0}
                        color={(product.sl_ton || 0) < 10 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.hien_thi}
                        color={product.hien_thi === 'Có' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{product.ghi_chu}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(product.id || `product-${index}`)}
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
          count={filteredProducts.length}
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

      {/* Dialog thêm/sửa sản phẩm */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã Sản Phẩm"
                value={formData.san_pham_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, san_pham_id: e.target.value })}
              />
              <TextField
                fullWidth
                label="Tên Sản Phẩm"
                value={formData.ten_san_pham}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_san_pham: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã Kho"
                value={formData.kho_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, kho_id: e.target.value })}
              />
              <TextField
                fullWidth
                label="Tên Kho"
                value={formData.ten_kho}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_kho: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Đơn Vị Tính"
                value={formData.dvt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dvt: e.target.value })}
              />
              <TextField
                fullWidth
                type="number"
                label="Số Lượng Tồn"
                value={formData.sl_ton}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sl_ton: parseInt(e.target.value) || 0 })}
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
          <Button onClick={handleCloseDialog} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingProduct ? 'Cập Nhật' : 'Thêm'}
          </Button>
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

export default Products; 