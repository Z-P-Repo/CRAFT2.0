'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken?: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState & { error: string | null } = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent flash
  error: null,
};

function authReducer(
  state: AuthState & { error: string | null },
  action: AuthAction
): AuthState & { error: string | null } {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false, // We know user is not authenticated after logout
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Define checkAuth first before useEffect
  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data,
            token,
            ...(localStorage.getItem('refreshToken') && {
              refreshToken: localStorage.getItem('refreshToken')!
            }),
          },
        });
      } else {
        // Invalid token, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      // Token validation failed, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    // Only check auth once on initial mount
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    
    initAuth();
    
    // Listen for auth errors from API client
    const handleAuthError = () => {
      if (mounted) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:error', handleAuthError);
      
      return () => {
        mounted = false;
        window.removeEventListener('auth:error', handleAuthError);
      };
    } else {
      return () => {
        mounted = false;
      };
    }
  }, []); // Empty dependency to run only once

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
            ...(response.data.refreshToken && {
              refreshToken: response.data.refreshToken
            }),
          },
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.error || error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiClient.register(userData);
      
      if (response.success) {
        // After successful registration, user needs to login
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.error || error.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };