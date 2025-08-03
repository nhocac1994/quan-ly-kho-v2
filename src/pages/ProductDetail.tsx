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
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { Product, InboundShipment, OutboundShipment } from '../types';

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

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>([]);
  const [outboundShipments, setOutboundShipments] = useState<OutboundShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      // Lấy thông tin sản phẩm
      const products = await dataService.products.getAll();
      const foundProduct = products.find(p => p.san_pham_id === productId);
      
      if (!foundProduct) {
        setError('Không tìm thấy sản phẩm');
        setLoading(false);
        return;
      }
      
      setProduct(foundProduct);

      // Lấy lịch sử nhập kho
      const inboundData = await dataService.inboundShipments.getAll();
      const productInbound = inboundData.filter(
        shipment => shipment.san_pham_id === productId
      );
      setInboundShipments(productInbound);

      // Lấy lịch sử xuất kho
      const outboundData = await dataService.outboundShipments.getAll();
      const productOutbound = outboundData.filter(
        shipment => shipment.san_pham_id === productId
      );
      setOutboundShipments(productOutbound);

    } catch (error) {
      console.error('Error loading product data:', error);
      setError('Có lỗi khi tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const calculateStock = () => {
    const totalInbound = inboundShipments.reduce((sum, shipment) => sum + shipment.sl_nhap, 0);
    const totalOutbound = outboundShipments.reduce((sum, shipment) => sum + shipment.sl_xuat, 0);
    return totalInbound - totalOutbound;
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

  if (error || !product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy sản phẩm'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  const currentStock = calculateStock();
  const totalInbound = inboundShipments.reduce((sum, shipment) => sum + shipment.sl_nhap, 0);
  const totalOutbound = outboundShipments.reduce((sum, shipment) => sum + shipment.sl_xuat, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/products')}>
          <ArrowBackIcon />
        </IconButton>
        <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
          Chi Tiết Sản Phẩm
        </Typography>
      </Box>

      {/* Product Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {product.ten_san_pham}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={product.san_pham_id} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Mã sản phẩm
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Kho: {product.ten_kho} ({product.kho_id})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Đơn vị: {product.dvt}
                  </Typography>
                </Box>
                {product.ghi_chu && (
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú: {product.ghi_chu}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" color="primary">
                    Tồn kho: {currentStock}
                  </Typography>
                  <Chip
                    label={product.hien_thi ? 'Hiển thị' : 'Ẩn'}
                    color={product.hien_thi ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body2">
                      Tổng nhập: {totalInbound}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon color="error" />
                    <Typography variant="body2">
                      Tổng xuất: {totalOutbound}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {inboundShipments.length} phiếu nhập
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {outboundShipments.length} phiếu xuất
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
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product history tabs">
          <Tab label={`Lịch sử nhập kho (${inboundShipments.length})`} />
          <Tab label={`Lịch sử xuất kho (${outboundShipments.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {inboundShipments.length === 0 ? (
            <Alert severity="info">Chưa có lịch sử nhập kho cho sản phẩm này</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã phiếu</TableCell>
                    <TableCell>Ngày nhập</TableCell>
                    <TableCell>Loại nhập</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell>Nhà cung cấp</TableCell>
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
                      <TableCell>{shipment.loai_nhap}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={shipment.sl_nhap}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{shipment.ten_nha_cung_cap}</TableCell>
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
            <Alert severity="info">Chưa có lịch sử xuất kho cho sản phẩm này</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Mã phiếu</TableCell>
                    <TableCell>Ngày xuất</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell>Số HĐ</TableCell>
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
                      <TableCell align="right">
                        <Chip
                          label={shipment.sl_xuat}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{shipment.ten_khach_hang}</TableCell>
                      <TableCell>{shipment.so_hd}</TableCell>
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
      </Paper>
    </Box>
  );
};

export default ProductDetail; 