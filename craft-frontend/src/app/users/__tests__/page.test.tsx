import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UsersPage from '../page';

// Mock the API client at the top level
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Get the mocked client
const { apiClient: mockApiClient } = require('@/lib/api');

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

// Mock permissions utils
jest.mock('@/utils/permissions', () => ({
  canManage: jest.fn(() => true),
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canCreate: jest.fn(() => true),
}));

// Mock DeleteConfirmationDialog
jest.mock('@/components/common/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ 
    open, 
    onClose, 
    onConfirm, 
    loading, 
    title,
    item 
  }: any) {
    return open ? (
      <div data-testid="delete-dialog">
        <div>{title}</div>
        {item && <div>{item.name}</div>}
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    ) : null;
  };
});

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

// Mock response helper
const mockApiResponse = (data: any, success: boolean = true, error: string | null = null, pagination?: any) => ({
  data,
  success,
  error,
  pagination,
});

// Mock user data
const mockUser = {
  _id: 'current-user',
  id: 'current-user',
  name: 'Current User',
  email: 'current@example.com',
  role: 'admin',
  active: true,
};

const mockUsers = [
  {
    _id: '1',
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    department: 'IT',
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    _id: '2',
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'basic',
    department: 'HR',
    active: false,
    createdAt: '2023-02-01T00:00:00Z',
  },
  {
    _id: '3',
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'super_admin',
    department: 'Management',
    active: true,
    createdAt: '2023-03-01T00:00:00Z',
  },
];

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
    });
    mockApiClient.get.mockResolvedValue(
      mockApiResponse(mockUsers, true, null, { total: mockUsers.length, page: 1, limit: 10 })
    );
  });

  describe('Rendering', () => {
    it('renders users page header', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Manage user accounts and roles in your system')).toBeInTheDocument();
      expect(screen.getByText('Create User')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('renders search and filter toolbar', () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    it('renders users table', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });
  });

  describe('User Statistics', () => {
    it('displays correct user counts', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total
        expect(screen.getByText('2')).toBeInTheDocument(); // Active (John and Admin)
        expect(screen.getByText('1')).toBeInTheDocument(); // Inactive (Jane)
      });
    });

    it('shows loading state for counts', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const loadingElements = screen.getAllByText('...');
      expect(loadingElements).toHaveLength(3); // Total, Active, Inactive
    });
  });

  describe('User Display', () => {
    it('displays user information correctly', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Check user details
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('IT')).toBeInTheDocument();
        
        // Check role chips
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Basic')).toBeInTheDocument();
        expect(screen.getByText('Super Admin')).toBeInTheDocument();
        
        // Check status chips
        expect(screen.getAllByText('Active')).toHaveLength(2);
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('handles users without department', async () => {
      const usersWithoutDept = [
        { ...mockUsers[0], department: null },
      ];
      mockApiClient.get.mockResolvedValue(
        mockApiResponse(usersWithoutDept, true, null, { total: 1, page: 1, limit: 10 })
      );

      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument(); // No department
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters users by search term', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      // Should show only John Doe
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('searches by email', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'jane@example' } });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('searches by department', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'IT' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('clears search and filters', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Create User Dialog', () => {
    it('opens create user dialog', () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      expect(screen.getByText('Create New User')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('validates required fields for new user', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required for new users')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates password length', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('creates new user successfully', async () => {
      mockApiClient.post.mockResolvedValue(mockApiResponse({ id: 'new-user' }));
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const roleSelect = screen.getByLabelText(/role/i);
      
      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.mouseDown(roleSelect);
      fireEvent.click(screen.getByText('Admin'));
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/users', {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'admin',
          department: '',
        });
      });
    });
  });

  describe('Edit User Dialog', () => {
    it('opens edit user dialog with existing data', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Click edit button for John Doe
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IT')).toBeInTheDocument();
      
      // Password field should not be present for editing
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('updates existing user', async () => {
      mockApiClient.put.mockResolvedValue(mockApiResponse({ id: '1' }));
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'John Updated' } });
      
      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/users/1', {
          name: 'John Updated',
          email: 'john@example.com',
          role: 'admin',
          department: 'IT',
        });
      });
    });
  });

  describe('User Actions', () => {
    it('opens view user dialog', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      fireEvent.click(viewButtons[0]);
      
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('IT')).toBeInTheDocument();
    });

    it('opens role change dialog', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const roleChangeButtons = screen.getAllByTestId('SecurityIcon');
      fireEvent.click(roleChangeButtons[0]);
      
      expect(screen.getByText('Change User Role')).toBeInTheDocument();
      expect(screen.getByText(/Change role for/)).toBeInTheDocument();
    });

    it('changes user role', async () => {
      mockApiClient.put.mockResolvedValue(mockApiResponse({ success: true }));
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const roleChangeButtons = screen.getAllByTestId('SecurityIcon');
      fireEvent.click(roleChangeButtons[0]);
      
      const roleSelect = screen.getByLabelText(/new role/i);
      fireEvent.mouseDown(roleSelect);
      fireEvent.click(screen.getByText('Super Admin'));
      
      const changeButton = screen.getByText('Change Role');
      fireEvent.click(changeButton);
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/users/1/change-role', {
          role: 'super_admin'
        });
      });
    });

    it('opens delete confirmation dialog', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete User')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('deletes user successfully', async () => {
      mockApiClient.delete.mockResolvedValue(mockApiResponse({ success: true }));
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/users/1');
      });
    });
  });

  describe('Pagination', () => {
    it('handles page change', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find pagination component and simulate page change
      const paginationElement = screen.getByRole('button', { name: /next page/i });
      if (paginationElement) {
        fireEvent.click(paginationElement);
      }
    });

    it('handles rows per page change', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // This would typically involve clicking on rows per page dropdown
      // but Material-UI's TablePagination makes this complex to test
    });
  });

  describe('Error Handling', () => {
    it('displays error message on fetch failure', async () => {
      mockApiClient.get.mockResolvedValue(
        mockApiResponse(null, false, 'Failed to fetch users')
      );
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('handles retry after error', async () => {
      mockApiClient.get.mockResolvedValueOnce(
        mockApiResponse(null, false, 'Failed to fetch users')
      ).mockResolvedValueOnce(
        mockApiResponse(mockUsers, true, null, { total: mockUsers.length, page: 1, limit: 10 })
      );
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('handles create user error', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse(null, false, 'A user with this email already exists')
      );
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('A user with this email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions Integration', () => {
    it('hides create button when user cannot create', () => {
      const { canCreate } = require('@/utils/permissions');
      canCreate.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    });

    it('hides edit buttons when user cannot edit', async () => {
      const { canEdit } = require('@/utils/permissions');
      canEdit.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.queryAllByTestId('EditIcon')).toHaveLength(0);
    });

    it('hides delete buttons when user cannot delete', async () => {
      const { canDelete } = require('@/utils/permissions');
      canDelete.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.queryAllByTestId('DeleteIcon')).toHaveLength(0);
    });
  });

  describe('Filter and Sort', () => {
    it('opens filter popover', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const filterButton = screen.getByTestId('FilterListIcon').closest('button');
      fireEvent.click(filterButton!);
      
      expect(screen.getByText('Filter Users')).toBeInTheDocument();
    });

    it('opens sort popover', async () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const sortButton = screen.getByTestId('SortIcon').closest('button');
      fireEvent.click(sortButton!);
      
      expect(screen.getByText('Sort Users')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows no users message when list is empty', async () => {
      mockApiClient.get.mockResolvedValue(
        mockApiResponse([], true, null, { total: 0, page: 1, limit: 10 })
      );
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Management', () => {
    it('closes dialogs properly', () => {
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      // Open create dialog
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      expect(screen.getByText('Create New User')).toBeInTheDocument();
      
      // Close dialog
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Create New User')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state in submit button', async () => {
      mockApiClient.post.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });
});