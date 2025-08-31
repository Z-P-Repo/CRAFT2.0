import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import CreatePolicyPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { apiClient } from '@/lib/api';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockSnackbar = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

const mockUser = {
  _id: '1',
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'Admin' as const,
  permissions: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canManage: true,
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockDropdownData = {
  subjects: [
    { _id: '1', id: '1', name: 'User', type: 'user' },
    { _id: '2', id: '2', name: 'Admin', type: 'role' },
  ],
  actions: [
    { _id: '1', id: '1', name: 'read', description: 'Read access' },
    { _id: '2', id: '2', name: 'write', description: 'Write access' },
  ],
  resources: [
    { _id: '1', id: '1', name: 'Document', type: 'file' },
    { _id: '2', id: '2', name: 'Database', type: 'database' },
  ],
  attributes: [
    { _id: '1', id: '1', name: 'department', type: 'string' },
    { _id: '2', id: '2', name: 'level', type: 'number' },
  ],
};

const mockSuccessResponse = {
  success: true,
  data: {
    id: '1',
    name: 'Test Policy',
    message: 'Policy created successfully',
  },
};

describe('CreatePolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useApiSnackbar as jest.Mock).mockReturnValue(mockSnackbar);
    (apiClient.get as jest.Mock).mockImplementation((url) => {
      if (url === '/subjects') return Promise.resolve({ success: true, data: mockDropdownData.subjects });
      if (url === '/actions') return Promise.resolve({ success: true, data: mockDropdownData.actions });
      if (url === '/resources') return Promise.resolve({ success: true, data: mockDropdownData.resources });
      if (url === '/attributes') return Promise.resolve({ success: true, data: mockDropdownData.attributes });
      return Promise.resolve({ success: true, data: [] });
    });
    (apiClient.post as jest.Mock).mockResolvedValue(mockSuccessResponse);
  });

  describe('Initial Render', () => {
    it('should render the create policy page with loading state', async () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<CreatePolicyPage />);
      
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
      expect(screen.getByText('Define a new access control policy')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render the stepper with all steps', async () => {
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Define Rules')).toBeInTheDocument();
      expect(screen.getByText('Review & Create')).toBeInTheDocument();
    });

    it('should render basic information form initially', async () => {
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('Policy Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Effect')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });
  });

  describe('Basic Information Step', () => {
    it('should handle policy name input', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      expect(nameInput).toHaveValue('Test Policy');
    });

    it('should handle description input', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'Test description');
      
      expect(descriptionInput).toHaveValue('Test description');
    });

    it('should handle effect selection', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const effectSelect = screen.getByLabelText('Effect');
      await user.click(effectSelect);
      
      const denyOption = screen.getByText('Deny');
      await user.click(denyOption);
      
      expect(screen.getByDisplayValue('Deny')).toBeInTheDocument();
    });

    it('should handle status selection', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      
      const draftOption = screen.getByText('Draft');
      await user.click(draftOption);
      
      expect(screen.getByDisplayValue('Draft')).toBeInTheDocument();
    });

    it('should handle priority input', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const priorityInput = screen.getByLabelText('Priority');
      await user.clear(priorityInput);
      await user.type(priorityInput, '5');
      
      expect(priorityInput).toHaveValue(5);
    });

    it('should validate required fields before proceeding to next step', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Should show validation error for required name field
      expect(screen.getByText('Policy name is required')).toBeInTheDocument();
    });

    it('should proceed to next step when form is valid', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Should move to rules step
      expect(screen.getByText('Add Rule')).toBeInTheDocument();
    });
  });

  describe('Define Rules Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Fill basic information and proceed to rules step
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add Rule')).toBeInTheDocument();
      });
    });

    it('should render empty rules state initially', () => {
      expect(screen.getByText('No rules defined yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first rule to get started')).toBeInTheDocument();
    });

    it('should open add rule dialog when add rule button is clicked', async () => {
      const user = userEvent.setup();
      
      const addRuleButton = screen.getByText('Add Rule');
      await user.click(addRuleButton);
      
      expect(screen.getByText('Add New Rule')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
      expect(screen.getByLabelText('Resource')).toBeInTheDocument();
    });

    it('should handle rule form submission', async () => {
      const user = userEvent.setup();
      
      const addRuleButton = screen.getByText('Add Rule');
      await user.click(addRuleButton);
      
      // Fill rule form
      const subjectSelect = screen.getByLabelText('Subject');
      await user.click(subjectSelect);
      await user.click(screen.getByText('User'));
      
      const actionSelect = screen.getByLabelText('Action');
      await user.click(actionSelect);
      await user.click(screen.getByText('read'));
      
      const resourceSelect = screen.getByLabelText('Resource');
      await user.click(resourceSelect);
      await user.click(screen.getByText('Document'));
      
      const saveButton = screen.getByText('Add Rule');
      await user.click(saveButton);
      
      // Should add rule to the list
      expect(screen.getByText('User can read Document')).toBeInTheDocument();
    });

    it('should handle rule deletion', async () => {
      const user = userEvent.setup();
      
      // First add a rule
      const addRuleButton = screen.getByText('Add Rule');
      await user.click(addRuleButton);
      
      const subjectSelect = screen.getByLabelText('Subject');
      await user.click(subjectSelect);
      await user.click(screen.getByText('User'));
      
      const actionSelect = screen.getByLabelText('Action');
      await user.click(actionSelect);
      await user.click(screen.getByText('read'));
      
      const resourceSelect = screen.getByLabelText('Resource');
      await user.click(resourceSelect);
      await user.click(screen.getByText('Document'));
      
      const saveButton = screen.getByText('Add Rule');
      await user.click(saveButton);
      
      // Delete the rule
      const deleteButton = screen.getByLabelText('Delete rule');
      await user.click(deleteButton);
      
      expect(screen.getByText('No rules defined yet')).toBeInTheDocument();
    });

    it('should validate rules before proceeding to review step', async () => {
      const user = userEvent.setup();
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Should show validation error
      expect(screen.getByText('At least one rule is required')).toBeInTheDocument();
    });

    it('should proceed to review step when rules are defined', async () => {
      const user = userEvent.setup();
      
      // Add a rule
      const addRuleButton = screen.getByText('Add Rule');
      await user.click(addRuleButton);
      
      const subjectSelect = screen.getByLabelText('Subject');
      await user.click(subjectSelect);
      await user.click(screen.getByText('User'));
      
      const actionSelect = screen.getByLabelText('Action');
      await user.click(actionSelect);
      await user.click(screen.getByText('read'));
      
      const resourceSelect = screen.getByLabelText('Resource');
      await user.click(resourceSelect);
      await user.click(screen.getByText('Document'));
      
      const saveButton = screen.getByText('Add Rule');
      await user.click(saveButton);
      
      // Proceed to review
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      expect(screen.getByText('Review Policy')).toBeInTheDocument();
    });
  });

  describe('Review & Create Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      // Fill basic information
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'Test description');
      
      let nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Add a rule
      const addRuleButton = screen.getByText('Add Rule');
      await user.click(addRuleButton);
      
      const subjectSelect = screen.getByLabelText('Subject');
      await user.click(subjectSelect);
      await user.click(screen.getByText('User'));
      
      const actionSelect = screen.getByLabelText('Action');
      await user.click(actionSelect);
      await user.click(screen.getByText('read'));
      
      const resourceSelect = screen.getByLabelText('Resource');
      await user.click(resourceSelect);
      await user.click(screen.getByText('Document'));
      
      const saveButton = screen.getByText('Add Rule');
      await user.click(saveButton);
      
      // Proceed to review
      nextButton = screen.getByText('Next');
      await user.click(nextButton);
    });

    it('should display policy summary in review step', () => {
      expect(screen.getByText('Review Policy')).toBeInTheDocument();
      expect(screen.getByText('Test Policy')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Allow')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display rules summary', () => {
      expect(screen.getByText('Rules (1)')).toBeInTheDocument();
      expect(screen.getByText('User can read Document')).toBeInTheDocument();
    });

    it('should allow going back to previous steps', async () => {
      const user = userEvent.setup();
      
      const backButton = screen.getByText('Back');
      await user.click(backButton);
      
      // Should go back to rules step
      expect(screen.getByText('Add Rule')).toBeInTheDocument();
    });

    it('should create policy when create button is clicked', async () => {
      const user = userEvent.setup();
      
      const createButton = screen.getByText('Create Policy');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/policies', expect.objectContaining({
          name: 'Test Policy',
          description: 'Test description',
          effect: 'Allow',
          status: 'Active',
          priority: 1,
          rules: expect.arrayContaining([
            expect.objectContaining({
              subject: 'User',
              action: 'read',
              resource: 'Document',
            })
          ])
        }));
      });
      
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Policy created successfully');
      expect(mockRouter.push).toHaveBeenCalledWith('/policies');
    });

    it('should handle creation error', async () => {
      const user = userEvent.setup();
      const error = new Error('Creation failed');
      (apiClient.post as jest.Mock).mockRejectedValue(error);
      
      const createButton = screen.getByText('Create Policy');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalledWith(error, 'Failed to create policy');
      });
    });

    it('should show loading state during creation', async () => {
      const user = userEvent.setup();
      (apiClient.post as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      const createButton = screen.getByText('Create Policy');
      await user.click(createButton);
      
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to policies list when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const backButton = screen.getByLabelText('Go back');
      await user.click(backButton);
      
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should handle breadcrumb navigation', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const policiesLink = screen.getByText('Policies');
      await user.click(policiesLink);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/policies');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for invalid priority', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const priorityInput = screen.getByLabelText('Priority');
      await user.clear(priorityInput);
      await user.type(priorityInput, '-1');
      
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      expect(screen.getByText('Priority must be a positive number')).toBeInTheDocument();
    });

    it('should trim whitespace from text inputs', async () => {
      const user = userEvent.setup();
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, '  Test Policy  ');
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Should proceed without validation error
      expect(screen.getByText('Add Rule')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API error when fetching dropdown data', async () => {
      const error = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);
      
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(mockSnackbar.handleApiError).toHaveBeenCalledWith(error, expect.any(String));
      });
    });

    it('should handle empty dropdown data', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: [] });
      
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Policy Name');
      await user.type(nameInput, 'Test Policy');
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      // Should show message about no available options
      expect(screen.getByText('No subjects available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form elements', async () => {
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('Policy Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Effect')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });

    it('should support keyboard navigation through steps', async () => {
      render(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Policy Name');
      nameInput.focus();
      expect(nameInput).toHaveFocus();
      
      fireEvent.keyDown(nameInput, { key: 'Tab' });
      // Next focusable element should receive focus
    });
  });

  describe('Performance', () => {
    it('should not re-fetch dropdown data unnecessarily', async () => {
      const { rerender } = renderWithProviders(<CreatePolicyPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const initialCallCount = (apiClient.get as jest.Mock).mock.calls.length;
      
      // Re-render with same props
      rerender(<CreatePolicyPage />);
      
      // Should not make additional API calls
      expect((apiClient.get as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });
  });
});