import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Slider,
  Button,
  Divider,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import {
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useSupabaseAutoSync } from '../contexts/SupabaseAutoSyncContext';
import AutoSyncStatus from '../components/AutoSyncStatus';


const AutoSync: React.FC = () => {
  const { 
    config, 
    status, 
    updateConfig, 
    startAutoSync, 
    stopAutoSync, 
    performManualSync,

    resetStats,
    showUpdateNotification
  } = useSupabaseAutoSync();
  
  const currentDataSource = localStorage.getItem('REACT_APP_DATA_SOURCE') || 'supabase';
  
  // Tạm thời tạo mock data cho realtimeStatus và errors
  const mockRealtimeStatus = {
    products: false,
    suppliers: false,
    customers: false,
    inboundShipments: false,
    outboundShipments: false,
    companyInfo: false,
    users: false
  };
  
  const mockErrors = {
    products: null,
    suppliers: null,
    customers: null,
    inboundShipments: null,
    outboundShipments: null,
    companyInfo: null,
    users: null
  };
  
  // Sử dụng mock data cho realtimeStatus và errors
  const realtimeStatus = mockRealtimeStatus;
  const errors = mockErrors;

  const handleIntervalChange = (event: Event, newValue: number | number[]) => {
    updateConfig({ interval: newValue as number });
  };

  const handleToggleAutoSync = () => {
    updateConfig({ isEnabled: !config.isEnabled });
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Chưa có';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ 
      minHeight: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 3
    }}>
      <Typography variant="h4" gutterBottom>
        <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Quản lý Auto Sync
      </Typography>



      {showUpdateNotification && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
          🔄 Dữ liệu đã được cập nhật!
        </Box>
      )}

      {/* Thông báo dựa trên data source */}
      {currentDataSource === 'supabase' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ℹ️ Thông tin về Supabase:
          </Typography>
          <Typography variant="body2">
            • Realtime sync tự động giữa các người dùng
          </Typography>
          <Typography variant="body2">
            • Không có giới hạn rate limiting
          </Typography>
          <Typography variant="body2">
            • Auto sync có thể bật với interval ngắn
          </Typography>
          <Typography variant="body2">
            • Dữ liệu được lưu trữ an toàn trên PostgreSQL
          </Typography>
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ Lưu ý về Mock Data:
          </Typography>
          <Typography variant="body2">
            • Dữ liệu chỉ lưu trong memory (sẽ mất khi reload)
          </Typography>
          <Typography variant="body2">
            • Không có realtime sync
          </Typography>
          <Typography variant="body2">
            • Chỉ dùng cho development/testing
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        {/* Cài đặt Auto Sync */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cài đặt
          </Typography>
          
          {currentDataSource === 'supabase' ? (
            <>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.isEnabled}
                      onChange={handleToggleAutoSync}
                    />
                  }
                  label="Bật Auto Sync (Realtime)"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Interval: {config.interval} giây
                </Typography>
                <Slider
                  value={config.interval}
                  onChange={handleIntervalChange}
                  min={10}
                  max={300}
                  step={10}
                  marks={[
                    { value: 10, label: '10s' },
                    { value: 30, label: '30s' },
                    { value: 60, label: '1m' },
                    { value: 300, label: '5m' }
                  ]}
                  valueLabelDisplay="auto"
                  disabled={!config.isEnabled}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={startAutoSync}
                  disabled={config.isEnabled}
                >
                  Bắt đầu
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<StopIcon />}
                  onClick={stopAutoSync}
                  disabled={!config.isEnabled}
                >
                  Dừng
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={performManualSync}
                  disabled={status.isProcessing}
                >
                  Sync thủ công
                </Button>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              Auto Sync chỉ khả dụng khi sử dụng Supabase. Với Mock Data, dữ liệu được cập nhật realtime tự động.
            </Alert>
          )}
        </Paper>

        {/* Trạng thái */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Trạng thái
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Nguồn dữ liệu:</span>
              <Chip 
                label={currentDataSource === 'supabase' ? 'Supabase' : 'Mock Data'} 
                color={currentDataSource === 'supabase' ? 'primary' : 'secondary'}
                size="small"
                icon={<StorageIcon />}
              />
            </Box>
            
            {currentDataSource === 'supabase' && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Kết nối Supabase:</span>
                  <Chip 
                    label={Object.values(errors).every(e => e === null) ? 'Đã kết nối' : 'Lỗi kết nối'} 
                    color={Object.values(errors).every(e => e === null) ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Realtime:</span>
                  <Chip 
                    label={Object.values(realtimeStatus).some(s => s) ? 'Đang hoạt động' : 'Không hoạt động'} 
                    color={Object.values(realtimeStatus).some(s => s) ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Auto Sync:</span>
              <Chip 
                label={status.isRunning ? 'Đang chạy' : 'Đã dừng'} 
                color={status.isRunning ? 'primary' : 'default'}
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Đang xử lý:</span>
              <Chip 
                label={status.isProcessing ? 'Có' : 'Không'} 
                color={status.isProcessing ? 'warning' : 'default'}
                size="small"
              />
            </Box>
            
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Số lần sync:</span>
              <Typography variant="body2" color="primary">
                {status.syncCount}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Lần cuối sync:</span>
              <Typography variant="body2" color="text.secondary">
                {formatLastSync(status.lastSync)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cập nhật cuối:</span>
              <Typography variant="body2" color="text.secondary">
                {formatLastSync(status.lastDataUpdate)}
              </Typography>
            </Box>
            
            {status.error && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText' }}>
                {status.error}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Auto Sync Status Component */}
      <Box sx={{ mb: 3 }}>
        <AutoSyncStatus />
      </Box>

      {/* Supabase Realtime Status - tạm thời ẩn */}
      {currentDataSource === 'supabase' && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info">
            Supabase Realtime Status sẽ được hiển thị khi cấu hình Supabase hoàn tất.
          </Alert>
        </Box>
      )}

      {/* Thống kê */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thống kê
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {status.syncCount}
              </Typography>
              <Typography variant="body2" color="white">
                Lần sync
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {currentDataSource === 'supabase' ? '✓' : '⚠️'}
              </Typography>
              <Typography variant="body2" color="white">
                {currentDataSource === 'supabase' ? 'Supabase' : 'Mock Data'}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {currentDataSource === 'supabase' ? config.interval + 's' : 'N/A'}
              </Typography>
              <Typography variant="body2" color="white">
                Interval
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {currentDataSource === 'supabase' ? 
                  (Object.values(errors).every(e => e === null) ? '✓' : '✗') : 
                  '✓'
                }
              </Typography>
              <Typography variant="body2" color="white">
                Kết nối
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={resetStats}
              size="small"
            >
              Reset thống kê
            </Button>
            {currentDataSource === 'supabase' && (
              <Button
                variant="outlined"
                onClick={performManualSync}
                disabled={status.isProcessing}
                size="small"
              >
                Force sync
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="small"
            >
              Reload
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoSync; 