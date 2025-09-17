'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Stack,
  Alert,
  Chip,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  AccountCircle as ProfileIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleProtection from '@/components/auth/RoleProtection';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true
  });
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  const { user } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotifications(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  return (
    <RoleProtection allowedRoles={['admin', 'super_admin']}>
      <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your application preferences and account settings
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<ProfileIcon />} label="Profile" />
            <Tab icon={<NotificationIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<ThemeIcon />} label="Appearance" />
            <Tab icon={<LanguageIcon />} label="Language" />
          </Tabs>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Typography variant="h6">Profile Settings</Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Account Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Name"
                      value={user?.name || ''}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      label="Email"
                      value={user?.email || ''}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Role
                      </Typography>
                      <Chip 
                        label={user?.role || 'Unknown'} 
                        color="primary" 
                        size="small"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info">
                Contact your administrator to update profile information.
              </Alert>
            </Stack>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Typography variant="h6">Notification Preferences</Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive notifications via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notifications.email}
                          onChange={handleNotificationChange('email')}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Push Notifications"
                        secondary="Receive browser push notifications"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notifications.push}
                          onChange={handleNotificationChange('push')}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Desktop Notifications"
                        secondary="Show desktop notifications when app is open"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notifications.desktop}
                          onChange={handleNotificationChange('desktop')}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <Typography variant="h6">Security Settings</Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Password & Authentication
                  </Typography>
                  <Stack spacing={2}>
                    <Button variant="outlined" disabled>
                      Change Password
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Password changes are managed through your organization's authentication system.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Session Management
                  </Typography>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Active sessions and login history are managed centrally.
                    </Typography>
                    <Button variant="outlined" size="small">
                      View Active Sessions
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={3}>
            <Stack spacing={3}>
              <Typography variant="h6">Appearance Settings</Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Theme
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={theme === 'dark'}
                          onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                        />
                      }
                      label="Dark Mode"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Switch between light and dark themes.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info">
                Theme changes will take effect after refreshing the page.
              </Alert>
            </Stack>
          </TabPanel>

          {/* Language Tab */}
          <TabPanel value={tabValue} index={4}>
            <Stack spacing={3}>
              <Typography variant="h6">Language & Region</Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Display Language
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      select
                      label="Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </TextField>
                    <Typography variant="body2" color="text.secondary">
                      Changes will take effect after refreshing the page.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info">
                Additional languages may be available based on your organization's configuration.
              </Alert>
            </Stack>
          </TabPanel>
        </Paper>
      </Box>
      </DashboardLayout>
    </RoleProtection>
  );
}