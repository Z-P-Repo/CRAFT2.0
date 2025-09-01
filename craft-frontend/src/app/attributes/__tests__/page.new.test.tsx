import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttributesPage from '../page';

// Mock all external dependencies
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/attributes',
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'user-1',
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      active: true,
    },
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    handleApiResponse: jest.fn(),
  }),
}));

jest.mock('@/utils/permissions', () => ({
  canManage: () => true,
  canEdit: () => true,
  canDelete: () => true,
  canCreate: () => true,
}));

// Mock DashboardLayout to avoid navigation hook issues
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

const { apiClient } = require('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
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
  {
    _id: 'attr-2',
    id: 'attr-2',
    name: 'clearance_level',
    displayName: 'Clearance Level',
    description: 'Security clearance level',
    categories: ['subject'],
    dataType: 'number',
    isRequired: false,
    isMultiValue: false,
    policyCount: 0,
    constraints: {
      minValue: 1,
      maxValue: 5,
    },
    createdBy: 'admin',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('AttributesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful API response
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockAttributes,
      pagination: {
        total: mockAttributes.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders attributes page with loading state initially', async () => {
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

    it('renders attributes table with data', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
        expect(screen.getByText('Clearance Level')).toBeInTheDocument();
      });
    });

    it('renders toolbar with search and action buttons', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      expect(screen.getByPlaceholderText('Search attributes...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create attribute/i })).toBeInTheDocument();
    });
  });

  describe('Data Loading and Error Handling', () => {
    it('handles API error gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

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
    });

    it('handles unsuccessful API response', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        message: 'Failed to fetch attributes',
      });

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
    });

    it('handles empty attributes list', async () => {
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

  describe('Search Functionality', () => {
    it('handles search input changes', async () => {
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

    it('debounces search queries', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      // Fast forward debounce timer
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            search: 'test',
          }),
        });
      });
    });
  });

  describe('Sorting and Filtering', () => {
    it('handles sort button click', async () => {
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

      // Should show sort options
      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument();
      });
    });

    it('handles filter button click', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <AttributesPage />
          </TestWrapper>
        );
      });

      const filterButton = screen.getByRole('button', { name: /filter/i });
      
      await act(async () => {
        fireEvent.click(filterButton);
      });

      // Should show filter options
      await waitFor(() => {
        expect(screen.getByText(/category/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('handles page change', async () => {
      // Mock data with more pages
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

      // Click next page
      const nextButton = screen.getByRole('button', { name: /go to next page/i });
      
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            page: 2,
          }),
        });
      });
    });

    it('handles rows per page change', async () => {
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

      // Find and click rows per page selector
      const rowsPerPageSelect = screen.getByDisplayValue('10');
      
      await act(async () => {
        fireEvent.mouseDown(rowsPerPageSelect);
      });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option25 = screen.getByRole('option', { name: '25' });
      
      await act(async () => {
        fireEvent.click(option25);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            limit: 25,
          }),
        });
      });
    });
  });

  describe('Create Attribute', () => {
    it('opens create dialog when button is clicked', async () => {
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

    it('creates new attribute successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: { _id: 'new-attr', name: 'new_attr', displayName: 'New Attribute' },
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

      // Fill form
      const nameInput = screen.getByLabelText(/attribute name/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'new_attr' } });
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

    it('handles create error', async () => {
      mockApiClient.post.mockResolvedValue({
        success: false,
        message: 'Attribute already exists',
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
        
        fireEvent.change(nameInput, { target: { value: 'duplicate' } });
        fireEvent.change(displayNameInput, { target: { value: 'Duplicate' } });
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Attribute', () => {
    it('opens edit dialog when edit button is clicked', async () => {
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

    it('updates existing attribute', async () => {
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: { ...mockAttributes[0], displayName: 'Updated Department' },
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

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      
      await act(async () => {
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const displayNameInput = screen.getByDisplayValue('Department');
        fireEvent.change(displayNameInput, { target: { value: 'Updated Department' } });
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/attributes/attr-1', expect.any(Object));
      });
    });
  });

  describe('Delete Attribute', () => {
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

    it('deletes attribute successfully', async () => {
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

    it('handles delete errors', async () => {
      mockApiClient.delete.mockResolvedValue({
        success: false,
        message: 'Cannot delete system attribute',
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
        expect(mockApiClient.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Operations', () => {
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

    it('handles individual selection', async () => {
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
      const firstAttributeCheckbox = checkboxes[1]; // First non-header checkbox
      
      await act(async () => {
        fireEvent.click(firstAttributeCheckbox);
      });

      expect(firstAttributeCheckbox).toBeChecked();
    });

    it('handles bulk delete', async () => {
      mockApiClient.delete.mockResolvedValue({
        success: true,
        message: 'Attributes deleted successfully',
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

      // Select an attribute
      const checkboxes = screen.getAllByRole('checkbox');
      const firstAttributeCheckbox = checkboxes[1];
      
      await act(async () => {
        fireEvent.click(firstAttributeCheckbox);
      });

      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      
      await act(async () => {
        fireEvent.click(bulkDeleteButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-delete');
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button is clicked', async () => {
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
  });

  describe('Edge Cases', () => {
    it('handles attributes without policy counts', async () => {
      const attributesWithoutCounts = mockAttributes.map(attr => ({
        ...attr,
        policyCount: undefined,
      }));

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: attributesWithoutCounts,
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
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
    });

    it('handles attributes without constraints', async () => {
      const attributesWithoutConstraints = mockAttributes.map(attr => ({
        ...attr,
        constraints: {},
      }));

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: attributesWithoutConstraints,
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
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
        expect(screen.getByText('Any value')).toBeInTheDocument();
      });
    });
  });
});