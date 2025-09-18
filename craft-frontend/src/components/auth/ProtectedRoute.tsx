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

  // Show loading while checking auth or during redirect
  if (!mounted || isLoading || (mounted && !isAuthenticated && !user)) {
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

  // Only render children if we have both authentication and user data
  if (!isAuthenticated || !user) {
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

  return <>{children}</>;
}