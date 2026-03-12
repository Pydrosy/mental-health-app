import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Toolbar,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChatIcon from '@mui/icons-material/Chat';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonIcon from '@mui/icons-material/Person';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ScheduleIcon from '@mui/icons-material/Schedule';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle, isPatient, isTherapist }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const patientMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Find Therapists', icon: <PeopleIcon />, path: '/matching' },
    { text: 'My Sessions', icon: <CalendarTodayIcon />, path: '/my-sessions' },
    { text: 'Messages', icon: <ChatIcon />, path: '/chat' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const therapistMenu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/therapist/dashboard' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/therapist/profile' },
    { text: 'Availability', icon: <ScheduleIcon />, path: '/therapist/availability' },
    { text: 'Upcoming Sessions', icon: <EventAvailableIcon />, path: '/therapist/sessions' },
    { text: 'Messages', icon: <ChatIcon />, path: '/chat' },
  ];

  const menuItems = isPatient ? patientMenu : therapistMenu;

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {isPatient ? 'Patient' : 'Therapist'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isPatient ? 'Finding Help' : 'Providing Care'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
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
  );
};

export default Sidebar;