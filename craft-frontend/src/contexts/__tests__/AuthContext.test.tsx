import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@/__tests__/test-utils';
import { AuthProvider, useAuth } from '../AuthContext';
import { mockApiClient, mockApiResponse } from '@/__tests__/test-utils';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
}));

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

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Test component to access context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {isLoading && <span>Loading</span>}
        {isAuthenticated && <span>Authenticated</span>}
        {!isAuthenticated && !isLoading && <span>Not Authenticated</span>}
      </div>
      {user && <div data-testid="user-name">{user.name}</div>}
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-button">
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button onClick={checkAuth} data-testid="check-auth-button">
        Check Auth
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('starts with unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });

    it('checks auth on mount when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('existing-token');
      mockApiClient.validateToken.mockResolvedValue(
        mockApiResponse({
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'Admin',
          permissions: {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canManage: true,
          },
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });
    });

    it('handles invalid token on mount', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockApiClient.validateToken.mockResolvedValue(mockApiResponse(null, false));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      });
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      mockApiClient.login.mockResolvedValue(
        mockApiResponse({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'Admin',
            permissions: {
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canManage: true,
            },
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      });
    });

    it('handles login failure', async () => {
      mockApiClient.login.mockResolvedValue(
        mockApiResponse(null, false)
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });

    it('handles login network error', async () => {
      mockApiClient.login.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });

    it('shows loading state during login', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockApiClient.login.mockReturnValue(loginPromise);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      
      act(() => {
        fireEvent.click(loginButton);
      });

      // Should show loading state
      expect(screen.getByText('Loading')).toBeInTheDocument();

      // Resolve the login
      await act(async () => {
        resolveLogin!(mockApiResponse({
          user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
          accessToken: 'token',
          refreshToken: 'refresh',
        }));
      });

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Logout', () => {
    it('logs out user successfully', async () => {
      // First login the user
      mockApiClient.login.mockResolvedValue(
        mockApiResponse({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'Admin',
            permissions: {
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canManage: true,
            },
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      const loginButton = screen.getByTestId('login-button');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument();
      });

      // Now logout
      mockApiClient.logout.mockResolvedValue(mockApiResponse(null));
      const logoutButton = screen.getByTestId('logout-button');
      
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout API failure gracefully', async () => {
      // First login the user
      mockApiClient.login.mockResolvedValue(
        mockApiResponse({
          user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      const loginButton = screen.getByTestId('login-button');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      // Logout with API failure
      mockApiClient.logout.mockRejectedValue(new Error('Network error'));
      const logoutButton = screen.getByTestId('logout-button');
      
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        // Should still logout locally
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      });
    });
  });

  describe('Check Auth', () => {
    it('validates existing token', async () => {
      mockApiClient.validateToken.mockResolvedValue(
        mockApiResponse({
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'Admin',
          permissions: {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canManage: true,
          },
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const checkAuthButton = screen.getByTestId('check-auth-button');
      
      await act(async () => {
        fireEvent.click(checkAuthButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });
    });

    it('handles invalid token during check', async () => {
      mockApiClient.validateToken.mockResolvedValue(
        mockApiResponse(null, false)
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const checkAuthButton = screen.getByTestId('check-auth-button');
      
      await act(async () => {
        fireEvent.click(checkAuthButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing localStorage', () => {
      // Mock localStorage to be undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      expect(() => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      }).not.toThrow();
    });

    it('handles malformed token in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('malformed-token');
      mockApiClient.validateToken.mockRejectedValue(new Error('Invalid token format'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Context Provider', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('provides all expected context values', () => {
      const contextValues: any[] = [];
      
      const ContextConsumer = () => {
        const auth = useAuth();
        contextValues.push(auth);
        return null;
      };

      render(
        <AuthProvider>
          <ContextConsumer />
        </AuthProvider>
      );

      const auth = contextValues[0];
      expect(auth).toHaveProperty('user');
      expect(auth).toHaveProperty('isAuthenticated');
      expect(auth).toHaveProperty('isLoading');
      expect(auth).toHaveProperty('login');
      expect(auth).toHaveProperty('logout');
      expect(auth).toHaveProperty('checkAuth');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', async () => {
      let renderCount = 0;
      
      const RenderCounter = () => {
        renderCount++;
        const { isAuthenticated } = useAuth();
        return <div>{isAuthenticated ? 'Auth' : 'No Auth'}</div>;
      };

      render(
        <AuthProvider>
          <RenderCounter />
        </AuthProvider>
      );

      const initialRenderCount = renderCount;

      // Re-render should not increase count if state hasn't changed
      await waitFor(() => {
        expect(renderCount).toBe(initialRenderCount);
      });
    });

    it('batches state updates correctly', async () => {
      mockApiClient.login.mockResolvedValue(
        mockApiResponse({
          user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      let renderCount = 0;
      const RenderCounter = () => {
        renderCount++;
        const { isAuthenticated, user, isLoading } = useAuth();
        return <div>{isAuthenticated && user && !isLoading ? 'Ready' : 'Loading'}</div>;
      };

      render(
        <AuthProvider>
          <RenderCounter />
          <TestComponent />
        </AuthProvider>
      );

      const initialCount = renderCount;
      
      const loginButton = screen.getByTestId('login-button');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      // Should not have excessive re-renders
      expect(renderCount - initialCount).toBeLessThan(5);
    });
  });
});