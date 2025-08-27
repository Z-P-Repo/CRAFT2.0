'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      // Use replace to avoid back button issues
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Show loading states
  const shouldShowLoading = !mounted || isLoading || (mounted && !isAuthenticated);

  if (shouldShowLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: 'grey.50' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render children only if authenticated and has user data
  return isAuthenticated && user ? <>{children}</> : null;
}