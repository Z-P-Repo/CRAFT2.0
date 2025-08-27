'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon 
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, user, router]);

  // Show loading while checking auth or during redirect
  if (!mounted || isLoading || (mounted && isAuthenticated)) {
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        {/* Hero Section */}
        <Paper elevation={3} sx={{ p: 6, mb: 6, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            CRAFT Permission System
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Advanced Attribute-Based Access Control (ABAC) System
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            Manage complex permissions and access control with our modern ABAC system. 
            Define fine-grained policies based on user attributes, resource properties, 
            and environmental conditions.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<DashboardIcon />}
              onClick={() => router.push('/register')}
            >
              Get Started
            </Button>
          </Box>
        </Paper>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Advanced Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Implement fine-grained access control with attribute-based policies 
                  that adapt to changing security requirements.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <DashboardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Intuitive Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage subjects, resources, actions, and policies through an 
                  easy-to-use web interface designed for administrators.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <SecurityIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Real-time Evaluation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test and evaluate access policies in real-time with our 
                  comprehensive policy testing framework.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Info */}
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            System Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Attribute-Based Access Control (ABAC) • Policy Management • 
            Real-time Evaluation • Subject & Resource Management • 
            Action Controls • Security Audit Trail
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}