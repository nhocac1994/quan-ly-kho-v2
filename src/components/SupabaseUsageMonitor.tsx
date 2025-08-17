import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabaseService';

interface UsageData {
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  bandwidth: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    used: number;
    total: number;
    percentage: number;
  };
  lastUpdated: string;
}

const SupabaseUsageMonitor: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Giới hạn gói free Supabase (theo tháng)
  const FREE_LIMITS = {
    storage: 500 * 1024 * 1024 * 1024, // 500MB
    bandwidth: 2 * 1024 * 1024 * 1024, // 2GB
    requests: 50000, // 50,000 requests
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN');
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return '#f44336'; // Red
    if (percentage >= 75) return '#ff9800'; // Orange
    if (percentage >= 50) return '#ffc107'; // Yellow
    return '#4caf50'; // Green
  };

  const getUsageStatus = (percentage: number): 'safe' | 'warning' | 'danger' => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'safe';
  };

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy thông tin storage từ Supabase
      const { data: storageData, error: storageError } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (storageError) throw storageError;

      // Tính toán storage usage (ước tính)
      const estimatedStorageUsed = (storageData?.length || 0) * 1024; // 1KB per record
      
      // Tính toán bandwidth usage (ước tính dựa trên số requests)
      const estimatedBandwidthUsed = (storageData?.length || 0) * 512; // 512 bytes per request
      
      // Tính toán requests usage (ước tính)
      const estimatedRequestsUsed = (storageData?.length || 0) * 10; // 10 requests per record

      const usage: UsageData = {
        storage: {
          used: estimatedStorageUsed,
          total: FREE_LIMITS.storage,
          percentage: (estimatedStorageUsed / FREE_LIMITS.storage) * 100,
        },
        bandwidth: {
          used: estimatedBandwidthUsed,
          total: FREE_LIMITS.bandwidth,
          percentage: (estimatedBandwidthUsed / FREE_LIMITS.bandwidth) * 100,
        },
        requests: {
          used: estimatedRequestsUsed,
          total: FREE_LIMITS.requests,
          percentage: (estimatedRequestsUsed / FREE_LIMITS.requests) * 100,
        },
        lastUpdated: new Date().toLocaleString('vi-VN'),
      };

      setUsageData(usage);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Không thể lấy thông tin sử dụng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchUsageData();
  };

  if (loading && !usageData) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StorageIcon color="primary" />
            <Typography variant="h6">Đang tải thông tin sử dụng...</Typography>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  if (!usageData) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Theo Dõi Sử Dụng Supabase
          </Typography>
          <Chip 
            label="Free Plan" 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN')}
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Usage Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
        gap: 2 
      }}>
        {/* Storage Usage */}
        <Card sx={{ 
          height: '100%',
          border: `2px solid ${getUsageColor(usageData.storage.percentage)}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StorageIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lưu Trữ
              </Typography>
              {getUsageStatus(usageData.storage.percentage) === 'danger' && (
                <ErrorIcon color="error" />
              )}
              {getUsageStatus(usageData.storage.percentage) === 'warning' && (
                <WarningIcon color="warning" />
              )}
              {getUsageStatus(usageData.storage.percentage) === 'safe' && (
                <CheckCircleIcon color="success" />
              )}
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {formatBytes(usageData.storage.used)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              / {formatBytes(usageData.storage.total)}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={Math.min(usageData.storage.percentage, 100)}
              sx={{ 
                height: 20, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getUsageColor(usageData.storage.percentage),
                }
              }}
            />
            
            <Typography variant="caption" sx={{ mt: 0, display: 'block' }}>
              {usageData.storage.percentage.toFixed(1)}% đã sử dụng
            </Typography>
          </CardContent>
        </Card>

        {/* Bandwidth Usage */}
        <Card sx={{ 
          height: '100%',
          border: `2px solid ${getUsageColor(usageData.bandwidth.percentage)}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <NetworkIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Băng Thông
              </Typography>
              {getUsageStatus(usageData.bandwidth.percentage) === 'danger' && (
                <ErrorIcon color="error" />
              )}
              {getUsageStatus(usageData.bandwidth.percentage) === 'warning' && (
                <WarningIcon color="warning" />
              )}
              {getUsageStatus(usageData.bandwidth.percentage) === 'safe' && (
                <CheckCircleIcon color="success" />
              )}
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {formatBytes(usageData.bandwidth.used)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              / {formatBytes(usageData.bandwidth.total)}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={Math.min(usageData.bandwidth.percentage, 100)}
              sx={{ 
                height: 20, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getUsageColor(usageData.bandwidth.percentage),
                }
              }}
            />
            
            <Typography variant="caption" sx={{ mt: 0, display: 'block' }}>
              {usageData.bandwidth.percentage.toFixed(1)}% đã sử dụng
            </Typography>
          </CardContent>
        </Card>

        {/* Requests Usage */}
        <Card sx={{ 
          height: '100%',
          border: `2px solid ${getUsageColor(usageData.requests.percentage)}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SpeedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                API Requests
              </Typography>
              {getUsageStatus(usageData.requests.percentage) === 'danger' && (
                <ErrorIcon color="error" />
              )}
              {getUsageStatus(usageData.requests.percentage) === 'warning' && (
                <WarningIcon color="warning" />
              )}
              {getUsageStatus(usageData.requests.percentage) === 'safe' && (
                <CheckCircleIcon color="success" />
              )}
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {formatNumber(usageData.requests.used)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              / {formatNumber(usageData.requests.total)}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={Math.min(usageData.requests.percentage, 100)}
              sx={{ 
                height: 20, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getUsageColor(usageData.requests.percentage),
                }
              }}
            />
            
            <Typography variant="caption" sx={{ mt: 0, display: 'block' }}>
              {usageData.requests.percentage.toFixed(1)}% đã sử dụng
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Warnings */}
      <Box sx={{ mt: 1 }}>
        {(usageData.storage.percentage >= 75 || 
          usageData.bandwidth.percentage >= 75 || 
          usageData.requests.percentage >= 75) && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>Chú ý:</strong> Một số tài nguyên đang gần đạt giới hạn. 
              Hãy cân nhắc nâng cấp lên gói Pro để có thêm tài nguyên.
            </Typography>
          </Alert>
        )}
        
        {(usageData.storage.percentage >= 90 || 
          usageData.bandwidth.percentage >= 90 || 
          usageData.requests.percentage >= 90) && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>Cảnh báo:</strong> Một số tài nguyên đã gần hết! 
              Ứng dụng có thể bị gián đoạn. Vui lòng nâng cấp ngay.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Info */}
      <Paper sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InfoIcon color="info" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Thông Tin Gói Free
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          • <strong>Lưu trữ:</strong> 500MB | • <strong>Băng thông:</strong> 2GB/tháng | • <strong>API Requests:</strong> 50,000/tháng
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0 }}>
          Dữ liệu được ước tính dựa trên số lượng records và hoạt động hiện tại. 
          Để có thông tin chính xác, vui lòng kiểm tra Supabase Dashboard.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SupabaseUsageMonitor; 