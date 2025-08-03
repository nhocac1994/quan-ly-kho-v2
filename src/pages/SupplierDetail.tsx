import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuppliers, useShipmentHeaders } from '../hooks/useSupabaseQueries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseService';
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
  
  const [tabValue, setTabValue] = useState(0);

  // Fetch data using Supabase hooks
  const { data: suppliers, isLoading: suppliersLoading, error: suppliersError } = useSuppliers();
  const { data: shipmentHeaders, isLoading: headersLoading } = useShipmentHeaders('inbound');
  // Get all shipment items for inbound shipments
  const { data: allShipmentItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['allShipmentItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_items')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!shipmentHeaders,
  });

  // Find supplier by ID
  const supplier = useMemo(() => {
    if (!suppliers || !supplierId) return null;
    return suppliers.find((s: any) => s.ten_ncc === supplierId);
  }, [suppliers, supplierId]);

  // Filter inbound shipments for this supplier (for history tab)
  const inboundShipments = useMemo(() => {
    if (!shipmentHeaders || !allShipmentItems || !supplierId) return [];
    
    console.log('Supplier ID:', supplierId);
    console.log('All shipment headers:', shipmentHeaders);
    console.log('All shipment items:', allShipmentItems);
    
    const filtered = shipmentHeaders.filter(
      (header: any) => header.supplier_name === supplierId
    );
    
    console.log('Filtered headers:', filtered);
    
    // Convert to InboundShipment format for history display
    return filtered.map((header: any) => {
      const items = allShipmentItems.filter((item: any) => item.shipment_header_id === header.id);
      console.log(`Items for shipment ${header.id}:`, items);
      const firstItem = items[0];
      
      return {
        id: header.id,
        xuat_kho_id: header.shipment_id,
        ngay_nhap: header.shipment_date,
        ten_san_pham: firstItem?.product_name || 'N/A',
        san_pham_id: firstItem?.product_id || 'N/A',
        loai_nhap: header.content || 'Nhập kho',
        sl_nhap: header.total_quantity || 0, // Use header total for history
        ghi_chu: header.content || '',
        nguoi_tao: header.created_by || 'N/A',
        ten_nha_cung_cap: header.supplier_name
      };
    });
  }, [shipmentHeaders, allShipmentItems, supplierId]);

  // Product statistics data (for statistics tab)
  const productStatistics = useMemo(() => {
    if (!shipmentHeaders || !allShipmentItems || !supplierId) return [];
    
    const filtered = shipmentHeaders.filter(
      (header: any) => header.supplier_name === supplierId
    );
    
    // Get all items for this supplier
    const allItems: any[] = [];
    filtered.forEach((header: any) => {
      const items = allShipmentItems.filter((item: any) => item.shipment_header_id === header.id);
      items.forEach((item: any) => {
        allItems.push({
          product_id: item.product_id,
          product_code: item.product_code, // Add product_code if available
          product_name: item.product_name,
          quantity: item.quantity || 0,
          shipment_date: header.shipment_date,
          shipment_id: header.id
        });
      });
    });
    
    // Group by product and calculate statistics
    const productMap = new Map();
    allItems.forEach((item: any) => {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          total_quantity: 0,
          shipment_count: new Set(),
          last_shipment_date: item.shipment_date
        });
      }
      
      const product = productMap.get(item.product_id);
      product.total_quantity += item.quantity;
      product.shipment_count.add(item.shipment_id);
      
      if (new Date(item.shipment_date) > new Date(product.last_shipment_date)) {
        product.last_shipment_date = item.shipment_date;
      }
    });
    
    return Array.from(productMap.values()).map((product: any) => ({
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      total_quantity: product.total_quantity,
      shipment_count: product.shipment_count.size,
      last_shipment_date: product.last_shipment_date
    }));
  }, [shipmentHeaders, allShipmentItems, supplierId]);

  const loading = suppliersLoading || headersLoading || itemsLoading;
  const error = suppliersError?.message || null;

  const calculateTotalInbound = () => {
    return inboundShipments.reduce((sum: number, shipment: any) => sum + (shipment.sl_nhap || 0), 0);
  };

  const calculateTotalValue = () => {
    // Giả sử có trường giá trị, nếu không thì tính theo số lượng
    return inboundShipments.reduce((sum: number, shipment: any) => sum + (shipment.sl_nhap || 0), 0);
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
          {productStatistics.length === 0 ? (
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
                  {productStatistics.map((product: any) => (
                    <TableRow key={product.product_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {product.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.product_code || product.product_id?.substring(0, 8) || 'N/A'} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={product.total_quantity}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{product.shipment_count}</TableCell>
                      <TableCell>
                        {new Date(product.last_shipment_date).toLocaleDateString('vi-VN')}
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

export default SupplierDetail; 