import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Slide,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useProducts, useShipmentHeaders } from '../hooks/useSupabaseQueries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseService';
import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

interface InventoryReportProps {}

interface ProductReport {
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  beginning_stock: number;
  inbound_quantity: number;
  outbound_quantity: number;
  ending_stock: number;
}

const InventoryReport: React.FC<InventoryReportProps> = () => {
  // Cấu hình pdfmake fonts
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;
  
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: shipmentHeaders = [], isLoading: loadingShipments } = useShipmentHeaders();
  
  // Lấy tất cả shipment items bằng cách query trực tiếp
  const { data: shipmentItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['allShipmentItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching all shipment items:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [branch, setBranch] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const isLoading = loadingProducts || loadingShipments || loadingItems;

  // Tính toán báo cáo xuất nhập tồn
  const inventoryReport = useMemo(() => {
    if (!products.length || !shipmentHeaders.length) return [];

    const report: ProductReport[] = [];

    products.forEach(product => {
      // Lọc shipments trong khoảng thời gian
      const periodShipments = shipmentHeaders.filter(header => {
        const shipmentDate = new Date(header.shipment_date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return shipmentDate >= fromDate && shipmentDate <= toDate;
      });

      // Tính nhập xuất trong kỳ
      let inboundQuantity = 0;
      let outboundQuantity = 0;

      periodShipments.forEach((header: any) => {
        if (header.shipment_type === 'inbound') {
          // Tìm items của shipment này
          const items = shipmentItems.filter((item: any) => 
            item.shipment_header_id === header.id && 
            item.product_id === product.id
          );
          items.forEach((item: any) => {
            inboundQuantity += item.quantity || 0;
          });
        } else if (header.shipment_type === 'outbound') {
          // Tìm items của shipment này
          const items = shipmentItems.filter((item: any) => 
            item.shipment_header_id === header.id && 
            item.product_id === product.id
          );
          items.forEach((item: any) => {
            outboundQuantity += item.quantity || 0;
          });
        }
      });

      // Tính tồn đầu kỳ = tồn hiện tại - nhập + xuất
      const currentStock = product.sl_ton || 0;
      const beginningStock = currentStock - inboundQuantity + outboundQuantity;
      const endingStock = beginningStock + inboundQuantity - outboundQuantity;

      // Debug log cho sản phẩm có dữ liệu
      if (inboundQuantity > 0 || outboundQuantity > 0) {
        console.log(`Product ${product.san_pham_id}:`, {
          currentStock,
          inboundQuantity,
          outboundQuantity,
          beginningStock,
          endingStock
        });
      }

      // CHỈ THÊM VÀO BÁO CÁO NHỮNG SẢN PHẨM CÓ PHÁT SINH XUẤT HOẶC NHẬP
      if (inboundQuantity > 0 || outboundQuantity > 0) {
        report.push({
          product_id: product.id,
          product_code: product.san_pham_id,
          product_name: `${product.ten_san_pham} (${product.dvt})`,
          unit: product.dvt,
          beginning_stock: beginningStock, // Cho phép số âm
          inbound_quantity: inboundQuantity,
          outbound_quantity: outboundQuantity,
          ending_stock: endingStock, // Cho phép số âm
        });
      }
    });

    return report.sort((a, b) => a.product_code.localeCompare(b.product_code));
  }, [products, shipmentHeaders, shipmentItems, dateFrom, dateTo]);

  // Tính tổng
  const totals = useMemo(() => {
    return inventoryReport.reduce((acc, item) => ({
      beginning_stock: acc.beginning_stock + item.beginning_stock,
      inbound_quantity: acc.inbound_quantity + item.inbound_quantity,
      outbound_quantity: acc.outbound_quantity + item.outbound_quantity,
      ending_stock: acc.ending_stock + item.ending_stock,
    }), {
      beginning_stock: 0,
      inbound_quantity: 0,
      outbound_quantity: 0,
      ending_stock: 0,
    });
  }, [inventoryReport]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const formatValue = (value: number) => {
    if (value === 0) return '0';
    if (value < 0) return `-${formatNumber(Math.abs(value))}`;
    return formatNumber(value);
  };

  // Xuất Excel
  const exportToExcel = () => {
    const wsData = [
      // Header
      ['Báo cáo xuất nhập tồn'],
      [`Từ ngày ${formatDate(dateFrom)} đến ngày ${formatDate(dateTo)}`],
      [`Chi nhánh: ${branch}`],
      [`Ngày lập: ${new Date().toLocaleString('vi-VN')}`],
      [],
      // Table headers
      [
        'Mã hàng',
        'Tên hàng',
        'Tồn đầu kỳ',
        'SL Nhập',
        'SL Xuất',
        'Tồn cuối kỳ'
      ],
      // Summary row
      [
        `SL mặt hàng: ${inventoryReport.length}`,
        '',
        totals.beginning_stock,
        totals.inbound_quantity,
        totals.outbound_quantity,
        totals.ending_stock
      ],
      // Data rows
      ...inventoryReport.map(item => [
        item.product_code,
        item.product_name,
        item.beginning_stock,
        item.inbound_quantity,
        item.outbound_quantity,
        item.ending_stock
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo xuất nhập tồn');
    
    // Auto-size columns
    const colWidths = [15, 40, 12, 10, 10, 12];
    ws['!cols'] = colWidths.map(width => ({ width }));

    XLSX.writeFile(wb, `bao-cao-xuat-nhap-ton-${formatDate(dateFrom)}-${formatDate(dateTo)}.xlsx`);
  };

  // Xuất PDF
  const exportToPDF = () => {
    try {
      // Định nghĩa document
      const docDefinition = {
        pageOrientation: 'landscape',
        pageSize: 'A4',
        content: [
          // Header
          {
            text: 'Báo cáo xuất nhập tồn',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Từ ngày ${formatDate(dateFrom)} đến ngày ${formatDate(dateTo)}`,
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: `Chi nhánh: ${branch || 'Tất cả'}`,
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: `Ngày lập: ${new Date().toLocaleString('vi-VN')}`,
            style: 'subheader',
            alignment: 'left',
            margin: [0, 0, 0, 20]
          },
          // Table
          {
            table: {
              headerRows: 1,
              widths: ['15%', '35%', '12%', '12%', '12%', '14%'],
              body: [
                // Header row
                [
                  { text: 'Mã hàng', style: 'tableHeader' },
                  { text: 'Tên hàng', style: 'tableHeader' },
                  { text: 'Tồn đầu kỳ', style: 'tableHeader' },
                  { text: 'SL Nhập', style: 'tableHeader' },
                  { text: 'SL Xuất', style: 'tableHeader' },
                  { text: 'Tồn cuối kỳ', style: 'tableHeader' }
                ],
                // Summary row
                [
                  { text: `SL mặt hàng: ${inventoryReport.length}`, style: 'summaryRow' },
                  { text: '', style: 'summaryRow' },
                  { text: formatNumber(totals.beginning_stock), style: 'summaryRow' },
                  { text: formatNumber(totals.inbound_quantity), style: 'summaryRow' },
                  { text: formatNumber(totals.outbound_quantity), style: 'summaryRow' },
                  { text: formatNumber(totals.ending_stock), style: 'summaryRow' }
                ],
                // Data rows
                ...inventoryReport.map(item => [
                  { text: item.product_code, style: 'tableCell' },
                  { text: item.product_name, style: 'tableCell' },
                  { text: formatNumber(item.beginning_stock), style: 'tableCell' },
                  { text: formatNumber(item.inbound_quantity), style: 'tableCell' },
                  { text: formatNumber(item.outbound_quantity), style: 'tableCell' },
                  { text: formatNumber(item.ending_stock), style: 'tableCell' }
                ])
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#000000'
          },
          subheader: {
            fontSize: 12,
            color: '#000000'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: '#ffffff',
            fillColor: '#4285f4',
            alignment: 'center'
          },
          tableCell: {
            fontSize: 9,
            color: '#000000'
          },
          summaryRow: {
            bold: true,
            fontSize: 9,
            color: '#000000',
            fillColor: '#f5f5f5'
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };

      // Tạo và download PDF
      pdfMake.createPdf(docDefinition as any).download(`bao-cao-xuat-nhap-ton-${formatDate(dateFrom)}-${formatDate(dateTo)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Lỗi khi tạo file PDF');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 0, sm: 1, md: 2 }, 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden', 
      mx: 'auto',
      mt: { xs: 2, sm: 0 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 1.5, sm: 1 },
        mb: 3 
      }}>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
          <ReportIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, 
            color: 'primary.main' 
          }}>
            Báo Cáo Xuất Nhập Tồn
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 0.5, sm: 1.5 }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            endIcon={filterDialogOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setFilterDialogOpen(!filterDialogOpen)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: { xs: '35px', sm: '35px' },
              px: { xs: 1, sm: 2 },
              py: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              borderColor: 'primary.main',
              color: 'primary.main',
              flex: { xs: 1, sm: 'none' },
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
              }
            }}
          >
            Bộ Lọc
          </Button>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'row', sm: 'row' }
          }}>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={exportToExcel}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                borderColor: 'success.main',
                color: 'success.main',
                flex: { xs: 1, sm: 'none' },
                '&:hover': {
                  backgroundColor: 'success.light',
                  color: 'white',
                  borderColor: 'success.light',
                }
              }}
            >
              Xuất Excel
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={exportToPDF}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                borderColor: 'error.main',
                color: 'error.main',
                flex: { xs: 1, sm: 'none' },
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'white',
                  borderColor: 'error.light',
                }
              }}
            >
              Xuất PDF
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Thông báo về báo cáo */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-message': {
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }
        }}
      >
        <Typography variant="body2">
          <strong>Lưu ý:</strong> Báo cáo chỉ hiển thị những sản phẩm có phát sinh xuất hoặc nhập trong khoảng thời gian đã chọn.
        </Typography>
      </Alert>

      {/* Filter Dialog - Slide down from header */}
      <Slide direction="down" in={filterDialogOpen} mountOnEnter unmountOnExit>
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          boxShadow: 3,
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: 'primary.main', 
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Bộ Lọc Báo Cáo
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
            gap: { xs: 1.5, sm: 2 } 
          }}>
            <TextField
              type="date"
              label="Từ ngày"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              sx={{
                height: { xs: '40px', sm: '35px' },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              type="date"
              label="Đến ngày"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              sx={{
                height: { xs: '40px', sm: '35px' },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              label="Chi nhánh"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              fullWidth
              sx={{
                height: { xs: '40px', sm: '35px' },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <Chip 
                label={`SL mặt hàng: ${inventoryReport.length}`} 
                color="primary" 
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  height: { xs: '40px', sm: '32px' }
                }}
              />
              <Chip 
                label={`Tổng shipments: ${shipmentHeaders.length}`} 
                color="secondary" 
                variant="outlined"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  height: { xs: '40px', sm: '32px' }
                }}
              />
            </Box>
          </Box>
          
          {/* Debug Info */}
          <Box sx={{ 
            mt: 1, 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: 'grey.50', 
            borderRadius: 1 
          }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              Thông Tin Debug:
            </Typography>
            <Typography variant="body2" sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: { xs: 1.4, sm: 1.5 }
            }}>
              • Tổng sản phẩm: {products.length} | 
              • Sản phẩm có phát sinh: {inventoryReport.length} | 
              • Số phiếu: {shipmentHeaders.length} | 
              • Số items: {shipmentItems.length} |
              • Khoảng thời gian: {formatDate(dateFrom)} - {formatDate(dateTo)}
            </Typography>
            <Typography variant="body2" sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
              mt: 0.5,
              lineHeight: { xs: 1.4, sm: 1.5 }
            }}>
              • Phiếu nhập: {shipmentHeaders.filter(h => h.shipment_type === 'inbound').length} |
              • Phiếu xuất: {shipmentHeaders.filter(h => h.shipment_type === 'outbound').length}
            </Typography>
          </Box>
        </Paper>
      </Slide>

      {/* Thông báo khi không có dữ liệu */}
      {inventoryReport.length === 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        >
          <Typography variant="body2">
            <strong>Không có dữ liệu:</strong> Trong khoảng thời gian từ {formatDate(dateFrom)} đến {formatDate(dateTo)} không có sản phẩm nào có phát sinh xuất hoặc nhập.
          </Typography>
        </Alert>
      )}

      {/* Desktop Table View */}
      {inventoryReport.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 180px)' }}>
          <Table stickyHeader size="small">
            <TableHead sx={{ 
                backgroundColor: '#E3F2FD !important', 
                position: 'sticky', 
                top: 0, 
                zIndex: 1000,
                '& .MuiTableCell-root': {
                  backgroundColor: '#E3F2FD !important',
                  color: '#000 !important',
                  fontWeight: 'bold'
                } 
                }}>
              <TableRow sx={{ bgcolor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 1000, height: '50px' }}>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 120 }}>Mã hàng</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Tên hàng</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 200, textAlign: 'right' }}>Tồn đầu kỳ</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 200, textAlign: 'right' }}>SL Nhập</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 200, textAlign: 'right' }}>SL Xuất</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 200, textAlign: 'right' }}>Tồn cuối kỳ</TableCell>
              </TableRow>
              
              {/* Summary Row - Nằm sát với header */}
              <TableRow sx={{ 
                backgroundColor: '#FFD54F !important', 
                position: 'sticky', 
                top: 10, 
                zIndex: 999,
                '& .MuiTableCell-root': {
                  backgroundColor: '#FFD54F !important',
                  color: '#000 !important',
                  fontWeight: 'bold',
                  borderBottom: '4px solid #FFB300'
                }
              }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  SL mặt hàng: {inventoryReport.length}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatValue(totals.beginning_stock)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatValue(totals.inbound_quantity)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatValue(totals.outbound_quantity)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatValue(totals.ending_stock)}
                </TableCell>
              </TableRow>
              </TableHead>
            <TableBody>
              
              {/* Data Rows */}
              {inventoryReport.map((item, index) => (
                <TableRow 
                  key={item.product_id} 
                  hover
                  sx={{ bgcolor: index % 2 === 0 ? 'success.50' : 'white' }}
                >
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {item.product_code}
                  </TableCell>
                  <TableCell>
                    {item.product_name}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatValue(item.beginning_stock)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatValue(item.inbound_quantity)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatValue(item.outbound_quantity)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatValue(item.ending_stock)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Paper>
      )}

      {/* Mobile Card View */}
      {inventoryReport.length > 0 && (
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Summary Card */}
        <Card sx={{ 
          mb: 2, 
          bgcolor: '#FFD54F',
          border: '2px solid #FFB300'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: '1rem',
              color: 'primary.main'
            }}>
              Tổng Kết
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 1 
            }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  SL mặt hàng
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {inventoryReport.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Tồn đầu kỳ
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {formatValue(totals.beginning_stock)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  SL Nhập
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'success.main' }}>
                  {formatValue(totals.inbound_quantity)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  SL Xuất
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'error.main' }}>
                  {formatValue(totals.outbound_quantity)}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Tồn cuối kỳ
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.875rem', 
                  color: totals.ending_stock < 0 ? 'error.main' : 'primary.main'
                }}>
                  {formatValue(totals.ending_stock)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Product Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {inventoryReport.map((item, index) => (
            <Card key={item.product_id} sx={{ 
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: 4,
                borderColor: 'primary.main'
              }
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30, fontSize: '0.75rem' }}>
                      {index + 1}.
                    </Typography>
                    <Chip
                      label={item.product_code}
                      color="primary"
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Chip
                    label={item.unit}
                    color="secondary"
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
                
                <Typography 
                  variant="body1" 
                  fontWeight="medium"
                  sx={{ 
                    color: 'primary.main',
                    mb: 1,
                    fontSize: '1rem'
                  }}
                >
                  {item.product_name}
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Tồn đầu kỳ:</Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500, 
                      fontSize: '0.8rem',
                      color: item.beginning_stock < 0 ? 'error.main' : 'inherit'
                    }}>
                      {formatValue(item.beginning_stock)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>SL Nhập:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'success.main' }}>
                      {formatValue(item.inbound_quantity)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>SL Xuất:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'error.main' }}>
                      {formatValue(item.outbound_quantity)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Tồn cuối kỳ:</Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500, 
                      fontSize: '0.8rem', 
                      color: item.ending_stock < 0 ? 'error.main' : 'primary.main'
                    }}>
                      {formatValue(item.ending_stock)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
      )}
    </Box>
  );
};

export default InventoryReport; 