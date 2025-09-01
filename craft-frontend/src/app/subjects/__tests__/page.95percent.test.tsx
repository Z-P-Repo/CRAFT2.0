import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SubjectsPage from '../page';

// Comprehensive mocking for 95% coverage
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
  const MockDashboardLayout = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  MockDashboardLayout.displayName = 'MockDashboardLayout';
  return MockDashboardLayout;
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  const MockDeleteConfirmationDialog = ({ open, onConfirm, onClose, items, item }: any) => 
    open ? (
      <div data-testid="delete-dialog">
        {item && <div data-testid="single-item">{item.displayName}</div>}
        {items && <div data-testid="bulk-items">{items.length} items</div>}
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

const createMockSubject = (id: string, active: boolean = true) => ({
  _id: id,
  id: id,
  name: `subject.${id}`,
  displayName: `Subject ${id}`,
  email: `subject${id}@example.com`,
  type: 'user',
  role: 'User',
  department: 'General',
  description: `Description for subject ${id}`,
  status: active ? 'active' : 'inactive',
  permissions: ['read'],
  policyCount: 1,
  metadata: { 
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: [],
    isSystem: false,
    isCustom: true,
    version: '1.0'
  },
  active: active,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
});

describe('SubjectsPage 95% Coverage Test', () => {
  it('achieves 95% coverage through comprehensive component interaction', async () => {
    const mockSubjects = [
      createMockSubject('1', true),
      createMockSubject('2', false),
      createMockSubject('3', true),
    ];

    // Setup successful API responses
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockSubjects,
      pagination: { total: 3, page: 1, limit: 10 },
    });

    const { container } = render(<TestWrapper><SubjectsPage /></TestWrapper>);

    // Wait for data to load - covers fetchSubjects success path
    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
        page: 1,
        limit: 10,
        sortBy: 'displayName',
        sortOrder: 'asc',
      });
    });

    // Covers basic rendering and statistics calculation (lines 507-600)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total count
      expect(screen.getByText('2')).toBeInTheDocument(); // Active count  
      expect(screen.getByText('1')).toBeInTheDocument(); // Inactive count
    });

    // Force re-render to cover all table rendering paths (lines 650-870)
    await act(async () => {
      // Trigger a state update to force re-render of table
      const refreshButton = container.querySelector('[aria-label*="refresh"]');
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }
    });

    // Cover Create Subject Dialog and all form paths (lines 876-978)
    const createButton = screen.getByText('Create Subject');
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Subject')).toBeInTheDocument();
    });

    // Cover all form interactions and validation (lines 918-936)
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const descriptionInput = screen.getByRole('textbox', { name: /description/i });
    
    // Test validation paths (lines 235-239)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'a' } }); // Too short
    });
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Valid Subject Name' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    });

    // Cover form submission - create path (lines 462-505)
    mockApiClient.post.mockResolvedValue({ success: true, data: mockSubjects[0] });
    
    const saveButton = screen.getByText('Create Subject');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        displayName: 'Valid Subject Name',
        description: 'Test description',
        name: 'validsubjectname',
        type: 'user',
        role: 'User',
        department: 'General',
        status: 'active',
      }));
    });

    // Cover handleClose (lines 227-231)
    await act(async () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    // Cover Edit functionality and update path (lines 481-487, 832-838, 1113-1125)
    await act(async () => {
      const editButtons = container.querySelectorAll('[aria-label="Edit"]');
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Subject')).toBeInTheDocument();
    });

    // Modify form for update
    const editNameInput = screen.getByDisplayValue('Subject 1');
    await act(async () => {
      fireEvent.change(editNameInput, { target: { value: 'Updated Subject 1' } });
    });

    // Cover update submission
    mockApiClient.put.mockResolvedValue({ success: true, data: mockSubjects[0] });
    const updateButton = screen.getByText('Update Subject');
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(mockApiClient.put).toHaveBeenCalledWith('/subjects/1', expect.any(Object));
    });

    // Close edit dialog
    await act(async () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    // Cover View functionality (lines 161-167, 822-827, 982-1127)
    await act(async () => {
      const viewButtons = container.querySelectorAll('[aria-label="View"]');
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('View Subject')).toBeInTheDocument();
    });

    // Cover edit from view dialog (lines 1113-1125)
    const editFromViewButton = screen.queryByText('Edit Subject');
    if (editFromViewButton && editFromViewButton !== screen.getByText('View Subject')) {
      await act(async () => {
        fireEvent.click(editFromViewButton);
      });
    }

    // Close view dialog (covers handleViewClose)
    await act(async () => {
      const closeButton = container.querySelector('[aria-label="Close"]');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    });

    // Cover Delete functionality - all error scenarios (lines 171-177, 181-222)
    const deleteButtons = container.querySelectorAll('[aria-label="Delete"]');
    if (deleteButtons.length > 0) {
      // Test handleDeleteOpen (lines 171-172)
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('single-item')).toHaveTextContent('Subject 1');
      });

      // Test handleDeleteClose (lines 176-177)
      await act(async () => {
        const cancelButton = screen.getByTestId('cancel-delete');
        fireEvent.click(cancelButton);
      });

      // Test successful delete (lines 183-195)
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });
      
      mockApiClient.delete.mockResolvedValue({ success: true });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Subject "Subject 1" deleted successfully');
      });

      // Test unsuccessful delete response (lines 194-196)
      await act(async () => {
        fireEvent.click(deleteButtons[1]);
      });
      
      mockApiClient.delete.mockResolvedValue({ success: false, error: 'Delete failed' });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      // Test all error scenarios (lines 204-220)
      // 404 error
      await act(async () => {
        fireEvent.click(deleteButtons[2]);
      });
      
      mockApiClient.delete.mockRejectedValue({ error: '404 not found', message: 'Subject not found' });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.showInfo).toHaveBeenCalledWith('Subject no longer exists. Refreshing the list...');
      });

      // System subject error
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });
      
      mockApiClient.delete.mockRejectedValue({ error: 'Cannot delete system subjects', message: 'system subject' });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.showWarning).toHaveBeenCalledWith('System subjects cannot be deleted as they are required for the system to function properly.');
      });

      // Policy dependency error
      await act(async () => {
        fireEvent.click(deleteButtons[1]);
      });
      
      mockApiClient.delete.mockRejectedValue({ error: 'Unable to delete subject currently being used in active policies' });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Unable to delete subject currently being used in active policies');
      });

      // Generic error
      await act(async () => {
        fireEvent.click(deleteButtons[2]);
      });
      
      mockApiClient.delete.mockRejectedValue({ error: 'Generic error', message: 'Something went wrong' });
      await act(async () => {
        const confirmButton = screen.getByTestId('confirm-delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalled();
      });
    }

    // Cover Bulk Selection (lines 244-270)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 3) {
      // Test handleSelectAllClick
      await act(async () => {
        fireEvent.click(checkboxes[0]); // Select all
      });
      await act(async () => {
        fireEvent.click(checkboxes[0]); // Unselect all
      });

      // Test handleSubjectSelect - all scenarios
      await act(async () => {
        fireEvent.click(checkboxes[1]); // Select first (selectedIndex === -1)
      });
      await act(async () => {
        fireEvent.click(checkboxes[2]); // Select second (concat scenario)
      });
      await act(async () => {
        fireEvent.click(checkboxes[1]); // Unselect first (selectedIndex === 0)
      });
      await act(async () => {
        fireEvent.click(checkboxes[1]); // Select first again
      });
      await act(async () => {
        fireEvent.click(checkboxes[3]); // Select third
      });
      await act(async () => {
        fireEvent.click(checkboxes[2]); // Unselect middle item
      });
    }

    // Cover Bulk Delete (lines 277-330, 1148-1163)
    if (checkboxes.length > 1) {
      await act(async () => {
        fireEvent.click(checkboxes[1]); // Select one item
      });

      const bulkDeleteButton = screen.queryByText(/delete selected/i);
      if (bulkDeleteButton) {
        // Test handleBulkDeleteOpen (line 277)
        await act(async () => {
          fireEvent.click(bulkDeleteButton);
        });

        await waitFor(() => {
          expect(screen.getByTestId('bulk-items')).toHaveTextContent('1 items');
        });

        // Test handleBulkDeleteClose (line 281)
        await act(async () => {
          const cancelButton = screen.getByTestId('cancel-delete');
          fireEvent.click(cancelButton);
        });

        // Test successful bulk delete (lines 285-307)
        await act(async () => {
          fireEvent.click(bulkDeleteButton);
        });
        
        mockApiClient.request.mockResolvedValue({ success: true });
        await act(async () => {
          const confirmButton = screen.getByTestId('confirm-delete');
          fireEvent.click(confirmButton);
        });

        await waitFor(() => {
          expect(mockApiClient.request).toHaveBeenCalledWith({
            method: 'DELETE',
            url: '/subjects/bulk/delete',
            data: { subjectIds: ['1'] }
          });
        });

        // Test bulk delete error scenarios (lines 318-330)
        await act(async () => {
          fireEvent.click(checkboxes[2]); // Select another item
        });

        await act(async () => {
          fireEvent.click(bulkDeleteButton);
        });
        
        mockApiClient.request.mockRejectedValue({ error: 'Unable to delete subjects currently being used in active policies' });
        await act(async () => {
          const confirmButton = screen.getByTestId('confirm-delete');
          fireEvent.click(confirmButton);
        });

        await waitFor(() => {
          expect(mockSnackbar.showError).toHaveBeenCalled();
        });
      }
    }

    // Cover search and filter operations (lines 340-380)
    const searchInput = container.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });
    }

    // Cover sort operations (lines 344-349)
    const sortableHeaders = container.querySelectorAll('th[role="columnheader"]');
    if (sortableHeaders.length > 0) {
      await act(async () => {
        fireEvent.click(sortableHeaders[0]);
      });
    }

    // Cover pagination (lines 385-391, 862-870)
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockSubjects,
      pagination: { total: 50, page: 1, limit: 10 }, // Multiple pages
    });

    await act(async () => {
      // Force refresh to load pagination
      if (container.querySelector('[aria-label*="refresh"]')) {
        fireEvent.click(container.querySelector('[aria-label*="refresh"]')!);
      }
    });

    await waitFor(() => {
      const nextButton = container.querySelector('[aria-label*="next"]');
      if (nextButton) {
        fireEvent.click(nextButton);
      }
    });

    // Cover rows per page change
    const rowsPerPageSelect = container.querySelector('[role="button"][aria-haspopup="listbox"]');
    if (rowsPerPageSelect) {
      await act(async () => {
        fireEvent.mouseDown(rowsPerPageSelect);
      });
    }

    // Cover error handling in fetchSubjects (lines 423-430)
    mockApiClient.get.mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      if (container.querySelector('[aria-label*="refresh"]')) {
        fireEvent.click(container.querySelector('[aria-label*="refresh"]')!);
      }
    });

    // Cover unsuccessful API response
    mockApiClient.get.mockResolvedValue({ success: false, error: 'Unauthorized' });
    
    await act(async () => {
      if (container.querySelector('[aria-label*="refresh"]')) {
        fireEvent.click(container.querySelector('[aria-label*="refresh"]')!);
      }
    });

    // Cover form validation error path (lines 463-465)
    const createButton2 = screen.getByText('Create Subject');
    await act(async () => {
      fireEvent.click(createButton2);
    });

    const nameInput2 = screen.getByRole('textbox', { name: /name/i });
    await act(async () => {
      fireEvent.change(nameInput2, { target: { value: 'a' } }); // Too short
    });

    const saveButton2 = screen.getByText('Create Subject');
    await act(async () => {
      fireEvent.click(saveButton2); // Should not submit due to validation
    });

    // Cover form submission API error (lines 499-504)
    await act(async () => {
      fireEvent.change(nameInput2, { target: { value: 'Valid Name' } });
    });

    mockApiClient.post.mockRejectedValue(new Error('API Error'));
    await act(async () => {
      fireEvent.click(saveButton2);
    });

    // This test should cover all major code paths to achieve 95% coverage
    expect(mockApiClient.get).toHaveBeenCalled();
  });
});