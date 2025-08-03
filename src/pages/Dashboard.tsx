import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useProducts, useSuppliers, useCustomers } from '../hooks/useSupabaseQueries';
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
      icon: <InventoryIcon />,
      color: '#667eea',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: t('suppliers'),
      value: suppliers.length,
      icon: <BusinessIcon />,
      color: '#f093fb',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: t('customers'),
      value: customers.length,
      icon: <PeopleIcon />,
      color: '#4facfe',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: t('total_value'),
      value: `${products.reduce((sum: number, p: any) => sum + p.sl_ton * 1000, 0).toLocaleString()} VNĐ`,
      icon: <TrendingUpIcon />,
      color: '#43e97b',
      bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: '+15%',
      changeType: 'positive'
    },
  ];

  const lowStockProducts = products.filter((p: any) => p.sl_ton < 10).slice(0, 5);
  const outOfStockProducts = products.filter((p: any) => p.sl_ton === 0).length;
  const lowStockCount = products.filter((p: any) => p.sl_ton < 10 && p.sl_ton > 0).length;
  const totalStock = products.reduce((sum: number, p: any) => sum + p.sl_ton, 0);

  return (
    <Box sx={{ 
      p: 3, 
      height: '100%', 
      overflow: 'auto',
      maxWidth: 1280,
      mx: 'auto',
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '&': {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tổng quan hệ thống quản lý kho
        </Typography>
      </Box>



      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {stats.map((stat, index) => (
          <Box key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: stat.bgColor,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)',
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 36, 
                      height: 36,
                      '& .MuiSvgIcon-root': { fontSize: 18, color: 'white' }
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Chip 
                    label={stat.change} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }} 
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Low Stock Products */}
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 32, height: 32 }}>
                  <WarningIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    Sản phẩm sắp hết hàng
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Cần bổ sung gấp
                  </Typography>
                </Box>
              </Box>
              
              {lowStockProducts.length > 0 ? (
                <Box>
                  {lowStockProducts.map((product: any, index: number) => (
                    <Box key={product.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.ten_san_pham}
                        </Typography>
                        <Chip 
                          label={`${product.sl_ton} còn lại`} 
                          size="small" 
                          color={product.sl_ton === 0 ? 'error' : 'warning'}
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((product.sl_ton / 10) * 100, 100)} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: product.sl_ton === 0 ? 'error.main' : 'warning.main',
                          }
                        }} 
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tất cả sản phẩm đều có đủ hàng
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Quick Stats */}
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2, width: 32, height: 32 }}>
                  <InfoIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    Thống kê nhanh
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Tổng quan kho hàng
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.50', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {products.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Loại sản phẩm
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'error.50', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {outOfStockProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Hết hàng
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {lowStockCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Sắp hết hàng
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.50', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {totalStock.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Tổng tồn kho
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Scheduled History */}
      <Box>
        <ScheduledHistory />
      </Box>
    </Box>
  );
};

export default Dashboard; 