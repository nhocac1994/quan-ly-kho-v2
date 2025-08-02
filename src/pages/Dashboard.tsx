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
import { useProducts, useSuppliers, useCustomers } from '../hooks/useSupabaseQueries';
import RealtimeStatus from '../components/RealtimeStatus';
import ScheduledHistory from '../components/ScheduledHistory';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: customers = [] } = useCustomers();
  const { t } = useLanguage();

  const stats = [
    {
      title: t('total_products'),
      value: products.length,
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: t('suppliers'),
      value: suppliers.length,
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
    {
      title: t('customers'),
      value: customers.length,
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    },
    {
      title: t('total_value'),
      value: `${products.reduce((sum: number, p: any) => sum + p.sl_ton * 1000, 0).toLocaleString()} VNĐ`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('dashboard')}
      </Typography>
      
      <RealtimeStatus />
      
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
            {t('low_stock_products')}
          </Typography>
          <Box>
            {products
              .filter((p: any) => p.sl_ton < 10)
              .slice(0, 5)
              .map((product: any) => (
                <Box key={product.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    {product.ten_san_pham} - {t('remaining')}: {product.sl_ton}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Paper>
        
        <Paper sx={{ p: 2, flex: '1 1 400px' }}>
          <Typography variant="h6" gutterBottom>
            {t('quick_stats')}
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • {t('total_product_types')}: {products.length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • {t('out_of_stock')}: {products.filter((p: any) => p.sl_ton === 0).length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • {t('low_stock')}: {products.filter((p: any) => p.sl_ton < 10 && p.sl_ton > 0).length}
            </Typography>
          </Box>
        </Paper>

        <ScheduledHistory />
      </Box>
    </Box>
  );
};

export default Dashboard; 