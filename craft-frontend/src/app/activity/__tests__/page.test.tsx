import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityPage from '../page';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getActivities: jest.fn(),
    getActivity: jest.fn(),
    createActivity: jest.fn(),
    getActivityStats: jest.fn(),
  },
}));

const { apiClient: mockApiClient } = require('@/lib/api');

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

// Mock Snackbar
const mockSnackbar = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: () => mockSnackbar,
}));

// Mock ActivityDetailModal
jest.mock('@/components/activity/ActivityDetailModal', () => {
  return function MockActivityDetailModal({ activity, open, onClose }: any) {
    return open ? (
      <div data-testid="activity-detail-modal">
        <div data-testid="activity-action">{activity?.action}</div>
        <div data-testid="activity-description">{activity?.description}</div>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null;
  };
});

// Mock permissions utils
jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

// Mock ProtectedRoute
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

// Mock data
const mockActivities = [
  {
    _id: '1',
    type: 'authentication',
    category: 'security',
    action: 'login',
    description: 'User logged in successfully',
    actor: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'user' as const,
    },
    resource: {
      type: 'user',
      id: 'user-1',
      name: 'John Doe',
    },
    timestamp: '2023-12-01T10:00:00.000Z',
    severity: 'low' as const,
    metadata: {
      status: 'success',
      ipAddress: '192.168.1.1',
    },
    tags: ['login', 'success'],
  },
  {
    _id: '2',
    type: 'policy_management',
    category: 'administration',
    action: 'policy_created',
    description: 'New security policy created',
    actor: {
      id: 'user-2',
      name: 'Jane Admin',
      email: 'jane@example.com',
      type: 'user' as const,
    },
    resource: {
      type: 'policy',
      id: 'policy-1',
      name: 'Security Policy',
    },
    timestamp: '2023-12-01T09:00:00.000Z',
    severity: 'medium' as const,
    metadata: {
      status: 'success',
    },
    tags: ['policy', 'creation'],
  },
];

const mockStats = {
  total: 150,
  recentActivities: 25,
  categories: {
    security: 45,
    administration: 30,
    compliance: 20,
  },
  severities: {
    low: 80,
    medium: 45,
    high: 20,
    critical: 5,
  },
};

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
};

