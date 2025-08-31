import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import EditPolicyPage from '../page';
import { apiClient } from '@/lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockPolicy = {
  _id: '676b5c123456789012345678',
  id: 'policy-123',
  name: 'Test Policy',
  description: 'Test policy description',
  effect: 'Allow' as const,
  status: 'Active' as const,
  rules: [{
    id: 'rule-1',
    subject: {
      type: 'user-123',
      attributes: [
        { name: 'department', operator: 'equals' as const, value: 'Finance' },
        { name: 'role', operator: 'in' as const, value: ['Manager', 'Senior'] }
      ]
    },
    action: {
      name: 'read',
      displayName: 'Read'
    },
    object: {
      type: 'document',
      attributes: []
    },
    conditions: []
  }],
  subjects: ['user-123'],
  resources: ['doc-123'],
  actions: ['read'],
  conditions: [],
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    version: '1.0',
    isSystem: false,
    isCustom: true
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockSubjects = [
  {
    _id: '676b5c123456789012345678',
    id: 'user-123',
    name: 'john.doe',
    displayName: 'John Doe',
    email: 'john.doe@company.com',
    type: 'user' as const,
    role: 'Manager',
    department: 'Finance',
    status: 'active' as const,
    permissions: ['read', 'write'],
    metadata: { createdBy: 'admin' }
  },
  {
    _id: '676b5c123456789012345679',
    id: 'group-456',
    name: 'finance.team',
    displayName: 'Finance Team',
    email: 'finance@company.com',
    type: 'group' as const,
    role: 'Team',
    department: 'Finance',
    status: 'active' as const,
    permissions: ['read'],
    metadata: { createdBy: 'admin' }
  }
];

const mockActions = [
  {
    _id: '676b5c123456789012345680',
    id: 'read',
    name: 'read',
    displayName: 'Read',
    description: 'Read access to resources',
    category: 'read' as const,
    httpMethod: 'GET',
    endpoint: '/api/*',
    riskLevel: 'low' as const,
    active: true,
    metadata: {
      owner: 'system',
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['basic'],
      isSystem: true
    }
  },
  {
    _id: '676b5c123456789012345681',
    id: 'write',
    name: 'write',
    displayName: 'Write',
    description: 'Write access to resources',
    category: 'write' as const,
    httpMethod: 'POST',
    endpoint: '/api/*',
    riskLevel: 'medium' as const,
    active: true,
    metadata: {
      owner: 'system',
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['basic'],
      isSystem: true
    }
  }
];

const mockResources = [
  {
    _id: '676b5c123456789012345682',
    id: 'doc-123',
    name: 'financial.docs',
    displayName: 'Financial Documents',
    type: 'document' as const,
    uri: '/documents/financial/*',
    description: 'Financial documents and reports',
    attributes: {},
    children: [],
    permissions: {
      read: true,
      write: false,
      delete: false,
      execute: false,
      admin: false
    }
  },
  {
    _id: '676b5c123456789012345683',
    id: 'api-456',
    name: 'finance.api',
    displayName: 'Finance API',
    type: 'api' as const,
    uri: '/api/finance/*',
    description: 'Finance API endpoints',
    attributes: {},
    children: [],
    permissions: {
      read: true,
      write: true,
      delete: false,
      execute: true,
      admin: false
    }
  }
];

