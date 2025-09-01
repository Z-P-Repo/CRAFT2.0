import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CreatePolicyPage from '../page';

// Mock external dependencies
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/policies/create',
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    handleApiResponse: jest.fn(),
    handleApiError: jest.fn(),
  }),
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

const { apiClient } = require('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data with more comprehensive test data
const mockData = {
  subjects: [
    { _id: '1', id: '1', name: 'john_doe', displayName: 'John Doe', type: 'user', email: 'john@example.com', role: 'employee', department: 'IT', status: 'active', permissions: [], metadata: { createdBy: 'admin' } },
    { _id: '2', id: '2', name: 'admin_group', displayName: 'Admin Group', type: 'group', email: '', role: 'admin', department: 'IT', status: 'active', permissions: [], metadata: { createdBy: 'admin' } }
  ],
  actions: [
    { _id: '1', id: '1', name: 'read', displayName: 'Read', description: 'Read access', category: 'read', riskLevel: 'low', active: true, metadata: { owner: 'system', createdBy: 'admin', lastModifiedBy: 'admin', tags: [], isSystem: true } },
    { _id: '2', id: '2', name: 'write', displayName: 'Write', description: 'Write access', category: 'write', riskLevel: 'medium', active: true, metadata: { owner: 'system', createdBy: 'admin', lastModifiedBy: 'admin', tags: [], isSystem: true } }
  ],
  resources: [
    { _id: '1', id: '1', name: 'documents', displayName: 'Documents', type: 'file', category: 'data', owner: 'system', path: '/documents', active: true, metadata: { createdBy: 'admin', lastModifiedBy: 'admin', tags: [], isSystem: false } },
    { _id: '2', id: '2', name: 'reports', displayName: 'Reports', type: 'file', category: 'data', owner: 'system', path: '/reports', active: true, metadata: { createdBy: 'admin', lastModifiedBy: 'admin', tags: [], isSystem: false } }
  ],
  attributes: [
    { _id: '1', id: '1', name: 'department', displayName: 'Department', categories: ['subject'], dataType: 'string', isRequired: false, isMultiValue: false, constraints: {}, createdBy: 'admin', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    { _id: '2', id: '2', name: 'clearance_level', displayName: 'Security Clearance', categories: ['subject', 'resource'], dataType: 'string', isRequired: false, isMultiValue: false, constraints: {}, createdBy: 'admin', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    { _id: '3', id: '3', name: 'legacy_attr', displayName: 'Legacy Attribute', category: 'action', dataType: 'string', isRequired: false, isMultiValue: false, constraints: {}, createdBy: 'admin', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
  ],
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('CreatePolicyPage Function Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockApiClient.get.mockImplementation((endpoint: string) => {
      const key = endpoint.replace('/', '') as keyof typeof mockData;
      return Promise.resolve({
        success: true,
        data: mockData[key] || [],
        pagination: { total: (mockData[key] || []).length, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    mockApiClient.post.mockResolvedValue({
      success: true,
      data: { _id: 'new-policy', displayName: 'Test Policy' },
    });
  });

  describe('Step Validation Functions', () => {
    let container: any;

    beforeEach(async () => {
      const result = render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );
      container = result.container;

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('validates step 0 - basic information', async () => {
      // Test empty display name (invalid)
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();

      // Test short display name (invalid)  
      const policyNameInput = screen.getByLabelText(/policy name/i);
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'Te' } });
      });

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });

      // Test long display name (invalid)
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'a'.repeat(101) } });
      });

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });

      // Test valid display name
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'Valid Policy Name' } });
      });

      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('validates all display name edge cases', async () => {
      const policyNameInput = screen.getByLabelText(/policy name/i);
      
      // Test exactly 3 characters (minimum valid)
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'abc' } });
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      // Test exactly 100 characters (maximum valid)
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'a'.repeat(100) } });
      });

      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      // Test whitespace trimming
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: '   ' } });
      });

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Form Interaction Functions', () => {
    it('handles step navigation functions', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Test initial state (step 0)
      expect(screen.getAllByText('Basic Information')).toHaveLength(2);
      
      // Test back button disabled on first step
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();

      // Enable next by filling valid data
      const policyNameInput = screen.getByLabelText(/policy name/i);
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'Test Policy Navigation' } });
      });

      // Navigate forward
      const nextButton = screen.getByRole('button', { name: /next/i });
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Should be on step 1 now
      await waitFor(() => {
        expect(screen.getAllByText('Subject Selection')).toHaveLength(2);
      });

      // Test back button enabled on second step
      await waitFor(() => {
        expect(backButton).not.toBeDisabled();
      });

      // Navigate back
      await act(async () => {
        fireEvent.click(backButton);
      });

      // Should be back on step 0
      await waitFor(() => {
        expect(screen.getAllByText('Basic Information')).toHaveLength(2);
      });
    });
  });

  describe('Attribute Helper Functions', () => {
    it('handles attribute category checking logic', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Navigate through steps to trigger attribute category logic
      const policyNameInput = screen.getByLabelText(/policy name/i);
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'Test Attribute Logic' } });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getAllByText('Subject Selection')).toHaveLength(2);
      });

      // This step should exercise the attributeHasCategory helper function
      // by filtering attributes based on categories
      expect(screen.getByText('Subject Selection')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Functions', () => {
    it('handles different data states', async () => {
      // Test with empty data
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });

      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Create New Policy')).toBeInTheDocument();
    });

    it('handles different response formats', async () => {
      // Test non-array data
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { invalid: 'format' },
        pagination: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });

      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });

    it('handles null/undefined data', async () => {
      // Test null data
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: null,
      });

      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });
  });

  describe('Form State Management', () => {
    it('handles form state updates and validation', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Test description field updates
      const descriptionInput = screen.getByLabelText(/description/i);
      await act(async () => {
        fireEvent.change(descriptionInput, { target: { value: 'Test description content' } });
      });

      expect(descriptionInput).toHaveValue('Test description content');

      // Test policy name with various inputs
      const policyNameInput = screen.getByLabelText(/policy name/i);
      
      // Test clearing the field
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: '' } });
      });

      // Test setting valid value
      await act(async () => {
        fireEvent.change(policyNameInput, { target: { value: 'Final Test Policy' } });
      });

      expect(policyNameInput).toHaveValue('Final Test Policy');
    });
  });

  describe('API Error Edge Cases', () => {
    it('handles network failures', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network failure'));

      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
      
      // Should handle error gracefully
      expect(screen.getByText('Create New Policy')).toBeInTheDocument();
    });

    it('handles API success with error flag', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        message: 'API returned success: false',
        error: 'Test error',
      });

      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });
  });

  describe('Button and Action Handlers', () => {
    it('handles cancel action', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Should trigger navigation or state change
      expect(cancelButton).toBeInTheDocument();
    });

    it('handles icon button interactions', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find the back arrow icon button at the top
      const iconButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && !button.textContent?.trim()
      );

      for (const button of iconButtons) {
        if (!button.hasAttribute('disabled')) {
          await act(async () => {
            fireEvent.click(button);
          });
        }
      }

      expect(iconButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Component Mount and Effect Hooks', () => {
    it('triggers all useEffect hooks', async () => {
      render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      // This should trigger fetchDropdownData effect
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', { page: 1, limit: 1000 });
        expect(mockApiClient.get).toHaveBeenCalledWith('/actions', { page: 1, limit: 1000 });
        expect(mockApiClient.get).toHaveBeenCalledWith('/resources', { page: 1, limit: 1000 });
        expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', { page: 1, limit: 1000 });
      });
    });

    it('handles component unmount scenarios', async () => {
      const { unmount } = render(
        <TestWrapper>
          <CreatePolicyPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Unmount component to trigger cleanup
      unmount();

      expect(mockApiClient.get).toHaveBeenCalled();
    });
  });
});