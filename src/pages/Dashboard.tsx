import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useProducts, useSuppliers, useCustomers } from '../hooks/useInventoryQueries';

const Dashboard: React.FC = () => {
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: customers = [] } = useCustomers();

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: products.length,
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Nhà cung cấp',
      value: suppliers.length,
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
    {
      title: 'Khách hàng',
      value: customers.length,
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    },
    {
      title: 'Tổng giá trị',
      value: `${products.reduce((sum: number, p: any) => sum + p.sl_ton * 1000, 0).toLocaleString()} VNĐ`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {stats.map((stat, index) => (
          <Card key={index} sx={{ minWidth: 250, flex: '1 1 250px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                {stat.icon}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Paper sx={{ p: 2, flex: '1 1 400px' }}>
          <Typography variant="h6" gutterBottom>
            Sản phẩm gần hết hàng
          </Typography>
          <Box>
            {products
              .filter((p: any) => p.sl_ton < 10)
              .slice(0, 5)
              .map((product: any) => (
                <Box key={product.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    {product.ten_san_pham} - Còn lại: {product.sl_ton}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Paper>
        
        <Paper sx={{ p: 2, flex: '1 1 400px' }}>
          <Typography variant="h6" gutterBottom>
            Thống kê nhanh
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Tổng số loại sản phẩm: {products.length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Sản phẩm hết hàng: {products.filter((p: any) => p.sl_ton === 0).length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Sản phẩm sắp hết: {products.filter((p: any) => p.sl_ton < 10 && p.sl_ton > 0).length}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 