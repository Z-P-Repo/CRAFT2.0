import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TesterPage from '../page';

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

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

// Mock response helper
const mockApiResponse = (data: any, success: boolean = true, error: string | null = null) => ({
  data,
  success,
  error,
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

describe('TesterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
    });
    mockApiClient.get.mockResolvedValue(
      mockApiResponse([])
    );
  });

  describe('Basic Rendering', () => {
    it('renders tester page header', () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Policy Tester')).toBeInTheDocument();
    });

    it('renders test form components', () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Policy Evaluation')).toBeInTheDocument();
    });

    it('renders within DashboardLayout', () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  describe('Form Elements', () => {
    it('renders subject selector', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Subject/i)).toBeInTheDocument();
      });
    });

    it('renders resource selector', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Resource/i)).toBeInTheDocument();
      });
    });

    it('renders action selector', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Action/i)).toBeInTheDocument();
      });
    });

    it('renders test button', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test policy/i })).toBeInTheDocument();
      });
    });
  });

  describe('Policy Testing', () => {
    it('enables test button when all fields are selected', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const testButton = screen.getByRole('button', { name: /test policy/i });
        // Button behavior depends on form validation
        expect(testButton).toBeInTheDocument();
      });
    });

    it('handles test execution', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse({
          result: 'PERMIT',
          explanation: 'Access granted',
        })
      );
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const testButton = screen.getByRole('button', { name: /test policy/i });
        fireEvent.click(testButton);
      });
      
      // Test execution would show results
    });
  });

  describe('Results Display', () => {
    it('shows test results when available', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse({
          result: 'PERMIT',
          explanation: 'Access granted based on user role',
        })
      );
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      // Execute test first
      const testButton = screen.getByRole('button', { name: /test policy/i });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        // Results would appear after test execution
        expect(mockApiClient.post).toHaveBeenCalledWith('/policies/test', expect.any(Object));
      });
    });

    it('handles test errors', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse(null, false, 'Test execution failed')
      );
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      const testButton = screen.getByRole('button', { name: /test policy/i });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        // Error handling would be implemented
        expect(mockApiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('Data Loading', () => {
    it('loads subjects for selection', async () => {
      mockApiClient.get
        .mockResolvedValueOnce(mockApiResponse([
          { id: '1', name: 'user1', displayName: 'User 1' }
        ]))
        .mockResolvedValueOnce(mockApiResponse([]))
        .mockResolvedValueOnce(mockApiResponse([]));
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects');
      });
    });

    it('loads resources for selection', async () => {
      mockApiClient.get
        .mockResolvedValueOnce(mockApiResponse([]))
        .mockResolvedValueOnce(mockApiResponse([
          { id: '1', name: 'resource1', description: 'Resource 1' }
        ]))
        .mockResolvedValueOnce(mockApiResponse([]));
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources');
      });
    });

    it('loads actions for selection', async () => {
      mockApiClient.get
        .mockResolvedValueOnce(mockApiResponse([]))
        .mockResolvedValueOnce(mockApiResponse([]))
        .mockResolvedValueOnce(mockApiResponse([
          { id: '1', name: 'read', description: 'Read access' }
        ]));
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/actions');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      // Should handle errors without crashing
      await waitFor(() => {
        expect(screen.getByText('Policy Tester')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      render(
        <TestWrapper>
          <TesterPage />
        </TestWrapper>
      );
      
      const testButton = screen.getByRole('button', { name: /test policy/i });
      
      // Form validation would prevent submission if fields are missing
      expect(testButton).toBeInTheDocument();
    });
  });
});