import React, { useState, useMemo } from 'react';
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
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { OutboundDetail, OutboundShipment } from '../types';
import { outboundDetailsAPI } from '../services/googleSheetsService';

interface OutboundDetailFormData {
  san_pham_id: string;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  chat_luong: string;
}

const OutboundShipmentDetails: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useInventory();
  const { outboundDetails, outboundShipments } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState<OutboundDetail | null>(null);
  const [formData, setFormData] = useState<OutboundDetailFormData>({
    san_pham_id: '',
    ten_san_pham: '',
    so_luong: 0,
    don_gia: 0,
    thanh_tien: 0,
    chat_luong: 'Tốt',
  });

  // Lấy thông tin shipment và chi tiết
  const shipment = useMemo(() => 
    outboundShipments.find((s: OutboundShipment) => s.id === shipmentId), 
    [outboundShipments, shipmentId]
  );

  const shipmentDetails = useMemo(() => 
    outboundDetails.filter((detail: OutboundDetail) => detail.xuat_kho_id === shipmentId), 
    [outboundDetails, shipmentId]
  );

  const filteredDetails = useMemo(() => {
    return shipmentDetails.filter((detail: OutboundDetail) =>
      detail.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.san_pham_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentDetails, searchTerm]);

  const handleOpenDialog = (detail?: OutboundDetail) => {
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
      const detailData: OutboundDetail = {
        id: editingDetail?.id || Date.now().toString(),
        xuat_kho_id: shipmentId!,
        ...formData,
        ngay_tao: editingDetail?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingDetail?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingDetail) {
        await outboundDetailsAPI.update(detailData.id, detailData);
        dispatch({ type: 'UPDATE_OUTBOUND_DETAIL', payload: detailData });
      } else {
        const newDetail = await outboundDetailsAPI.create(detailData);
        dispatch({ type: 'ADD_OUTBOUND_DETAIL', payload: newDetail });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving outbound detail:', error);
      alert('Có lỗi khi lưu chi tiết xuất kho');
    }
  };

  const handleDelete = async (detailId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết này?')) {
      try {
        await outboundDetailsAPI.delete(detailId);
        dispatch({ type: 'DELETE_OUTBOUND_DETAIL', payload: detailId });
      } catch (error) {
        console.error('Error deleting outbound detail:', error);
        alert('Có lỗi khi xóa chi tiết xuất kho');
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

  const totalQuantity = useMemo(() => 
    shipmentDetails.reduce((sum: number, detail: OutboundDetail) => sum + detail.so_luong, 0), 
    [shipmentDetails]
  );

  const totalValue = useMemo(() => 
    shipmentDetails.reduce((sum: number, detail: OutboundDetail) => sum + detail.thanh_tien, 0), 
    [shipmentDetails]
  );

  if (!shipment) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Không tìm thấy thông tin phiếu xuất kho
        </Typography>
        <Button onClick={() => navigate('/outbound')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate('/outbound')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Chi Tiết Phiếu Xuất Kho: {shipment.id}
          </Typography>
        </Box>

        {/* Thông tin phiếu xuất */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Khách Hàng
              </Typography>
              <Typography variant="h6">
                {shipment.Ten_Khach_Hang}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ngày Xuất
              </Typography>
              <Typography variant="h6">
                {new Date(shipment.ngay_xuat).toLocaleDateString('vi-VN')}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Số Lượng
              </Typography>
              <Typography variant="h6" color="error.main">
                {totalQuantity}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Giá Trị
              </Typography>
              <Typography variant="h6" color="primary.main">
                {totalValue.toLocaleString('vi-VN')} ₫
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Tìm kiếm chi tiết..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportExcel}
          >
            Import Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            In
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm Chi Tiết
          </Button>
        </Box>
      </Box>

      {/* Bảng chi tiết */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
        <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Mã CT</TableCell>
                <TableCell>Mã SP</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell align="right">Số Lượng</TableCell>
                <TableCell align="right">Đơn Giá</TableCell>
                <TableCell align="right">Thành Tiền</TableCell>
                <TableCell>Chất Lượng</TableCell>
                <TableCell>Ngày Tạo</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDetails
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((detail) => (
                  <TableRow key={detail.id} hover>
                    <TableCell>{detail.id}</TableCell>
                    <TableCell>{detail.san_pham_id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {detail.ten_san_pham}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={detail.so_luong}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {detail.don_gia.toLocaleString('vi-VN')} ₫
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${detail.thanh_tien.toLocaleString('vi-VN')} ₫`}
                        color="error"
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
                    <TableCell>{new Date(detail.ngay_tao).toLocaleDateString('vi-VN')}</TableCell>
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
      </Paper>

      {/* Dialog thêm/sửa chi tiết */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDetail ? 'Sửa Chi Tiết Xuất Kho' : 'Thêm Chi Tiết Mới'}
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

export default OutboundShipmentDetails; 