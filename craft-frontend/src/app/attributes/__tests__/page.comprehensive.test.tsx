import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttributesPage from '../page';

// Mock all external dependencies first
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
  useAuth: () => ({ user: mockUser, logout: jest.fn() }),
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

const mockPermissions = require('@/utils/permissions');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock layout and common components
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ 
    open, 
    onClose, 
    onConfirm, 
    title,
    loading 
  }: any) {
    if (!open) return null;
    return (
      <div data-testid="delete-dialog">
        <div>{title}</div>
        <button onClick={onClose} data-testid="delete-cancel">Cancel</button>
        <button onClick={onConfirm} disabled={loading} data-testid="delete-confirm">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    );
  };
});

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

// Sample attribute data
const sampleAttributes = [
  {
    _id: 'attr-1',
    id: 'attr-1',
    name: 'user.department',
    displayName: 'Department',
    description: 'User department',
    categories: ['subject'] as ('subject' | 'resource')[],
    dataType: 'string' as const,
    isRequired: false,
    isMultiValue: false,
    policyCount: 5,
    constraints: {
      enumValues: ['Engineering', 'Marketing', 'Sales'],
    },
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['user'],
      isSystem: false,
      isCustom: true,
      version: '1.0',
    },
    mapping: {},
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    _id: 'attr-2',
    id: 'attr-2',
    name: 'resource.type',
    displayName: 'Resource Type',
    description: 'Type of resource',
    categories: ['resource'] as ('subject' | 'resource')[],
    dataType: 'string' as const,
    isRequired: true,
    isMultiValue: false,
    policyCount: 3,
    constraints: {},
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0',
    },
    mapping: {},
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

