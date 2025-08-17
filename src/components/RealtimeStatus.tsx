import React from 'react';
import { Box, Typography, Alert, Button, Chip } from '@mui/material';
import { 
  Wifi as WifiIcon, 
  WifiOff as WifiOffIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSupabase } from '../contexts/SupabaseContext';

const RealtimeStatus: React.FC = () => {
  const { realtimeStatus } = useSupabase();

  const allConnected = Object.values(realtimeStatus).every(status => status);
  const connectedCount = Object.values(realtimeStatus).filter(status => status).length;
  const totalCount = Object.keys(realtimeStatus).length;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={allConnected ? "success" : "warning"}
        icon={allConnected ? <CheckCircleIcon /> : <InfoIcon />}
        action={
          <Button 
            color="inherit" 
            size="small"
            href="https://supabase.com/docs/guides/realtime"
            target="_blank"
            rel="noopener"
          >
            Hướng dẫn
          </Button>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            Trạng thái Realtime:
          </Typography>
          <Chip 
            icon={allConnected ? <WifiIcon /> : <WifiOffIcon />}
            label={`${connectedCount}/${totalCount} kết nối`}
            color={allConnected ? "success" : "warning"}
            size="small"
          />
        </Box>
        
        {!allConnected && (
          <Typography variant="body2" sx={{ mt: 0 }}>
            Để có realtime sync giữa các thiết bị, vui lòng chạy script SQL trong Supabase Dashboard:
            <br />
            <code style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
              ALTER PUBLICATION supabase_realtime ADD TABLE products, suppliers, customers, inbound_shipments, outbound_shipments, company_info, users;
            </code>
          </Typography>
        )}
        
        {allConnected && (
          <Typography variant="body2" sx={{ mt: 0 }}>
            ✅ Realtime đã được bật! Dữ liệu sẽ tự động cập nhật giữa các thiết bị.
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default RealtimeStatus; 