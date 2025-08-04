import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Input as InputIcon,
  Output as OutputIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Wifi as WifiIcon,
  Language as LanguageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useSidebar } from '../contexts/SidebarContext';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed, currentDrawerWidth } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems = [
    { text: t('dashboard'), icon: <DashboardIcon />, path: '/' },
    { text: t('products'), icon: <InventoryIcon />, path: '/products' },
    { text: t('suppliers_management'), icon: <BusinessIcon />, path: '/suppliers' },
    { text: t('customers_management'), icon: <PeopleIcon />, path: '/customers' },
    { text: t('company_info'), icon: <BusinessIcon />, path: '/company-info' },
    { text: t('users'), icon: <PersonIcon />, path: '/users' },
    { text: t('inbound_shipments'), icon: <InputIcon />, path: '/inbound' },
    { text: t('outbound_shipments'), icon: <OutputIcon />, path: '/outbound' },
    { text: t('transaction_history'), icon: <HistoryIcon />, path: '/transaction-history' },
    { text: 'Báo cáo XNT', icon: <AssessmentIcon />, path: '/inventory-report' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header của Sidebar */}
      <Box
        sx={{
          background: '#667eea',
          color: 'white',
          p: sidebarCollapsed ? 1 : 2,
          textAlign: 'center',
          minHeight: 65,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Quản Lý Kho
          </Typography>
        )}
        
        {/* Toggle Button */}
        <IconButton
          onClick={handleSidebarToggle}
          sx={{
            position: 'absolute',
            right: sidebarCollapsed ? '50%' : 8,
            top: '50%',
            transform: sidebarCollapsed ? 'translate(50%, -50%)' : 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip 
                title={sidebarCollapsed ? item.text : ''} 
                placement="right"
                disableHoverListener={!sidebarCollapsed}
              >
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: sidebarCollapsed ? 0.5 : 1,
                    borderRadius: sidebarCollapsed ? 1 : 2,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    minHeight: 48,
                    '&.Mui-selected': {
                      background: '#667eea',
                      color: 'white',
                      '&:hover': {
                        background: '#667eea',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: sidebarCollapsed ? 1 : 2,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarCollapsed ? 0 : 40,
                      color: location.pathname === item.path ? 'white' : 'text.secondary',
                      margin: sidebarCollapsed ? 0 : undefined,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText 
                      primary={item.text} 
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '0.9rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer của Sidebar */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          background: 'background.paper',
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © 2025 Quản lý kho
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          background: '#667eea',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar sx={{ minHeight: 65 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Breadcrumb */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontSize: '1.3rem', 
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Database Connection Status */}
            <Tooltip title="Đang kết nối database" arrow placement="bottom">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                <WifiIcon sx={{ fontSize: 22, color: 'rgba(51, 237, 76, 0.9)' }} />
              </Box>
            </Tooltip>
            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, ml: 1 }}>
               <LanguageIcon sx={{ fontSize: 22, color: 'rgba(51, 237, 76, 0.9)' }} />
            </Box> */}
          </Box>
        </Toolbar>
      </AppBar>
              <Box
          component="nav"
          sx={{ 
            width: { sm: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth }, 
            flexShrink: { sm: 0 },
            transition: 'width 0.3s ease',
          }}
          aria-label="mailbox folders"
        >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
              transition: 'width 0.3s ease',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
              background: 'white',
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { xs: '100vw', sm: `calc(100vw - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
              height: '100vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#f5f7fa',
              transition: 'width 0.3s ease',
            }}
          >
            <Toolbar />
            <Box 
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                p: 0,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}
            >
              {children}
            </Box>
          </Box>
    </Box>
  );
};

export default Layout; 