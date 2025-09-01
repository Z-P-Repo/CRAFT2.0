import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
  const MockDashboardLayout = ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard">{children}</div>;
  MockDashboardLayout.displayName = 'MockDashboardLayout';
  return MockDashboardLayout;
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  const MockDeleteConfirmationDialog = ({ open, onConfirm, onClose }: any) => open ? (
    <div data-testid="delete-dialog">
      <button onClick={onConfirm} data-testid="confirm-delete">Confirm Delete</button>
      <button onClick={onClose} data-testid="cancel-delete">Cancel Delete</button>
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

describe('SubjectsPage Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: sampleSubjects,
      pagination: { total: 1, page: 1, limit: 10 },
    });
  });

  it('renders successfully and covers basic functionality', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    expect(screen.getByText('Subjects')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('covers loading state', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {}));

    act(() => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    // Loading state should show skeleton loaders
    const loadingElements = screen.getAllByText('...');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('covers API error handling', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    expect(mockSnackbar.showError).toHaveBeenCalled();
  });

  it('covers unsuccessful API response', async () => {
    mockApiClient.get.mockResolvedValue({
      success: false,
      error: 'Failed to load subjects',
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to load subjects');
  });

  it('covers helper functions with various subject types', async () => {
    const subjectsWithDifferentTypes = [
      { ...sampleSubjects[0], type: 'user' },
      { ...sampleSubjects[0], _id: 'subj-2', id: 'subj-2', name: 'test.group', displayName: 'Test Group', type: 'group' },
      { ...sampleSubjects[0], _id: 'subj-3', id: 'subj-3', name: 'test.role', displayName: 'Test Role', type: 'role' },
      { ...sampleSubjects[0], _id: 'subj-4', id: 'subj-4', name: 'test.device', displayName: 'Test Device', type: 'device' },
      { ...sampleSubjects[0], _id: 'subj-5', id: 'subj-5', name: 'test.service', displayName: 'Test Service', type: 'service' },
      { ...sampleSubjects[0], _id: 'subj-6', id: 'subj-6', name: 'test.other', displayName: 'Test Other', type: 'other' },
    ];

    mockApiClient.get.mockResolvedValue({
      success: true,
      data: subjectsWithDifferentTypes,
      pagination: { total: 6, page: 1, limit: 10 },
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // This covers getTypeColor and getTypeIcon functions
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
    expect(screen.getByText('Test Device')).toBeInTheDocument();
  });

  it('covers search functionality', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find search input
    const searchInput = screen.getByLabelText(/search/i) || screen.getByPlaceholderText(/search/i);
    if (searchInput) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'john' } });
      });

      // Should trigger debounced search
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
          page: 1,
          limit: 10,
          sortBy: 'displayName',
          sortOrder: 'asc',
          search: 'john',
        });
      }, { timeout: 1000 });
    }
  });

  it('covers create subject functionality', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      data: sampleSubjects[0],
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find and click Create button
    const createButton = screen.getByText(/create subject/i) || screen.getByText(/create/i);
    if (createButton) {
      await act(async () => {
        fireEvent.click(createButton);
      });

      // This covers handleClickOpen with mode 'create'
      await waitFor(() => {
        expect(screen.getByText(/create subject/i)).toBeInTheDocument();
      });
    }
  });

  it('covers edit subject functionality', async () => {
    mockApiClient.put.mockResolvedValue({
      success: true,
      data: sampleSubjects[0],
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find edit button (IconButton with edit icon)
    const editButtons = screen.getAllByLabelText(/edit/i);
    if (editButtons.length > 0) {
      await act(async () => {
        fireEvent.click(editButtons[0]);
      });

      // This covers handleClickOpen with mode 'edit'
      await waitFor(() => {
        const dialogs = screen.getAllByRole('dialog');
        expect(dialogs.length).toBeGreaterThan(0);
      });
    }
  });

  it('covers delete subject functionality', async () => {
    mockApiClient.delete.mockResolvedValue({
      success: true,
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    if (deleteButtons.length > 0) {
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      // Should open delete confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      });

      // Confirm delete
      const confirmButton = screen.getByTestId('confirm-delete');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Should call delete API
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalled();
      });
    }
  });

  it('covers view subject functionality', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find view button
    const viewButtons = screen.getAllByLabelText(/view/i);
    if (viewButtons.length > 0) {
      await act(async () => {
        fireEvent.click(viewButtons[0]);
      });

      // This covers handleViewOpen
      await waitFor(() => {
        const dialogs = screen.getAllByRole('dialog');
        expect(dialogs.length).toBeGreaterThan(0);
      });
    }
  });

  it('covers pagination functionality', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: sampleSubjects,
      pagination: { total: 50, page: 1, limit: 10 },
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find pagination controls
    const nextPageButton = screen.getByLabelText(/go to next page/i) || screen.getByLabelText(/next/i);
    if (nextPageButton) {
      await act(async () => {
        fireEvent.click(nextPageButton);
      });

      // Should trigger API call with page 2
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
          page: 2,
          limit: 10,
          sortBy: 'displayName',
          sortOrder: 'asc',
        });
      });
    }
  });

  it('covers bulk selection functionality', async () => {
    const multipleSubjects = [
      sampleSubjects[0],
      { ...sampleSubjects[0], _id: 'subj-2', id: 'subj-2', name: 'jane.doe', displayName: 'Jane Doe' },
    ];

    mockApiClient.get.mockResolvedValue({
      success: true,
      data: multipleSubjects,
      pagination: { total: 2, page: 1, limit: 10 },
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find select all checkbox
    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    if (selectAllCheckbox) {
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      // This covers bulk selection logic
      expect(selectAllCheckbox).toBeChecked();
    }
  });

  it('covers form validation and submission errors', async () => {
    mockApiClient.post.mockRejectedValue({
      response: {
        status: 400,
        data: {
          success: false,
          error: 'Validation failed',
          details: ['Display name is required'],
        },
      },
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find Create button and click it
    const createButton = screen.getByText(/create subject/i) || screen.getByText(/create/i);
    if (createButton) {
      await act(async () => {
        fireEvent.click(createButton);
      });

      // Try to submit form without required fields
      const saveButtons = screen.getAllByText(/save/i);
      if (saveButtons.length > 0) {
        await act(async () => {
          fireEvent.click(saveButtons[0]);
        });

        // Should handle validation error
        await waitFor(() => {
          expect(mockSnackbar.showError).toHaveBeenCalled();
        });
      }
    }
  });

  it('covers empty state', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 10 },
    });

    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Should show empty state
    expect(screen.getByText('Subjects')).toBeInTheDocument();
  });

  it('covers sorting functionality', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Find sortable column headers
    const columnHeaders = screen.getAllByRole('columnheader');
    if (columnHeaders.length > 0) {
      const nameHeader = columnHeaders.find(header => 
        header.textContent?.includes('Name') || header.textContent?.includes('Display Name')
      );
      
      if (nameHeader) {
        await act(async () => {
          fireEvent.click(nameHeader);
        });

        // Should trigger sort
        await waitFor(() => {
          expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', {
            page: 1,
            limit: 10,
            sortBy: 'displayName',
            sortOrder: 'desc',
          });
        });
      }
    }
  });

  it('covers refresh functionality', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <SubjectsPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    // Clear the mock to verify refresh call
    mockApiClient.get.mockClear();

    // Find refresh button
    const refreshButton = screen.getByLabelText(/refresh/i);
    if (refreshButton) {
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Should trigger refresh
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    }
  });
});