import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Input as InputIcon,
  Output as OutputIcon,
  Sync as SyncIcon,
  Person as PersonIcon,
  ListAlt as ListAltIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { AutoSyncStatusIcon } from './AutoSyncStatus';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Sản phẩm', icon: <InventoryIcon />, path: '/products' },
  { text: 'Nhà cung cấp', icon: <BusinessIcon />, path: '/suppliers' },
  { text: 'Khách hàng', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Thông tin công ty', icon: <BusinessIcon />, path: '/company-info' },
  { text: 'Người dùng', icon: <PersonIcon />, path: '/users' },
  { text: 'Nhập kho', icon: <InputIcon />, path: '/inbound' },
  { text: 'Xuất kho', icon: <OutputIcon />, path: '/outbound' },
  { text: 'Lịch sử giao dịch', icon: <HistoryIcon />, path: '/transaction-history' },
  { text: 'Auto Sync', icon: <SyncIcon />, path: '/auto-sync' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Quản lý kho
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Hệ thống quản lý kho
          </Typography>
          <AutoSyncStatusIcon />
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
            p: 0,
            width: { sm: `calc(100vw - ${drawerWidth}px)` },
            height: '100vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbar />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
    </Box>
  );
};

export default Layout; 