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
  Chip
} from '@mui/material';
import {
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { useAutoSync } from '../contexts/AutoSyncContext';
import AutoSyncStatus from '../components/AutoSyncStatus';

const AutoSync: React.FC = () => {
  const { 
    config, 
    status, 
    updateConfig, 
    startAutoSync, 
    stopAutoSync, 
    performManualSync,
    forceSync,
    resetStats,
    showUpdateNotification
  } = useAutoSync();

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Quản lý Auto Sync
      </Typography>

      {showUpdateNotification && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
          🔄 Dữ liệu đã được cập nhật từ Google Sheets!
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        {/* Cài đặt Auto Sync */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cài đặt
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.isEnabled}
                  onChange={handleToggleAutoSync}
                />
              }
              label="Bật Auto Sync"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Interval: {config.interval} giây
            </Typography>
            <Slider
              value={config.interval}
              onChange={handleIntervalChange}
              min={5}
              max={60}
              step={5}
              marks
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
        </Paper>

        {/* Trạng thái */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Trạng thái
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Kết nối:</span>
              <Chip 
                label={status.isConnected ? 'Đã kết nối' : 'Mất kết nối'} 
                color={status.isConnected ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
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
                {status.dataVersion}
              </Typography>
              <Typography variant="body2" color="white">
                Phiên bản dữ liệu
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {config.interval}s
              </Typography>
              <Typography variant="body2" color="white">
                Interval
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="h4" color="white">
                {status.isConnected ? '✓' : '✗'}
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
            <Button
              variant="outlined"
              onClick={forceSync}
              disabled={status.isProcessing}
              size="small"
            >
              Force sync
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoSync; 