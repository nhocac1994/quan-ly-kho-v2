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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { InboundDetail } from '../types';
import { inboundDetailsAPI } from '../services/googleSheetsService';

interface InboundDetailFormData {
  xuat_kho_id: string;
  san_pham_id: string;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  chat_luong: string;
}

const InboundDetails: React.FC = () => {
  const { state, dispatch } = useInventory();
  const { inboundDetails } = state;
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState<InboundDetail | null>(null);
  const [formData, setFormData] = useState<InboundDetailFormData>({
    xuat_kho_id: '',
    san_pham_id: '',
    ten_san_pham: '',
    so_luong: 0,
    don_gia: 0,
    thanh_tien: 0,
    chat_luong: 'Tốt',
  });

  const filteredDetails = useMemo(() => {
    return inboundDetails.filter((detail: InboundDetail) =>
      detail.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.san_pham_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inboundDetails, searchTerm]);

  const handleOpenDialog = (detail?: InboundDetail) => {
    if (detail) {
      setEditingDetail(detail);
      setFormData({
        xuat_kho_id: detail.xuat_kho_id,
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
        xuat_kho_id: '',
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
        ...formData,
        ngay_tao: editingDetail?.ngay_tao || new Date().toISOString(),
        nguoi_tao: editingDetail?.nguoi_tao || 'Admin',
        update: new Date().toISOString(),
      };

      if (editingDetail) {
        await inboundDetailsAPI.update(detailData.id, detailData);
        dispatch({ type: 'UPDATE_INBOUND_DETAIL', payload: detailData });
      } else {
        const newDetail = await inboundDetailsAPI.create(detailData);
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
        await inboundDetailsAPI.delete(detailId);
        dispatch({ type: 'DELETE_INBOUND_DETAIL', payload: detailId });
      } catch (error) {
        console.error('Error deleting inbound detail:', error);
        alert('Có lỗi khi xóa chi tiết nhập kho');
      }
    }
  };

  const totalQuantity = useMemo(() => 
    inboundDetails.reduce((sum: number, detail: InboundDetail) => sum + detail.so_luong, 0), 
    [inboundDetails]
  );

  const totalValue = useMemo(() => 
    inboundDetails.reduce((sum: number, detail: InboundDetail) => sum + detail.thanh_tien, 0), 
    [inboundDetails]
  );

  const todayDetails = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return inboundDetails.filter((detail: InboundDetail) => 
      detail.ngay_tao.startsWith(today)
    );
  }, [inboundDetails]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Chi Tiết Nhập Kho
        </Typography>

        {/* Thống kê */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Chi Tiết
              </Typography>
              <Typography variant="h4">
                {inboundDetails.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Số Lượng
              </Typography>
              <Typography variant="h4" color="success.main">
                {totalQuantity}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Giá Trị
              </Typography>
              <Typography variant="h4" color="primary.main">
                {totalValue.toLocaleString('vi-VN')} ₫
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Hôm Nay
              </Typography>
              <Typography variant="h4" color="info.main">
                {todayDetails.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Thanh tìm kiếm và thêm mới */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Tìm kiếm chi tiết nhập kho..."
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
                <TableCell>Mã NK</TableCell>
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
                    <TableCell>{detail.xuat_kho_id}</TableCell>
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
          {editingDetail ? 'Sửa Chi Tiết Nhập Kho' : 'Thêm Chi Tiết Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã Nhập Kho"
                value={formData.xuat_kho_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, xuat_kho_id: e.target.value })}
              />
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

export default InboundDetails; 