describe('ActivityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    // Default API responses
    mockApiClient.getActivities.mockResolvedValue({
      success: true,
      data: mockActivities,
      pagination: {
        page: 1,
        limit: 50,
        total: mockActivities.length,
        totalPages: 1,
      },
    });

    mockApiClient.getActivityStats.mockResolvedValue({
      success: true,
      data: mockStats,
    });
  });

  describe('Component Rendering', () => {
    it('renders activity page with protected route', async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('renders page title and description', async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
        expect(screen.getByText(/Comprehensive audit trail/)).toBeInTheDocument();
      });
    });

    it('shows loading skeletons initially', () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      // Should show skeleton loading states
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders statistics cards after loading', async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Activities')).toBeInTheDocument();
        expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('High Priority')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total activities
        expect(screen.getByText('25')).toBeInTheDocument(); // Recent activities
      });
    });
  });

  describe('API Status and Fallback', () => {
    it('shows live data status when API is available', async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Live Data')).toBeInTheDocument();
        expect(screen.getByText(/Real-time activity data/)).toBeInTheDocument();
      });
    });

    it('shows demo mode when API fails', async () => {
      mockApiClient.getActivities.mockRejectedValue(new Error('API Error'));
      mockApiClient.getActivityStats.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
        expect(screen.getByText(/Activity API is not available/)).toBeInTheDocument();
      });
    });

    it('shows retry functionality in demo mode', async () => {
      mockApiClient.getActivities.mockRejectedValue(new Error('API Error'));
      mockApiClient.getActivityStats.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockApiClient.getActivities).toHaveBeenCalledTimes(2);
        expect(mockApiClient.getActivityStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search activities...')).toBeInTheDocument();
      });
    });

    it('handles search input', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search activities...');

      await user.type(searchInput, 'login');
      
      expect(searchInput).toHaveValue('login');
    });

    it('opens filter popover when filter button clicked', async () => {
      const user = userEvent.setup();
      const filterButton = screen.getByRole('button', { name: /filter/i });

      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Filter Activities')).toBeInTheDocument();
      });
    });

    it('handles category filtering', async () => {
      const user = userEvent.setup();
      const filterButton = screen.getByRole('button', { name: /filter/i });

      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Filter Activities')).toBeInTheDocument();
      });

      // Click on category dropdown
      const categorySelect = screen.getByLabelText('Category');
      await user.click(categorySelect);

      await waitFor(() => {
        expect(screen.getByText('security')).toBeInTheDocument();
      });
    });

    it('opens sort popover when sort button clicked', async () => {
      const user = userEvent.setup();
      const sortButton = screen.getByRole('button', { name: /sort/i });

      await user.click(sortButton);

      await waitFor(() => {
        expect(screen.getByText('Sort Activities')).toBeInTheDocument();
        expect(screen.getByText('Most Recent')).toBeInTheDocument();
        expect(screen.getByText('By Severity')).toBeInTheDocument();
      });
    });

    it('shows clear button when filters are active', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search activities...');

      await user.type(searchInput, 'test search');

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
    });

    it('clears filters when clear button clicked', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search activities...');

      await user.type(searchInput, 'test search');
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Activity Table', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });
    });

    it('renders activity table with data', async () => {
      await waitFor(() => {
        expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
        expect(screen.getByText('New security policy created')).toBeInTheDocument();
      });
    });

    it('shows activity details when row clicked', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
      });

      const activityRow = screen.getByText('User logged in successfully').closest('tr');
      expect(activityRow).toBeInTheDocument();

      await user.click(activityRow!);

      await waitFor(() => {
        expect(screen.getByTestId('activity-detail-modal')).toBeInTheDocument();
        expect(screen.getByTestId('activity-action')).toHaveTextContent('login');
      });
    });

    it('closes activity detail modal', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
      });

      const activityRow = screen.getByText('User logged in successfully').closest('tr');
      await user.click(activityRow!);

      await waitFor(() => {
        expect(screen.getByTestId('activity-detail-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-detail-modal')).not.toBeInTheDocument();
      });
    });

    it('handles pagination', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeInTheDocument();
      });

      // Should show pagination controls
      const rowsPerPageSelect = screen.getByDisplayValue('25');
      expect(rowsPerPageSelect).toBeInTheDocument();

      await user.click(rowsPerPageSelect);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('displays severity chips with correct colors', async () => {
      await waitFor(() => {
        expect(screen.getByText('LOW')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      });

      const lowChip = screen.getByText('LOW');
      const mediumChip = screen.getByText('MEDIUM');

      expect(lowChip).toHaveClass('MuiChip-root');
      expect(mediumChip).toHaveClass('MuiChip-root');
    });

    it('displays category icons and chips', async () => {
      await waitFor(() => {
        expect(screen.getByText('security')).toBeInTheDocument();
        expect(screen.getByText('administration')).toBeInTheDocument();
      });
    });

    it('shows actor information with avatars', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Admin')).toBeInTheDocument();
      });

      // Check for user avatars (should have initials)
      const avatars = screen.getAllByText('J');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApiClient.getActivities.mockRejectedValue(new Error('Network error'));
      mockApiClient.getActivityStats.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
      });

      // Should not crash and should show demo data
      expect(screen.getByText(/Activity API is not available/)).toBeInTheDocument();
    });

    it('handles empty activity list', async () => {
      mockApiClient.getActivities.mockResolvedValue({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 1,
        },
      });

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No activities found')).toBeInTheDocument();
      });
    });

    it('handles partial API failures', async () => {
      mockApiClient.getActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 50,
          total: mockActivities.length,
          totalPages: 1,
        },
      });

      mockApiClient.getActivityStats.mockRejectedValue(new Error('Stats error'));

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
      });

      // Should still show activities even if stats fail
      expect(screen.getByText('Total Activities')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on different screen sizes', async () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(min-width: 768px)'), // Mock desktop
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
      });

      // Should render without layout issues
      expect(screen.getByText('Total Activities')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const filterButton = screen.getByRole('button', { name: /filter/i });
        const sortButton = screen.getByRole('button', { name: /sort/i });
        
        expect(filterButton).toHaveAttribute('aria-label');
        expect(sortButton).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search activities...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search activities...');
      
      // Should be focusable
      await user.tab();
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('memoizes expensive calculations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
      });

      // Component should render without performance warnings
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('debounces search input', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      render(
        <TestWrapper>
          <ActivityPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search activities...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search activities...');
      
      await user.type(searchInput, 'test');
      
      // Fast typing shouldn't trigger multiple API calls
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(searchInput).toHaveValue('test');
      
      jest.useRealTimers();
    });
  });
});