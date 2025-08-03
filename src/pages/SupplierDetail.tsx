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
  Divider,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Supplier, InboundShipment } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SupplierDetail: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierId) {
      loadSupplierData();
    }
  }, [supplierId]);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      // Lấy thông tin nhà cung cấp
      const suppliers = await dataService.suppliers.getAll();
      const foundSupplier = suppliers.find(s => s.ten_ncc === supplierId);
      
      if (!foundSupplier) {
        setError('Không tìm thấy nhà cung cấp');
        setLoading(false);
        return;
      }
      
      setSupplier(foundSupplier);

      // Lấy lịch sử nhập kho từ nhà cung cấp này
      const inboundData = await dataService.inboundShipments.getAll();
      const supplierInbound = inboundData.filter(
        shipment => shipment.ten_nha_cung_cap === supplierId
      );
      setInboundShipments(supplierInbound);

    } catch (error) {
      console.error('Error loading supplier data:', error);
      setError('Có lỗi khi tải dữ liệu nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalInbound = () => {
    return inboundShipments.reduce((sum, shipment) => sum + shipment.sl_nhap, 0);
  };

  const calculateTotalValue = () => {
    // Giả sử có trường giá trị, nếu không thì tính theo số lượng
    return inboundShipments.reduce((sum, shipment) => sum + shipment.sl_nhap, 0);
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

  if (error || !supplier) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy nhà cung cấp'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/suppliers')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  const totalInbound = calculateTotalInbound();
  const totalValue = calculateTotalValue();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/suppliers')}>
          <ArrowBackIcon />
        </IconButton>
        <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
          Chi Tiết Nhà Cung Cấp
        </Typography>
      </Box>

      {/* Supplier Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {supplier.ten_ncc}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={supplier.loai_ncc} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Loại nhà cung cấp
                  </Typography>
                </Box>
                {supplier.ten_day_du && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Tên đầy đủ: {supplier.ten_day_du}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Người đại diện: {supplier.nguoi_dai_dien}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    SĐT: {supplier.sdt}
                  </Typography>
                </Box>
                {supplier.ghi_chu && (
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú: {supplier.ghi_chu}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" color="primary">
                    Tổng nhập: {totalInbound}
                  </Typography>
                  <Chip
                    label={supplier.hien_thi ? 'Hiển thị' : 'Ẩn'}
                    color={supplier.hien_thi ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body2">
                      Tổng giá trị: {totalValue.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {inboundShipments.length} phiếu nhập
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {new Set(inboundShipments.map(s => s.san_pham_id)).size} sản phẩm
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      NV phụ trách: {supplier.nv_phu_trach}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="supplier history tabs">
          <Tab label={`Lịch sử nhập kho (${inboundShipments.length})`} />
          <Tab label="Thống kê sản phẩm" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {inboundShipments.length === 0 ? (
            <Alert severity="info">Chưa có lịch sử nhập kho từ nhà cung cấp này</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã phiếu</TableCell>
                    <TableCell>Ngày nhập</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Loại nhập</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell>Người tạo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inboundShipments.map((shipment, index) => (
                    <TableRow key={shipment.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip label={shipment.xuat_kho_id} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16 }} />
                          {new Date(shipment.ngay_nhap).toLocaleDateString('vi-VN')}
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
                      <TableCell>{shipment.loai_nhap}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={shipment.sl_nhap}
                          color="success"
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
          {inboundShipments.length === 0 ? (
            <Alert severity="info">Chưa có dữ liệu thống kê</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mã SP</TableCell>
                    <TableCell align="right">Tổng nhập</TableCell>
                    <TableCell align="right">Số phiếu</TableCell>
                    <TableCell>Lần nhập cuối</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(new Set(inboundShipments.map(s => s.san_pham_id))).map(productId => {
                    const productShipments = inboundShipments.filter(s => s.san_pham_id === productId);
                    const totalQuantity = productShipments.reduce((sum, s) => sum + s.sl_nhap, 0);
                    const lastShipment = productShipments.sort((a, b) => 
                      new Date(b.ngay_nhap).getTime() - new Date(a.ngay_nhap).getTime()
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
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{productShipments.length}</TableCell>
                        <TableCell>
                          {new Date(lastShipment.ngay_nhap).toLocaleDateString('vi-VN')}
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

export default SupplierDetail; 