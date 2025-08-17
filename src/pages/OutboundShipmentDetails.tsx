import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService-supabase-only';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useShipmentHeaders, useShipmentItems } from '../hooks/useSupabaseQueries';

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
  
  // Fetch data using Supabase hooks
  const { data: shipmentHeaders, isLoading: headersLoading } = useShipmentHeaders('outbound');
  
  // Lấy thông tin shipment từ shipment headers
  const shipment = useMemo(() => {
    console.log('=== DEBUG SHIPMENT LOOKUP ===');
    console.log('Looking for shipment with ID:', shipmentId);
    console.log('All shipment headers:', shipmentHeaders);
    console.log('Headers count:', shipmentHeaders?.length || 0);
    
    if (!shipmentHeaders || shipmentHeaders.length === 0) {
      console.log('No shipment headers found');
      return null;
    }
    
    const found = shipmentHeaders.find((s: any) => {
      console.log('Checking shipment:', s);
      console.log('s.shipment_id:', s.shipment_id);
      console.log('s.id:', s.id);
      console.log('s.shipment_header_id:', s.shipment_header_id);
      console.log('shipmentId:', shipmentId);
      
      return s.shipment_id === shipmentId || 
             s.id === shipmentId ||
             s.shipment_header_id === shipmentId;
    });
    
    console.log('Found shipment:', found);
    return found;
  }, [shipmentHeaders, shipmentId]);

  // Lấy shipment items dựa trên shipment header ID
  const { data: shipmentItems, isLoading: itemsLoading } = useShipmentItems(shipment?.id || '');
  
  console.log('=== DEBUG SHIPMENT ITEMS ===');
  console.log('Shipment ID for items:', shipment?.id);
  console.log('Shipment items:', shipmentItems);
  console.log('Items loading:', itemsLoading);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState<any>(null);
  const [formData, setFormData] = useState<OutboundDetailFormData>({
    san_pham_id: '',
    ten_san_pham: '',
    so_luong: 0,
    don_gia: 0,
    thanh_tien: 0,
    chat_luong: 'Tốt',
  });

  const shipmentDetails = useMemo(() => 
    shipmentItems || [], 
    [shipmentItems]
  );

  const filteredDetails = useMemo(() => {
    return shipmentDetails.filter((detail: any) =>
      detail.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.product_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.shipment_header_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipmentDetails, searchTerm]);

  const handleOpenDialog = (detail?: any) => {
    if (detail) {
      setEditingDetail(detail);
      setFormData({
        san_pham_id: detail.product_id || '',
        ten_san_pham: detail.product_name || '',
        so_luong: detail.quantity || 0,
        don_gia: detail.unit_price || 0,
        thanh_tien: (detail.quantity || 0) * (detail.unit_price || 0),
        chat_luong: 'Tốt',
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
      if (editingDetail) {
        // Update existing item
        await dataService.shipmentItems.update(editingDetail.id, {
          product_id: formData.san_pham_id,
          product_name: formData.ten_san_pham,
          quantity: formData.so_luong,
          unit_price: formData.don_gia,
          total_price: formData.thanh_tien,
          notes: formData.chat_luong,
        });
      } else {
        // Create new item
        await dataService.shipmentItems.create({
          shipment_header_id: shipment?.id || shipmentId,
          shipment_type: 'outbound',
          product_id: formData.san_pham_id,
          product_name: formData.ten_san_pham,
          quantity: formData.so_luong,
          unit_price: formData.don_gia,
          total_price: formData.thanh_tien,
          notes: formData.chat_luong,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving shipment item:', error);
    }
  };

  const handleDelete = async (detailId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết này?')) {
      try {
        await dataService.shipmentItems.delete(detailId);
      } catch (error) {
        console.error('Error deleting shipment item:', error);
      }
    }
  };

  const handlePrint = () => {
    console.log('=== HANDLE PRINT CALLED ===');
    alert('handlePrint function called!');
    
    if (!shipment) {
      console.log('No shipment data found');
      alert('Không có dữ liệu phiếu xuất kho');
      return;
    }
    
    console.log('=== DEBUG PRINT DATA ===');
    console.log('Shipment:', shipment);
    console.log('Shipment Details:', shipmentDetails);
    console.log('Shipment Keys:', Object.keys(shipment));
    
    // Tạo nội dung in đơn giản
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PHIẾU XUẤT KHO</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 14px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
          .info-row { 
            display: flex; 
            margin-bottom: 10px; 
          }
          .info-label { 
            font-weight: bold; 
            width: 150px; 
          }
          .info-value { 
            flex: 1; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
          }
          .signatures { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 40px; 
          }
          .signature-box { 
            text-align: center; 
            width: 200px; 
          }
          .signature-line { 
            border-top: 1px solid #000; 
            margin-top: 50px; 
            padding-top: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PHIẾU XUẤT KHO</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>Ngày: ${shipment.created_at || shipment.shipment_date ? new Date(shipment.created_at || shipment.shipment_date).toLocaleDateString('vi-VN') : ''}</div>
            <div>Số Phiếu: ${shipment.shipment_id || shipment.id || ''}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="info-row">
            <div class="info-label">Khách hàng:</div>
            <div class="info-value">${shipment.customer_name || shipment.customer_id || ''}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Nội dung:</div>
            <div class="info-value">${shipment.content || ''}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3>Danh sách sản phẩm</h3>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              ${shipmentDetails && shipmentDetails.length > 0 ? 
                shipmentDetails.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.product_name || ''}</td>
                    <td>${item.product_code || item.product_id || ''}</td>
                    <td>${item.quantity || 0}</td>
                  </tr>
                `).join('') : 
                '<tr><td colspan="4">Chưa có sản phẩm nào</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Người Lập Phiếu</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Trưởng Bộ Phận</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Tài Xế</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Người Nhận Hàng</div>
            <div>(Ký, họ tên)</div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('Print content length:', printContent.length);
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.log('Failed to open print window');
        alert('Không thể mở cửa sổ in');
        return;
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      console.log('Print successful');
    } catch (error) {
      console.error('Error printing:', error);
      alert('Lỗi khi in: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (headersLoading || itemsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy phiếu xuất kho</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/outbound-shipments')}
          sx={{ mt: 1 }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  console.log('=== COMPONENT RENDER ===');
  console.log('Shipment:', shipment);
  console.log('Shipment Details:', shipmentDetails);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/outbound-shipments')}>
          <ArrowBackIcon />
        </IconButton>
        <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
          Chi Tiết Phiếu Xuất Kho
        </Typography>
      </Box>

      {/* Shipment Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Phiếu: {shipment.shipment_id || shipment.id}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Ngày xuất:</strong> {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Khách hàng:</strong> {shipment.customer_name || shipment.customer_id || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Nội dung:</strong> {shipment.content || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Người tạo:</strong> {shipment.created_by || 'N/A'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" color="primary">
                  Tổng xuất: {shipment.total_quantity || 0}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Typography variant="body2">
                    <strong>Tổng giá trị:</strong> {shipment.total_amount?.toLocaleString('vi-VN') || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Số sản phẩm:</strong> {shipmentDetails.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Sản Phẩm
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => {
            console.log('=== PRINT BUTTON CLICKED ===');
            alert('Print button clicked!');
            handlePrint();
          }}
        >
          In Phiếu
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            console.log('=== TEST PRINT ===');
            alert('Test print button clicked');
            try {
              const testWindow = window.open('', '_blank');
              if (testWindow) {
                testWindow.document.write(`
                  <html>
                    <head><title>Test Print</title></head>
                    <body>
                      <h1>Test Print - Phiếu Xuất Kho</h1>
                      <p>Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
                      <p>Số phiếu: TEST-001</p>
                      <p>Khách hàng: Test Customer</p>
                      <p>Nội dung: Test Content</p>
                      <table border="1" style="width: 100%;">
                        <tr><th>STT</th><th>Sản phẩm</th><th>Số lượng</th></tr>
                        <tr><td>1</td><td>Test Product</td><td>10</td></tr>
                      </table>
                    </body>
                  </html>
                `);
                testWindow.document.close();
                testWindow.print();
              }
            } catch (error) {
              console.error('Test print error:', error);
              alert('Test print error: ' + error);
            }
          }}
        >
          Test Print
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Items Table */}
      <Paper>
        <TableContainer>
          <Table>
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
                <TableCell>Mã SP</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>ĐVT</TableCell>
                <TableCell align="right">Số Lượng</TableCell>
                <TableCell align="right">Đơn Giá</TableCell>
                <TableCell align="right">Thành Tiền</TableCell>
                <TableCell>Ghi Chú</TableCell>
                <TableCell>Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDetails
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((detail: any, index: number) => (
                  <TableRow key={detail.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Chip label={detail.product_code || detail.product_id || 'N/A'} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {detail.product_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{detail.unit || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={detail.quantity || detail.sl_xuat || 0}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {detail.unit_price || detail.don_gia || 0}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {detail.total_price || (detail.quantity || 0) * (detail.unit_price || 0) || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {detail.notes || detail.ghi_chu || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(detail)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(detail.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
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
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDetail ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Mã Sản Phẩm"
              value={formData.san_pham_id}
              onChange={(e) => setFormData({ ...formData, san_pham_id: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tên Sản Phẩm"
              value={formData.ten_san_pham}
              onChange={(e) => setFormData({ ...formData, ten_san_pham: e.target.value })}
              fullWidth
            />
            <TextField
              label="Số Lượng"
              type="number"
              value={formData.so_luong}
              onChange={(e) => {
                const quantity = parseFloat(e.target.value) || 0;
                setFormData({
                  ...formData,
                  so_luong: quantity,
                  thanh_tien: quantity * formData.don_gia
                });
              }}
              fullWidth
            />
            <TextField
              label="Đơn Giá"
              type="number"
              value={formData.don_gia}
              onChange={(e) => {
                const price = parseFloat(e.target.value) || 0;
                setFormData({
                  ...formData,
                  don_gia: price,
                  thanh_tien: formData.so_luong * price
                });
              }}
              fullWidth
            />
            <TextField
              label="Thành Tiền"
              type="number"
              value={formData.thanh_tien}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Ghi Chú"
              value={formData.chat_luong}
              onChange={(e) => setFormData({ ...formData, chat_luong: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
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