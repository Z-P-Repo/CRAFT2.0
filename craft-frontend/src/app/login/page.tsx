'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Login as LoginIcon, Microsoft as MicrosoftIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import azureAdService from '@/lib/azureAdService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAzureAdSubmitting, setIsAzureAdSubmitting] = useState(false);
  const [azureAdEnabled, setAzureAdEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, isAuthenticated, isLoading, clearError } = useAuth();
  const snackbar = useApiSnackbar();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Initialize Azure AD and check if it's enabled
    const initializeAzureAd = async () => {
      try {
        console.log('🔍 Checking Azure AD configuration...');
        const isConfigured = azureAdService.isConfigured();
        console.log('✓ Azure AD isConfigured:', isConfigured);

        if (isConfigured) {
          await azureAdService.initialize();
          console.log('✓ Azure AD initialized');

          const config = await azureAdService.getBackendConfig();
          console.log('✓ Backend config:', config);

          const enabled = config?.enabled || false;
          console.log('✓ Setting azureAdEnabled to:', enabled);
          setAzureAdEnabled(enabled);
        } else {
          console.log('✗ Azure AD not configured');
          setAzureAdEnabled(false);
        }
      } catch (error) {
        console.error('❌ Failed to initialize Azure AD:', error);
        setAzureAdEnabled(false);
      }
    };

    initializeAzureAd();
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    // Clear any previous errors when component mounts
    if (mounted) {
      clearError();
    }
  }, [mounted, clearError]);

  const handleSubmit = async () => {
    if (!email || !password) {
      snackbar.showWarning('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      snackbar.showSuccess('Login successful! Welcome back.');
      // Navigation will happen via useEffect when isAuthenticated changes
    } catch (error: any) {
      // Error is handled by the auth context, but we can show additional feedback
      const errorMessage = error?.error || error?.message || 'Login failed. Please check your credentials.';
      snackbar.showError(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAzureAdLogin = async () => {
    if (!azureAdService.isConfigured()) {
      snackbar.showError('Azure AD is not configured');
      return;
    }

    setIsAzureAdSubmitting(true);
    
    try {
      // Use redirect method for Azure AD login
      await azureAdService.loginRedirect();
    } catch (error: any) {
      console.error('Azure AD login error:', error);
      snackbar.showError(
        error?.message || 'Azure AD login failed. Please try again.'
      );
      setIsAzureAdSubmitting(false);
    }
  };

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
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your CRAFT Permission System account
            </Typography>
          </Box>


          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              error={!email && isSubmitting}
              helperText={!email && isSubmitting ? 'Email is required' : ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting && email && password) {
                  handleSubmit();
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              error={!password && isSubmitting}
              helperText={!password && isSubmitting ? 'Password is required' : ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting && email && password) {
                  handleSubmit();
                }
              }}
            />
            
            <Button
              onClick={handleSubmit}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isSubmitting || !email || !password || isAzureAdSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Azure AD SSO Button - Debug: azureAdEnabled = {String(azureAdEnabled)} */}
            {azureAdEnabled && (
              <>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Button
                  onClick={handleAzureAdLogin}
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    mb: 3, 
                    py: 1.5,
                    borderColor: '#0078d4',
                    color: '#0078d4',
                    '&:hover': {
                      borderColor: '#106ebe',
                      backgroundColor: 'rgba(16, 110, 190, 0.04)',
                    }
                  }}
                  disabled={isSubmitting || isAzureAdSubmitting}
                  startIcon={isAzureAdSubmitting ? <CircularProgress size={20} /> : <MicrosoftIcon />}
                >
                  {isAzureAdSubmitting ? 'Redirecting...' : 'Sign in with Microsoft'}
                </Button>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  variant="body2"
                  sx={{ textDecoration: 'none' }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}