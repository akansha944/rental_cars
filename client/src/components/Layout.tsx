import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Popover,
  ListItemAvatar,
  Chip,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import { dashboardApi } from '../api/endpoints';
import { AppNotification } from '../types';
import { BRAND_GRADIENT } from '../theme';

const drawerWidth = 256;

function BrandMark() {
  return (
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 2.5,
        background: BRAND_GRADIENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 18px -8px rgba(79,70,229,0.7)',
      }}
    >
      <DirectionsCarIcon sx={{ color: '#fff', fontSize: 22 }} />
    </Box>
  );
}

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Vehicles', icon: <DirectionsCarIcon />, path: '/vehicles' },
  { label: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { label: 'Rentals', icon: <ReceiptLongIcon />, path: '/rentals' },
  { label: 'Agreements', icon: <DescriptionIcon />, path: '/agreements' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export function Layout() {
  const { user, company, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await dashboardApi.notifications();
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNotifications = async (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    if (unread > 0) {
      await dashboardApi.markAllRead().catch(() => undefined);
      setUnread(0);
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.25, px: 2.5 }}>
        <BrandMark />
        <Box>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: '1.15rem',
              lineHeight: 1,
              background: BRAND_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RentalFlow
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Fleet manager
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ mx: 2 }} />
      <Typography
        variant="caption"
        sx={{ px: 3, pt: 2, pb: 0.5, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.06em' }}
      >
        MENU
      </Typography>
      <List sx={{ px: 1.5 }}>
        {navItems.map((item) => {
          const selected =
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{ my: 0.4, py: 1.1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            borderRadius: 3,
            p: 2,
            background: BRAND_GRADIENT,
            color: '#fff',
          }}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            RentalFlow Pro
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 1 }}>
            Unlock SMS reminders, branded agreements & more.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: (t) => alpha(t.palette.background.paper, 0.8),
          backdropFilter: 'saturate(180%) blur(12px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {company?.name ?? 'RentalFlow'}
          </Typography>

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggle}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <IconButton onClick={openNotifications}>
            <Badge badgeContent={unread} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ background: BRAND_GRADIENT, width: 38, height: 38 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <br />
              <Chip size="small" label={user?.role} sx={{ mt: 0.5 }} />
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ width: 360, maxHeight: 420, overflow: 'auto' }}>
              <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }} fontWeight={700}>
                Notifications
              </Typography>
              <Divider />
              {notifications.length === 0 ? (
                <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">
                  You're all caught up.
                </Typography>
              ) : (
                <List dense>
                  {notifications.map((n) => (
                    <ListItemButton key={n._id} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              n.severity === 'critical'
                                ? 'error.light'
                                : n.severity === 'warning'
                                ? 'warning.light'
                                : 'info.light',
                          }}
                        >
                          <WarningAmberIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={n.title} secondary={n.message} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          </Popover>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
