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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Lịch Sử Giao Dịch
        </Typography>

        {/* Thống kê */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng Giao Dịch
              </Typography>
              <Typography variant="h4">
                {totalTransactions}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đơn Nhập Kho
              </Typography>
              <Typography variant="h4" color="success.main">
                {totalInbound}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đơn Xuất Kho
              </Typography>
              <Typography variant="h4" color="error.main">
                {totalOutbound}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Bộ lọc */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Bộ Lọc
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <TextField
                fullWidth
                type="date"
                label="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <TextField
                fullWidth
                type="date"
                label="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth>
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
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth>
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
            <Box sx={{ minWidth: 100 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
              >
                Xóa
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
      </Box>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tab: Tất cả */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
            <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Loại</TableCell>
                    <TableCell>Mã Phiếu</TableCell>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Tên Sản Phẩm</TableCell>
                    <TableCell>Đối Tác</TableCell>
                    <TableCell align="right">Số Lượng</TableCell>
                    <TableCell>Đơn Vị</TableCell>
                    <TableCell>Nội Dung</TableCell>
                    <TableCell align="center">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                                     {[...filteredInbound, ...filteredOutbound]
                     .sort((a, b) => {
                       const dateA = 'ngay_nhap' in a ? (a as InboundShipment).ngay_nhap : (a as OutboundShipment).ngay_xuat;
                       const dateB = 'ngay_nhap' in b ? (b as InboundShipment).ngay_nhap : (b as OutboundShipment).ngay_xuat;
                       return new Date(dateB).getTime() - new Date(dateA).getTime();
                     })
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((transaction) => {
                      const isInbound = 'ngay_nhap' in transaction;
                      const transactionData = transaction as InboundShipment | OutboundShipment;
                      
                      return (
                        <TableRow key={`${isInbound ? 'inbound' : 'outbound'}-${transactionData.id}`} hover>
                          <TableCell>
                            <Chip
                              label={isInbound ? 'Nhập' : 'Xuất'}
                              color={isInbound ? 'success' : 'error'}
                              size="small"
                              icon={isInbound ? <InputIcon /> : <OutputIcon />}
                            />
                          </TableCell>
                          <TableCell>{transactionData.id}</TableCell>
                                                   <TableCell>
                           {new Date(isInbound ? (transactionData as InboundShipment).ngay_nhap : (transactionData as OutboundShipment).ngay_xuat).toLocaleDateString('vi-VN')}
                         </TableCell>
                          <TableCell>{transactionData.ten_san_pham}</TableCell>
                          <TableCell>{isInbound ? (transactionData as InboundShipment).ten_nha_cung_cap : (transactionData as OutboundShipment).ten_khach_hang}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={isInbound ? (transactionData as InboundShipment).sl_nhap : (transactionData as OutboundShipment).sl_xuat}
                              color="info"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{transactionData.dvt}</TableCell>
                          <TableCell>{isInbound ? (transactionData as InboundShipment).noi_dung_nhap : (transactionData as OutboundShipment).noi_dung_xuat}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(transactionData.id, isInbound ? 'inbound' : 'outbound')}
                              title="Xem chi tiết"
                            >
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={[...filteredInbound, ...filteredOutbound].length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Số hàng mỗi trang:"
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </Paper>
        </TabPanel>

        {/* Tab: Nhập kho */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
            <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã Phiếu</TableCell>
                    <TableCell>Ngày Nhập</TableCell>
                    <TableCell>Tên Sản Phẩm</TableCell>
                    <TableCell>Nhà Cung Cấp</TableCell>
                    <TableCell align="right">Số Lượng</TableCell>
                    <TableCell>Đơn Vị</TableCell>
                    <TableCell>Nội Dung</TableCell>
                    <TableCell align="center">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInbound
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((shipment) => (
                      <TableRow key={shipment.id} hover>
                        <TableCell>{shipment.id}</TableCell>
                        <TableCell>{new Date(shipment.ngay_nhap).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{shipment.ten_san_pham}</TableCell>
                        <TableCell>{shipment.ten_nha_cung_cap}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={shipment.sl_nhap}
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{shipment.dvt}</TableCell>
                        <TableCell>{shipment.noi_dung_nhap}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(shipment.id, 'inbound')}
                            title="Xem chi tiết"
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
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredInbound.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Số hàng mỗi trang:"
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </Paper>
        </TabPanel>

        {/* Tab: Xuất kho */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', mx: 3, mb: 3 }}>
            <TableContainer sx={{ flex: 1, maxHeight: 'none' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã Phiếu</TableCell>
                    <TableCell>Ngày Xuất</TableCell>
                    <TableCell>Tên Sản Phẩm</TableCell>
                    <TableCell>Khách Hàng</TableCell>
                    <TableCell align="right">Số Lượng</TableCell>
                    <TableCell>Đơn Vị</TableCell>
                    <TableCell>Nội Dung</TableCell>
                    <TableCell align="center">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOutbound
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((shipment) => (
                      <TableRow key={shipment.id} hover>
                        <TableCell>{shipment.id}</TableCell>
                        <TableCell>{new Date(shipment.ngay_xuat).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{shipment.ten_san_pham}</TableCell>
                        <TableCell>{shipment.ten_khach_hang}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={shipment.sl_xuat}
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{shipment.dvt}</TableCell>
                        <TableCell>{shipment.noi_dung_xuat}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(shipment.id, 'outbound')}
                            title="Xem chi tiết"
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
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredOutbound.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Số hàng mỗi trang:"
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </Paper>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default TransactionHistory; 