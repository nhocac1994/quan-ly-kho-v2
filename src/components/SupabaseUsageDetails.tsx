import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { supabase } from '../services/supabaseService';

interface TableInfo {
  name: string;
  rowCount: number;
  estimatedSize: number;
  lastUpdated: string;
}

interface UsageDetails {
  tables: TableInfo[];
  totalRows: number;
  totalSize: number;
  recommendations: string[];
}

const SupabaseUsageDetails: React.FC = () => {
  const [usageDetails, setUsageDetails] = useState<UsageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTableDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const tables = [
        'products',
        'suppliers', 
        'customers',
        'shipment_headers',
        'shipment_items',
        'company_info',
        'users'
      ];

      const tableInfo: TableInfo[] = [];
      let totalRows = 0;
      let totalSize = 0;

      for (const tableName of tables) {
        try {
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' });

          if (tableError) {
            console.warn(`Error fetching ${tableName}:`, tableError);
            continue;
          }

          const rowCount = data?.length || 0;
          const estimatedSize = rowCount * 1024; // 1KB per record estimate
          
          totalRows += rowCount;
          totalSize += estimatedSize;

          tableInfo.push({
            name: tableName,
            rowCount,
            estimatedSize,
            lastUpdated: new Date().toLocaleDateString('vi-VN')
          });
        } catch (err) {
          console.warn(`Error processing table ${tableName}:`, err);
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (totalSize > 400 * 1024 * 1024) { // 400MB
        recommendations.push('Dung lượng lưu trữ đang gần đạt giới hạn. Cân nhắc dọn dẹp dữ liệu cũ.');
      }
      
      if (totalRows > 10000) {
        recommendations.push('Số lượng records lớn. Cân nhắc tối ưu hóa queries và thêm indexes.');
      }

      const tableWithMostRows = tableInfo.reduce((max, current) => 
        current.rowCount > max.rowCount ? current : max
      );
      
      if (tableWithMostRows.rowCount > 5000) {
        recommendations.push(`Bảng ${tableWithMostRows.name} có nhiều records (${tableWithMostRows.rowCount}). Cân nhắc phân trang và lazy loading.`);
      }

      if (recommendations.length === 0) {
        recommendations.push('Hệ thống đang hoạt động tốt. Tiếp tục theo dõi để đảm bảo hiệu suất.');
      }

      setUsageDetails({
        tables: tableInfo,
        totalRows,
        totalSize,
        recommendations
      });
    } catch (err) {
      console.error('Error fetching usage details:', err);
      setError('Không thể lấy thông tin chi tiết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableDetails();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN');
  };

  const getTableStatus = (rowCount: number): 'low' | 'medium' | 'high' => {
    if (rowCount > 5000) return 'high';
    if (rowCount > 1000) return 'medium';
    return 'low';
  };

  const getStatusColor = (status: 'low' | 'medium' | 'high'): string => {
    switch (status) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Đang tải thông tin chi tiết...</Typography>
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

  if (!usageDetails) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TimelineIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Chi Tiết Sử Dụng Database
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StorageIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Tổng Dung Lượng
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {formatBytes(usageDetails.totalSize)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#f3e5f5' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SpeedIcon color="secondary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Tổng Records
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
              {formatNumber(usageDetails.totalRows)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#e8f5e8' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoIcon color="success" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Số Bảng
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {usageDetails.tables.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Table Details */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Chi Tiết Theo Bảng
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên Bảng</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Số Records</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Dung Lượng (Ước Tính)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Trạng Thái</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Cập Nhật</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usageDetails.tables.map((table) => {
                  const status = getTableStatus(table.rowCount);
                  return (
                    <TableRow key={table.name} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {table.name}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 500 }}>
                        {formatNumber(table.rowCount)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {formatBytes(table.estimatedSize)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={status === 'high' ? 'Cao' : status === 'medium' ? 'Trung bình' : 'Thấp'}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(status),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>
                        {table.lastUpdated}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Recommendations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Khuyến Nghị Tối Ưu
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {usageDetails.recommendations.map((recommendation, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {recommendation.includes('gần đạt giới hạn') || recommendation.includes('nhiều records') ? (
                      <WarningIcon color="warning" />
                    ) : recommendation.includes('hoạt động tốt') ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <InfoIcon color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={recommendation}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                {index < usageDetails.recommendations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Tips */}
      <Card sx={{ mt: 2, bgcolor: '#fff3e0' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon color="warning" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
              Mẹo Tiết Kiệm Tài Nguyên
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Xóa dữ liệu cũ không cần thiết định kỳ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Sử dụng pagination cho danh sách lớn
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Tối ưu hóa queries với indexes phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Cân nhắc nâng cấp lên gói Pro khi cần thêm tài nguyên
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SupabaseUsageDetails; 