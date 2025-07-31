import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { useSupabase } from '../contexts/SupabaseContext';

const SupabaseRealtimeStatus: React.FC = () => {
  const { realtimeStatus, errors } = useSupabase();

  const tables = [
    { key: 'products', label: 'Sản phẩm' },
    { key: 'suppliers', label: 'Nhà cung cấp' },
    { key: 'customers', label: 'Khách hàng' },
    { key: 'inboundShipments', label: 'Nhập kho' },
    { key: 'outboundShipments', label: 'Xuất kho' },
    { key: 'companyInfo', label: 'Thông tin công ty' },
    { key: 'users', label: 'Người dùng' }
  ] as const;

  const getStatusIcon = (isConnected: boolean, hasError: boolean) => {
    if (hasError) return <Error />;
    if (isConnected) return <CheckCircle />;
    return <WifiOff />;
  };

  const getStatusColor = (isConnected: boolean, hasError: boolean) => {
    if (hasError) return 'error';
    if (isConnected) return 'success';
    return 'warning';
  };

  const getStatusText = (isConnected: boolean, hasError: boolean) => {
    if (hasError) return 'Lỗi';
    if (isConnected) return 'Kết nối';
    return 'Ngắt kết nối';
  };

  const hasAnyError = Object.values(errors).some(error => error !== null);
  const isAllConnected = Object.values(realtimeStatus).every(status => status);

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Wifi sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Trạng thái Supabase Realtime
          </Typography>
        </Box>

        {/* Overall Status */}
        <Box mb={2}>
          <Alert 
            severity={hasAnyError ? 'error' : isAllConnected ? 'success' : 'warning'}
            icon={hasAnyError ? <Error /> : isAllConnected ? <CheckCircle /> : <Warning />}
          >
            {hasAnyError 
              ? 'Có lỗi kết nối với Supabase' 
              : isAllConnected 
                ? 'Tất cả bảng đã kết nối realtime thành công' 
                : 'Đang kết nối realtime...'
            }
          </Alert>
        </Box>

        {/* Table Status Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
          {tables.map(({ key, label }) => {
            const isConnected = realtimeStatus[key as keyof typeof realtimeStatus];
            const hasError = errors[key as keyof typeof errors] !== null;
            
            return (
              <Box key={key}
                sx={{ 
                  p: 1, 
                  border: 1, 
                  borderColor: getStatusColor(isConnected, hasError) + '.main',
                  borderRadius: 1,
                  bgcolor: getStatusColor(isConnected, hasError) + '.light',
                  opacity: 0.8
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" fontWeight="medium">
                    {label}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(isConnected, hasError)}
                    label={getStatusText(isConnected, hasError)}
                    color={getStatusColor(isConnected, hasError) as any}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {hasError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors[key as keyof typeof errors]}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Connection Info */}
        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            <strong>Thông tin kết nối:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Realtime subscriptions: {Object.values(realtimeStatus).filter(Boolean).length}/{tables.length}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            • Lỗi kết nối: {Object.values(errors).filter(Boolean).length}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            • Trạng thái: {hasAnyError ? 'Có lỗi' : isAllConnected ? 'Hoạt động bình thường' : 'Đang kết nối'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SupabaseRealtimeStatus; 