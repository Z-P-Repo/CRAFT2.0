import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import PoliciesPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { apiClient } from '@/lib/api';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

// Mock DeleteConfirmationDialog
jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({
    open,
    onConfirm,
    onCancel,
    loading,
  }: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
  }) {
    if (!open) return null;
    return (
      <div data-testid="delete-confirmation-dialog">
        <button data-testid="confirm-delete" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </button>
        <button data-testid="cancel-delete" onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockSnackbar = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

const mockUser = {
  _id: '1',
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'Admin' as const,
  permissions: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canManage: true,
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockPolicy = {
  _id: '1',
  id: '1',
  name: 'Test Policy',
  description: 'Test policy description',
  effect: 'Allow' as const,
  status: 'Active' as const,
  priority: 1,
  rules: [],
  metadata: {
    createdBy: 'Test User',
    lastModifiedBy: 'Test User',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0',
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockPoliciesResponse = {
  success: true,
  data: [mockPolicy],
  pagination: {
    total: 1,
    page: 1,
    pages: 1,
    limit: 10,
  },
};

describe('PoliciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useApiSnackbar as jest.Mock).mockReturnValue(mockSnackbar);
    (apiClient.get as jest.Mock).mockResolvedValue(mockPoliciesResponse);
  });

  describe('Initial Render', () => {
    it('should render the policies page with loading state', async () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<PoliciesPage />);
      
      expect(screen.getByText('Policies')).toBeInTheDocument();
      expect(screen.getByText('Manage access control policies')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render policies table after loading', async () => {
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test policy description')).toBeInTheDocument();
      expect(screen.getByText('Allow')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display empty state when no policies', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 10 },
      });

      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No policies found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search policies...');
      await user.type(searchInput, 'test search');
      
      expect(searchInput).toHaveValue('test search');
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search policies...');
      await user.type(searchInput, 'test search');
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter popover when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const filterButton = screen.getByLabelText('Filter');
      await user.click(filterButton);
      
      expect(screen.getByText('Filter by Status')).toBeInTheDocument();
      expect(screen.getByText('Filter by Effect')).toBeInTheDocument();
    });

    it('should handle status filter selection', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const filterButton = screen.getByLabelText('Filter');
      await user.click(filterButton);
      
      const activeCheckbox = screen.getByLabelText('Active');
      await user.click(activeCheckbox);
      
      expect(activeCheckbox).toBeChecked();
    });

    it('should handle effect filter selection', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const filterButton = screen.getByLabelText('Filter');
      await user.click(filterButton);
      
      const allowCheckbox = screen.getByLabelText('Allow');
      await user.click(allowCheckbox);
      
      expect(allowCheckbox).toBeChecked();
    });
  });

  describe('Sort Functionality', () => {
    it('should open sort popover when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const sortButton = screen.getByLabelText('Sort');
      await user.click(sortButton);
      
      expect(screen.getByText('Sort by Name')).toBeInTheDocument();
      expect(screen.getByText('Sort by Status')).toBeInTheDocument();
      expect(screen.getByText('Sort by Effect')).toBeInTheDocument();
    });

    it('should handle sort selection', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const sortButton = screen.getByLabelText('Sort');
      await user.click(sortButton);
      
      const statusSort = screen.getByText('Sort by Status');
      await user.click(statusSort);
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('sortBy=status'));
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to create page when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByLabelText('Create Policy');
      await user.click(createButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/policies/create');
    });

    it('should navigate to view page when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const viewButton = screen.getByLabelText('View Policy');
      await user.click(viewButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/policies/1');
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const editButton = screen.getByLabelText('Edit Policy');
      await user.click(editButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/policies/1/edit');
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete Policy');
      await user.click(deleteButton);
      
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    });

    it('should close delete confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete Policy');
      await user.click(deleteButton);
      
      const cancelButton = screen.getByTestId('cancel-delete');
      await user.click(cancelButton);
      
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
    });

    it('should delete policy when confirmed', async () => {
      const user = userEvent.setup();
      (apiClient.delete as jest.Mock).mockResolvedValue({ success: true });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete Policy');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/policies/1');
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Policy deleted successfully');
      });
    });

    it('should handle delete error', async () => {
      const user = userEvent.setup();
      const error = new Error('Delete failed');
      (apiClient.delete as jest.Mock).mockRejectedValue(error);
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete Policy');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalledWith(error, 'Failed to delete policy');
      });
    });
  });

  describe('Selection and Bulk Operations', () => {
    it('should handle single policy selection', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const checkbox = screen.getByRole('checkbox', { name: /select policy/i });
      await user.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });

    it('should handle select all functionality', async () => {
      const user = userEvent.setup();
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockPolicy, { ...mockPolicy, id: '2', name: 'Policy 2' }],
        pagination: { total: 2, page: 1, pages: 1, limit: 10 },
      });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByLabelText('Select all policies');
      await user.click(selectAllCheckbox);
      
      const policyCheckboxes = screen.getAllByRole('checkbox', { name: /select policy/i });
      policyCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show bulk delete button when policies are selected', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const checkbox = screen.getByRole('checkbox', { name: /select policy/i });
      await user.click(checkbox);
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete selected policies')).toBeInTheDocument();
    });

    it('should handle bulk delete operation', async () => {
      const user = userEvent.setup();
      (apiClient.delete as jest.Mock).mockResolvedValue({ success: true });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const checkbox = screen.getByRole('checkbox', { name: /select policy/i });
      await user.click(checkbox);
      
      const bulkDeleteButton = screen.getByLabelText('Delete selected policies');
      await user.click(bulkDeleteButton);
      
      expect(screen.getByText('Delete Selected Policies')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should handle page change', async () => {
      const user = userEvent.setup();
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockPolicy],
        pagination: { total: 20, page: 1, pages: 2, limit: 10 },
      });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const nextPageButton = screen.getByLabelText('Go to next page');
      await user.click(nextPageButton);
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    });

    it('should handle rows per page change', async () => {
      const user = userEvent.setup();
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const rowsSelect = screen.getByLabelText('Rows per page:');
      await user.click(rowsSelect);
      
      const option25 = screen.getByText('25');
      await user.click(option25);
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('limit=25'));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error when fetching policies', async () => {
      const error = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalledWith(error, 'Failed to load policies');
      });
    });

    it('should handle API error response when fetching policies', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch',
      });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Test Policy')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('Create Policy')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort')).toBeInTheDocument();
      expect(screen.getByLabelText('View Policy')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit Policy')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Policy')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByLabelText('Create Policy');
      createButton.focus();
      expect(createButton).toHaveFocus();
      
      fireEvent.keyDown(createButton, { key: 'Tab' });
      // Next focusable element should receive focus
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile view', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      render(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      // Check if mobile-specific elements are rendered
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-fetch data unnecessarily', async () => {
      const { rerender } = renderWithProviders(<PoliciesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
      });
      
      const initialCallCount = (apiClient.get as jest.Mock).mock.calls.length;
      
      // Re-render with same props
      rerender(<PoliciesPage />);
      
      // Should not make additional API calls
      expect((apiClient.get as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });
  });
});