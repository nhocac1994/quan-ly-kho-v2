import React from 'react';
import { Box, IconButton, Tooltip, Badge, Chip } from '@mui/material';
import { 
  Sync as SyncIcon, 
  SyncDisabled as SyncDisabledIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSupabaseAutoSync } from '../contexts/SupabaseAutoSyncContext';

export const AutoSyncStatusIcon: React.FC = () => {
  const { status, config } = useSupabaseAutoSync();

  const getStatusColor = () => {
    if (status.error) return 'error';
    if (status.isProcessing) return 'warning';
    if (status.isConnected && status.isRunning) return 'success';
    return 'default';
  };

  const getStatusIcon = () => {
    if (status.error) return <ErrorIcon />;
    if (status.isProcessing) return <SyncIcon className="rotating" />;
    if (status.isConnected && status.isRunning) return <CheckCircleIcon />;
    return <SyncDisabledIcon />;
  };

  const getTooltipText = () => {
    if (status.error) return `Lỗi: ${status.error}`;
    if (status.isProcessing) return 'Đang đồng bộ...';
    if (status.isConnected && status.isRunning) {
      return `Auto sync đang chạy (${config.interval}s) - Lần cuối: ${status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Chưa có'}`;
    }
    return 'Auto sync đã tắt';
  };

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton 
        onClick={() => {}}
        disabled={status.isProcessing}
        size="small"
        color={getStatusColor()}
      >
        <Badge badgeContent={status.syncCount} max={99} color="primary">
          {getStatusIcon()}
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export const AutoSyncStatus: React.FC = () => {
  const { status, config, updateConfig, performManualSync } = useSupabaseAutoSync();

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Chưa có';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(event.target.value);
    updateConfig({ interval: newInterval });
  };

  const handleToggleAutoSync = () => {
    updateConfig({ isEnabled: !config.isEnabled });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <h3 style={{ margin: 0 }}>🔄 Auto Sync Status</h3>
        <AutoSyncStatusIcon />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Trạng thái kết nối */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={status.isConnected ? 'Đã kết nối' : 'Mất kết nối'} 
            color={status.isConnected ? 'success' : 'error'}
            size="small"
          />
        </Box>

        {/* Trạng thái auto sync */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={config.isEnabled ? 'Auto sync: Bật' : 'Auto sync: Tắt'} 
            color={config.isEnabled ? 'primary' : 'default'}
            size="small"
            onClick={handleToggleAutoSync}
            clickable
          />
        </Box>

        {/* Thông tin chi tiết */}
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          <div>🕒 Interval: {config.interval}s</div>
          <div>📊 Sync count: {status.syncCount}</div>
          <div>🔄 Last sync: {formatLastSync(status.lastSync)}</div>
          <div>📅 Last update: {formatLastSync(status.lastDataUpdate)}</div>
          {status.error && (
            <div style={{ color: 'red' }}>❌ Error: {status.error}</div>
          )}
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <select 
            value={config.interval} 
            onChange={handleIntervalChange}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={5}>5 giây</option>
            <option value={10}>10 giây</option>
            <option value={15}>15 giây</option>
            <option value={30}>30 giây</option>
            <option value={60}>1 phút</option>
          </select>
          
          <IconButton 
            onClick={performManualSync}
            disabled={status.isProcessing}
            size="small"
            title="Sync thủ công"
          >
            <RefreshIcon />
          </IconButton>
          
          <IconButton 
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn reset số lần sync?')) {
                // Reset sync count
                localStorage.setItem('supabase_auto_sync_syncCount', '0');
                window.location.reload();
              }
            }}
            size="small"
            title="Reset số lần sync"
            style={{ color: 'orange' }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AutoSyncStatus; 