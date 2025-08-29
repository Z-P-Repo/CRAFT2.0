import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttributesPage from '../page';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const { apiClient: mockApiClient } = require('@/lib/api');

// Mock permissions utils
jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

const mockPermissions = require('@/utils/permissions');

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
const mockUser = {
  _id: 'current-user',
  id: 'current-user',
  name: 'Current User',
  email: 'current@example.com',
  role: 'admin',
  active: true,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock SnackbarContext
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
    onClose, 
    onConfirm, 
    title,
    loading 
  }: any) {
    if (!open) return null;
    return (
      <div data-testid="delete-dialog">
        <div>{title}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    );
  };
});

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
);

// Mock data
const mockAttributes = [
  {
    _id: 'attr-1',
    id: 'attr-1',
    displayName: 'Department',
    name: 'department',
    description: 'Employee department',
    dataType: 'string',
    category: 'subject',
    constraints: {
      required: true,
      permittedValues: ['HR', 'Engineering', 'Marketing'],
    },
    metadata: {
      system: false,
      createdBy: { name: 'Admin', email: 'admin@test.com' },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    usage: {
      totalPolicies: 3,
      activePolicies: 2,
      policyNames: ['Policy 1', 'Policy 2', 'Policy 3'],
    },
  },
  {
    _id: 'attr-2',
    id: 'attr-2',
    displayName: 'Age',
    name: 'age',
    description: 'Employee age',
    dataType: 'number',
    category: 'subject',
    constraints: {
      required: false,
      min: 18,
      max: 65,
    },
    metadata: {
      system: false,
      createdBy: { name: 'User', email: 'user@test.com' },
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
    usage: {
      totalPolicies: 0,
      activePolicies: 0,
      policyNames: [],
    },
  },
];

describe('AttributesPage Enhanced Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful API responses
    mockApiClient.get.mockImplementation((url: string) => {
      if (url === '/attributes') {
        return Promise.resolve({
          data: {
            success: true,
            data: mockAttributes,
            total: mockAttributes.length,
          },
        });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Component Initialization and Rendering', () => {
    test('renders main component structure', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      expect(screen.getByText('Attributes')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    test('initializes with correct default state', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes');
      });
    });

    test('handles loading state correctly', async () => {
      // Mock delayed response
      mockApiClient.get.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                success: true,
                data: mockAttributes,
                total: mockAttributes.length,
              },
            });
          }, 100);
        });
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      // Should show loading initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Fast forward timers and wait
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality Enhanced', () => {
    test('handles search input changes', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      fireEvent.change(searchInput, { target: { value: 'Department' } });
      
      // Fast forward debounce timer
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            search: 'Department',
          }),
        });
      });
    });

    test('clears search correctly', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText('Search attributes...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Create Attribute Dialog Enhanced', () => {
    test('opens create dialog via button', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Attribute')).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const saveButton = screen.getByRole('button', { name: 'Create' });
      fireEvent.click(saveButton);
      
      // Should show validation errors
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });

    test('creates new attribute successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            _id: 'new-attr',
            displayName: 'New Attribute',
            name: 'new_attribute',
            dataType: 'string',
            category: 'subject',
          },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'New Attribute' } });
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const stringOption = screen.getByRole('option', { name: 'String' });
      fireEvent.click(stringOption);
      
      const categorySelect = screen.getByLabelText('Category *');
      fireEvent.mouseDown(categorySelect);
      const subjectOption = screen.getByRole('option', { name: 'Subject' });
      fireEvent.click(subjectOption);
      
      const saveButton = screen.getByRole('button', { name: 'Create' });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/attributes', expect.any(Object));
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Attribute created successfully');
      });
    });

    test('handles create errors', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: {
            success: false,
            error: 'Attribute name already exists',
          },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Duplicate Attribute' } });
      
      const saveButton = screen.getByRole('button', { name: 'Create' });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Attribute Dialog Enhanced', () => {
    test('opens edit dialog with existing data', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const editButtons = screen.getAllByLabelText('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Attribute')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Department')).toBeInTheDocument();
    });

    test('updates existing attribute', async () => {
      mockApiClient.put.mockResolvedValue({
        data: {
          success: true,
          data: {
            ...mockAttributes[0],
            displayName: 'Updated Department',
          },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const editButtons = screen.getAllByLabelText('Edit');
      fireEvent.click(editButtons[0]);
      
      const displayNameInput = screen.getByDisplayValue('Department');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Department' } });
      
      const saveButton = screen.getByRole('button', { name: 'Update' });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/attributes/attr-1', expect.any(Object));
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Attribute updated successfully');
      });
    });

    test('shows usage warning for attributes used in policies', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const editButtons = screen.getAllByLabelText('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByText(/This attribute is used in 3 policies/)).toBeInTheDocument();
    });
  });

  describe('Delete Attribute Enhanced', () => {
    test('opens delete confirmation dialog', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    test('deletes attribute successfully', async () => {
      mockApiClient.delete.mockResolvedValue({
        data: { success: true },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/attributes/attr-1');
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Attribute deleted successfully');
      });
    });

    test('handles delete errors - not found', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: {
          status: 404,
          data: { success: false, error: 'Attribute not found' },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Attribute not found');
      });
    });

    test('handles delete errors - system attribute', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: {
          status: 400,
          data: { 
            success: false, 
            error: 'Cannot delete system attribute',
            details: { type: 'system_attribute' }
          },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Cannot delete system attributes');
      });
    });

    test('handles delete errors - policy dependency', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: {
          status: 400,
          data: { 
            success: false, 
            error: 'Attribute is used in policies',
            details: { 
              type: 'policy_dependency',
              policies: ['Policy 1', 'Policy 2']
            }
          },
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith(
          expect.stringContaining('This attribute is currently used in the following policies')
        );
      });
    });
  });

  describe('Data Type Specific Form Fields', () => {
    test('shows string value inputs for string data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const stringOption = screen.getByRole('option', { name: 'String' });
      fireEvent.click(stringOption);
      
      expect(screen.getByText('Permitted Values (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a permitted value')).toBeInTheDocument();
    });

    test('shows number value inputs for number data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const numberOption = screen.getByRole('option', { name: 'Number' });
      fireEvent.click(numberOption);
      
      expect(screen.getByLabelText('Minimum Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Value')).toBeInTheDocument();
    });

    test('shows boolean value selector for boolean data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const booleanOption = screen.getByRole('option', { name: 'Boolean' });
      fireEvent.click(booleanOption);
      
      expect(screen.getByText('Default Value')).toBeInTheDocument();
    });

    test('shows date value inputs for date data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const dateOption = screen.getByRole('option', { name: 'Date' });
      fireEvent.click(dateOption);
      
      expect(screen.getByText('Date Input Type')).toBeInTheDocument();
    });

    test('shows array value inputs for array data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const arrayOption = screen.getByRole('option', { name: 'Array' });
      fireEvent.click(arrayOption);
      
      expect(screen.getByText('Default Value (JSON Array)')).toBeInTheDocument();
    });

    test('shows object value inputs for object data type', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const objectOption = screen.getByRole('option', { name: 'Object' });
      fireEvent.click(objectOption);
      
      expect(screen.getByText('Default Value (JSON Object)')).toBeInTheDocument();
    });
  });

  describe('Form Value Management', () => {
    test('handles string value addition and removal', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const stringOption = screen.getByRole('option', { name: 'String' });
      fireEvent.click(stringOption);
      
      const valueInput = screen.getByPlaceholderText('Add a permitted value');
      fireEvent.change(valueInput, { target: { value: 'Test Value' } });
      
      const addButton = screen.getByRole('button', { name: 'Add' });
      fireEvent.click(addButton);
      
      expect(screen.getByText('Test Value')).toBeInTheDocument();
      
      const removeButton = screen.getByLabelText('Remove Test Value');
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('Test Value')).not.toBeInTheDocument();
    });

    test('handles JSON array parsing', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const arrayOption = screen.getByRole('option', { name: 'Array' });
      fireEvent.click(arrayOption);
      
      const jsonInput = screen.getByLabelText('Default Value (JSON Array)');
      fireEvent.change(jsonInput, { target: { value: '["value1", "value2"]' } });
      
      // The component should parse the JSON successfully
      expect(jsonInput).toHaveValue('["value1", "value2"]');
    });

    test('handles invalid JSON input', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByRole('button', { name: /create attribute/i });
      fireEvent.click(createButton);
      
      const dataTypeSelect = screen.getByLabelText('Data Type *');
      fireEvent.mouseDown(dataTypeSelect);
      const arrayOption = screen.getByRole('option', { name: 'Array' });
      fireEvent.click(arrayOption);
      
      const jsonInput = screen.getByLabelText('Default Value (JSON Array)');
      fireEvent.change(jsonInput, { target: { value: 'invalid json' } });
      
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    test('handles category filter selection', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const filterButton = screen.getByLabelText('Filter');
      fireEvent.click(filterButton);
      
      const categoryFilter = screen.getByLabelText('Category');
      fireEvent.mouseDown(categoryFilter);
      const subjectOption = screen.getByRole('option', { name: 'Subject' });
      fireEvent.click(subjectOption);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            category: 'subject',
          }),
        });
      });
    });

    test('handles data type filter selection', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const filterButton = screen.getByLabelText('Filter');
      fireEvent.click(filterButton);
      
      const dataTypeFilter = screen.getByLabelText('Data Type');
      fireEvent.mouseDown(dataTypeFilter);
      const stringOption = screen.getByRole('option', { name: 'String' });
      fireEvent.click(stringOption);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            dataType: 'string',
          }),
        });
      });
    });

    test('handles sort selection', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const sortButton = screen.getByLabelText('Sort');
      fireEvent.click(sortButton);
      
      const nameOption = screen.getByText('Name (A-Z)');
      fireEvent.click(nameOption);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        });
      });
    });
  });

  describe('Pagination', () => {
    test('handles page change', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const nextPageButton = screen.getByLabelText('Go to next page');
      fireEvent.click(nextPageButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            page: 2,
          }),
        });
      });
    });

    test('handles rows per page change', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const rowsPerPageSelect = screen.getByRole('button', { name: /rows per page/i });
      fireEvent.mouseDown(rowsPerPageSelect);
      
      const option25 = screen.getByRole('option', { name: '25' });
      fireEvent.click(option25);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', {
          params: expect.objectContaining({
            limit: 25,
            page: 1,
          }),
        });
      });
    });
  });

  describe('Bulk Operations', () => {
    test('handles select all checkbox', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(selectAllCheckbox);
      
      // All attribute checkboxes should be selected
      const attributeCheckboxes = screen.getAllByRole('checkbox');
      const attributeSelectionCheckboxes = attributeCheckboxes.slice(1); // Exclude select all
      
      attributeSelectionCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    test('handles individual attribute selection', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const attributeCheckboxes = screen.getAllByRole('checkbox');
      const firstAttributeCheckbox = attributeCheckboxes[1]; // First attribute checkbox
      
      fireEvent.click(firstAttributeCheckbox);
      
      expect(firstAttributeCheckbox).toBeChecked();
      
      // Should show bulk actions toolbar
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    test('handles bulk delete operation', async () => {
      mockApiClient.delete.mockResolvedValue({
        data: { success: true },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Select first attribute
      const attributeCheckboxes = screen.getAllByRole('checkbox');
      const firstAttributeCheckbox = attributeCheckboxes[1];
      fireEvent.click(firstAttributeCheckbox);
      
      // Click bulk delete
      const bulkDeleteButton = screen.getByLabelText('Delete selected');
      fireEvent.click(bulkDeleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/attributes/bulk', {
          data: { ids: ['attr-1'] },
        });
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('1 attribute deleted successfully');
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message on fetch failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading attributes. Please try again.')).toBeInTheDocument();
      });
    });

    test('handles empty state', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
          total: 0,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('No attributes found')).toBeInTheDocument();
      });
    });

    test('shows clear filters option when no results with active filters', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
          total: 0,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Apply a filter first
      const filterButton = screen.getByLabelText('Filter');
      fireEvent.click(filterButton);
      
      const categoryFilter = screen.getByLabelText('Category');
      fireEvent.mouseDown(categoryFilter);
      const subjectOption = screen.getByRole('option', { name: 'Subject' });
      fireEvent.click(subjectOption);
      
      await waitFor(() => {
        expect(screen.getByText('No attributes match your current filters.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
      });
    });
  });

  describe('Permission-based UI', () => {
    test('hides create button when user cannot create', async () => {
      mockPermissions.canCreate.mockReturnValue(false);

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      expect(screen.queryByRole('button', { name: /create attribute/i })).not.toBeInTheDocument();
    });

    test('hides edit buttons when user cannot edit', async () => {
      mockPermissions.canEdit.mockReturnValue(false);

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
    });

    test('hides delete buttons when user cannot delete', async () => {
      mockPermissions.canDelete.mockReturnValue(false);

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Helper Functions Coverage', () => {
    test('tests getCategoryColor function with all categories', async () => {
      const attributesWithDifferentCategories = [
        { ...mockAttributes[0], category: 'subject' },
        { ...mockAttributes[0], _id: 'attr-2', category: 'resource' },
        { ...mockAttributes[0], _id: 'attr-3', category: 'action' },
        { ...mockAttributes[0], _id: 'attr-4', category: 'environment' },
        { ...mockAttributes[0], _id: 'attr-5', category: 'custom' },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: attributesWithDifferentCategories,
          total: attributesWithDifferentCategories.length,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Subject')).toBeInTheDocument();
        expect(screen.getByText('Resource')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Environment')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });
    });

    test('tests getTypeColor function with all data types', async () => {
      const attributesWithDifferentTypes = [
        { ...mockAttributes[0], dataType: 'string' },
        { ...mockAttributes[0], _id: 'attr-2', dataType: 'number' },
        { ...mockAttributes[0], _id: 'attr-3', dataType: 'boolean' },
        { ...mockAttributes[0], _id: 'attr-4', dataType: 'date' },
        { ...mockAttributes[0], _id: 'attr-5', dataType: 'array' },
        { ...mockAttributes[0], _id: 'attr-6', dataType: 'object' },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: attributesWithDifferentTypes,
          total: attributesWithDifferentTypes.length,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('String')).toBeInTheDocument();
        expect(screen.getByText('Number')).toBeInTheDocument();
        expect(screen.getByText('Boolean')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Array')).toBeInTheDocument();
        expect(screen.getByText('Object')).toBeInTheDocument();
      });
    });

    test('handles attributes without constraints', async () => {
      const attributeWithoutConstraints = [
        {
          ...mockAttributes[0],
          constraints: undefined,
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: attributeWithoutConstraints,
          total: attributeWithoutConstraints.length,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Any value')).toBeInTheDocument();
      });
    });

    test('handles attributes with missing metadata', async () => {
      const attributeWithoutMetadata = [
        {
          ...mockAttributes[0],
          metadata: undefined,
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: attributeWithoutMetadata,
          total: attributeWithoutMetadata.length,
        },
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('refreshes data when refresh button is clicked', async () => {
      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByLabelText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    test('auto-refresh functionality', async () => {
      const mockFocus = jest.fn();
      const mockBlur = jest.fn();
      
      // Mock window focus/blur events
      Object.defineProperty(window, 'addEventListener', {
        value: jest.fn().mockImplementation((event, callback) => {
          if (event === 'focus') mockFocus.mockImplementation(callback);
          if (event === 'blur') mockBlur.mockImplementation(callback);
        }),
      });

      render(<AttributesPage />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Simulate window focus
      act(() => {
        mockFocus();
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });
});