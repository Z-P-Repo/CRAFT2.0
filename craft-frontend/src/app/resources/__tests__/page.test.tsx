import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResourcesPage from '../page';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

// Mock modules
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: jest.fn(),
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ open, onClose, onConfirm, title, message, subject }: any) {
    if (!open) return null;
    return (
      <div data-testid="delete-dialog" role="dialog">
        <div data-testid="dialog-title">{title}</div>
        <div data-testid="dialog-message">{message}</div>
        <div data-testid="dialog-subject">{subject?.displayName || subject?.name}</div>
        <button onClick={onConfirm} data-testid="confirm-delete">Delete</button>
        <button onClick={onClose} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  };
});

jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

// Mock next navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/resources',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseApiSnackbar = useApiSnackbar as jest.MockedFunction<typeof useApiSnackbar>;

// Mock data
const mockUser = {
  _id: '1',
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'Admin',
  permissions: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canManage: true,
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const mockBasicUser = {
  ...mockUser,
  role: 'Basic',
  permissions: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canManage: false,
  },
};

const mockResource = {
  _id: '1',
  id: '1',
  name: 'test-resource',
  displayName: 'Test Resource',
  description: 'Test resource description',
  type: 'file' as const,
  uri: '/files/test-resource',
  attributes: {
    size: '1024KB',
    format: 'PDF',
  },
  children: [],
  path: '/resources/test-resource',
  owner: 'admin',
  policyCount: 2,
  usedInPolicies: [
    { id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' },
    { id: 'policy2', name: 'Policy 2', displayName: 'Policy 2' },
  ],
  permissions: {
    read: true,
    write: false,
    delete: false,
    execute: false,
    admin: false,
  },
  status: 'active',
  metadata: {
    owner: 'admin',
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
    externalId: 'ext-123',
  },
  active: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

describe('ResourcesPage', () => {
  const mockResources = [
    { ...mockResource, _id: '1', id: '1', displayName: 'Document Store', type: 'document' as const },
    { ...mockResource, _id: '2', id: '2', displayName: 'API Gateway', type: 'api' as const },
    { ...mockResource, _id: '3', id: '3', displayName: 'File System', type: 'file' as const },
    { ...mockResource, _id: '4', id: '4', displayName: 'Database', type: 'database' as const },
    { ...mockResource, _id: '5', id: '5', displayName: 'Service', type: 'service' as const },
  ];

  const mockSnackbar = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
    handleApiResponse: jest.fn(),
    handleApiError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    mockUseApiSnackbar.mockReturnValue(mockSnackbar);

    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockResources,
      message: 'Success',
      pagination: {
        page: 1,
        limit: 10,
        total: mockResources.length,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('displays loading state initially', async () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      render(<ResourcesPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders the resources page with header', async () => {
      render(<ResourcesPage />);
      
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByTestId('FolderIcon')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total count
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('renders resources data after loading', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Document Store')).toBeInTheDocument();
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('File System')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
      });
    });

    it('displays resource types with correct icons', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('DescriptionIcon')).toHaveLength(1); // Document icon
        expect(screen.getAllByTestId('SettingsIcon')).toHaveLength(1); // API icon
        expect(screen.getAllByTestId('FolderIcon')).toHaveLength(2); // File icon + header icon
        expect(screen.getAllByTestId('FolderOpenIcon')).toHaveLength(1); // Database icon
        expect(screen.getAllByTestId('SettingsIcon')).toHaveLength(1); // Service icon
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input field', async () => {
      render(<ResourcesPage />);
      
      expect(screen.getByPlaceholderText('Search resources by name, type, or description...')).toBeInTheDocument();
    });

    it('filters resources when searching', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Document Store')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search resources by name, type, or description...');
      await user.type(searchInput, 'Document');

      // Advance timers to trigger debounced search
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', expect.objectContaining({
          search: 'Document',
        }));
      });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<ResourcesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search resources by name, type, or description...');
      await user.type(searchInput, 'Document');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter and Sort Functionality', () => {
    it('opens filter popover when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Filter by Type')).toBeInTheDocument();
      expect(screen.getByText('Filter by Status')).toBeInTheDocument();
    });

    it('applies type filters correctly', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      const fileCheckbox = screen.getByRole('checkbox', { name: /file/i });
      await user.click(fileCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', expect.objectContaining({
          type: ['file'],
        }));
      });
    });

    it('applies status filters correctly', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });
      await user.click(activeCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', expect.objectContaining({
          status: ['active'],
        }));
      });
    });

    it('opens sort popover and applies sorting', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);
      
      const nameOption = screen.getByText('Name');
      await user.click(nameOption);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', expect.objectContaining({
          sortBy: 'displayName',
          sortOrder: 'asc',
        }));
      });
    });
  });

  describe('Create Resource Functionality', () => {
    it('shows create button for admin users', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create resource/i })).toBeInTheDocument();
      });
    });

    it('hides create button for basic users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockBasicUser,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn().mockResolvedValue(undefined),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /create resource/i })).not.toBeInTheDocument();
      });
    });

    it('opens create dialog when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create resource/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create resource/i });
      await user.click(createButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Resource')).toBeInTheDocument();
    });

    it('creates a new resource successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValue({ success: true, data: mockResource });
      
      render(<ResourcesPage />);
      
      const createButton = screen.getByRole('button', { name: /create resource/i });
      await user.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const typeSelect = screen.getByLabelText(/type/i);
      
      await user.type(nameInput, 'New Resource');
      await user.type(descriptionInput, 'New resource description');
      await user.click(typeSelect);
      
      const fileOption = screen.getByText('File');
      await user.click(fileOption);
      
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/resources', expect.objectContaining({
          displayName: 'New Resource',
          description: 'New resource description',
          type: 'file',
        }));
      });
    });

    it('handles create resource validation errors', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      const createButton = screen.getByRole('button', { name: /create resource/i });
      await user.click(createButton);
      
      // Try to create without filling required fields
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);
      
      // Should not call API due to validation
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Resource Actions', () => {
    it('displays action buttons for admin users', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        // Each resource row should have view, edit, delete buttons
        expect(screen.getAllByLabelText(/view resource/i)).toHaveLength(5);
        expect(screen.getAllByLabelText(/edit resource/i)).toHaveLength(5);
        expect(screen.getAllByLabelText(/delete resource/i)).toHaveLength(5);
      });
    });

    it('only shows view buttons for basic users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockBasicUser,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn().mockResolvedValue(undefined),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/view resource/i)).toHaveLength(5);
        expect(screen.queryByLabelText(/edit resource/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/delete resource/i)).not.toBeInTheDocument();
      });
    });

    it('opens view dialog when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/view resource/i)).toHaveLength(5);
      });

      const viewButton = screen.getAllByLabelText(/view resource/i)[0];
      await user.click(viewButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
      expect(screen.getByText('Document Store')).toBeInTheDocument();
    });

    it('opens edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/edit resource/i)).toHaveLength(5);
      });

      const editButton = screen.getAllByLabelText(/edit resource/i)[0];
      await user.click(editButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Resource')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Document Store')).toBeInTheDocument();
    });

    it('updates resource successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockResolvedValue({ success: true, data: mockResource });
      
      render(<ResourcesPage />);
      
      const editButton = screen.getAllByLabelText(/edit resource/i)[0];
      await user.click(editButton);
      
      const nameInput = screen.getByDisplayValue('Document Store');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Resource');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/resources/1', expect.objectContaining({
          displayName: 'Updated Resource',
        }));
      });
    });
  });

  describe('Delete Resource Functionality', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/delete resource/i)).toHaveLength(5);
      });

      const deleteButton = screen.getAllByLabelText(/delete resource/i)[0];
      await user.click(deleteButton);
      
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-subject')).toHaveTextContent('Document Store');
    });

    it('deletes resource successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ success: true });
      
      render(<ResourcesPage />);
      
      const deleteButton = screen.getAllByLabelText(/delete resource/i)[0];
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/resources/1');
      });
    });

    it('handles delete error with validation message', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ 
        success: false, 
        error: 'Cannot delete resource. It is used in active policies.' 
      });
      
      render(<ResourcesPage />);
      
      const deleteButton = screen.getAllByLabelText(/delete resource/i)[0];
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('enables bulk selection mode when resources are selected', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')).toHaveLength(6); // Header + 5 resources
      });

      const firstResourceCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstResourceCheckbox);
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk delete/i })).toBeInTheDocument();
    });

    it('selects all resources with header checkbox', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')).toHaveLength(6);
      });

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);
      
      expect(screen.getByText('5 selected')).toBeInTheDocument();
    });

    it('performs bulk delete operation', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ success: true });
      
      render(<ResourcesPage />);
      
      // Select all resources
      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);
      
      // Click bulk delete
      const bulkDeleteButton = screen.getByRole('button', { name: /bulk delete/i });
      await user.click(bulkDeleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Rows per page:')).toBeInTheDocument();
        expect(screen.getByText('1–5 of 5')).toBeInTheDocument();
      });
    });

    it('changes page when pagination controls are used', async () => {
      const user = userEvent.setup();
      const manyResources = Array.from({ length: 25 }, (_, i) => ({
        ...mockResource,
        _id: `${i + 1}`,
        id: `${i + 1}`,
        displayName: `Resource ${i + 1}`,
      }));

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: manyResources.slice(0, 10),
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText('Go to next page');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', expect.objectContaining({
          page: 2,
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load resources/i)).toBeInTheDocument();
      });
    });

    it('displays empty state when no resources exist', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
      
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No resources found')).toBeInTheDocument();
        expect(screen.getByText('Get started by creating your first resource')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh and Focus Handling', () => {
    it('refreshes data when window gains focus', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      });
      
      // Simulate window focus
      fireEvent.focus(window);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Resource Types and Icons', () => {
    it('displays correct icons for different resource types', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        // Document type
        expect(screen.getAllByTestId('DescriptionIcon')).toHaveLength(1);
        // API type  
        expect(screen.getAllByTestId('SettingsIcon')).toHaveLength(1);
        // File type
        expect(screen.getAllByTestId('FolderIcon')).toHaveLength(2); // One in header, one for file type
        // Database type
        expect(screen.getAllByTestId('FolderOpenIcon')).toHaveLength(1);
      });
    });

    it('displays resource type chips with correct colors', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('document')).toBeInTheDocument();
        expect(screen.getByText('api')).toBeInTheDocument();
        expect(screen.getByText('file')).toBeInTheDocument();
        expect(screen.getByText('database')).toBeInTheDocument();
        expect(screen.getByText('service')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<ResourcesPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create resource/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create resource/i });
      createButton.focus();
      expect(createButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has proper table headers and structure', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /policies/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      });
    });
  });

  describe('Resource Information Display', () => {
    it('displays resource metadata correctly', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        // Check that resource information is displayed
        expect(screen.getByText('Document Store')).toBeInTheDocument();
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('File System')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
      });
    });

    it('displays policy count for resources', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        // Each resource should show policy count
        expect(screen.getAllByText('2')).toHaveLength(5); // All resources have 2 policies
      });
    });

    it('shows resource URIs and paths', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        const viewButton = screen.getAllByLabelText(/view resource/i)[0];
        fireEvent.click(viewButton);
        
        expect(screen.getByText('/files/test-resource')).toBeInTheDocument();
      });
    });

    it('displays resource permissions correctly', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        const viewButton = screen.getAllByLabelText(/view resource/i)[0];
        fireEvent.click(viewButton);
        
        // Should display permission checkboxes or indicators
        expect(screen.getByText('Read')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Resource Features', () => {
    it('handles resource attributes display', async () => {
      render(<ResourcesPage />);
      
      await waitFor(() => {
        const viewButton = screen.getAllByLabelText(/view resource/i)[0];
        fireEvent.click(viewButton);
        
        expect(screen.getByText('1024KB')).toBeInTheDocument(); // Size attribute
        expect(screen.getByText('PDF')).toBeInTheDocument(); // Format attribute
      });
    });

    it('displays resource hierarchy for folders', async () => {
      const folderResource = {
        ...mockResource,
        type: 'folder',
        children: ['child1', 'child2'],
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [folderResource],
        pagination: { page: 1, limit: 10, total: 1, pages: 1, hasNext: false, hasPrev: false },
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('2 items')).toBeInTheDocument(); // Children count
      });
    });

    it('handles system vs custom resource indicators', async () => {
      const systemResource = {
        ...mockResource,
        metadata: { ...mockResource.metadata, isSystem: true, isCustom: false },
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [systemResource],
        pagination: { page: 1, limit: 10, total: 1, pages: 1, hasNext: false, hasPrev: false },
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        const viewButton = screen.getAllByLabelText(/view resource/i)[0];
        fireEvent.click(viewButton);
        
        expect(screen.getByText('System Resource')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('handles resources with missing optional fields', async () => {
      const minimalResource = {
        _id: 'minimal',
        id: 'minimal',
        name: 'minimal-resource',
        displayName: 'Minimal Resource',
        type: 'file' as const,
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [minimalResource],
        pagination: { page: 1, limit: 10, total: 1, pages: 1, hasNext: false, hasPrev: false },
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Minimal Resource')).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: 'invalid data',
        pagination: { page: 1, limit: 10, total: 0, pages: 0, hasNext: false, hasPrev: false },
      });

      render(<ResourcesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load resources/i)).toBeInTheDocument();
      });
    });

    it('handles network timeouts gracefully', async () => {
      mockApiClient.get.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      render(<ResourcesPage />);
      
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load resources/i)).toBeInTheDocument();
      });
    });
  });
});