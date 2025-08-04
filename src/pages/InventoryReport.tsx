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

      report.push({
        product_id: product.id,
        product_code: product.san_pham_id,
        product_name: `${product.ten_san_pham} (${product.dvt})`,
        unit: product.dvt,
        beginning_stock: Math.max(0, beginningStock), // Không âm
        inbound_quantity: inboundQuantity,
        outbound_quantity: outboundQuantity,
        ending_stock: Math.max(0, endingStock), // Không âm
      });
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
    return value > 0 ? formatNumber(value) : '---';
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
    <Box sx={{ p: 3 , width: '100%', maxWidth: 1280, overflow: 'hidden', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
            Báo Cáo Xuất Nhập Tồn
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            endIcon={filterDialogOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setFilterDialogOpen(!filterDialogOpen)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: '35px',
              px: 2,
              py: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
              }
            }}
          >
            Bộ Lọc
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={exportToExcel}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              height: '35px',
              px: 2,
              py: 1,
              borderColor: 'success.main',
              color: 'success.main',
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
              height: '35px',
              px: 2,
              py: 1,
              borderColor: 'error.main',
              color: 'error.main',
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

      {/* Filter Dialog - Slide down from header */}
      <Slide direction="down" in={filterDialogOpen} mountOnEnter unmountOnExit>
        <Paper sx={{ p: 2, mb: 3, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Bộ Lọc Báo Cáo
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <TextField
                type="date"
                label="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <TextField
                type="date"
                label="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <TextField
                label="Chi nhánh"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`SL mặt hàng: ${inventoryReport.length}`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`Tổng shipments: ${shipmentHeaders.length}`} 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          
          {/* Debug Info */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Thông Tin Debug:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              • Số sản phẩm: {products.length} | 
              • Số phiếu: {shipmentHeaders.length} | 
              • Số items: {shipmentItems.length} |
              • Khoảng thời gian: {formatDate(dateFrom)} - {formatDate(dateTo)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
              • Phiếu nhập: {shipmentHeaders.filter(h => h.shipment_type === 'inbound').length} |
              • Phiếu xuất: {shipmentHeaders.filter(h => h.shipment_type === 'outbound').length}
            </Typography>
          </Box>
        </Paper>
      </Slide>

      {/* Report Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
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
              </TableHead>
              <TableHead>
              {/* Summary Row - Sticky */}
              <TableRow sx={{ 
                backgroundColor: '#FFF8E1 !important', 
                position: 'sticky', 
                top: 50, 
                zIndex: 999,
                '& .MuiTableCell-root': {
                  backgroundColor: '#FFF8E1 !important',
                  color: '#000 !important',
                  fontWeight: 'bold'
                }
              }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  SL mặt hàng: {inventoryReport.length}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatNumber(totals.beginning_stock)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatNumber(totals.inbound_quantity)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatNumber(totals.outbound_quantity)}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {formatNumber(totals.ending_stock)}
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
                    {formatNumber(item.beginning_stock)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatNumber(item.inbound_quantity)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatNumber(item.outbound_quantity)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatNumber(item.ending_stock)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default InventoryReport; 