describe('AttributesPage Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: sampleAttributes,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
      },
    });
  });

  describe('Component Initialization and Rendering', () => {
    it('renders the main attributes page structure', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /attributes/i })).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      
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
    });

    it('displays loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      // The loading state shows "..." in the stats
      expect(screen.getAllByText('...')).toHaveLength(3);
    });

    it('handles successful data load with statistics', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total count
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('handles API errors during initial load', async () => {
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
  });

  describe('Data Display and Table Functionality', () => {
    it('displays attributes in table format', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
        expect(screen.getByText('Resource Type')).toBeInTheDocument();
        expect(screen.getByText('user.department')).toBeInTheDocument();
        expect(screen.getByText('resource.type')).toBeInTheDocument();
      });
    });

    it('displays permitted values correctly', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Marketing')).toBeInTheDocument();
      });
    });

    it('shows "Any value" when no constraints', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Resource Type has no enumValues, so should show "Any value"
        expect(screen.getByText('Any value')).toBeInTheDocument();
      });
    });

    it('displays policy counts with tooltips', async () => {
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const policyChips = screen.getAllByText(/^\d+$/);
        expect(policyChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('updates search input and triggers API call', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      await user.type(searchInput, 'department');

      // Should debounce and call API
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          search: 'department',
        }));
      }, { timeout: 1000 });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search attributes...');
      await user.type(searchInput, 'test');

      // Wait for search to update
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });

      // Find and click clear button
      const clearButton = screen.getByLabelText(/clear search/i);
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Sorting Functionality', () => {
    it('opens sort popover and handles selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Click sort button
      const sortButton = screen.getByLabelText(/sort/i);
      await user.click(sortButton);

      // Check if sort options appear
      await waitFor(() => {
        expect(screen.getByText('Display Name')).toBeInTheDocument();
        expect(screen.getByText('Data Type')).toBeInTheDocument();
        expect(screen.getByText('Created Date')).toBeInTheDocument();
      });

      // Select a sort option
      await user.click(screen.getByText('Data Type'));

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          sortBy: 'dataType',
        }));
      });
    });

    it('toggles sort order when clicking same field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const sortButton = screen.getByLabelText(/sort/i);
      await user.click(sortButton);

      // Click Display Name (should toggle to desc since it's currently asc)
      const displayNameOption = screen.getByText('Display Name');
      await user.click(displayNameOption);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          sortBy: 'displayName',
          sortOrder: 'desc',
        }));
      });
    });
  });

  describe('Filter Functionality', () => {
    it('opens filter popover and applies category filter', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Click filter button
      const filterButton = screen.getByLabelText(/filter/i);
      await user.click(filterButton);

      // Check if filter options appear
      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('Data Types')).toBeInTheDocument();
      });

      // Select subject category
      const subjectCheckbox = screen.getByLabelText('subject');
      await user.click(subjectCheckbox);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          category: ['subject'],
        }));
      });
    });

    it('applies data type filter', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByLabelText(/filter/i);
      await user.click(filterButton);

      // Select string data type
      const stringCheckbox = screen.getByLabelText('string');
      await user.click(stringCheckbox);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          dataType: ['string'],
        }));
      });
    });

    it('clears all filters when clear all is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByLabelText(/filter/i);
      await user.click(filterButton);

      // Apply some filters first
      const subjectCheckbox = screen.getByLabelText('subject');
      await user.click(subjectCheckbox);

      // Clear all filters
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          category: [],
          dataType: [],
        }));
      });
    });
  });

  describe('Selection and Bulk Operations', () => {
    it('handles select all checkbox', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find and click select all checkbox
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      // Should see bulk actions available
      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('handles individual row selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find and click individual checkbox (first one)
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Skip select all checkbox
      await user.click(firstRowCheckbox);

      // Should see bulk delete button
      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('opens bulk delete dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Select an item first
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      // Click bulk delete
      const bulkDeleteButton = screen.getByLabelText(/bulk delete/i);
      await user.click(bulkDeleteButton);

      // Should see delete dialog
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  describe('Create Attribute Dialog', () => {
    it('opens create dialog via create button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find create button
      const createButton = screen.getByText(/create attribute/i);
      await user.click(createButton);

      // Should see dialog
      expect(screen.getByText('Create New Attribute')).toBeInTheDocument();
    });

    it('opens create dialog via FAB', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find FAB
      const fab = screen.getByLabelText(/add attribute/i);
      await user.click(fab);

      expect(screen.getByText('Create New Attribute')).toBeInTheDocument();
    });

    it('validates display name field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create attribute/i);
      await user.click(createButton);

      // Try to submit without display name
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
    });

    it('creates new attribute successfully', async () => {
      const user = userEvent.setup();
      
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: { ...sampleAttributes[0], _id: 'new-attr' },
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create attribute/i);
      await user.click(createButton);

      // Fill in form
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'New Attribute');

      const categorySelect = screen.getByLabelText(/categories/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Subject'));

      const dataTypeSelect = screen.getByLabelText(/data type/i);
      await user.click(dataTypeSelect);
      await user.click(screen.getByText('String'));

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          displayName: 'New Attribute',
        }));
      });
    });

    it('handles create error', async () => {
      const user = userEvent.setup();
      
      mockApiClient.post.mockRejectedValue(new Error('Validation error'));

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create attribute/i);
      await user.click(createButton);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Test Attribute');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalledWith(
          { success: false, error: 'Validation error' },
          'Attribute created successfully',
          'Failed to create attribute'
        );
      });
    });
  });

  describe('Edit Attribute Dialog', () => {
    it('opens edit dialog with existing data', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find edit button for first attribute
      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      // Should see dialog with existing data
      expect(screen.getByText('Edit Attribute')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Department')).toBeInTheDocument();
    });

    it('updates existing attribute', async () => {
      const user = userEvent.setup();
      
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: { ...sampleAttributes[0], displayName: 'Updated Department' },
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      const displayNameInput = screen.getByDisplayValue('Department');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Updated Department');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/attributes/attr-1', expect.objectContaining({
          displayName: 'Updated Department',
        }));
      });
    });
  });

  describe('View Attribute Dialog', () => {
    it('opens view dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const viewButtons = screen.getAllByLabelText(/view/i);
      await user.click(viewButtons[0]);

      expect(screen.getByText('View Attribute')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
    });

    it('transitions from view to edit dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const viewButtons = screen.getAllByLabelText(/view/i);
      await user.click(viewButtons[0]);

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(screen.getByText('Edit Attribute')).toBeInTheDocument();
    });
  });

  describe('Delete Attribute', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('deletes attribute successfully', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByTestId('delete-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/attributes/attr-1');
      });
    });

    it('handles delete error', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockRejectedValue(new Error('Delete failed'));

      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByTestId('delete-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalledWith(
          { success: false, error: 'Delete failed' },
          'Attribute deleted successfully',
          'Failed to delete attribute'
        );
      });
    });
  });

  describe('Pagination', () => {
    it('handles page change', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Find next page button
      const nextPageButton = screen.getByLabelText(/go to next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          page: 2,
        }));
      });
    });

    it('handles rows per page change', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Change rows per page
      const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
      await user.click(rowsPerPageSelect);
      
      const option25 = screen.getByText('25');
      await user.click(option25);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', expect.objectContaining({
          limit: 25,
        }));
      });
    });
  });

  describe('Utility Functions and Edge Cases', () => {
    it('handles refresh functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    it('handles permission restrictions', async () => {
      mockPermissions.canCreate.mockReturnValue(false);
      mockPermissions.canEdit.mockReturnValue(false);
      mockPermissions.canDelete.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <AttributesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Create button should not be visible
      expect(screen.queryByText(/create attribute/i)).not.toBeInTheDocument();
      
      // Edit and delete buttons should not be visible
      expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument();
    });

    it('displays empty state when no attributes', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
        },
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
  });
});