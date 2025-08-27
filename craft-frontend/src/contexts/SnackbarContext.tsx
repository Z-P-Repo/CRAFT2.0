'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

export interface SnackbarMessage {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  action?: ReactNode;
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor, duration?: number, action?: ReactNode) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// Custom slide transition
const SlideTransition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement<any, any> }
>(function SlideTransition(props, ref) {
  const { appear = true, enter = true, exit = true, ...otherProps } = props;
  return (
    <Slide 
      direction="down" 
      ref={ref} 
      appear={appear}
      enter={enter}
      exit={exit}
      {...otherProps} 
    />
  );
});

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);

  const showSnackbar = useCallback((
    message: string, 
    severity: AlertColor = 'info', 
    duration: number = 4000,
    action?: ReactNode
  ) => {
    const id = Date.now().toString();
    setSnackbar({
      id,
      message,
      severity,
      duration,
      action
    });
  }, []);

  const showSuccess = useCallback((message: string, duration: number = 4000) => {
    showSnackbar(message, 'success', duration);
  }, [showSnackbar]);

  const showError = useCallback((message: string, duration: number = 6000) => {
    showSnackbar(message, 'error', duration);
  }, [showSnackbar]);

  const showWarning = useCallback((message: string, duration: number = 5000) => {
    showSnackbar(message, 'warning', duration);
  }, [showSnackbar]);

  const showInfo = useCallback((message: string, duration: number = 4000) => {
    showSnackbar(message, 'info', duration);
  }, [showSnackbar]);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const handleClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    hideSnackbar();
  }, [hideSnackbar]);

  const value: SnackbarContextType = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideSnackbar,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar && (
        <Snackbar
          open={!!snackbar}
          autoHideDuration={snackbar.duration ?? null}
          onClose={handleClose}
          TransitionComponent={SlideTransition}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{
            top: { xs: 16, sm: 24 },
            '& .MuiSnackbarContent-root': {
              padding: 0,
            }
          }}
        >
          <Alert
            onClose={handleClose}
            severity={snackbar.severity}
            variant="filled"
            action={snackbar.action}
            sx={{
              width: '100%',
              minWidth: 300,
              maxWidth: 600,
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '& .MuiAlert-message': {
                padding: '8px 0',
              },
              '& .MuiAlert-action': {
                paddingLeft: 2,
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

// Utility functions for common API response patterns
export const useApiSnackbar = () => {
  const snackbar = useSnackbar();

  const handleApiResponse = useCallback((
    response: any, 
    successMessage?: string,
    errorMessage?: string
  ) => {
    if (response.success) {
      snackbar.showSuccess(
        successMessage || response.message || 'Operation completed successfully'
      );
    } else {
      snackbar.showError(
        errorMessage || response.error || response.message || 'An error occurred'
      );
    }
  }, [snackbar]);

  const handleApiError = useCallback((error: any, fallbackMessage?: string) => {
    const message = error?.response?.data?.error || 
                   error?.response?.data?.message ||
                   error?.message ||
                   fallbackMessage ||
                   'An unexpected error occurred';
    snackbar.showError(message);
  }, [snackbar]);

  return {
    ...snackbar,
    handleApiResponse,
    handleApiError,
  };
};

export { SnackbarContext };