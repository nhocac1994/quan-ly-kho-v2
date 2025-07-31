import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Button,
  Divider
} from '@mui/material';
import { Storage, Cloud, Memory } from '@mui/icons-material';
import { useSupabase } from '../contexts/SupabaseContext';

const DataSourceSwitcher: React.FC = () => {
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('supabase');
  const { realtimeStatus, errors } = useSupabase();

  const handleDataSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSource = event.target.checked ? 'supabase' : 'mock';
    setDataSource(newSource);
    
    // Cập nhật environment variable (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('REACT_APP_DATA_SOURCE', newSource);
      window.location.reload(); // Reload để áp dụng thay đổi
    }
  };

  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'supabase':
        return {
          name: 'Supabase',
          description: 'Database PostgreSQL với realtime',
          icon: <Cloud color="primary" />,
          color: 'primary' as const,
          features: ['Realtime sync', 'PostgreSQL', 'Row Level Security', 'Auto-generated APIs']
        };
      case 'mock':
        return {
          name: 'Mock Data',
          description: 'Dữ liệu mẫu cho development',
          icon: <Memory color="secondary" />,
          color: 'secondary' as const,
          features: ['Dữ liệu mẫu', 'Không cần kết nối', 'Development mode']
        };
      default:
        return {
          name: 'Unknown',
          description: 'Nguồn dữ liệu không xác định',
          icon: <Storage />,
          color: 'default' as const,
          features: []
        };
    }
  };

  const info = getDataSourceInfo();
  const hasErrors = Object.values(errors).some(error => error !== null);
  const isConnected = Object.values(realtimeStatus).some(status => status);

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            {info.icon}
            <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
              Nguồn dữ liệu
            </Typography>
          </Box>
          <Chip
            label={info.name}
            color={info.color}
            variant="outlined"
            icon={info.icon}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {info.description}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {info.features.map((feature, index) => (
            <Chip
              key={index}
              label={feature}
              size="small"
              variant="outlined"
              color="default"
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <FormControlLabel
            control={
              <Switch
                checked={dataSource === 'supabase'}
                onChange={handleDataSourceChange}
                color="primary"
              />
            }
            label="Sử dụng Supabase"
          />
          
          {dataSource === 'supabase' && (
            <Box display="flex" alignItems="center" gap={1}>
              {hasErrors ? (
                <Alert severity="error" sx={{ py: 0 }}>
                  Lỗi kết nối
                </Alert>
              ) : isConnected ? (
                <Alert severity="success" sx={{ py: 0 }}>
                  Đã kết nối
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ py: 0 }}>
                  Đang kết nối...
                </Alert>
              )}
            </Box>
          )}
        </Box>

        {dataSource === 'mock' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Đang sử dụng dữ liệu mẫu. Để sử dụng Supabase, hãy cấu hình environment variables và bật switch trên.
          </Alert>
        )}

        {dataSource === 'supabase' && hasErrors && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Không thể kết nối đến Supabase. Vui lòng kiểm tra:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)</li>
              <li>Kết nối internet</li>
              <li>Trạng thái Supabase project</li>
            </ul>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.location.reload()}
              sx={{ mt: 1 }}
            >
              Thử lại
            </Button>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSourceSwitcher; 