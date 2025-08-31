import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubjectsPage from '../page';
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
        <div data-testid="dialog-subject">{subject?.displayName}</div>
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
  usePathname: () => '/subjects',
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

const mockSubject = {
  _id: '1',
  id: '1',
  name: 'test.subject',
  displayName: 'Test Subject',
  email: 'test.subject@company.com',
  type: 'user' as const,
  role: 'Manager',
  department: 'Engineering',
  description: 'Test description',
  status: 'active' as const,
  permissions: ['read', 'write'],
  policyCount: 2,
  usedInPolicies: [
    { id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' },
    { id: 'policy2', name: 'Policy 2', displayName: 'Policy 2' },
  ],
  metadata: {
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
  lastLogin: '2023-12-01T00:00:00.000Z',
};

describe('SubjectsPage', () => {
  const mockSubjects = [
    { ...mockSubject, _id: '1', id: '1', displayName: 'John Doe', type: 'user' as const },
    { ...mockSubject, _id: '2', id: '2', displayName: 'Engineering Team', type: 'group' as const },
    { ...mockSubject, _id: '3', id: '3', displayName: 'Admin Role', type: 'role' as const },
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
      data: mockSubjects,
      message: 'Success',
      pagination: {
        page: 1,
        limit: 10,
        total: mockSubjects.length,
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

      render(<SubjectsPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders the subjects page with header', async () => {
      render(<SubjectsPage />);
      
      expect(screen.getByText('Subjects')).toBeInTheDocument();
      expect(screen.getByTestId('PeopleIcon')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total count
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('renders subjects data after loading', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Engineering Team')).toBeInTheDocument();
        expect(screen.getByText('Admin Role')).toBeInTheDocument();
      });
    });

    it('displays subject types with correct icons and colors', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('PersonIcon')).toHaveLength(1); // User icon
        expect(screen.getAllByTestId('GroupIcon')).toHaveLength(1); // Group icon
        expect(screen.getAllByTestId('AdminPanelSettingsIcon')).toHaveLength(1); // Role icon
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input field', async () => {
      render(<SubjectsPage />);
      
      expect(screen.getByPlaceholderText('Search subjects by name, email, or department...')).toBeInTheDocument();
    });

    it('filters subjects when searching', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search subjects by name, email, or department...');
      await user.type(searchInput, 'John');

      // Advance timers to trigger debounced search
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          search: 'John',
        }));
      });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SubjectsPage />);
      
      const searchInput = screen.getByPlaceholderText('Search subjects by name, email, or department...');
      await user.type(searchInput, 'John');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter and Sort Functionality', () => {
    it('opens filter popover when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Filter by Type')).toBeInTheDocument();
      expect(screen.getByText('Filter by Status')).toBeInTheDocument();
    });

    it('applies type filters correctly', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      const userCheckbox = screen.getByRole('checkbox', { name: /user/i });
      await user.click(userCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          type: ['user'],
        }));
      });
    });

    it('applies status filters correctly', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);
      
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });
      await user.click(activeCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          status: ['active'],
        }));
      });
    });

    it('opens sort popover and applies sorting', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);
      
      const nameOption = screen.getByText('Name');
      await user.click(nameOption);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          sortBy: 'displayName',
          sortOrder: 'asc',
        }));
      });
    });
  });

  describe('Create Subject Functionality', () => {
    it('shows create button for admin users', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add subject/i })).toBeInTheDocument();
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

      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add subject/i })).not.toBeInTheDocument();
      });
    });

    it('opens create dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add subject/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add subject/i });
      await user.click(addButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add New Subject')).toBeInTheDocument();
    });

    it('creates a new subject successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValue({ success: true, data: mockSubject });
      
      render(<SubjectsPage />);
      
      const addButton = screen.getByRole('button', { name: /add subject/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/display name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'New Subject');
      await user.type(descriptionInput, 'New subject description');
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          displayName: 'New Subject',
          description: 'New subject description',
        }));
      });
    });

    it('handles create subject validation errors', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      const addButton = screen.getByRole('button', { name: /add subject/i });
      await user.click(addButton);
      
      // Try to create without filling required fields
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      // Should not call API due to validation
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Subject Actions', () => {
    it('displays action buttons for admin users', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        // Each subject row should have view, edit, delete buttons
        expect(screen.getAllByLabelText(/view subject/i)).toHaveLength(3);
        expect(screen.getAllByLabelText(/edit subject/i)).toHaveLength(3);
        expect(screen.getAllByLabelText(/delete subject/i)).toHaveLength(3);
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

      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/view subject/i)).toHaveLength(3);
        expect(screen.queryByLabelText(/edit subject/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/delete subject/i)).not.toBeInTheDocument();
      });
    });

    it('opens view dialog when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/view subject/i)).toHaveLength(3);
      });

      const viewButton = screen.getAllByLabelText(/view subject/i)[0];
      await user.click(viewButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Subject Details')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('opens edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/edit subject/i)).toHaveLength(3);
      });

      const editButton = screen.getAllByLabelText(/edit subject/i)[0];
      await user.click(editButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Subject')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('updates subject successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockResolvedValue({ success: true, data: mockSubject });
      
      render(<SubjectsPage />);
      
      const editButton = screen.getAllByLabelText(/edit subject/i)[0];
      await user.click(editButton);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/subjects/1', expect.objectContaining({
          displayName: 'Updated Name',
        }));
      });
    });
  });

  describe('Delete Subject Functionality', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/delete subject/i)).toHaveLength(3);
      });

      const deleteButton = screen.getAllByLabelText(/delete subject/i)[0];
      await user.click(deleteButton);
      
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-subject')).toHaveTextContent('John Doe');
    });

    it('deletes subject successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ success: true });
      
      render(<SubjectsPage />);
      
      const deleteButton = screen.getAllByLabelText(/delete subject/i)[0];
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/subjects/1');
      });
    });

    it('handles delete error with validation message', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ 
        success: false, 
        error: 'Cannot delete subject. It is used in active policies.' 
      });
      
      render(<SubjectsPage />);
      
      const deleteButton = screen.getAllByLabelText(/delete subject/i)[0];
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('enables bulk selection mode when subjects are selected', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')).toHaveLength(4); // Header + 3 subjects
      });

      const firstSubjectCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstSubjectCheckbox);
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk delete/i })).toBeInTheDocument();
    });

    it('selects all subjects with header checkbox', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')).toHaveLength(4);
      });

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);
      
      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });

    it('performs bulk delete operation', async () => {
      const user = userEvent.setup();
      mockApiClient.delete.mockResolvedValue({ success: true });
      
      render(<SubjectsPage />);
      
      // Select all subjects
      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);
      
      // Click bulk delete
      const bulkDeleteButton = screen.getByRole('button', { name: /bulk delete/i });
      await user.click(bulkDeleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Rows per page:')).toBeInTheDocument();
        expect(screen.getByText('1–3 of 3')).toBeInTheDocument();
      });
    });

    it('changes page when pagination controls are used', async () => {
      const user = userEvent.setup();
      const manySubjects = Array.from({ length: 25 }, (_, i) => ({
        ...mockSubject,
        _id: `${i + 1}`,
        id: `${i + 1}`,
        displayName: `Subject ${i + 1}`,
      }));

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: manySubjects.slice(0, 10),
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });

      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText('Go to next page');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', expect.objectContaining({
          page: 2,
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load subjects/i)).toBeInTheDocument();
      });
    });

    it('displays empty state when no subjects exist', async () => {
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
      
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No subjects found')).toBeInTheDocument();
        expect(screen.getByText('Get started by creating your first subject')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh and Focus Handling', () => {
    it('refreshes data when window gains focus', async () => {
      render(<SubjectsPage />);
      
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

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<SubjectsPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /display name/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add subject/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add subject/i });
      addButton.focus();
      expect(addButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has proper table headers and structure', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /display name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /policies/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      });
    });
  });

  describe('Subject Information Display', () => {
    it('displays subject metadata correctly', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        // Check that subject information is displayed
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Engineering Team')).toBeInTheDocument();
        expect(screen.getByText('Admin Role')).toBeInTheDocument();
        
        // Check status indicators
        expect(screen.getAllByText('active')).toHaveLength(3);
      });
    });

    it('displays policy count for subjects', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        // Each subject should show policy count
        expect(screen.getAllByText('2')).toHaveLength(3); // All subjects have 2 policies
      });
    });

    it('shows correct subject type badges', async () => {
      render(<SubjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('group')).toBeInTheDocument();
        expect(screen.getByText('role')).toBeInTheDocument();
      });
    });
  });
});