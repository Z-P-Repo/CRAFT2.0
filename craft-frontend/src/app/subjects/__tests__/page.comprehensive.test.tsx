import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SubjectsPage from '../page';

// Mock all dependencies
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
  <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
);

// Sample subject data
const sampleSubjects = [
  {
    _id: 'subj-1',
    id: 'subj-1',
    name: 'john.doe',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    type: 'user' as const,
    role: 'manager',
    department: 'Engineering',
    description: 'Software engineer',
    status: 'active' as const,
    permissions: ['read', 'write'],
    policyCount: 3,
    usedInPolicies: [
      { id: 'pol-1', name: 'policy1', displayName: 'Policy 1' }
    ],
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['employee'],
      isSystem: false,
      isCustom: true,
      version: '1.0',
      externalId: 'ext-1',
    },
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    lastLogin: '2023-01-02T00:00:00Z',
  },
  {
    _id: 'subj-2',
    id: 'subj-2',
    name: 'developers',
    displayName: 'Developers Group',
    email: 'developers@example.com',
    type: 'group' as const,
    role: 'developer',
    department: 'IT',
    status: 'inactive' as const,
    permissions: ['read'],
    policyCount: 1,
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['group'],
      isSystem: true,
      isCustom: false,
      version: '2.0',
    },
    active: false,
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z',
  },
];

