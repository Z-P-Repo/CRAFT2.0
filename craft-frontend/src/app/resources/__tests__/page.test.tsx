import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResourcesPage from '../page';

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

const mockResources = [
  {
    _id: '1',
    id: '1',
    name: 'Document System',
    description: 'Document management system',
    type: 'system',
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    _id: '2',
    id: '2',
    name: 'User Database',
    description: 'User data storage',
    type: 'database',
    active: false,
    createdAt: '2023-02-01T00:00:00Z',
  },
];

describe('ResourcesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
    });
    mockApiClient.get.mockResolvedValue(
      mockApiResponse(mockResources, true, null, { total: mockResources.length, page: 1, limit: 10 })
    );
  });

  describe('Basic Rendering', () => {
    it('renders resources page header', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Create Resource')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('renders search functionality', () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText('Search resources...')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Loading resources...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays resource information', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Document System')).toBeInTheDocument();
        expect(screen.getByText('User Database')).toBeInTheDocument();
        expect(screen.getByText('Document management system')).toBeInTheDocument();
      });
    });

    it('displays correct counts', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total
      });
    });
  });

  describe('Create Resource Dialog', () => {
    it('opens create dialog', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Create Resource')).toBeInTheDocument();
      });
      
      const createButton = screen.getByText('Create Resource');
      fireEvent.click(createButton);
      
      expect(screen.getByText('Create New Resource')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      const createButton = screen.getByText('Create Resource');
      fireEvent.click(createButton);
      
      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters resources by search term', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Document System')).toBeInTheDocument();
        expect(screen.getByText('User Database')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search resources...');
      fireEvent.change(searchInput, { target: { value: 'document' } });
      
      expect(screen.getByText('Document System')).toBeInTheDocument();
      expect(screen.queryByText('User Database')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on fetch failure', async () => {
      mockApiClient.get.mockResolvedValue(
        mockApiResponse(null, false, 'Failed to fetch resources')
      );
      
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch resources')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('handles empty state', async () => {
      mockApiClient.get.mockResolvedValue(
        mockApiResponse([], true, null, { total: 0, page: 1, limit: 10 })
      );
      
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('No resources found')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('handles edit action', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Document System')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByText('Edit Resource')).toBeInTheDocument();
    });

    it('handles delete action', async () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Document System')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders within DashboardLayout', () => {
      render(
        <TestWrapper>
          <ResourcesPage />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });
});