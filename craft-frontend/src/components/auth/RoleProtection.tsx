'use client';

import React from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectionProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleProtection({
  allowedRoles,
  children,
  fallback
}: RoleProtectionProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user has required role
  const hasAccess = user?.role && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Alert
          severity="error"
          sx={{ maxWidth: 500, width: '100%' }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
          }
        >
          <AlertTitle>Access Denied</AlertTitle>
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}