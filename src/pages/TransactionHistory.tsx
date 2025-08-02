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
  Grid,
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
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
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
  const { state } = useInventory();
  const { inboundShipments, outboundShipments } = state;
  
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');

  // Lấy danh sách khách hàng và nhà cung cấp unique
  const allCustomers = useMemo(() => {
    const customers = new Set<string>();
            inboundShipments.forEach(s => customers.add(s.ten_nha_cung_cap));
          outboundShipments.forEach(s => customers.add(s.ten_khach_hang));
    return Array.from(customers).sort();
  }, [inboundShipments, outboundShipments]);

  // Lọc dữ liệu nhập kho
  const filteredInbound = useMemo(() => {
    let filtered = inboundShipments.filter((shipment: InboundShipment) => {
      const matchesSearch = 
        shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.ten_nha_cung_cap.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (!dateFrom || shipment.ngay_nhap >= dateFrom) &&
                         (!dateTo || shipment.ngay_nhap <= dateTo);
      
      const matchesType = filterType === 'all' || filterType === 'inbound';
      
      const matchesCustomer = filterCustomer === 'all' || shipment.ten_nha_cung_cap === filterCustomer;
      
      return matchesSearch && matchesDate && matchesType && matchesCustomer;
    });
    
    return filtered.sort((a, b) => new Date(b.ngay_nhap).getTime() - new Date(a.ngay_nhap).getTime());
  }, [inboundShipments, searchTerm, dateFrom, dateTo, filterType, filterCustomer]);

  // Lọc dữ liệu xuất kho
  const filteredOutbound = useMemo(() => {
    let filtered = outboundShipments.filter((shipment: OutboundShipment) => {
      const matchesSearch = 
        shipment.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (!dateFrom || shipment.ngay_xuat >= dateFrom) &&
                         (!dateTo || shipment.ngay_xuat <= dateTo);
      
      const matchesType = filterType === 'all' || filterType === 'outbound';
      
      const matchesCustomer = filterCustomer === 'all' || shipment.ten_khach_hang === filterCustomer;
      
      return matchesSearch && matchesDate && matchesType && matchesCustomer;
    });
    
    return filtered.sort((a, b) => new Date(b.ngay_xuat).getTime() - new Date(a.ngay_xuat).getTime());
  }, [outboundShipments, searchTerm, dateFrom, dateTo, filterType, filterCustomer]);

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
  };

  const totalInbound = filteredInbound.length;
  const totalOutbound = filteredOutbound.length;
  const totalTransactions = totalInbound + totalOutbound;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const filteredTransactions = useMemo(() => {
    let transactions: any[] = [];
    if (tabValue === 0) {
      transactions = [...filteredInbound, ...filteredOutbound];
    } else if (tabValue === 1) {
      transactions = filteredInbound;
    } else if (tabValue === 2) {
      transactions = filteredOutbound;
    }

    transactions = transactions.filter((transaction) => {
      const matchesSearch = 
        transaction.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.xuat_kho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (!dateFrom || new Date(transaction.ngay_nhap).getTime() >= new Date(dateFrom).getTime()) &&
                         (!dateTo || new Date(transaction.ngay_nhap).getTime() <= new Date(dateTo).getTime());
      
      const matchesType = filterType === 'all' || (transaction.type === 'inbound' && filterType === 'inbound') || (transaction.type === 'outbound' && filterType === 'outbound');
      
      const matchesCustomer = filterCustomer === 'all' || transaction.ten_nha_cung_cap === filterCustomer || transaction.ten_khach_hang === filterCustomer;
      
      return matchesSearch && matchesDate && matchesType && matchesCustomer;
    });

    return transactions.sort((a, b) => {
      const dateA = 'ngay_nhap' in a ? (a as InboundShipment).ngay_nhap : (a as OutboundShipment).ngay_xuat;
      const dateB = 'ngay_nhap' in b ? (b as InboundShipment).ngay_nhap : (b as OutboundShipment).ngay_xuat;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [tabValue, searchTerm, dateFrom, dateTo, filterType, filterCustomer, filteredInbound, filteredOutbound]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            onClick={clearFilters}
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

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            type="date"
            label="Từ ngày"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <TextField
            type="date"
            label="Đến ngày"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs">
          <Tab 
            label={`Tất cả (${totalTransactions})`} 
            icon={<CalendarIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`Nhập kho (${totalInbound})`} 
            icon={<InputIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`Xuất kho (${totalOutbound})`} 
            icon={<OutputIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* TransactionHistory Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Loại</TableCell>
                <TableCell>Mã Phiếu</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>Đối Tác</TableCell>
                <TableCell>Số Lượng</TableCell>
                <TableCell>Đơn Vị</TableCell>
                <TableCell>Nội Dung</TableCell>
                <TableCell align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Chip
                        label={transaction.type === 'inbound' ? 'Nhập' : 'Xuất'}
                        color={transaction.type === 'inbound' ? 'success' : 'error'}
                        size="small"
                        icon={transaction.type === 'inbound' ? <InputIcon /> : <OutputIcon />}
                      />
                    </TableCell>
                    <TableCell>{transaction.xuat_kho_id}</TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.ten_san_pham}</TableCell>
                    <TableCell>{transaction.partner}</TableCell>
                    <TableCell>{transaction.quantity?.toLocaleString()}</TableCell>
                    <TableCell>{transaction.unit}</TableCell>
                    <TableCell>{transaction.content}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(transaction.id, transaction.type)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
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
        />
      </Paper>
    </Box>
  );
};

export default TransactionHistory; 