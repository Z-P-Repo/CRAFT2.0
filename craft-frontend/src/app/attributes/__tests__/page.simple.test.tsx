import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttributesPage from '../page';

// Mock all modules first
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockSnackbar = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

const mockUser = {
  _id: 'user-1',
  id: 'user-1', 
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  active: true,
};
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: jest.fn() }),
}));
jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: () => mockSnackbar,
}));
jest.mock('@/utils/permissions', () => ({
  canManage: () => true,
  canEdit: () => true,
  canDelete: () => true,
  canCreate: () => true,
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/attributes',
}));

// Mock complex components to avoid their dependencies
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ 
    open, 
    onConfirm, 
    onCancel 
  }: { 
    open: boolean; 
    onConfirm: () => void; 
    onCancel: () => void; 
  }) {
    return open ? (
      <div data-testid="delete-confirmation-dialog">
        <button data-testid="confirm-delete" onClick={onConfirm}>Confirm</button>
        <button data-testid="cancel-delete" onClick={onCancel}>Cancel</button>
      </div>
    ) : null;
  };
});

// Get reference to mocked API client
const { apiClient: mockApiClient } = require('@/lib/api');

// Sample test data
const mockAttributes = [
  {
    _id: 'attr-1',
    id: 'attr-1',
    name: 'department',
    displayName: 'Department',
    description: 'User department',
    categories: ['subject'],
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    policyCount: 2,
    constraints: {
      allowedValues: ['IT', 'HR', 'Finance'],
    },
    usedInPolicies: [
      { id: 'policy-1', name: 'policy-1', displayName: 'IT Policy' }
    ],
    createdBy: 'admin',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('AttributesPage Focused Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API responses
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockAttributes,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  describe('Basic Rendering', () => {
    it('renders the attributes page', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByText('Attributes')).toBeInTheDocument();
    });

    it('loads and displays attributes data', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.any(Object));
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockApiClient.get.mockReturnValue(promise);

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      // Should show loading indicators
      expect(screen.getAllByTestId('skeleton')).toHaveLength(5);

      // Resolve the promise
      await act(async () => {
        resolvePromise({
          success: true,
          data: mockAttributes,
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        });
      });
    });
  });

  describe('Data Fetching Edge Cases', () => {
    it('handles API errors during data fetch', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalledWith(
          expect.any(Error), 
          'Failed to load attributes'
        );
      });
    });

    it('handles unsuccessful API responses', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        message: 'Failed to fetch',
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalledWith(
          expect.objectContaining({ success: false }),
          undefined,
          'Failed to load attributes'
        );
      });
    });

    it('displays empty state when no attributes', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/no attributes found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Interactions', () => {
    it('updates search input value', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'department' } });
      });

      expect(searchInput).toHaveValue('department');
    });

    it('opens sort popover when sort button clicked', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const sortButton = screen.getByRole('button', { name: /sort/i });
      
      await act(async () => {
        fireEvent.click(sortButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Attribute Functionality', () => {
    it('opens create dialog', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('handles successful attribute creation', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: {
          _id: 'new-attr',
          name: 'new_attribute',
          displayName: 'New Attribute',
        },
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill required form fields
      const nameInput = screen.getByLabelText(/attribute name/i);
      const displayNameInput = screen.getByLabelText(/display name/i);

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'new_attribute' } });
        fireEvent.change(displayNameInput, { target: { value: 'New Attribute' } });
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/attributes', expect.any(Object));
      });
    });

    it('handles create errors', async () => {
      mockApiClient.post.mockResolvedValue({
        success: false,
        message: 'Validation error',
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/attribute name/i);
        const displayNameInput = screen.getByLabelText(/display name/i);

        fireEvent.change(nameInput, { target: { value: 'invalid' } });
        fireEvent.change(displayNameInput, { target: { value: 'Invalid' } });
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Edit and Delete Operations', () => {
    it('opens edit dialog', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      
      await act(async () => {
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Department')).toBeInTheDocument();
      });
    });

    it('opens delete confirmation dialog', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });
    });

    it('handles successful deletion', async () => {
      mockApiClient.delete.mockResolvedValue({
        success: true,
        message: 'Attribute deleted successfully',
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-delete');
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/attributes/attr-1');
      });
    });
  });

  describe('Table Interactions', () => {
    it('handles select all checkbox', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      expect(selectAllCheckbox).toBeChecked();
    });

    it('handles individual row selection', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const rowCheckbox = checkboxes[1]; // Skip header checkbox
      
      await act(async () => {
        fireEvent.click(rowCheckbox);
      });

      expect(rowCheckbox).toBeChecked();
    });

    it('shows bulk delete button when items selected', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const rowCheckbox = checkboxes[1];
      
      await act(async () => {
        fireEvent.click(rowCheckbox);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
      });
    });
  });

  describe('Refresh and Pagination', () => {
    it('refreshes data when refresh button clicked', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    it('handles pagination controls', async () => {
      // Mock multi-page data
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockAttributes,
        pagination: { total: 25, page: 1, limit: 10, totalPages: 3 },
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
      });
    });
  });

  describe('Helper Functions and Utilities', () => {
    it('displays category colors correctly', async () => {
      const multiCategoryAttribute = {
        ...mockAttributes[0],
        categories: ['subject', 'resource'],
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [multiCategoryAttribute],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('subject')).toBeInTheDocument();
        expect(screen.getByText('resource')).toBeInTheDocument();
      });
    });

    it('displays data type information', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('string')).toBeInTheDocument();
      });
    });

    it('handles attributes with no constraints', async () => {
      const unconstrained = {
        ...mockAttributes[0],
        constraints: {},
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [unconstrained],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Any value')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions Integration', () => {
    it('shows action buttons when user has permissions', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      expect(screen.getByRole('button', { name: /create attribute/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
    });
  });
});