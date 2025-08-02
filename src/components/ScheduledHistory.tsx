import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface ScheduledItem {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
  description: string;
  type: 'appointment' | 'meeting' | 'task';
}

const ScheduledHistory: React.FC = () => {
  const { t } = useLanguage();

  // Mock data - sau này sẽ lấy từ Supabase
  const scheduledItems: ScheduledItem[] = [
    {
      id: '1',
      title: 'Họp với nhà cung cấp',
      date: '2025-01-15',
      time: '09:00',
      status: 'completed',
      description: 'Thảo luận về hợp đồng cung cấp sản phẩm mới',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Kiểm tra kho hàng',
      date: '2025-01-16',
      time: '14:30',
      status: 'pending',
      description: 'Kiểm tra tồn kho và cập nhật hệ thống',
      type: 'task'
    },
    {
      id: '3',
      title: 'Gặp khách hàng ABC',
      date: '2025-01-17',
      time: '10:00',
      status: 'pending',
      description: 'Giới thiệu sản phẩm mới',
      type: 'appointment'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'cancelled':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('status') === 'Trạng thái' ? 'Hoàn thành' : 'Completed';
      case 'pending':
        return t('status') === 'Trạng thái' ? 'Chờ xử lý' : 'Pending';
      case 'cancelled':
        return t('status') === 'Trạng thái' ? 'Đã hủy' : 'Cancelled';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'appointment':
        return t('appointments');
      case 'meeting':
        return t('status') === 'Trạng thái' ? 'Cuộc họp' : 'Meeting';
      case 'task':
        return t('status') === 'Trạng thái' ? 'Công việc' : 'Task';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t('language') === 'Ngôn ngữ' ? 'vi-VN' : 'en-US');
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {t('scheduled_history')}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {scheduledItems.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {scheduledItems.map((item) => (
                <Paper
                  key={item.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.description}
                      </Typography>
                    </Box>
                    {getStatusIcon(item.status)}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={getTypeText(item.type)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={getStatusText(item.status)}
                      size="small"
                      color={getStatusColor(item.status) as any}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.date)} - {item.time}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              textAlign: 'center',
              py: 4
            }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('scheduled_history')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('no_saved_data')}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScheduledHistory; 