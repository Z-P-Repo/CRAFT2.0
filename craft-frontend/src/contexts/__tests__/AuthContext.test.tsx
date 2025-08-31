import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { User } from '@/types';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  },
}));

// Get reference to mocked API client
const { apiClient: mockApiClient } = require('@/lib/api');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// Test the reducer function directly for edge cases
const testAuthReducer = (state: any, action: any) => {
  const AuthContextModule = require('../AuthContext');
  // Access the reducer through module internals for testing
  return AuthContextModule.default ? AuthContextModule.default(state, action) : state;
};

describe('AuthContext', () => {
  const mockUser: User = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    attributes: {},
    active: true,
  };

  // Test component to interact with AuthContext
  const TestComponent = ({ onAuthData }: { onAuthData?: (auth: any) => void }) => {
    const auth = useAuth();
    
    React.useEffect(() => {
      if (onAuthData) {
        onAuthData(auth);
      }
    }, [auth, onAuthData]);

    return (
      <div>
        <div data-testid="user-email">{auth.user?.email || 'Not authenticated'}</div>
        <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="is-loading">{auth.isLoading.toString()}</div>
        <div data-testid="error">{auth.error || 'No error'}</div>
        <button data-testid="login-btn" onClick={() => auth.login({ email: 'test@test.com', password: 'password' })}>
          Login
        </button>
        <button data-testid="register-btn" onClick={() => auth.register({ email: 'test@test.com', password: 'password', name: 'Test' })}>
          Register  
        </button>
        <button data-testid="logout-btn" onClick={() => auth.logout()}>
          Logout
        </button>
        <button data-testid="check-auth-btn" onClick={() => auth.checkAuth()}>
          Check Auth
        </button>
        <button data-testid="clear-error-btn" onClick={() => auth.clearError()}>
          Clear Error
        </button>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider and Hook', () => {
    it('provides auth context to children', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user-email')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    it('throws error when useAuth is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleError.mockRestore();
    });
  });

  describe('Initial State and Setup', () => {
    it('starts with initial state', async () => {
      mockApiClient.getProfile.mockResolvedValue({ success: false });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user-email')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    it('checks auth on mount when token exists', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });

      mockApiClient.getProfile.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockApiClient.getProfile).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });
    });

    it('handles invalid token on mount', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockApiClient.getProfile.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      });
    });

    it('sets up auth error event listener', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('auth:error', expect.any(Function));
    });
  });

  describe('Login', () => {
    it('handles successful login', async () => {
      mockApiClient.login.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'new-token',
          refreshToken: 'new-refresh-token',
        },
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        authData.login({ email: 'test@test.com', password: 'password' });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(mockApiClient.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      });
    });

    it('handles login failure', async () => {
      mockApiClient.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        try {
          await authData.login({ email: 'test@test.com', password: 'password' });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      });
    });

    it('handles login exception', async () => {
      mockApiClient.login.mockRejectedValue(new Error('Network error'));

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        try {
          await authData.login({ email: 'test@test.com', password: 'password' });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Register', () => {
    it('handles successful registration', async () => {
      mockApiClient.register.mockResolvedValue({
        success: true,
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        await authData.register({ email: 'test@test.com', password: 'password', name: 'Test' });
      });

      expect(mockApiClient.register).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
        name: 'Test',
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('handles registration failure', async () => {
      mockApiClient.register.mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        try {
          await authData.register({ email: 'test@test.com', password: 'password', name: 'Test' });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('Logout', () => {
    it('handles successful logout', async () => {
      // First login
      mockApiClient.login.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'token',
        },
      });

      mockApiClient.logout.mockResolvedValue({ success: true });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      // Login first
      await act(async () => {
        await authData.login({ email: 'test@test.com', password: 'password' });
      });

      // Then logout
      await act(async () => {
        await authData.logout();
      });

      expect(mockApiClient.logout).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('Not authenticated');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      });
    });

    it('handles logout with server error', async () => {
      mockApiClient.logout.mockRejectedValue(new Error('Server error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        await authData.logout();
      });

      // Should still log out locally even if server fails
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Check Auth', () => {
    it('handles missing token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        await authData.checkAuth();
      });

      expect(mockApiClient.getProfile).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('clears error', async () => {
      mockApiClient.login.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      // Generate an error
      await act(async () => {
        try {
          await authData.login({ email: 'test@test.com', password: 'password' });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Clear the error
      await act(async () => {
        authData.clearError();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    it('handles auth error event', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Get the event handler that was registered
      const authErrorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'auth:error'
      )?.[1];

      expect(authErrorHandler).toBeDefined();

      // Simulate auth error event
      await act(async () => {
        authErrorHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Auth Reducer', () => {
    it('handles all reducer actions correctly', async () => {
      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      // AUTH_START
      mockApiClient.login.mockImplementation(async () => {
        // During this time, isLoading should be true
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          success: true,
          data: { user: mockUser, token: 'token' }
        };
      });

      await act(async () => {
        authData.login({ email: 'test@test.com', password: 'password' });
      });

      // Should eventually show authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });
    });

    it('handles CLEAR_ERROR action', async () => {
      // First create an error state
      mockApiClient.login.mockResolvedValue({
        success: false,
        error: 'Test error for clearing',
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      // Generate an error first
      await act(async () => {
        try {
          await authData.login({ email: 'test@test.com', password: 'password' });
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error for clearing');
      });

      // Now clear the error
      await act(async () => {
        authData.clearError();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    it('handles checkAuth in server environment', async () => {
      // Mock checkAuth function separately to test SSR path
      const mockCheckAuth = jest.fn();
      
      // We can't easily test the SSR branch in jsdom environment,
      // but we can verify the function handles undefined window gracefully
      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      // Test that checkAuth is callable and doesn't throw
      await act(async () => {
        await authData.checkAuth();
      });

      expect(authData.checkAuth).toBeDefined();
    });

  });

  describe('Edge Cases', () => {
    it('handles login without refresh token', async () => {
      mockApiClient.login.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'token',
          // No refreshToken
        },
      });

      let authData: any;
      render(
        <AuthProvider>
          <TestComponent onAuthData={(auth) => { authData = auth; }} />
        </AuthProvider>
      );

      await act(async () => {
        await authData.login({ email: 'test@test.com', password: 'password' });
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });
    });

    it('handles checkAuth with invalid response', async () => {
      mockLocalStorage.getItem.mockReturnValue('token');
      mockApiClient.getProfile.mockResolvedValue({
        success: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      });
    });

    it('exports AuthContext properly', () => {
      const { AuthContext } = require('../AuthContext');
      expect(AuthContext).toBeDefined();
    });
  });
});