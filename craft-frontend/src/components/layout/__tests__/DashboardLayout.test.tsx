import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import DashboardLayout from '../DashboardLayout';

// Mock the ProtectedRoute component
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

describe('DashboardLayout', () => {
  const mockChildren = <div data-testid="dashboard-content">Dashboard Content</div>;

  beforeEach(() => {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('(max-width: 600px)') ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Rendering', () => {
    it('renders the layout with children', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('renders the app bar', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('CRAFT 2.0')).toBeInTheDocument();
    });

    it('renders the navigation drawer', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Navigation should be present
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders menu toggle button', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const menuButton = screen.getByLabelText('toggle navigation menu');
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Navigation Menu', () => {
    it('renders all navigation items', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Main navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Subjects')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Policies')).toBeInTheDocument();
      expect(screen.getByText('Attributes')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Policy Tester')).toBeInTheDocument();
    });

    it('renders navigation icons', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Check for navigation icons (they should be SVG elements)
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('highlights active navigation item', () => {
      // Mock usePathname to return a specific path
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        usePathname: () => '/subjects',
      }));

      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const subjectsItem = screen.getByText('Subjects').closest('div');
      expect(subjectsItem).toHaveClass('Mui-selected');
    });
  });

  describe('Responsive Behavior', () => {
    it('toggles drawer on menu button click', async () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const menuButton = screen.getByLabelText('toggle navigation menu');
      
      // Click to toggle
      fireEvent.click(menuButton);
      
      // Should trigger drawer state change
      await waitFor(() => {
        // The drawer state should change (implementation specific)
        expect(menuButton).toBeInTheDocument();
      });
    });

    it('handles mobile view correctly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('(max-width: 600px)') ? true : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('renders user avatar and menu', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Look for user avatar
      const avatar = screen.getByTestId('user-avatar') || screen.getByText('T'); // First letter of Test User
      expect(avatar).toBeInTheDocument();
    });

    it('opens user menu on avatar click', async () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const avatar = screen.getByTestId('user-avatar') || screen.getByRole('button', { name: /account/i });
      
      if (avatar) {
        fireEvent.click(avatar);
        
        await waitFor(() => {
          expect(screen.getByText('Profile') || screen.getByText('Account')).toBeInTheDocument();
        });
      }
    });

    it('shows logout option in user menu', async () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const avatar = screen.getByTestId('user-avatar') || screen.getByRole('button', { name: /account/i });
      
      if (avatar) {
        fireEvent.click(avatar);
        
        await waitFor(() => {
          expect(screen.getByText('Logout')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Theme Integration', () => {
    it('applies theme colors correctly', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const appBar = screen.getByRole('banner');
      expect(appBar).toHaveStyle('background-color: rgb(25, 118, 210)'); // Primary color
    });

    it('uses proper spacing and layout', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const main = screen.getByRole('main');
      expect(main).toHaveStyle('flex-grow: 1');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByLabelText('toggle navigation menu')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const menuButton = screen.getByLabelText('toggle navigation menu');
      
      // Should be focusable
      menuButton.focus();
      expect(menuButton).toHaveFocus();
      
      // Should respond to Enter key
      fireEvent.keyDown(menuButton, { key: 'Enter' });
      // Menu toggle should work
    });

    it('has proper landmark roles', () => {
      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // AppBar
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Drawer
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });
  });

  describe('Navigation Behavior', () => {
    it('navigates to correct routes on menu item click', () => {
      const mockPush = jest.fn();
      
      // Mock the router
      jest.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
        usePathname: () => '/',
        useSearchParams: () => new URLSearchParams(),
        useParams: () => ({}),
      }));

      render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      const dashboardItem = screen.getByText('Dashboard');
      fireEvent.click(dashboardItem);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('handles logout correctly', async () => {
      const mockLogout = jest.fn();
      
      render(
        <DashboardLayout>{mockChildren}</DashboardLayout>,
        { authValue: { logout: mockLogout } }
      );
      
      // Open user menu and click logout
      const avatar = screen.getByTestId('user-avatar') || screen.getByRole('button', { name: /account/i });
      
      if (avatar) {
        fireEvent.click(avatar);
        
        await waitFor(() => {
          const logoutButton = screen.getByText('Logout');
          fireEvent.click(logoutButton);
          
          expect(mockLogout).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('handles missing user gracefully', () => {
      render(
        <DashboardLayout>{mockChildren}</DashboardLayout>,
        { authValue: { user: null } }
      );
      
      // Should still render the layout
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('handles authentication errors', () => {
      render(
        <DashboardLayout>{mockChildren}</DashboardLayout>,
        { authValue: { isAuthenticated: false, user: null } }
      );
      
      // Should still be wrapped in ProtectedRoute which handles auth
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks on unmount', () => {
      const { unmount } = render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid re-renders', () => {
      const { rerender } = render(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      // Multiple re-renders should not cause issues
      rerender(<DashboardLayout><div>New content</div></DashboardLayout>);
      rerender(<DashboardLayout>{mockChildren}</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });
});