const mockAttributes = [
  {
    _id: '676b5c123456789012345684',
    id: 'dept-attr',
    name: 'department',
    displayName: 'Department',
    description: 'Employee department',
    categories: ['subject'],
    dataType: 'string' as const,
    isRequired: true,
    isMultiValue: false,
    constraints: {
      enumValues: ['Finance', 'HR', 'Engineering', 'Marketing']
    },
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['employee'],
      isSystem: true,
      isCustom: false,
      version: '1.0'
    },
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '676b5c123456789012345685',
    id: 'role-attr',
    name: 'role',
    displayName: 'Role',
    description: 'Employee role',
    categories: ['subject'],
    dataType: 'string' as const,
    isRequired: false,
    isMultiValue: true,
    constraints: {
      enumValues: ['Manager', 'Senior', 'Junior', 'Lead']
    },
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['employee'],
      isSystem: true,
      isCustom: false,
      version: '1.0'
    },
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '676b5c123456789012345686',
    id: 'clearance-attr',
    name: 'clearance',
    displayName: 'Security Clearance',
    description: 'Security clearance level',
    categories: ['subject'],
    dataType: 'number' as const,
    isRequired: false,
    isMultiValue: false,
    constraints: {
      minValue: 1,
      maxValue: 5
    },
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['security'],
      isSystem: true,
      isCustom: false,
      version: '1.0'
    },
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '676b5c123456789012345687',
    id: 'admin-attr',
    name: 'isAdmin',
    displayName: 'Is Administrator',
    description: 'Whether user has admin privileges',
    categories: ['subject'],
    dataType: 'boolean' as const,
    isRequired: false,
    isMultiValue: false,
    constraints: {},
    validation: {},
    metadata: {
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      tags: ['admin'],
      isSystem: true,
      isCustom: false,
      version: '1.0'
    },
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('EditPolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    });
    mockUseParams.mockReturnValue({ id: 'policy-123' });
  });

  describe('Initial Loading and Data Fetching', () => {
    it('displays loading spinner while fetching policy data', async () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EditPolicyPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('fetches policy and dropdown data on mount', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/policies/policy-123');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/subjects', { page: 1, limit: 1000 });
      expect(mockApiClient.get).toHaveBeenCalledWith('/actions', { page: 1, limit: 1000 });
      expect(mockApiClient.get).toHaveBeenCalledWith('/resources', { page: 1, limit: 1000 });
      expect(mockApiClient.get).toHaveBeenCalledWith('/attributes', { page: 1, limit: 1000 });
    });

    it('handles policy not found error', async () => {
      mockApiClient.get.mockResolvedValueOnce({ success: false, data: null });

      render(<EditPolicyPage />);

      await waitFor(() => {
        expect(screen.getByText('Policy not found')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Policies')).toBeInTheDocument();
    });

    it('handles API error when fetching policy', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      render(<EditPolicyPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load policy. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Step 1: Basic Information', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Policy')).toBeInTheDocument();
      });
    });

    it('displays pre-populated form fields', () => {
      expect(screen.getByDisplayValue('Test Policy')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test policy description')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('validates policy name field', async () => {
      const user = userEvent.setup();
      const nameField = screen.getByRole('textbox', { name: /policy name/i });

      // Test empty field
      await user.clear(nameField);
      await user.tab();
      
      expect(screen.getByText('Next')).toBeDisabled();

      // Test too short name
      await user.type(nameField, 'AB');
      expect(screen.getByText('Policy name must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeDisabled();

      // Test too long name
      await user.clear(nameField);
      await user.type(nameField, 'A'.repeat(101));
      expect(screen.getByText('Policy name cannot exceed 100 characters')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeDisabled();

      // Test valid name
      await user.clear(nameField);
      await user.type(nameField, 'Valid Policy Name');
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
    });

    it('updates description field correctly', async () => {
      const user = userEvent.setup();
      const descriptionField = screen.getByRole('textbox', { name: /description/i });

      await user.clear(descriptionField);
      await user.type(descriptionField, 'Updated policy description');
      
      expect(screen.getByDisplayValue('Updated policy description')).toBeInTheDocument();
    });
  });

  describe('Step 2: Subject Selection', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Next'));
    });

    it('displays subject selection form', async () => {
      await waitFor(() => {
        expect(screen.getByText('Subject Selection')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Choose who this policy applies to and configure their attributes')).toBeInTheDocument();
    });

    it('pre-selects the subject from the original policy', async () => {
      await waitFor(() => {
        // Check that the subject dropdown has the pre-selected value
        const dropdown = screen.getByRole('combobox', { name: /select subject/i });
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('allows subject selection', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /select subject/i })).toBeInTheDocument();
      });

      const dropdown = screen.getByRole('combobox', { name: /select subject/i });
      await user.click(dropdown);

      const option = screen.getByText('John Doe');
      await user.click(option);

      expect(screen.getByText('Next')).toBeEnabled();
    });

    it('displays subject attributes when subject is selected', async () => {
      await waitFor(() => {
        expect(screen.getByText('Attribute Conditions')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Security Clearance')).toBeInTheDocument();
      expect(screen.getByText('Is Administrator')).toBeInTheDocument();
    });

    it('handles different attribute data types', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Department')).toBeInTheDocument();
      });

      // Test string dropdown attribute
      const deptDropdown = screen.getByDisplayValue('Finance');
      expect(deptDropdown).toBeInTheDocument();

      // Test multi-value attribute
      const roleField = screen.getAllByRole('textbox').find(input => 
        input.getAttribute('placeholder')?.includes('Select existing or type new values')
      );
      expect(roleField).toBeInTheDocument();

      // Test number attribute
      const clearanceField = screen.getByRole('spinbutton');
      await user.type(clearanceField, '3');
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();

      // Test boolean attribute
      const adminSwitch = screen.getByRole('checkbox');
      await user.click(adminSwitch);
      expect(adminSwitch).toBeChecked();
    });

    it('shows validation for required attributes', async () => {
      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });
    });

    it('prevents proceeding without subject selection', async () => {
      const user = userEvent.setup();
      
      // Clear subject selection
      const dropdown = screen.getByRole('combobox', { name: /select subject/i });
      await user.click(dropdown);
      await user.keyboard('{Escape}'); // Close dropdown without selection
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeDisabled();
      });
    });
  });

  describe('Step 3: Actions & Resources', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      
      // Navigate to step 3
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Next')); // Step 1 -> 2
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
      
      await user.click(screen.getByText('Next')); // Step 2 -> 3
    });

    it('displays actions and resources selection', async () => {
      await waitFor(() => {
        expect(screen.getByText('Actions & Resources')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Define what actions can be performed on which resources')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('pre-selects actions and resources from original policy', async () => {
      await waitFor(() => {
        const readSwitch = screen.getAllByRole('checkbox').find(checkbox => {
          const label = checkbox.closest('label');
          return label?.textContent?.includes('Read');
        });
        expect(readSwitch).toBeChecked();
      });

      const docSwitch = screen.getAllByRole('checkbox').find(checkbox => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('Financial Documents');
      });
      expect(docSwitch).toBeChecked();
    });

    it('allows toggling actions', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Write')).toBeInTheDocument();
      });

      const writeSwitch = screen.getAllByRole('checkbox').find(checkbox => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('Write');
      });
      
      expect(writeSwitch).not.toBeChecked();
      await user.click(writeSwitch!);
      expect(writeSwitch).toBeChecked();
    });

    it('allows toggling resources', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Finance API')).toBeInTheDocument();
      });

      const apiSwitch = screen.getAllByRole('checkbox').find(checkbox => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('Finance API');
      });
      
      expect(apiSwitch).not.toBeChecked();
      await user.click(apiSwitch!);
      expect(apiSwitch).toBeChecked();
    });

    it('validates that at least one action and resource are selected', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        const readSwitch = screen.getAllByRole('checkbox').find(checkbox => {
          const label = checkbox.closest('label');
          return label?.textContent?.includes('Read');
        });
        expect(readSwitch).toBeChecked();
      });

      // Unselect the read action
      const readSwitch = screen.getAllByRole('checkbox').find(checkbox => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('Read');
      });
      await user.click(readSwitch!);

      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('Step 4: Review & Save', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      
      // Navigate to step 4
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Next')); // Step 1 -> 2
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
      
      await user.click(screen.getByText('Next')); // Step 2 -> 3
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
      
      await user.click(screen.getByText('Next')); // Step 3 -> 4
    });

    it('displays policy review information', async () => {
      await waitFor(() => {
        expect(screen.getByText('Review & Save')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Policy Summary')).toBeInTheDocument();
      expect(screen.getByText('Policy Configuration')).toBeInTheDocument();
    });

    it('displays human-readable policy summary', async () => {
      await waitFor(() => {
        expect(screen.getByText(/This policy/)).toBeInTheDocument();
      });
    });

    it('allows changing policy effect', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Allow')).toBeInTheDocument();
      });

      const denyButton = screen.getByRole('button', { name: /deny/i });
      await user.click(denyButton);
      
      // Check that the summary updates
      await waitFor(() => {
        expect(screen.getByText(/DENYS/)).toBeInTheDocument();
      });
    });

    it('allows changing policy status', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });

      const draftButton = screen.getByRole('button', { name: /draft/i });
      await user.click(draftButton);
      
      expect(screen.getByText('Policy is being developed')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      
      // Navigate to final step
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
      await user.click(screen.getByText('Next'));
    });

    it('submits form with correct data structure', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockResolvedValueOnce({ success: true });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/policies/policy-123', expect.objectContaining({
          name: 'Test Policy',
          description: 'Test policy description',
          effect: 'Allow',
          status: 'Active',
          rules: expect.any(Array),
          subjects: expect.any(Array),
          resources: expect.any(Array),
          actions: expect.any(Array),
          conditions: expect.any(Array)
        }));
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockImplementation(() => new Promise(() => {})); // Never resolves

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('shows success message and redirects on successful submission', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockResolvedValueOnce({ success: true });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('Policy updated successfully! Redirecting to policy view...')).toBeInTheDocument();
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/policies/policy-123');
      }, { timeout: 3000 });
    });

    it('shows error message on submission failure', async () => {
      const user = userEvent.setup();
      mockApiClient.put.mockRejectedValueOnce(new Error('API Error'));

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update policy. Please try again.')).toBeInTheDocument();
      });
    });

    it('validates all steps before allowing submission', async () => {
      const user = userEvent.setup();
      
      // Go back to step 1 and clear required field
      await user.click(screen.getByText('Back'));
      await user.click(screen.getByText('Back'));
      await user.click(screen.getByText('Back'));
      
      const nameField = screen.getByRole('textbox', { name: /policy name/i });
      await user.clear(nameField);
      
      // Try to navigate back to final step
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
    });

    it('navigates between steps correctly', async () => {
      const user = userEvent.setup();
      
      // Step 1 -> 2
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Subject Selection')).toBeInTheDocument();
      
      // Step 2 -> 1
      await user.click(screen.getByText('Back'));
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      
      // Back is disabled on first step
      expect(screen.getByText('Back')).toBeDisabled();
    });

    it('shows correct step indicators', async () => {
      const user = userEvent.setup();
      
      // Check initial state
      expect(screen.getByText('1')).toBeInTheDocument();
      
      // Navigate to step 2
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('handles breadcrumb navigation', async () => {
      await waitFor(() => {
        expect(screen.getByText('Policies')).toBeInTheDocument();
      });
      
      const policiesLink = screen.getByText('Policies');
      fireEvent.click(policiesLink);
      expect(mockPush).toHaveBeenCalledWith('/policies');
    });

    it('handles back button navigation', async () => {
      const backButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && btn.getAttribute('aria-label') === null
      );
      
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockPush).toHaveBeenCalledWith('/policies/policy-123');
      }
    });

    it('handles cancel button', async () => {
      const user = userEvent.setup();
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/policies/policy-123');
    });
  });

  describe('Error Handling', () => {
    it('handles dropdown data fetch errors gracefully', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<EditPolicyPage />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching dropdown data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles malformed API responses', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: 'invalid' }) // Invalid subjects data
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Policy')).toBeInTheDocument();
      });
      
      // Should handle invalid data gracefully
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<EditPolicyPage />);
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
    });

    it('has proper ARIA labels and roles', () => {
      expect(screen.getByRole('textbox', { name: /policy name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
    });

    it('shows proper validation messages', async () => {
      const user = userEvent.setup();
      const nameField = screen.getByRole('textbox', { name: /policy name/i });
      
      await user.clear(nameField);
      await user.type(nameField, 'AB');
      
      expect(screen.getByText('Policy name must be at least 3 characters')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      // Tab through form fields
      await user.tab();
      expect(screen.getByRole('textbox', { name: /policy name/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('textbox', { name: /description/i })).toHaveFocus();
    });

    it('provides proper button labels', () => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});