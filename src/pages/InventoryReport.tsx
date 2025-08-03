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
import { useProducts, useShipmentHeaders, useShipmentItems } from '../hooks/useSupabaseQueries';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: shipmentHeaders = [], isLoading: loadingShipments } = useShipmentHeaders();
  const { data: shipmentItems = [], isLoading: loadingItems } = useShipmentItems('');

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

      // Tính tồn đầu kỳ (giả định = tồn hiện tại - nhập + xuất trong kỳ)
      let inboundQuantity = 0;
      let outboundQuantity = 0;
      let inboundValue = 0;
      let outboundValue = 0;

      periodShipments.forEach(header => {
        if (header.shipment_type === 'inbound') {
          // Tìm items của shipment này
          const items = shipmentItems.filter(item => 
            item.shipment_header_id === header.id && 
            item.product_id === product.id
          );
          items.forEach(item => {
            inboundQuantity += item.quantity || 0;
            inboundValue += (item.quantity || 0) * (item.unit_price || 0);
          });
        } else if (header.shipment_type === 'outbound') {
          // Tìm items của shipment này
          const items = shipmentItems.filter(item => 
            item.shipment_header_id === header.id && 
            item.product_id === product.id
          );
          items.forEach(item => {
            outboundQuantity += item.quantity || 0;
            outboundValue += (item.quantity || 0) * (item.unit_price || 0);
          });
        }
      });

      // Tính tồn đầu và tồn cuối (giả định tồn đầu = tồn hiện tại - nhập + xuất)
      const currentStock = product.sl_ton || 0;
      const beginningStock = currentStock - inboundQuantity + outboundQuantity;
      const endingStock = beginningStock + inboundQuantity - outboundQuantity;

      report.push({
        product_id: product.id,
        product_code: product.san_pham_id,
        product_name: `${product.ten_san_pham} (${product.dvt})`,
        unit: product.dvt,
        beginning_stock: beginningStock,
        inbound_quantity: inboundQuantity,
        outbound_quantity: outboundQuantity,
        ending_stock: endingStock,
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
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Header
    doc.setFontSize(18);
    doc.text('Báo cáo xuất nhập tồn', 140, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Từ ngày ${formatDate(dateFrom)} đến ngày ${formatDate(dateTo)}`, 140, 30, { align: 'center' });
    doc.text(`Chi nhánh: ${branch}`, 140, 37, { align: 'center' });
    doc.text(`Ngày lập: ${new Date().toLocaleString('vi-VN')}`, 20, 20);
    
    // Table data
    const tableData = [
      // Headers
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
        totals.beginning_stock.toString(),
        totals.inbound_quantity.toString(),
        totals.outbound_quantity.toString(),
        totals.ending_stock.toString()
      ],
      // Data rows
      ...inventoryReport.map(item => [
        item.product_code,
        item.product_name,
        item.beginning_stock.toString(),
        item.inbound_quantity.toString(),
        item.outbound_quantity.toString(),
        item.ending_stock.toString()
      ])
    ];

    autoTable(doc, {
      startY: 50,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' }
      }
    });

    doc.save(`bao-cao-xuat-nhap-ton-${formatDate(dateFrom)}-${formatDate(dateTo)}.pdf`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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
              </Box>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Report Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 120 }}>Mã hàng</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Tên hàng</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 100, textAlign: 'right' }}>Tồn đầu kỳ</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 80, textAlign: 'right' }}>SL Nhập</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 80, textAlign: 'right' }}>SL Xuất</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold', width: 100, textAlign: 'right' }}>Tồn cuối kỳ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Summary Row */}
              <TableRow sx={{ bgcolor: 'success.light' }}>
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