describe('SubjectsPage Comprehensive Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: sampleSubjects,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
      },
    });
  });

  describe('Component Initialization and Rendering', () => {
    it('renders main subjects page structure', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /subjects/i })).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
          page: 1,
          limit: 10,
          search: '',
          type: [],
          status: [],
          sortBy: 'displayName',
          sortOrder: 'asc',
        });
      });
    });

    it('displays loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      // Should show loading indicators
      expect(screen.getAllByText('...')).toHaveLength(3);
    });

    it('handles successful data load with statistics', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
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
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });

    it('handles unsuccessful API response', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        error: 'Access denied',
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Data Display and Table Functionality', () => {
    it('displays subjects in table format', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Developers Group')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });
    });

    it('displays subject types with correct styling', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for type display
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('group')).toBeInTheDocument();
      });
    });

    it('displays policy counts correctly', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show policy counts
        const policyElements = screen.getAllByText(/^\d+$/);
        expect(policyElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('updates search input and triggers API call', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText('Search subjects...');
      await user.type(searchInput, 'john');

      // Should trigger API call with search term
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          search: 'john',
        }));
      }, { timeout: 1000 });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search subjects...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });

      const clearButton = screen.getByLabelText(/clear search/i);
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter and Sort Functionality', () => {
    it('opens filter popover and applies filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByLabelText(/filter/i);
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      // Apply type filter
      const userTypeCheckbox = screen.getByLabelText('user');
      await user.click(userTypeCheckbox);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          type: ['user'],
        }));
      });
    });

    it('opens sort popover and handles sorting', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const sortButton = screen.getByLabelText(/sort/i);
      await user.click(sortButton);

      await waitFor(() => {
        expect(screen.getByText('Display Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
      });

      // Select sort option
      await user.click(screen.getByText('Email'));

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          sortBy: 'email',
        }));
      });
    });

    it('toggles sort order when clicking same field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
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
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          sortBy: 'displayName',
          sortOrder: 'desc',
        }));
      });
    });

    it('clears all filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByLabelText(/filter/i);
      await user.click(filterButton);

      // Apply some filters first
      const userTypeCheckbox = screen.getByLabelText('user');
      await user.click(userTypeCheckbox);

      // Clear all filters
      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          type: [],
          status: [],
        }));
      });
    });
  });

  describe('Create Subject Functionality', () => {
    it('opens create dialog via create button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      expect(screen.getByText('Create New Subject')).toBeInTheDocument();
    });

    it('opens create dialog via FAB', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const fab = screen.getByLabelText(/add subject/i);
      await user.click(fab);

      expect(screen.getByText('Create New Subject')).toBeInTheDocument();
    });

    it('validates display name field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      // Try to submit without display name
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
    });

    it('creates new subject successfully', async () => {
      const user = userEvent.setup();
      
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: { ...sampleSubjects[0], _id: 'new-subj' },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      // Fill in form
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'New Subject');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'new@example.com');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          displayName: 'New Subject',
          email: 'new@example.com',
        }));
      });
    });

    it('handles create error', async () => {
      const user = userEvent.setup();
      
      mockApiClient.post.mockRejectedValue(new Error('Validation error'));

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Test Subject');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Subject Functionality', () => {
    it('opens edit dialog with existing data', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Subject')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('updates existing subject', async () => {
      const user = userEvent.setup();
      
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: { ...sampleSubjects[0], displayName: 'Updated John Doe' },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Updated John Doe');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/subjects/subj-1', expect.objectContaining({
          displayName: 'Updated John Doe',
        }));
      });
    });
  });

  describe('View Subject Dialog', () => {
    it('opens view dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const viewButtons = screen.getAllByLabelText(/view/i);
      await user.click(viewButtons[0]);

      expect(screen.getByText('View Subject')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('transitions from view to edit dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const viewButtons = screen.getAllByLabelText(/view/i);
      await user.click(viewButtons[0]);

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(screen.getByText('Edit Subject')).toBeInTheDocument();
    });
  });

  describe('Delete Subject Functionality', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('deletes subject successfully', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <SubjectsPage />
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
        expect(mockApiClient.delete).toHaveBeenCalledWith('/subjects/subj-1');
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
          'Subject "John Doe" deleted successfully'
        );
      });
    });

    it('handles delete error with API response', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockResolvedValue({
        success: false,
        error: 'Cannot delete subject in use',
      });

      render(
        <TestWrapper>
          <SubjectsPage />
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
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });

    it('handles delete exception error', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SubjectsPage />
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
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('handles select all checkbox', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('handles individual row selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Skip select all checkbox
      await user.click(firstRowCheckbox);

      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('opens bulk delete dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Select items first
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      // Click bulk delete
      const bulkDeleteButton = screen.getByLabelText(/bulk delete/i);
      await user.click(bulkDeleteButton);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('performs bulk delete operation', async () => {
      const user = userEvent.setup();
      
      mockApiClient.delete.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Select items
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      // Click bulk delete
      const bulkDeleteButton = screen.getByLabelText(/bulk delete/i);
      await user.click(bulkDeleteButton);

      // Confirm bulk delete
      const confirmButton = screen.getByTestId('delete-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledTimes(2); // One for each selected subject
      });
    });
  });

  describe('Pagination', () => {
    it('handles page change', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const nextPageButton = screen.getByLabelText(/go to next page/i);
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          page: 2,
        }));
      });
    });

    it('handles rows per page change', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const rowsPerPageSelect = screen.getByLabelText(/rows per page/i);
      await user.click(rowsPerPageSelect);
      
      const option25 = screen.getByText('25');
      await user.click(option25);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          limit: 25,
          page: 1, // Should reset to first page
        }));
      });
    });
  });

  describe('Permission-based Functionality', () => {
    it('handles permission restrictions', async () => {
      const { canCreate, canEdit, canDelete } = require('@/utils/permissions');
      canCreate.mockReturnValue(false);
      canEdit.mockReturnValue(false);
      canDelete.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Create button should not be visible
      expect(screen.queryByText(/create subject/i)).not.toBeInTheDocument();
      
      // Edit and delete buttons should not be visible
      expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument();
    });
  });

  describe('Utility Functions and Edge Cases', () => {
    it('displays empty state when no subjects', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10 },
      });
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total count
      });
    });

    it('handles close dialog actions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open create dialog
      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      // Close dialog
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(screen.queryByText('Create New Subject')).not.toBeInTheDocument();
    });

    it('handles form reset on dialog close', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Open create dialog and fill form
      const createButton = screen.getByText(/create subject/i);
      await user.click(createButton);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'Test Name');

      // Close and reopen dialog
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      await user.click(createButton);

      // Form should be reset
      const newDisplayNameInput = screen.getByLabelText(/display name/i);
      expect(newDisplayNameInput).toHaveValue('');
    });

    it('handles various subject types and statuses', async () => {
      const diverseSubjects = [
        { ...sampleSubjects[0], type: 'role', status: 'active' },
        { ...sampleSubjects[1], type: 'user', status: 'inactive' },
      ];

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: diverseSubjects,
        pagination: { total: 2, page: 1, limit: 10 },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('role')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
      });
    });
  });
});