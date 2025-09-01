import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SubjectsPage from '../page';

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
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

const mockUser = {
  _id: 'user-1',
  name: 'Test User',
  role: 'admin',
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
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
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  const MockDashboardLayout = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  MockDashboardLayout.displayName = 'MockDashboardLayout';
  return MockDashboardLayout;
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  const MockDeleteConfirmationDialog = ({ open, onConfirm, onClose }: any) => open ? (
    <div>
      <button onClick={onConfirm}>Confirm Delete</button>
      <button onClick={onClose}>Cancel Delete</button>
    </div>
  ) : null;
  MockDeleteConfirmationDialog.displayName = 'MockDeleteConfirmationDialog';
  return MockDeleteConfirmationDialog;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const sampleSubjects = [
  {
    _id: 'subj-1',
    id: 'subj-1',
    name: 'john.doe',
    displayName: 'John Doe',
    email: 'john@example.com',
    type: 'user',
    role: 'manager',
    department: 'Engineering',
    description: 'Test user',
    status: 'active',
    permissions: ['read'],
    policyCount: 2,
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: [],
      isSystem: false,
      isCustom: true,
      version: '1.0',
    },
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

describe('SubjectsPage Optimized Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: sampleSubjects,
      pagination: { total: 1, page: 1, limit: 10 },
    });
  });

  describe('Basic Component Functionality', () => {
    it('renders and loads data successfully', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
          page: 1,
          limit: 10,
          sortBy: 'displayName',
          sortOrder: 'asc',
        });
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      expect(screen.getAllByText('...')).toHaveLength(3);
    });

    it('covers getTypeColor helper function', async () => {
      const subjectsWithDifferentTypes = [
        { ...sampleSubjects[0], type: 'user' },
        { ...sampleSubjects[0], _id: 'subj-2', type: 'group' },
        { ...sampleSubjects[0], _id: 'subj-3', type: 'role' },
        { ...sampleSubjects[0], _id: 'subj-4', type: 'unknown' },
      ];

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: subjectsWithDifferentTypes,
        pagination: { total: 4, page: 1, limit: 10 },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // This triggers the getTypeColor function for different types
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('covers getTypeIcon helper function', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // This should trigger the getTypeIcon function
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles API error during fetch', async () => {
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

    it('covers handleClickOpen for creating new subject', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByText(/create subject/i);
      fireEvent.click(createButton);

      expect(screen.getByText('Create New Subject')).toBeInTheDocument();
    });

    it('covers handleClickOpen for editing existing subject', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Subject')).toBeInTheDocument();
    });

    it('covers handleViewOpen and handleViewClose', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open view dialog
      const viewButtons = screen.getAllByLabelText(/view/i);
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText('View Subject')).toBeInTheDocument();

      // Close view dialog
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(screen.queryByText('View Subject')).not.toBeInTheDocument();
    });

    it('covers handleDeleteOpen and handleDeleteClose', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

      // Close delete dialog
      const cancelButton = screen.getByText('Cancel Delete');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });

    it('covers successful delete operation', async () => {
      mockApiClient.delete.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      // Confirm delete
      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/subjects/subj-1');
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
          'Subject "John Doe" deleted successfully'
        );
      });
    });

    it('covers delete operation with API error response', async () => {
      mockApiClient.delete.mockResolvedValue({
        success: false,
        error: 'Cannot delete subject',
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });

    it('covers delete operation with exception', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });

    it('covers form submission for create', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: sampleSubjects[0],
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open create dialog
      const createButton = screen.getByText(/create subject/i);
      fireEvent.click(createButton);

      // Fill form
      const displayNameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(displayNameInput, { target: { value: 'New Subject' } });

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      // Submit form
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          displayName: 'New Subject',
          email: 'new@example.com',
        }));
      });
    });

    it('covers form validation error', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open create dialog
      const createButton = screen.getByText(/create subject/i);
      fireEvent.click(createButton);

      // Try to submit without required fields
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
    });

    it('covers form submission for update', async () => {
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: { ...sampleSubjects[0], displayName: 'Updated John' },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open edit dialog
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);

      // Modify form
      const displayNameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(displayNameInput, { target: { value: 'Updated John' } });

      // Submit form
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/subjects/subj-1', expect.objectContaining({
          displayName: 'Updated John',
        }));
      });
    });

    it('covers search functionality', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText('Search subjects...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Advance timers to trigger search
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          search: 'john',
        }));
      });

      jest.useRealTimers();
    });

    it('covers pagination functionality', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });

      // Change page
      const nextPageButton = screen.getByLabelText(/go to next page/i);
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          page: 2,
        }));
      });

      // Change rows per page
      const rowsPerPageSelect = screen.getByDisplayValue('10');
      fireEvent.change(rowsPerPageSelect, { target: { value: '25' } });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          limit: 25,
          page: 1, // Should reset to page 1
        }));
      });
    });

    it('covers bulk selection functionality', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Select all
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      fireEvent.click(selectAllCheckbox);

      // Should show bulk delete button
      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();

      // Individual selection
      fireEvent.click(selectAllCheckbox); // Unselect all
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first individual item

      expect(screen.getByLabelText(/bulk delete/i)).toBeInTheDocument();
    });

    it('covers bulk delete functionality', async () => {
      mockApiClient.delete.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Select items
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      fireEvent.click(selectAllCheckbox);

      // Open bulk delete
      const bulkDeleteButton = screen.getByLabelText(/bulk delete/i);
      fireEvent.click(bulkDeleteButton);

      // Confirm bulk delete
      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/subjects/subj-1');
      });
    });

    it('covers clear search functionality', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText('Search subjects...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear search
      const clearButton = screen.getByLabelText(/clear/i);
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('covers empty state', async () => {
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
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('covers various subject statuses and metadata', async () => {
      const subjectsWithVariousData = [
        { 
          ...sampleSubjects[0], 
          status: 'inactive',
          metadata: {
            ...sampleSubjects[0].metadata,
            isSystem: true,
            externalId: 'ext-123',
          },
          lastLogin: '2023-01-15T00:00:00Z',
          usedInPolicies: [
            { id: 'pol1', name: 'policy1', displayName: 'Policy 1' }
          ]
        }
      ];

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: subjectsWithVariousData,
        pagination: { total: 1, page: 1, limit: 10 },
      });

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('covers form submission error handling', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Validation failed'));

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      const createButton = screen.getByText(/create subject/i);
      fireEvent.click(createButton);

      const displayNameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(displayNameInput, { target: { value: 'Test Subject' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });

    it('covers dialog close and form reset', async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open create dialog
      const createButton = screen.getByText(/create subject/i);
      fireEvent.click(createButton);

      // Fill form
      const displayNameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(displayNameInput, { target: { value: 'Test' } });

      // Close dialog
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      // Reopen dialog - form should be reset
      fireEvent.click(createButton);

      const newDisplayNameInput = screen.getByLabelText(/display name/i);
      expect(newDisplayNameInput).toHaveValue('');
    });
  });
});