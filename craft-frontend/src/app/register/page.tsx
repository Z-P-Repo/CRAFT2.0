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
import { PersonAdd as RegisterIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      const registerData: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      
      if (department.trim()) {
        registerData.department = department.trim();
      }
      
      await register(registerData);
      
      // Registration successful
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
      
    } catch (error: any) {
      // Error is handled by the auth context
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && name && email && password && confirmPassword) {
      handleSubmit();
    }
  };

  if (isLoading) {
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
            <RegisterIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your CRAFT Permission System account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Account created successfully! You will be redirected to the login page shortly.
            </Alert>
          )}

          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationErrors.name) {
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              disabled={isSubmitting || success}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              onKeyDown={handleKeyDown}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              disabled={isSubmitting || success}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              onKeyDown={handleKeyDown}
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="department"
              label="Department (Optional)"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isSubmitting || success}
              onKeyDown={handleKeyDown}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              disabled={isSubmitting || success}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              onKeyDown={handleKeyDown}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              disabled={isSubmitting || success}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              onKeyDown={handleKeyDown}
            />
            
            <Button
              onClick={handleSubmit}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isSubmitting || success || !name || !email || !password || !confirmPassword}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <RegisterIcon />}
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                New accounts are created with Basic user permissions
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  href="/login"
                  variant="body2"
                  sx={{ textDecoration: 'none' }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}