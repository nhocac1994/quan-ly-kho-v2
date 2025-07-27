import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

// Context
import { InventoryProvider } from './context/InventoryContext';
import { AutoSyncProvider } from './contexts/AutoSyncContext';

// Components
import Layout from './components/Layout';
import { GoogleSheetsProvider } from './components/GoogleSheetsProvider';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import InboundShipments from './pages/InboundShipments';
import OutboundShipments from './pages/OutboundShipments';
import CompanyInfoPage from './pages/CompanyInfo';
import Users from './pages/Users';
import InboundDetails from './pages/InboundDetails';
import InboundShipmentDetails from './pages/InboundShipmentDetails';
import OutboundDetails from './pages/OutboundDetails';
import OutboundShipmentDetails from './pages/OutboundShipmentDetails';
import TransactionHistory from './pages/TransactionHistory';
import AutoSync from './pages/AutoSync';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GoogleSheetsProvider>
          <AutoSyncProvider>
            <InventoryProvider>
              <Router>
                <Box sx={{ display: 'flex', height: '100vh' }}>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/inbound" element={<InboundShipments />} />
                      <Route path="/outbound" element={<OutboundShipments />} />
                      <Route path="/company-info" element={<CompanyInfoPage />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/inbound-details" element={<InboundDetails />} />
                      <Route path="/inbound-details/:shipmentId" element={<InboundShipmentDetails />} />
                      <Route path="/outbound-details" element={<OutboundDetails />} />
                      <Route path="/outbound-details/:shipmentId" element={<OutboundShipmentDetails />} />
                      <Route path="/transaction-history" element={<TransactionHistory />} />
                      <Route path="/auto-sync" element={<AutoSync />} />
                    </Routes>
                  </Layout>
                </Box>
              </Router>
            </InventoryProvider>
          </AutoSyncProvider>
        </GoogleSheetsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
