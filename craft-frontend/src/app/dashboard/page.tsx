'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  Security,
  People,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const stats = [
    { label: 'Active Policies', value: '24', icon: Security, color: 'primary' },
    { label: 'Total Subjects', value: '156', icon: People, color: 'success' },
    { label: 'System Health', value: '98%', icon: TrendingUp, color: 'info' },
    { label: 'Policy Tests', value: '42', icon: Assessment, color: 'warning' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Welcome back, <strong>{user?.name}</strong>! Here's an overview of your system.
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Icon sx={{ mr: 2, color: `${stat.color}.main` }} />
                    <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* User Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body2" fontWeight="medium">{user?.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body2" fontWeight="medium">{user?.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Role:</Typography>
                  <Chip 
                    label={user?.role?.toUpperCase()} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Department:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.department || 'Not specified'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={user?.active ? 'Active' : 'Inactive'} 
                    size="small"
                    color={user?.active ? 'success' : 'error'}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => router.push('/policies')}
                >
                  Manage Policies
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => router.push('/tester')}
                >
                  Test Policies
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => router.push('/subjects')}
                >
                  View Subjects
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ '& > *': { py: 1, borderBottom: '1px solid', borderColor: 'divider' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Policy "Admin Access" was updated</Typography>
                  <Typography variant="caption" color="text.secondary">2 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">New subject "John Doe" was created</Typography>
                  <Typography variant="caption" color="text.secondary">4 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Policy test completed successfully</Typography>
                  <Typography variant="caption" color="text.secondary">6 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none !important' }}>
                  <Typography variant="body2">System health check passed</Typography>
                  <Typography variant="caption" color="text.secondary">8 hours ago</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}