import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Alert
} from '@mui/material';
import { Storage, Cloud, Memory } from '@mui/icons-material';

const SimpleDataSourceSwitcher: React.FC = () => {
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('supabase');

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
        </Box>

        {dataSource === 'mock' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Đang sử dụng dữ liệu mẫu. Để sử dụng Supabase, hãy cấu hình environment variables và bật switch trên.
          </Alert>
        )}

        {dataSource === 'supabase' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Để kết nối Supabase, vui lòng cấu hình:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)</li>
              <li>Hoặc tạo file .env.local với thông tin Supabase</li>
            </ul>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleDataSourceSwitcher; 