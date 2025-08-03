import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomers, useShipmentHeaders } from '../hooks/useSupabaseQueries';
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
  
  const [tabValue, setTabValue] = useState(0);

  // Fetch data using Supabase hooks
  const { data: customers, isLoading: customersLoading, error: customersError } = useCustomers();
  const { data: shipmentHeaders, isLoading: headersLoading } = useShipmentHeaders('outbound');
  
  // Get all shipment items for outbound shipments
  const { data: allShipmentItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['allOutboundShipmentItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_items')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!shipmentHeaders,
  });

  // Find customer by ID
  const customer = useMemo(() => {
    if (!customers || !customerId) return null;
    console.log('Looking for customer with ID:', customerId);
    console.log('All customers:', customers.map((c: any) => ({ id: c.id, ten_khach_hang: c.ten_khach_hang })));
    const found = customers.find((c: any) => c.ten_khach_hang === customerId);
    console.log('Found customer:', found);
    return found;
  }, [customers, customerId]);

  // Filter outbound shipments for this customer (for history tab)
  const outboundShipments = useMemo(() => {
    if (!shipmentHeaders || !allShipmentItems || !customerId) return [];
    
    console.log('Customer ID:', customerId);
    console.log('Customer object:', customer);
    console.log('All shipment headers:', shipmentHeaders);
    console.log('All shipment items:', allShipmentItems);
    
    const filtered = shipmentHeaders.filter(
      (header: any) => {
        const matches = header.customer_name === customerId || 
                       header.customer_id === customer?.id ||
                       header.customer_name === customer?.ten_khach_hang;
        console.log(`Header ${header.id}: customer_name=${header.customer_name}, customer_id=${header.customer_id}, matches=${matches}`);
        return matches;
      }
    );
    
    console.log('Filtered headers:', filtered);
    
    // Convert to OutboundShipment format for history display
    return filtered.map((header: any) => {
      const items = allShipmentItems.filter((item: any) => item.shipment_header_id === header.id);
      console.log(`Items for shipment ${header.id}:`, items);
      const firstItem = items[0];
      
      return {
        id: header.id,
        xuat_kho_id: header.shipment_id,
        ngay_xuat: header.shipment_date,
        ten_san_pham: firstItem?.product_name || 'N/A',
        san_pham_id: firstItem?.product_id || 'N/A',
        sl_xuat: header.total_quantity || 0, // Use header total for history
        ghi_chu: header.content || '',
        so_hd: header.invoice_number || '',
        nguoi_tao: header.created_by || 'N/A',
        ten_khach_hang: header.customer_name
      };
    });
  }, [shipmentHeaders, allShipmentItems, customerId, customer]);

  // Product statistics data (for statistics tab)
  const productStatistics = useMemo(() => {
    if (!shipmentHeaders || !allShipmentItems || !customerId) return [];
    
    const filtered = shipmentHeaders.filter(
      (header: any) => {
        const matches = header.customer_name === customerId || 
                       header.customer_id === customer?.id ||
                       header.customer_name === customer?.ten_khach_hang;
        return matches;
      }
    );
    
    // Get all items for this customer
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
  }, [shipmentHeaders, allShipmentItems, customerId, customer]);

  const loading = customersLoading || headersLoading || itemsLoading;
  const error = customersError?.message || null;

  const calculateTotalOutbound = () => {
    return outboundShipments.reduce((sum: number, shipment: any) => sum + (shipment.sl_xuat || 0), 0);
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
          {productStatistics.length === 0 ? (
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
                          color="error"
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

export default CustomerDetail; 