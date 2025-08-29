import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DashboardPage from '../page';

// Mock the API client at the top level
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Get the mocked client
const { apiClient: mockApiClient } = require('@/lib/api');

// Mock user data
const mockUser = {
  _id: '1',
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  active: true,
  department: 'IT Department',
};

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ProtectedRoute
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders dashboard header', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(`Welcome back, ${mockUser.name}! Here's an overview of your system.`)).toBeInTheDocument();
    });

    it('renders stats cards', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Active Policies')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('Total Subjects')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('Policy Tests')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders user information card', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role.toUpperCase())).toBeInTheDocument();
    });

    it('renders quick actions card', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Manage Policies')).toBeInTheDocument();
      expect(screen.getByText('Test Policies')).toBeInTheDocument();
      expect(screen.getByText('View Subjects')).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });

    it('renders recent activity card', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Policy "Admin Access" was updated')).toBeInTheDocument();
      expect(screen.getByText('New subject "John Doe" was created')).toBeInTheDocument();
      expect(screen.getByText('Policy test completed successfully')).toBeInTheDocument();
      expect(screen.getByText('System health check passed')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('displays user role chip', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(mockUser.role.toUpperCase())).toBeInTheDocument();
    });

    it('displays user department when available', () => {
      const userWithDepartment = { ...mockUser, department: 'IT Department' };
      mockUseAuth.mockReturnValue({
        user: userWithDepartment,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('IT Department')).toBeInTheDocument();
    });

    it('displays "Not specified" when department is not available', () => {
      const userWithoutDepartment = { ...mockUser, department: undefined };
      mockUseAuth.mockReturnValue({
        user: userWithoutDepartment,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('displays active status chip', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays inactive status when user is not active', () => {
      const inactiveUser = { ...mockUser, active: false };
      mockUseAuth.mockReturnValue({
        user: inactiveUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to policies page when Manage Policies is clicked', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const managePoliciesButton = screen.getByText('Manage Policies');
      fireEvent.click(managePoliciesButton);
      
      expect(mockPush).toHaveBeenCalledWith('/policies');
    });

    it('navigates to tester page when Test Policies is clicked', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const testPoliciesButton = screen.getByText('Test Policies');
      fireEvent.click(testPoliciesButton);
      
      expect(mockPush).toHaveBeenCalledWith('/tester');
    });

    it('navigates to subjects page when View Subjects is clicked', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const viewSubjectsButton = screen.getByText('View Subjects');
      fireEvent.click(viewSubjectsButton);
      
      expect(mockPush).toHaveBeenCalledWith('/subjects');
    });

    it('renders Generate Report button without navigation', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const generateReportButton = screen.getByText('Generate Report');
      fireEvent.click(generateReportButton);
      
      // Should not navigate anywhere as no onClick handler is provided
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Stats Display', () => {
    it('renders all stat cards with correct values', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const stats = [
        { label: 'Active Policies', value: '24' },
        { label: 'Total Subjects', value: '156' },
        { label: 'System Health', value: '98%' },
        { label: 'Policy Tests', value: '42' },
      ];

      stats.forEach(stat => {
        expect(screen.getByText(stat.label)).toBeInTheDocument();
        expect(screen.getByText(stat.value)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('displays all recent activity items', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const activities = [
        'Policy "Admin Access" was updated',
        'New subject "John Doe" was created',
        'Policy test completed successfully',
        'System health check passed',
      ];

      activities.forEach(activity => {
        expect(screen.getByText(activity)).toBeInTheDocument();
      });
    });

    it('displays timestamps for activities', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('4 hours ago')).toBeInTheDocument();
      expect(screen.getByText('6 hours ago')).toBeInTheDocument();
      expect(screen.getByText('8 hours ago')).toBeInTheDocument();
    });
  });

  describe('Authentication Handling', () => {
    it('handles unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Should still render dashboard structure even without user
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, ! Here\'s an overview of your system.')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Should render dashboard even in loading state
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Layout Integration', () => {
    it('renders within DashboardLayout', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('renders within ProtectedRoute', () => {
      // This is implicitly tested since the component renders successfully
      // and ProtectedRoute is mocked to pass through children
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Dashboard');
    });

    it('has proper button roles', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check specific buttons
      expect(screen.getByRole('button', { name: 'Manage Policies' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Test Policies' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Subjects' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const managePoliciesButton = screen.getByText('Manage Policies');
      managePoliciesButton.focus();
      expect(managePoliciesButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('renders Grid components with responsive sizing', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Test that the component renders without errors
      // Grid responsive properties are handled by Material-UI internally
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          name: '',
          email: '',
          role: '',
          active: true,
        },
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, ! Here\'s an overview of your system.')).toBeInTheDocument();
    });

    it('handles undefined user properties', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          active: true,
          department: undefined,
        },
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders all main sections', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Welcome header
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      
      // Stats cards
      expect(screen.getByText('Active Policies')).toBeInTheDocument();
      
      // User information
      expect(screen.getByText('User Information')).toBeInTheDocument();
      
      // Quick actions
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      
      // Recent activity
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('maintains proper card structure', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // All cards should be present
      const userInfoCard = screen.getByText('User Information').closest('[class*="MuiCard"]');
      const quickActionsCard = screen.getByText('Quick Actions').closest('[class*="MuiCard"]');
      const recentActivityCard = screen.getByText('Recent Activity').closest('[class*="MuiCard"]');
      
      expect(userInfoCard).toBeInTheDocument();
      expect(quickActionsCard).toBeInTheDocument();
      expect(recentActivityCard).toBeInTheDocument();
    });
  });
});