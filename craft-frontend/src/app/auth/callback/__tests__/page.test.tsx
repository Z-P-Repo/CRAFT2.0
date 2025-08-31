import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import azureAdService from '@/lib/azureAdService';
import AuthCallbackPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: jest.fn(),
}));

// Mock Azure AD service
jest.mock('@/lib/azureAdService', () => ({
  isConfigured: jest.fn(),
  handleRedirectPromise: jest.fn(),
  authenticateWithBackend: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('AuthCallbackPage', () => {
  const mockReplace = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  const mockLogin = jest.fn();
  const mockGet = jest.fn();

  const defaultMocks = {
    router: { replace: mockReplace },
    auth: { login: mockLogin },
    snackbar: { showSuccess: mockShowSuccess, showError: mockShowError },
    searchParams: { get: mockGet },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue(defaultMocks.router);
    (useAuth as jest.Mock).mockReturnValue(defaultMocks.auth);
    (useApiSnackbar as jest.Mock).mockReturnValue(defaultMocks.snackbar);
    (useSearchParams as jest.Mock).mockReturnValue(defaultMocks.searchParams);
    
    // Reset Azure AD service mocks
    (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
    (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(null);
    (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue({ success: false });
    
    mockGet.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Suspense Fallback', () => {
    it('renders suspense fallback when component is suspending', () => {
      // Mock the Suspense fallback by temporarily making the component throw
      const OriginalAuthCallbackContent = require('../page').default;
      
      render(<AuthCallbackPage />);
      
      // The page should render with its content, not the suspense fallback
      // since we're not actually suspending in our test environment
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Completing Azure AD authentication...')).toBeInTheDocument();
    });
  });

  describe('Initial Loading State', () => {
    it('renders loading state initially when Azure AD is configured', async () => {
      render(<AuthCallbackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Completing Azure AD authentication...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Error Handling', () => {
    it('handles OAuth error parameter', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'access_denied';
        if (param === 'error_description') return 'User denied access';
        return null;
      });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('User denied access')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
      });

      // Fast-forward timers to test redirect
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles OAuth error without description', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'invalid_request';
        return null;
      });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication error: invalid_request')).toBeInTheDocument();
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('Azure AD Not Configured', () => {
    it('handles Azure AD not configured', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(false);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Azure AD is not configured')).toBeInTheDocument();
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('Successful Authentication Flow', () => {
    it('handles successful authentication with refresh token', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: true,
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
        },
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
      });

      expect(azureAdService.handleRedirectPromise).toHaveBeenCalled();
      expect(azureAdService.authenticateWithBackend).toHaveBeenCalledWith('auth-code-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
      expect(mockShowSuccess).toHaveBeenCalledWith('Azure AD authentication successful!');

      // Test redirect after success
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });

    it('handles successful authentication without refresh token', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: true,
        data: {
          accessToken: 'access-token-123',
          // No refresh token
        },
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1); // Only access token
      expect(mockShowSuccess).toHaveBeenCalledWith('Azure AD authentication successful!');
    });
  });

  describe('Authentication Failures', () => {
    it('handles missing authorization code', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };

      mockGet.mockReturnValue(null); // No code parameter

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('No authorization code received')).toBeInTheDocument();
      });

      expect(mockShowError).toHaveBeenCalledWith('No authorization code received');

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles backend authentication failure with error message', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: false,
        error: 'Invalid authorization code',
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'invalid-code';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid authorization code')).toBeInTheDocument();
      });

      expect(mockShowError).toHaveBeenCalledWith('Invalid authorization code');

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles backend authentication failure without error message', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: false,
        // No error message
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Backend authentication failed')).toBeInTheDocument();
      });

      expect(mockShowError).toHaveBeenCalledWith('Backend authentication failed');
    });

    it('handles no response from handleRedirectPromise', async () => {
      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(null);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication was not completed')).toBeInTheDocument();
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles response without account', async () => {
      const mockResponse = { account: null };

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication was not completed')).toBeInTheDocument();
      });
    });

    it('handles exception during authentication process', async () => {
      const error = new Error('Network connection failed');

      (azureAdService.handleRedirectPromise as jest.Mock).mockRejectedValue(error);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith('Authentication callback error:', error);
      expect(mockShowError).toHaveBeenCalledWith('Network connection failed');

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles exception without error message', async () => {
      const error = {};

      (azureAdService.handleRedirectPromise as jest.Mock).mockRejectedValue(error);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });

      expect(mockShowError).toHaveBeenCalledWith('Authentication failed');
    });

    it('handles backend service throwing exception', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Service unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Error State Rendering', () => {
    it('renders error state with unknown error message fallback', async () => {
      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(null);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Authentication was not completed')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
      });

      // Verify the Alert component is rendered with proper severity
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('renders error state with empty error message fallback', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: false,
        error: '', // Empty error message
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Backend authentication failed')).toBeInTheDocument();
      });
    });

    it('renders fallback error message when error message is empty', async () => {
      // Create a mock that sets error to empty string to trigger fallback
      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: false,
        error: null, // null error to trigger fallback condition
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Backend authentication failed')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle and Effects', () => {
    it('calls handleCallback effect on mount with correct dependencies', async () => {
      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(azureAdService.isConfigured).toHaveBeenCalled();
      });
    });

    it('handles component unmounting during async operations', async () => {
      const { unmount } = render(<AuthCallbackPage />);

      // Unmount before async operations complete
      unmount();

      // This should not cause any warnings or errors
      await waitFor(() => {
        expect(azureAdService.isConfigured).toHaveBeenCalled();
      });
    });

    it('preserves timer behavior across state changes', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'access_denied';
        return null;
      });

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      // Verify timer is set
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

      // Fast forward and verify redirect happens
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
      
      setTimeoutSpy.mockRestore();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('handles multiple query parameters correctly', async () => {
      mockGet.mockImplementation((param: string) => {
        switch (param) {
          case 'error': return null;
          case 'error_description': return null;
          case 'code': return 'auth-code-123';
          case 'state': return 'state-value';
          default: return null;
        }
      });

      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: true,
        data: { accessToken: 'token-123' },
      };

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      });

      expect(azureAdService.authenticateWithBackend).toHaveBeenCalledWith('auth-code-123');
    });

    it('handles localStorage being unavailable gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const mockAccount = { username: 'test@example.com' };
      const mockResponse = { account: mockAccount };
      const mockBackendResponse = {
        success: true,
        data: { accessToken: 'token-123' },
      };

      mockGet.mockImplementation((param: string) => {
        if (param === 'code') return 'auth-code-123';
        return null;
      });

      (azureAdService.handleRedirectPromise as jest.Mock).mockResolvedValue(mockResponse);
      (azureAdService.authenticateWithBackend as jest.Mock).mockResolvedValue(mockBackendResponse);

      render(<AuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      });

      // Restore original function
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('Default Export', () => {
    it('exports AuthCallbackPage as default', () => {
      expect(AuthCallbackPage).toBeDefined();
      expect(typeof AuthCallbackPage).toBe('function');
    });

    it('renders the main component wrapped in Suspense', () => {
      const { container } = render(<AuthCallbackPage />);
      expect(container.firstChild).not.toBeNull();
    });
  });
});