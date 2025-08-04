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
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden', 
      mx: 'auto',
      height: '100vh-80px',
      mt: {xs:2,sm:0}
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 2 
      }}>
        <Box sx={{ display: {xs:'none',sm:'flex'}, alignItems: 'center', gap: 2 }}>
          <HistoryIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, 
            color: 'primary.main' 
          }}>
            Lịch Sử Giao Dịch
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            placeholder="Tìm kiếm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              flexGrow: { xs: 1, sm: 0 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: '35px', sm: '35px' },
                fontSize: { xs: '0.875rem', sm: '1rem' },
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
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'row', sm: 'row' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' }

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
                borderColor: 'primary.main',
                color: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                width: "auto",
                minWidth: "auto",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                },
                '& .MuiButton-startIcon': {
                  margin: 0,
                  marginRight: { xs: 0, md: '8px' }
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
                height: { xs: '35px', sm: '35px' },
                px: { xs: 1, sm: 2 },
                py: 1,
                borderColor: 'error.main',
                color: 'error.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                width: "auto",
                minWidth: "auto",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'white',
                  borderColor: 'error.light',
                },
                '& .MuiButton-startIcon': {
                  margin: 0,
                  marginRight: { xs: 0, md: '8px' }
                }
              }}
            >
              Xóa Bộ Lọc
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-end', sm: 'flex-end' }, 
        mb: 2 
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 2, sm: 3 }, 
          color: 'text.secondary', 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' }
        }}>
          <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
            Tổng giao dịch: {totalTransactions}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
            Nhập kho: {totalInbound}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'warning.main',
            fontSize: 'inherit'
          }}>
            Xuất kho: {totalOutbound}
          </Typography>
        </Box>
      </Box>

      {/* Filter Dialog - Slide down from header */}
      <Slide direction="down" in={filterDialogOpen} mountOnEnter unmountOnExit>
        <Paper sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: 2, 
          boxShadow: 3, 
          borderRadius: 2 
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: 'primary.main', 
            fontWeight: 600, 
            fontSize: { xs: '1rem', sm: '1.2rem' } 
          }}>
            Bộ Lọc Nâng Cao
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
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
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
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
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Loại giao dịch</InputLabel>
              <Select
                value={filterType}
                label="Loại giao dịch"
                onChange={(e) => setFilterType(e.target.value)}
                sx={{
                  height: { xs: '40px', sm: '35px' },
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="inbound">Nhập kho</MenuItem>
                <MenuItem value="outbound">Xuất kho</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Nhà cung cấp</InputLabel>
              <Select
                value={filterSupplier}
                label="Nhà cung cấp"
                onChange={(e) => setFilterSupplier(e.target.value)}
                sx={{
                  height: { xs: '40px', sm: '35px' },
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {allSuppliers.map((supplier) => (
                  <MenuItem key={supplier} value={supplier}>
                    {supplier}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Khách hàng</InputLabel>
              <Select
                value={filterCustomer}
                label="Khách hàng"
                onChange={(e) => setFilterCustomer(e.target.value)}
                sx={{
                  height: { xs: '40px', sm: '35px' },
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
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
        </Paper>
      </Slide>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 2,
        overflow: 'auto'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="transaction tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 'auto' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              height: { xs: '40px', sm: '35px' },
              padding: { xs: '6px 8px', sm: '6px 16px' }
            }
          }}
        >
          <Tab 
            label={`TẤT CẢ (${totalTransactions})`} 
            icon={<CalendarIcon />} 
            iconPosition="start"
            sx={{
              height: { xs: '40px', sm: '35px' },
            }}
          />
          <Tab 
            label={`NHẬP KHO (${totalInbound})`} 
            icon={<InputIcon />} 
            iconPosition="start"
            sx={{
              height: { xs: '40px', sm: '35px' },
            }}
          />
          <Tab 
            label={`XUẤT KHO (${totalOutbound})`} 
            icon={<OutputIcon />} 
            iconPosition="start"
            sx={{
              height: { xs: '40px', sm: '35px' },
            }}
          />
        </Tabs>
      </Box>

      {/* Desktop Table View */}
      <Paper sx={{ width: '100%', overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ 
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

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTransactions
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((transaction, index) => (
              <Card key={`${transaction.type}-${transaction.id}`} sx={{ 
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
                        {page * rowsPerPage + index + 1}.
                      </Typography>
                      <Chip
                        label={transaction.shipment_id}
                        color="primary"
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Chip
                      label={transaction.type === 'inbound' ? 'Nhập' : 'Xuất'}
                      color={transaction.type === 'inbound' ? 'success' : 'error'}
                      size="small"
                      icon={transaction.type === 'inbound' ? <InputIcon /> : <OutputIcon />}
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
                    {transaction.ten_san_pham}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Ngày:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{formatDate(transaction.date)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Đối tác:</Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.75rem',
                        maxWidth: '60%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {transaction.partner}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Số lượng:</Typography>
                      <Chip label={transaction.quantity?.toLocaleString()} color="info" size="small" sx={{ fontSize: '0.7rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Đơn vị:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{transaction.unit}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Nội dung:</Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.75rem',
                        maxWidth: '60%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {transaction.content}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(transaction.id, transaction.type)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
        
        {/* Mobile Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 1, 
          mt: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            sx={{ fontSize: '0.75rem' }}
          >
            Trước
          </Button>
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            Trang {page + 1} / {Math.ceil(filteredTransactions.length / rowsPerPage)}
          </Typography>
          <Button
            size="small"
            disabled={page >= Math.ceil(filteredTransactions.length / rowsPerPage) - 1}
            onClick={() => setPage(page + 1)}
            sx={{ fontSize: '0.75rem' }}
          >
            Sau
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionHistory; 