'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import azureAdService from '@/lib/azureAdService';

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const snackbar = useApiSnackbar();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth error parameters
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          setErrorMessage(errorDescription || `Authentication error: ${error}`);
          setStatus('error');
          return;
        }

        // Handle Azure AD redirect response
        const response = await azureAdService.handleRedirectPromise();
        
        if (response && response.account) {
          // Get the authorization code from URL if available
          const code = searchParams.get('code');
          
          if (code) {
            // Authenticate with backend using the code
            const backendResponse = await azureAdService.authenticateWithBackend(code);
            
            if (backendResponse.success) {
              // Store tokens and user data
              localStorage.setItem('accessToken', backendResponse.data.accessToken);
              if (backendResponse.data.refreshToken) {
                localStorage.setItem('refreshToken', backendResponse.data.refreshToken);
              }
              
              setStatus('success');
              snackbar.showSuccess('Azure AD authentication successful!');
              
              // Redirect to dashboard
              setTimeout(() => {
                router.replace('/dashboard');
              }, 1000);
            } else {
              throw new Error(backendResponse.error || 'Backend authentication failed');
            }
          } else {
            throw new Error('No authorization code received');
          }
        } else {
          // No response means user is not authenticated
          setErrorMessage('Authentication was not completed');
          setStatus('error');
        }
      } catch (error: any) {
        console.error('Authentication callback error:', error);
        setErrorMessage(error.message || 'Authentication failed');
        setStatus('error');
        snackbar.showError(error.message || 'Authentication failed');
        
        // Redirect to login after error
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };

    if (azureAdService.isConfigured()) {
      handleCallback();
    } else {
      setErrorMessage('Azure AD is not configured');
      setStatus('error');
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    }
  }, [searchParams, router, snackbar]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Completing Azure AD authentication...
        </Typography>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h5" color="success.main">
          Authentication Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Redirecting to dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 4,
      }}
    >
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Authentication Failed
        </Typography>
        <Typography variant="body2">
          {errorMessage || 'An unknown error occurred during authentication.'}
        </Typography>
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Redirecting to login page...
      </Typography>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}