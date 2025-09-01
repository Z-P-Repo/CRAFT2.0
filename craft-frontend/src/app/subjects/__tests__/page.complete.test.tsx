import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SubjectsPage from '../page';

// Comprehensive mocking
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  },
}));

const { apiClient: mockApiClient } = require('@/lib/api');

const mockSnackbar = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'user-1', name: 'Test User', role: 'admin' } }),
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
  const MockDashboardLayout = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  );
  MockDashboardLayout.displayName = 'MockDashboardLayout';
  return MockDashboardLayout;
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  const MockDeleteConfirmationDialog = ({ open, onConfirm, onClose, title, message }: any) => 
    open ? (
      <div data-testid="delete-dialog">
        <h3 data-testid="dialog-title">{title}</h3>
        <p data-testid="dialog-message">{message}</p>
        <button onClick={onConfirm} data-testid="confirm-delete">Delete</button>
        <button onClick={onClose} data-testid="cancel-delete">Cancel</button>
      </div>
    ) : null;
  MockDeleteConfirmationDialog.displayName = 'MockDeleteConfirmationDialog';
  return MockDeleteConfirmationDialog;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const mockSubjects = [
  {
    _id: 'subj-1',
    id: 'subj-1',
    name: 'john.doe',
    displayName: 'John Doe',
    email: 'john@example.com',
    type: 'user',
    role: 'Manager',
    department: 'Engineering',
    description: 'Engineering Manager',
    status: 'active',
    permissions: ['read', 'write'],
    policyCount: 2,
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['important'],
      isSystem: false,
      isCustom: true,
      version: '1.0',
    },
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    _id: 'subj-2',
    id: 'subj-2',
    name: 'jane.smith',
    displayName: 'Jane Smith',
    email: 'jane@example.com',
    type: 'user',
    role: 'Developer',
    department: 'Engineering',
    description: 'Senior Developer',
    status: 'inactive',
    permissions: ['read'],
    policyCount: 1,
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: [],
      isSystem: false,
      isCustom: true,
      version: '1.0',
    },
    active: false,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

