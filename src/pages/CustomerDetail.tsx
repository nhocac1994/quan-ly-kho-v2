import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { Customer, OutboundShipment } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [outboundShipments, setOutboundShipments] = useState<OutboundShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const customers = await dataService.customers.getAll();
      const foundCustomer = customers.find(c => c.ten_khach_hang === customerId);
      
      if (!foundCustomer) {
        setError('Không tìm thấy khách hàng');
        setLoading(false);
        return;
      }
      
      setCustomer(foundCustomer);

      const outboundData = await dataService.outboundShipments.getAll();
      const customerOutbound = outboundData.filter(
        shipment => shipment.ten_khach_hang === customerId
      );
      setOutboundShipments(customerOutbound);

    } catch (error) {
      console.error('Error loading customer data:', error);
      setError('Có lỗi khi tải dữ liệu khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalOutbound = () => {
    return outboundShipments.reduce((sum, shipment) => sum + shipment.sl_xuat, 0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy khách hàng'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  const totalOutbound = calculateTotalOutbound();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}>
          <ArrowBackIcon />
        </IconButton>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
          Chi Tiết Khách Hàng
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {customer.ten_khach_hang}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={customer.loai_khach_hang} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Loại khách hàng
                  </Typography>
                </Box>
                {customer.ten_day_du && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Tên đầy đủ: {customer.ten_day_du}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Người đại diện: {customer.nguoi_dai_dien}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    SĐT: {customer.sdt}
                  </Typography>
                </Box>
                {customer.ghi_chu && (
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú: {customer.ghi_chu}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" color="primary">
                    Tổng xuất: {totalOutbound}
                  </Typography>
                  <Chip
                    label={customer.hien_thi ? 'Hiển thị' : 'Ẩn'}
                    color={customer.hien_thi ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon color="error" />
                    <Typography variant="body2">
                      Tổng giá trị: {totalOutbound.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {outboundShipments.length} phiếu xuất
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {new Set(outboundShipments.map(s => s.san_pham_id)).size} sản phẩm
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      NV phụ trách: {customer.nv_phu_trach}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer history tabs">
          <Tab label={`Lịch sử xuất kho (${outboundShipments.length})`} />
          <Tab label="Thống kê sản phẩm" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {outboundShipments.length === 0 ? (
            <Alert severity="info">Chưa có lịch sử xuất kho cho khách hàng này</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã phiếu</TableCell>
                    <TableCell>Ngày xuất</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Số HĐ</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell>Người tạo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outboundShipments.map((shipment, index) => (
                    <TableRow key={shipment.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip label={shipment.xuat_kho_id} color="secondary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16 }} />
                          {new Date(shipment.ngay_xuat).toLocaleDateString('vi-VN')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {shipment.ten_san_pham}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shipment.san_pham_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {shipment.so_hd && (
                          <Chip label={shipment.so_hd} color="info" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={shipment.sl_xuat}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {shipment.ghi_chu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          {shipment.nguoi_tao}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {outboundShipments.length === 0 ? (
            <Alert severity="info">Chưa có dữ liệu thống kê</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mã SP</TableCell>
                    <TableCell align="right">Tổng xuất</TableCell>
                    <TableCell align="right">Số phiếu</TableCell>
                    <TableCell>Lần xuất cuối</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(new Set(outboundShipments.map(s => s.san_pham_id))).map(productId => {
                    const productShipments = outboundShipments.filter(s => s.san_pham_id === productId);
                    const totalQuantity = productShipments.reduce((sum, s) => sum + s.sl_xuat, 0);
                    const lastShipment = productShipments.sort((a, b) => 
                      new Date(b.ngay_xuat).getTime() - new Date(a.ngay_xuat).getTime()
                    )[0];
                    
                    return (
                      <TableRow key={productId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {lastShipment.ten_san_pham}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={productId} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={totalQuantity}
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{productShipments.length}</TableCell>
                        <TableCell>
                          {new Date(lastShipment.ngay_xuat).toLocaleDateString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CustomerDetail; 