import React from 'react';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import ProtectedRoute from '../ProtectedRoute';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('ProtectedRoute', () => {
  const mockChildren = <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated User', () => {
    it('renders children when user is authenticated', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: true, isLoading: false } }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('renders children when user is authenticated and loading is false', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: true, isLoading: false, user: { id: '1', name: 'Test User' } } }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('does not render children when user is not authenticated', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: false, user: null } }
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', async () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: false, user: null } }
      );
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('does not redirect when already on login page', async () => {
      // Mock pathname to be login page
      jest.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
          replace: mockReplace,
        }),
        usePathname: () => '/login',
        useSearchParams: () => new URLSearchParams(),
        useParams: () => ({}),
      }));

      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: false, user: null } }
      );
      
      // Should not redirect if already on login page
      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when authentication is loading', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: true, user: null } }
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows loading text when authentication is loading', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: true, user: null } }
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not redirect when still loading', async () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: true, user: null } }
      );
      
      // Wait a bit to ensure no redirect happens during loading
      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Role-based Access', () => {
    it('renders children when user has required role', () => {
      render(
        <ProtectedRoute requiredRole="Admin">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Admin' } 
          } 
        }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('shows access denied when user lacks required role', () => {
      render(
        <ProtectedRoute requiredRole="Super Admin">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Basic' } 
          } 
        }
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('allows Super Admin access to all protected routes', () => {
      render(
        <ProtectedRoute requiredRole="Admin">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Super Admin' } 
          } 
        }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Permission-based Access', () => {
    it('renders children when user has required permission', () => {
      render(
        <ProtectedRoute requiredPermission="canCreate">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { 
              id: '1', 
              name: 'Test User', 
              permissions: { canCreate: true, canRead: true, canUpdate: false, canDelete: false } 
            } 
          } 
        }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('shows access denied when user lacks required permission', () => {
      render(
        <ProtectedRoute requiredPermission="canDelete">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { 
              id: '1', 
              name: 'Test User', 
              permissions: { canCreate: true, canRead: true, canUpdate: false, canDelete: false } 
            } 
          } 
        }
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Fallback Component', () => {
    it('renders custom fallback component when access is denied', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Access Denied</div>;
      
      render(
        <ProtectedRoute 
          requiredRole="Super Admin" 
          fallback={<CustomFallback />}
        >
          {mockChildren}
        </ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Basic' } 
          } 
        }
      );
      
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user object gracefully', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: true, isLoading: false, user: null } }
      );
      
      // Should redirect to login when user is null but isAuthenticated is true
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('handles missing permissions object', () => {
      render(
        <ProtectedRoute requiredPermission="canRead">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User' } // No permissions object
          } 
        }
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('handles invalid role gracefully', () => {
      render(
        <ProtectedRoute requiredRole="InvalidRole">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Admin' } 
          } 
        }
      );
      
      // Should show access denied for unrecognized role
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Multiple Requirements', () => {
    it('requires both role and permission when both are specified', () => {
      render(
        <ProtectedRoute requiredRole="Admin" requiredPermission="canDelete">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { 
              id: '1', 
              name: 'Test User', 
              role: 'Admin',
              permissions: { canCreate: true, canRead: true, canUpdate: true, canDelete: true }
            } 
          } 
        }
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('denies access if role matches but permission does not', () => {
      render(
        <ProtectedRoute requiredRole="Admin" requiredPermission="canDelete">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { 
              id: '1', 
              name: 'Test User', 
              role: 'Admin',
              permissions: { canCreate: true, canRead: true, canUpdate: true, canDelete: false }
            } 
          } 
        }
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for loading state', () => {
      render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: true, user: null } }
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading');
    });

    it('has proper heading for access denied', () => {
      render(
        <ProtectedRoute requiredRole="Super Admin">{mockChildren}</ProtectedRoute>,
        { 
          authValue: { 
            isAuthenticated: true, 
            isLoading: false, 
            user: { id: '1', name: 'Test User', role: 'Basic' } 
          } 
        }
      );
      
      expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: true, isLoading: false } }
      );
      
      // Re-render with same props
      rerender(<ProtectedRoute>{mockChildren}</ProtectedRoute>);
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('handles auth state changes efficiently', async () => {
      const { rerender } = render(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: false, isLoading: true, user: null } }
      );
      
      // Change to authenticated
      rerender(
        <ProtectedRoute>{mockChildren}</ProtectedRoute>,
        { authValue: { isAuthenticated: true, isLoading: false, user: { id: '1' } } }
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});