describe('SubjectsPage Complete Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockSubjects,
      pagination: { total: 2, page: 1, limit: 10 },
    });
  });

  describe('Complete UI Interaction Coverage', () => {
    it('covers all dialog and handler functions systematically', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Test Create Subject Dialog (covers lines 876-898+)
      const createButton = screen.getByText('Create Subject');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('New Subject')).toBeInTheDocument();
      });

      // Test handleDisplayNameChange validation (lines 235-239)
      const displayNameInput = screen.getByLabelText(/display name/i);
      
      // Test short name validation
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'a');
      
      // Test valid name
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Valid Subject Name');

      // Test description field
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Test description');

      // Test handleSubmit for create (lines 462-505)
      mockApiClient.post.mockResolvedValue({ success: true, data: mockSubjects[0] });
      
      const saveButton = screen.getByText(/save|create/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', {
          displayName: 'Valid Subject Name',
          description: 'Test description',
          name: 'validsubjectname',
          type: 'user',
          role: 'User',
          department: 'General',
          status: 'active',
        });
      });

      // Test handleClose (lines 227-231)
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);
    });

    it('covers edit functionality and form submission', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Find and click edit button (covers lines 832-838)
      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Subject')).toBeInTheDocument();
      });

      // Modify the form
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Updated John Doe');

      // Test handleSubmit for update (lines 481-487)
      mockApiClient.put.mockResolvedValue({ success: true, data: mockSubjects[0] });
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/subjects/subj-1', {
          displayName: 'Updated John Doe',
          description: 'Engineering Manager',
          name: 'updatedjohndoe',
          type: 'user',
          role: 'User',
          department: 'General',
          status: 'active',
        });
      });
    });

    it('covers view functionality (lines 161-167, 822-827)', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Click view button (covers handleViewOpen lines 161-162)
      const viewButtons = screen.getAllByLabelText(/view/i);
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/view subject/i)).toBeInTheDocument();
      });

      // Close view dialog (covers handleViewClose lines 166-167)
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);
    });

    it('covers all delete scenarios systematically', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Test handleDeleteOpen (lines 171-172, 844-850)
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      });

      // Test handleDeleteClose (lines 176-177)
      const cancelButton = screen.getByTestId('cancel-delete');
      await user.click(cancelButton);

      // Test successful delete (lines 181-195)
      await user.click(deleteButtons[0]);
      mockApiClient.delete.mockResolvedValue({ success: true });
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
          'Subject "John Doe" deleted successfully'
        );
      });

      // Test unsuccessful delete response (lines 194-196)
      await user.click(deleteButtons[1]);
      mockApiClient.delete.mockResolvedValue({ success: false, error: 'Delete failed' });
      
      const confirmButton2 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton2);

      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });

      // Test 404 error (lines 204-207)
      await user.click(deleteButtons[0]);
      mockApiClient.delete.mockRejectedValue({ 
        error: '404 not found',
        message: 'Subject not found' 
      });
      
      const confirmButton3 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton3);

      await waitFor(() => {
        expect(mockSnackbar.showInfo).toHaveBeenCalledWith(
          'Subject no longer exists. Refreshing the list...'
        );
      });

      // Test system subject error (lines 208-211)
      await user.click(deleteButtons[1]);
      mockApiClient.delete.mockRejectedValue({ 
        error: 'Cannot delete system subjects',
        message: 'system subject' 
      });
      
      const confirmButton4 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton4);

      await waitFor(() => {
        expect(mockSnackbar.showWarning).toHaveBeenCalledWith(
          'System subjects cannot be deleted as they are required for the system to function properly.'
        );
      });

      // Test policy dependency error (lines 212-215)
      await user.click(deleteButtons[0]);
      mockApiClient.delete.mockRejectedValue({ 
        error: 'Unable to delete subject currently being used in active policies'
      });
      
      const confirmButton5 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton5);

      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith(
          'Unable to delete subject currently being used in active policies'
        );
      });

      // Test generic error (lines 216-220)
      await user.click(deleteButtons[1]);
      mockApiClient.delete.mockRejectedValue({ 
        error: 'Generic error',
        message: 'Something went wrong' 
      });
      
      const confirmButton6 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton6);

      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalled();
      });
    });

    it('covers bulk operations completely', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Test bulk selection (lines 244-270)
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      
      // Select all checkbox (lines 244-250)
      await user.click(checkboxes[0]);
      await user.click(checkboxes[0]); // Unselect all

      // Test individual selection scenarios (lines 254-270)
      // Select first (selectedIndex === -1)
      await user.click(checkboxes[1]);
      
      // Select second (concat scenario)
      await user.click(checkboxes[2]);
      
      // Unselect first (selectedIndex === 0)
      await user.click(checkboxes[1]);
      
      // Select first again, then unselect second (middle removal)
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Test bulk delete open (line 277)
      const bulkDeleteButton = screen.getByText(/delete selected/i);
      await user.click(bulkDeleteButton);

      // Test bulk delete close (line 281)
      const cancelButton = screen.getByTestId('cancel-delete');
      await user.click(cancelButton);

      // Test bulk delete confirm successful (lines 285-307)
      await user.click(bulkDeleteButton);
      mockApiClient.request.mockResolvedValue({ success: true });
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApiClient.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/subjects/bulk/delete',
          data: { subjectIds: ['subj-1'] }
        });
      });

      // Test bulk delete error (lines 308-330)
      await user.click(checkboxes[1]);
      await user.click(bulkDeleteButton);
      mockApiClient.request.mockRejectedValue({ 
        error: 'Unable to delete subjects currently being used in active policies'
      });
      
      const confirmButton2 = screen.getByTestId('confirm-delete');
      await user.click(confirmButton2);

      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalled();
      });
    });

    it('covers search and filter operations', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Test search functionality (lines 340-342, 377-380)
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'john');

      // Test clear filters (lines 352-356)
      const clearButton = screen.getByText(/clear/i);
      await user.click(clearButton);

      // Test sort change (lines 344-349)
      const nameHeader = screen.getByText('Display Name');
      await user.click(nameHeader);

      // Test pagination (lines 385-391)
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockSubjects,
        pagination: { total: 50, page: 1, limit: 10 },
      });

      // Trigger re-render with more data
      const refreshButton = screen.getByLabelText(/refresh/i);
      await user.click(refreshButton);

      await waitFor(() => {
        // Should now have pagination controls
        const nextButton = screen.getByLabelText(/next page/i);
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next page/i);
      await user.click(nextButton);

      // Test rows per page change
      const rowsSelect = screen.getByDisplayValue('10');
      await user.click(rowsSelect);
      
      const option25 = screen.getByText('25');
      await user.click(option25);
    });

    it('covers form validation and error scenarios', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Open create dialog
      const createButton = screen.getByText('Create Subject');
      await user.click(createButton);

      // Test early return on validation error (lines 463-465)
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'a'); // Too short

      const saveButton = screen.getByText(/save|create/i);
      await user.click(saveButton);

      // Should not call API due to validation error
      expect(mockApiClient.post).not.toHaveBeenCalled();

      // Test API error handling (lines 499-504)
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Valid Name');

      mockApiClient.post.mockRejectedValue(new Error('API Error'));
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalled();
      });
    });

    it('covers API fetch error scenarios', async () => {
      // Test fetchSubjects error handling (lines 423-430)
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Test unsuccessful API response (lines 423-430)
      mockApiClient.get.mockResolvedValue({
        success: false,
        error: 'Unauthorized',
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Unauthorized');
      });
    });

    it('covers clearSelection function', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      // Select items first
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);

      // Clear selection (line 335)
      const clearButton = screen.getByText(/clear selection/i);
      await user.click(clearButton);
    });
  });
});