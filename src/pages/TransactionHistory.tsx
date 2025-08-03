import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Collapse,
  Divider,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Input as InputIcon,
  Output as OutputIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useInboundShipments, useOutboundShipments, useShipmentHeaders, useShipmentItems } from '../hooks/useSupabaseQueries';
import { InboundShipment, OutboundShipment } from '../types';

interface TransactionHistoryProps {}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TransactionHistory: React.FC<TransactionHistoryProps> = () => {
  const navigate = useNavigate();
  
  // Sử dụng hooks mới để lấy dữ liệu từ Supabase
  const { data: inboundShipments = [], isLoading: loadingInbound } = useInboundShipments();
  const { data: outboundShipments = [], isLoading: loadingOutbound } = useOutboundShipments();
  const { data: shipmentHeaders = [], isLoading: loadingHeaders } = useShipmentHeaders();
  
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Lấy danh sách khách hàng và nhà cung cấp unique từ shipment headers
  const allCustomers = useMemo(() => {
    const customers = new Set<string>();
    shipmentHeaders
      .filter(header => header.shipment_type === 'outbound')
      .forEach(header => {
        if (header.customer_name) customers.add(header.customer_name);
      });
    return Array.from(customers).sort();
  }, [shipmentHeaders]);

  const allSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    shipmentHeaders
      .filter(header => header.shipment_type === 'inbound')
      .forEach(header => {
        if (header.supplier_name) suppliers.add(header.supplier_name);
      });
    return Array.from(suppliers).sort();
  }, [shipmentHeaders]);

  // Lọc dữ liệu nhập kho từ shipment headers
  const filteredInbound = useMemo(() => {
    let filtered = shipmentHeaders.filter((header) => {
      if (header.shipment_type !== 'inbound') return false;
      
      const matchesSearch = 
        header.shipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        header.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        header.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (!dateFrom || header.shipment_date >= dateFrom) &&
                         (!dateTo || header.shipment_date <= dateTo);
      
      const matchesType = filterType === 'all' || filterType === 'inbound';
      
      const matchesSupplier = filterSupplier === 'all' || header.supplier_name === filterSupplier;
      
      return matchesSearch && matchesDate && matchesType && matchesSupplier;
    });
    
    return filtered.sort((a, b) => new Date(b.shipment_date).getTime() - new Date(a.shipment_date).getTime());
  }, [shipmentHeaders, searchTerm, dateFrom, dateTo, filterType, filterSupplier]);

  // Lọc dữ liệu xuất kho từ shipment headers
  const filteredOutbound = useMemo(() => {
    let filtered = shipmentHeaders.filter((header) => {
      if (header.shipment_type !== 'outbound') return false;
      
      const matchesSearch = 
        header.shipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        header.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        header.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (!dateFrom || header.shipment_date >= dateFrom) &&
                         (!dateTo || header.shipment_date <= dateTo);
      
      const matchesType = filterType === 'all' || filterType === 'outbound';
      
      const matchesCustomer = filterCustomer === 'all' || header.customer_name === filterCustomer;
      
      return matchesSearch && matchesDate && matchesType && matchesCustomer;
    });
    
    return filtered.sort((a, b) => new Date(b.shipment_date).getTime() - new Date(a.shipment_date).getTime());
  }, [shipmentHeaders, searchTerm, dateFrom, dateTo, filterType, filterCustomer]);

  const handleViewDetails = (shipmentId: string, type: 'inbound' | 'outbound') => {
    if (type === 'inbound') {
      navigate(`/inbound-details/${shipmentId}`);
    } else {
      navigate(`/outbound-details/${shipmentId}`);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFilterType('all');
    setFilterCustomer('all');
    setFilterSupplier('all');
  };

  const totalInbound = filteredInbound.length;
  const totalOutbound = filteredOutbound.length;
  const totalTransactions = totalInbound + totalOutbound;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Invalid Date';
    }
  };

  const filteredTransactions = useMemo(() => {
    let transactions: any[] = [];
    
    // Thêm inbound shipments với type
    const inboundWithType = filteredInbound.map(header => ({
      ...header,
      type: 'inbound' as const,
      date: header.shipment_date,
      partner: header.supplier_name,
      quantity: header.total_quantity || 0,
      unit: 'N/A', // Sẽ lấy từ items sau
      content: header.content || 'N/A',
      ten_san_pham: 'N/A' // Sẽ lấy từ items sau
    }));
    
    // Thêm outbound shipments với type
    const outboundWithType = filteredOutbound.map(header => ({
      ...header,
      type: 'outbound' as const,
      date: header.shipment_date,
      partner: header.customer_name,
      quantity: header.total_quantity || 0,
      unit: 'N/A', // Sẽ lấy từ items sau
      content: header.content || 'N/A',
      ten_san_pham: 'N/A' // Sẽ lấy từ items sau
    }));

    if (tabValue === 0) {
      transactions = [...inboundWithType, ...outboundWithType];
    } else if (tabValue === 1) {
      transactions = inboundWithType;
    } else if (tabValue === 2) {
      transactions = outboundWithType;
    }

    return transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [tabValue, filteredInbound, filteredOutbound]);

  const isLoading = loadingInbound || loadingOutbound || loadingHeaders;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'primary.main' }}>
            Lịch Sử Giao Dịch
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
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
            onClick={clearFilters}
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
            Xóa Bộ Lọc
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Tổng giao dịch: {totalTransactions}
          </Typography>
          <Typography variant="body2">
            Nhập kho: {totalInbound}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            Xuất kho: {totalOutbound}
          </Typography>
        </Box>
      </Box>

      {/* Filter Dialog - Slide down from header */}
      <Slide direction="down" in={filterDialogOpen} mountOnEnter unmountOnExit>
        <Paper sx={{ p: 2, mb: 2, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Bộ Lọc Nâng Cao
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
              <FormControl size="small" fullWidth>
                <InputLabel>Loại giao dịch</InputLabel>
                <Select
                  value={filterType}
                  label="Loại giao dịch"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="inbound">Nhập kho</MenuItem>
                  <MenuItem value="outbound">Xuất kho</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select
                  value={filterSupplier}
                  label="Nhà cung cấp"
                  onChange={(e) => setFilterSupplier(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {allSuppliers.map((supplier) => (
                    <MenuItem key={supplier} value={supplier}>
                      {supplier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Khách hàng</InputLabel>
                <Select
                  value={filterCustomer}
                  label="Khách hàng"
                  onChange={(e) => setFilterCustomer(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {allCustomers.map((customer) => (
                    <MenuItem key={customer} value={customer}>
                      {customer}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs">
          <Tab 
            label={`TẤT CẢ (${totalTransactions})`} 
            icon={<CalendarIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`NHẬP KHO (${totalInbound})`} 
            icon={<InputIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`XUẤT KHO (${totalOutbound})`} 
            icon={<OutputIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* TransactionHistory Table - Optimized for space */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Mã Phiếu</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên Sản Phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Đối Tác</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Số Lượng</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Đơn Vị</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Nội Dung</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction, index) => (
                  <TableRow key={`${transaction.type}-${transaction.id}`} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type === 'inbound' ? 'Nhập' : 'Xuất'}
                        color={transaction.type === 'inbound' ? 'success' : 'error'}
                        size="small"
                        icon={transaction.type === 'inbound' ? <InputIcon /> : <OutputIcon />}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {transaction.shipment_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(transaction.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {transaction.ten_san_pham}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {transaction.partner}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.quantity?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {transaction.content}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(transaction.id, transaction.type)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      </Paper>
    </Box>
  );
};

export default TransactionHistory; 