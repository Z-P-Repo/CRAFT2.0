import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttributesPage from '../page';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const { apiClient: mockApiClient } = require('@/lib/api');

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
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: () => mockSnackbar,
}));

jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true), 
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ open, onClose, onConfirm, loading }: any) {
    return open ? (
      <div data-testid="delete-dialog">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </button>
      </div>
    ) : null;
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const sampleAttribute = {
  _id: 'attr-1',
  id: 'attr-1',
  name: 'test.attribute',
  displayName: 'Test Attribute',
  description: 'Test description',
  categories: ['subject'],
  dataType: 'string',
  isRequired: false,
  isMultiValue: false,
  policyCount: 0,
  constraints: {},
  validation: {},
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: [],
    isSystem: false,
    isCustom: true,
    version: '1.0',
  },
  mapping: {},
  active: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('AttributesPage Targeted Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: [sampleAttribute],
      pagination: { total: 1, page: 1, limit: 10 },
    });
  });

  describe('Basic Component Functionality', () => {
    it('renders and loads data successfully', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          page: 1,
          limit: 10,
          search: '',
          category: [],
          dataType: [],
          sortBy: 'displayName',
          sortOrder: 'asc',
        });
      });

      expect(screen.getByText('Test Attribute')).toBeInTheDocument();
    });

    it('handles search functionality with debouncing', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      // Advance timers to trigger debounced search
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          search: 'test search',
        }));
      });

      jest.useRealTimers();
    });

    it('handles API error during fetch', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalledWith(
          { success: false, error: 'Network error' },
          undefined,
          'Failed to load attributes'
        );
      });
    });

    it('handles unsuccessful API response', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        error: 'Access denied',
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalledWith(
          { success: false, error: 'Access denied' },
          undefined,
          'Failed to load attributes'
        );
      });
    });

    it('handles pagination changes', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Test page change - use pagination controls
      const nextPageButton = screen.getByLabelText(/go to next page/i);
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          page: 2,
        }));
      });
    });

    it('handles rows per page change', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const rowsPerPageSelect = screen.getByDisplayValue('10');
      fireEvent.change(rowsPerPageSelect, { target: { value: '25' } });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          limit: 25,
          page: 1, // Should reset to first page
        }));
      });
    });

    it('handles refresh functionality', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    it('handles sorting changes', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Click on column header to sort
      const displayNameHeader = screen.getByText('Display Name');
      fireEvent.click(displayNameHeader);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          sortBy: 'displayName',
          sortOrder: 'desc', // Should toggle to desc
        }));
      });
    });

    it('handles filter changes', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open filter menu
      const filterButton = screen.getByLabelText(/filter/i);
      fireEvent.click(filterButton);

      // Select a filter option (subject category)
      const subjectCheckbox = screen.getByLabelText('subject');
      fireEvent.click(subjectCheckbox);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          category: ['subject'],
        }));
      });
    });

    it('handles bulk selection', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Select all
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      fireEvent.click(selectAllCheckbox);

      // Check that bulk actions are available
      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('handles delete operation', async () => {
      mockApiClient.delete.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Click delete button
      const deleteButton = screen.getAllByLabelText(/delete/i)[0];
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/attributes/attr-1');
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // Reload after delete
      });
    });

    it('handles create attribute dialog', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: sampleAttribute,
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open create dialog
      const createButton = screen.getByText(/create attribute/i);
      fireEvent.click(createButton);

      // Fill required field
      const displayNameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(displayNameInput, { target: { value: 'New Attribute' } });

      // Submit
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          displayName: 'New Attribute',
        }));
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // Reload after create
      });
    });

    it('handles edit attribute dialog', async () => {
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: sampleAttribute,
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open edit dialog
      const editButton = screen.getAllByLabelText(/edit/i)[0];
      fireEvent.click(editButton);

      // Modify field
      const displayNameInput = screen.getByDisplayValue('Test Attribute');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Attribute' } });

      // Submit
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/attributes/attr-1', expect.objectContaining({
          displayName: 'Updated Attribute',
        }));
        expect(mockApiClient.get).toHaveBeenCalledTimes(2); // Reload after update
      });
    });

    it('handles view attribute dialog', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open view dialog
      const viewButton = screen.getAllByLabelText(/view/i)[0];
      fireEvent.click(viewButton);

      // Check that view dialog is open
      expect(screen.getByText('View Attribute')).toBeInTheDocument();
      expect(screen.getByText('Test Attribute')).toBeInTheDocument();
    });

    it('handles form validation errors', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open create dialog
      const createButton = screen.getByText(/create attribute/i);
      fireEvent.click(createButton);

      // Try to submit without required field
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Check validation error
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
    });

    it('handles empty state', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10 },
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total count
      });
    });

    it('handles loading state', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      // Should show loading indicators
      expect(screen.getAllByText('...')).toHaveLength(3); // Loading placeholders
    });

    it('handles no permission scenarios', async () => {
      const { canCreate, canEdit, canDelete } = require('@/utils/permissions');
      canCreate.mockReturnValue(false);
      canEdit.mockReturnValue(false);
      canDelete.mockReturnValue(false);

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Create button should not exist
      expect(screen.queryByText(/create attribute/i)).not.toBeInTheDocument();
      // Action buttons should not exist
      expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument();
    });
  });
});