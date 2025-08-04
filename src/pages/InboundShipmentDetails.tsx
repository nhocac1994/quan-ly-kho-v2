import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useParams, useNavigate } from 'react-router-dom';
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
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
  FileUpload as FileUploadIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { InboundDetail, InboundShipment } from '../types';


interface InboundDetailFormData {
  san_pham_id: string;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  chat_luong: string;
}

const InboundShipmentDetails: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useInventory();
  const { inboundDetails, inboundShipments } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState<InboundDetail | null>(null);
  const [formData, setFormData] = useState<InboundDetailFormData>({
    san_pham_id: '',
    ten_san_pham: '',
    so_luong: 0,
    don_gia: 0,
    thanh_tien: 0,
    chat_luong: 'Tốt',
  });

  // Lấy thông tin shipment và chi tiết
  const shipment = useMemo(() => 
    inboundShipments.find((s: InboundShipment) => s.id === shipmentId), 
    [inboundShipments, shipmentId]
  );

  const shipmentDetails = useMemo(() => 
    inboundDetails.filter((detail: InboundDetail) => detail.xuat_kho_id === shipmentId), 
    [inboundDetails, shipmentId]
  );

  const filteredDetails = useMemo(() => {
    return shipmentDetails.filter((detail: InboundDetail) =>
      detail.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.san_pham_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentDetails, searchTerm]);

  const handleOpenDialog = (detail?: InboundDetail) => {
    if (detail) {
      setEditingDetail(detail);
      setFormData({
        san_pham_id: detail.san_pham_id,
        ten_san_pham: detail.ten_san_pham,
        so_luong: detail.so_luong,
        don_gia: detail.don_gia,
        thanh_tien: detail.thanh_tien,
        chat_luong: detail.chat_luong,
      });
    } else {
      setEditingDetail(null);
      setFormData({
        san_pham_id: '',
        ten_san_pham: '',
        so_luong: 0,
        don_gia: 0,
        thanh_tien: 0,
        chat_luong: 'Tốt',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDetail(null);
  };

  const handleSubmit = async () => {
    try {
      const detailData: InboundDetail = {
        id: editingDetail?.id || Date.now().toString(),
        xuat_kho_id: shipmentId!,
        ...formData,
        ngay_tao: editingDetail?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingDetail?.nguoi_tao || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (editingDetail) {
        await dataService.inboundDetails.update(detailData.id, detailData);
        dispatch({ type: 'UPDATE_INBOUND_DETAIL', payload: detailData });
      } else {
        const newDetail = await dataService.inboundDetails.create(detailData);
        dispatch({ type: 'ADD_INBOUND_DETAIL', payload: newDetail });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inbound detail:', error);
      alert('Có lỗi khi lưu chi tiết nhập kho');
    }
  };

  const handleDelete = async (detailId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết này?')) {
      try {
        await dataService.inboundDetails.delete(detailId);
        dispatch({ type: 'DELETE_INBOUND_DETAIL', payload: detailId });
      } catch (error) {
        console.error('Error deleting inbound detail:', error);
        alert('Có lỗi khi xóa chi tiết nhập kho');
      }
    }
  };

  const handleImportExcel = () => {
    // TODO: Implement Excel import functionality
    alert('Tính năng import Excel sẽ được phát triển sau');
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
    alert('Tính năng in sẽ được phát triển sau');
  };

  const handleCopy = () => {
    // TODO: Implement copy functionality
    alert('Tính năng copy sẽ được phát triển sau');
  };

  const totalQuantity = useMemo(() => 
    shipmentDetails.reduce((sum: number, detail: InboundDetail) => sum + detail.so_luong, 0), 
    [shipmentDetails]
  );

  const totalValue = useMemo(() => 
    shipmentDetails.reduce((sum: number, detail: InboundDetail) => sum + detail.thanh_tien, 0), 
    [shipmentDetails]
  );

  if (!shipment) {
    return (
      <Box sx={{ p: 3 , width: '100%', maxWidth: 1280, overflow: 'hidden', mx: 'auto' }}>
        <Typography variant="h6" color="error">
          Không tìm thấy thông tin phiếu nhập kho
        </Typography>
        <Button onClick={() => navigate('/inbound')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 0, sm: 2, md: 3 }, 
      width: '100%', 
      maxWidth: '100%',
      overflow: 'auto', 
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 1, sm: 3 },
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>

      {/* Header Section */}
      <Box sx={{ 
        bgcolor: 'white',
        p: { xs: 2, sm: 3 },
        mb: { xs: 1, sm: 2 },
        borderRadius: { xs: 0, sm: 2 },
        boxShadow: { xs: 0, sm: 1 },
        border: { xs: '3px solid #1976d2', sm: 'none' },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
          borderRadius: '2px 2px 0 0'
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: { xs: 1, sm: 2 }, 
          mb: { xs: 2, sm: 3 },
          flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 1, sm: 2 } }}>
            <IconButton onClick={() => navigate('/inbound')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Chi Tiết Phiếu Nhập Kho
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: { xs: 'center', sm: 'flex-end' },
            flexWrap: 'wrap',
            mb: { xs: 1, sm: 3 }
          }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/inbound')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Quay lại danh sách
            </Button>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopy}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                borderColor: 'success.main',
                color: 'success.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '&:hover': {
                  backgroundColor: 'success.light',
                  color: 'white',
                  borderColor: 'success.light',
                }
              }}
            >
              Copy Phiếu
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                borderColor: 'primary.main',
                color: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                }
              }}
            >
              In Phiếu Nhập
            </Button>
          </Box>
        </Box>

        {/* Thông tin phiếu nhập */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
          gap: { xs: 1, sm: 2 }, 
          mb: 3 
        }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Nhà Cung Cấp
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {shipment.ten_nha_cung_cap || 'Chưa cập nhật'}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Ngày Nhập
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {new Date(shipment.ngay_nhap).toLocaleDateString('vi-VN')}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Tổng Số Lượng
              </Typography>
              <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {totalQuantity.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Tổng Giá Trị
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {totalValue.toLocaleString('vi-VN')} ₫
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }, 
          mb: 2 
        }}>
          <TextField
            placeholder="Tìm kiếm chi tiết..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                height: { xs: '35px', sm: '35px' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: { xs: 'center', sm: 'flex-end' },
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleImportExcel}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Import Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              In
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Thêm Chi Tiết
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Bảng chi tiết */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: { xs: 0, sm: 2 },
        boxShadow: { xs: 0, sm: 1 },
        overflow: 'hidden',
        mx: { xs: 0, sm: 3 },
        mb: 3
      }}>
        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#E3F2FD !important', 
                  '& .MuiTableCell-root': {
                    backgroundColor: '#E3F2FD !important',
                    color: '#000 !important',
                    fontWeight: 'bold'
                  } 
                }}>
                  <TableCell>STT</TableCell>
                  <TableCell>Tên sản phẩm</TableCell>
                  <TableCell>Mã sản phẩm</TableCell>
                  <TableCell>Đơn vị tính</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Đơn giá</TableCell>
                  <TableCell align="right">Thành tiền</TableCell>
                  <TableCell>Chất lượng</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDetails
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((detail, index) => (
                    <TableRow key={detail.id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon color="primary" />
                          <Typography variant="body2" fontWeight="medium">
                            {detail.ten_san_pham}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{detail.san_pham_id}</TableCell>
                      <TableCell>Cái</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={detail.so_luong}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{detail.don_gia.toLocaleString('vi-VN')} ₫</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${detail.thanh_tien.toLocaleString('vi-VN')} ₫`}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={detail.chat_luong}
                          color={detail.chat_luong === 'Tốt' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(detail)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(detail.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', xl: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {filteredDetails
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((detail, index) => (
                <Card key={detail.id} sx={{ 
                  borderRadius: 2,
                  border: '3px solid #4caf50',
                  backgroundColor: '#f8fff8',
                  '&:hover': {
                    borderColor: '#2e7d32',
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                          {page * rowsPerPage + index + 1}.
                        </Typography>
                        <Chip
                          label={detail.san_pham_id}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Chip
                        label={detail.chat_luong}
                        color={detail.chat_luong === 'Tốt' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ 
                        color: 'primary.main',
                        mb: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {detail.ten_san_pham}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Đơn vị:</Typography>
                        <Typography variant="body2">Cái</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                        <Chip label={detail.so_luong} color="info" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Đơn giá:</Typography>
                        <Typography variant="body2">{detail.don_gia.toLocaleString('vi-VN')} ₫</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Thành tiền:</Typography>
                        <Chip label={`${detail.thanh_tien.toLocaleString('vi-VN')} ₫`} color="success" size="small" />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(detail)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(detail.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredDetails.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Số hàng mỗi trang:"
            />
          </Box>
        </Box>

        {/* Desktop Pagination */}
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDetails.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </Box>
      </Box>

      {/* Dialog thêm/sửa chi tiết */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDetail ? 'Sửa Chi Tiết Nhập Kho' : 'Thêm Chi Tiết Mới'}
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
            </Box>
            <TextField
              fullWidth
              label="Tên Sản Phẩm"
              value={formData.ten_san_pham}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ten_san_pham: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Số Lượng"
                type="number"
                value={formData.so_luong}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const so_luong = parseFloat(e.target.value) || 0;
                  const thanh_tien = so_luong * formData.don_gia;
                  setFormData({ ...formData, so_luong, thanh_tien });
                }}
              />
              <TextField
                fullWidth
                label="Đơn Giá"
                type="number"
                value={formData.don_gia}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const don_gia = parseFloat(e.target.value) || 0;
                  const thanh_tien = formData.so_luong * don_gia;
                  setFormData({ ...formData, don_gia, thanh_tien });
                }}
              />
            </Box>
            <TextField
              fullWidth
              label="Thành Tiền"
              type="number"
              value={formData.thanh_tien}
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Chất Lượng</InputLabel>
              <Select
                value={formData.chat_luong}
                label="Chất Lượng"
                onChange={(e) => setFormData({ ...formData, chat_luong: e.target.value })}
              >
                <MenuItem value="Tốt">Tốt</MenuItem>
                <MenuItem value="Khá">Khá</MenuItem>
                <MenuItem value="Trung bình">Trung bình</MenuItem>
                <MenuItem value="Kém">Kém</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDetail ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InboundShipmentDetails; 