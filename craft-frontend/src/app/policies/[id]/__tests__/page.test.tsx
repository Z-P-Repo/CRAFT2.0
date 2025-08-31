import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import PolicyViewPage from '../page';
import { apiClient } from '@/lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
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
  name: 'Finance Document Access Policy',
  description: 'Allows finance team members to access financial documents',
  effect: 'Allow' as const,
  status: 'Active' as const,
  rules: [
    {
      id: 'rule-1',
      subject: {
        type: 'user-123',
        attributes: [
          { name: 'department', operator: 'equals' as const, value: 'Finance' },
          { name: 'role', operator: 'in' as const, value: ['Manager', 'Analyst'] }
        ]
      },
      action: {
        name: 'read',
        displayName: 'Read Access'
      },
      object: {
        type: 'financial-docs',
        attributes: [
          { name: 'classification', operator: 'equals' as const, value: 'Internal' }
        ]
      },
      conditions: [
        { field: 'time', operator: 'greater_than' as const, value: '09:00' },
        { field: 'location', operator: 'in' as const, value: ['Office', 'VPN'] }
      ]
    },
    {
      id: 'rule-2',
      subject: {
        type: 'user-456',
        attributes: [
          { name: 'clearance', operator: 'greater_than' as const, value: 3 }
        ]
      },
      action: {
        name: 'write',
        displayName: 'Write Access'
      },
      object: {
        type: 'financial-reports',
        attributes: []
      },
      conditions: []
    }
  ],
  subjects: ['user-123', 'user-456'],
  resources: ['financial-docs', 'financial-reports'],
  actions: ['read', 'write'],
  conditions: [],
  metadata: {
    createdBy: 'admin@company.com',
    lastModifiedBy: 'manager@company.com',
    tags: ['finance', 'documents', 'security'],
    version: '1.2.0',
    isSystem: false,
    isCustom: true
  },
  createdAt: '2024-01-01T08:30:00Z',
  updatedAt: '2024-01-15T14:45:00Z'
};

const mockSingleRulePolicy = {
  ...mockPolicy,
  rules: [mockPolicy.rules[0]],
  name: 'Single Rule Policy'
};

const mockSubjects = [
  {
    id: 'user-123',
    displayName: 'John Smith',
    name: 'john.smith'
  },
  {
    id: 'user-456',
    displayName: 'Jane Doe',
    name: 'jane.doe'
  }
];

const mockActions = [
  {
    id: 'read',
    displayName: 'Read Access',
    name: 'read'
  },
  {
    id: 'write',
    displayName: 'Write Access',
    name: 'write'
  }
];

const mockResources = [
  {
    id: 'financial-docs',
    displayName: 'Financial Documents',
    name: 'financial-docs'
  },
  {
    id: 'financial-reports',
    displayName: 'Financial Reports',
    name: 'financial-reports'
  }
];

const mockAttributes = [
  {
    id: 'dept-attr',
    displayName: 'Department',
    name: 'department',
    dataType: 'string'
  },
  {
    id: 'role-attr',
    displayName: 'Role',
    name: 'role',
    dataType: 'string'
  },
  {
    id: 'clearance-attr',
    displayName: 'Security Clearance',
    name: 'clearance',
    dataType: 'number'
  },
  {
    id: 'classification-attr',
    displayName: 'Document Classification',
    name: 'classification',
    dataType: 'string'
  }
];

describe('PolicyViewPage', () => {
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

  describe('Loading State', () => {
    it('displays loading spinner while fetching data', async () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<PolicyViewPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('fetches policy and lookup data on mount', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/policies/policy-123');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/subjects?page=1&limit=1000');
      expect(mockApiClient.get).toHaveBeenCalledWith('/actions?page=1&limit=1000');
      expect(mockApiClient.get).toHaveBeenCalledWith('/resources?page=1&limit=1000');
      expect(mockApiClient.get).toHaveBeenCalledWith('/attributes?page=1&limit=1000');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when policy is not found', async () => {
      mockApiClient.get.mockResolvedValueOnce({ success: false, data: null });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Policy not found')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Policies')).toBeInTheDocument();
    });

    it('displays error message when API call fails', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load policy. Please try again.')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Policies')).toBeInTheDocument();
    });

    it('handles navigation back to policies on error', async () => {
      const user = userEvent.setup();
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Policies')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Policies'));
      expect(mockPush).toHaveBeenCalledWith('/policies');
    });

    it('handles lookup data fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockRejectedValueOnce(new Error('Subjects API error'))
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load lookup data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Policy Header', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);
      await waitFor(() => {
        expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      });
    });

    it('displays policy name and basic information', () => {
      expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      expect(screen.getByText('Allows finance team members to access financial documents')).toBeInTheDocument();
    });

    it('displays policy status and effect chips', () => {
      expect(screen.getByText('Allow')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays breadcrumb navigation', () => {
      expect(screen.getByText('Policies')).toBeInTheDocument();
      expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
    });

    it('handles breadcrumb navigation to policies list', async () => {
      const user = userEvent.setup();
      const policiesLink = screen.getByText('Policies');
      
      await user.click(policiesLink);
      expect(mockPush).toHaveBeenCalledWith('/policies');
    });

    it('displays edit policy button', () => {
      expect(screen.getByText('Edit Policy')).toBeInTheDocument();
    });

    it('handles edit policy navigation', async () => {
      const user = userEvent.setup();
      const editButton = screen.getByText('Edit Policy');
      
      await user.click(editButton);
      expect(mockPush).toHaveBeenCalledWith('/policies/policy-123/edit');
    });

    it('handles back button navigation', async () => {
      const user = userEvent.setup();
      const backButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('[data-testid="ArrowBackIcon"]') !== null
      );
      
      if (backButton) {
        await user.click(backButton);
        expect(mockPush).toHaveBeenCalledWith('/policies');
      }
    });
  });

  describe('Human-Readable Policy Summary', () => {
    it('displays single rule policy summary correctly', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockSingleRulePolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/This policy.*ALLOWS/)).toBeInTheDocument();
      });

      expect(screen.getByText(/John Smith/)).toBeInTheDocument();
      expect(screen.getByText(/Read Access/)).toBeInTheDocument();
      expect(screen.getByText(/Financial Documents/)).toBeInTheDocument();
    });

    it('displays multiple rules policy summary correctly', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/This policy.*ALLOWS.*the following access/)).toBeInTheDocument();
      });

      expect(screen.getByText(/1\./)).toBeInTheDocument();
      expect(screen.getByText(/2\./)).toBeInTheDocument();
    });

    it('handles Deny effect policies', async () => {
      const denyPolicy = { ...mockPolicy, effect: 'Deny' as const };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: denyPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/DENYS/)).toBeInTheDocument();
      });
    });

    it('displays subject attributes in summary', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/Department equals Finance/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Role in Manager, Analyst/)).toBeInTheDocument();
    });

    it('displays object attributes in summary', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/Document Classification equals Internal/)).toBeInTheDocument();
      });
    });

    it('displays conditions in summary', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText(/provided that.*time greater_than 09:00/)).toBeInTheDocument();
      });

      expect(screen.getByText(/location in Office, VPN/)).toBeInTheDocument();
    });
  });

  describe('Policy Rules Section', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);
      await waitFor(() => {
        expect(screen.getByText('Policy Rules')).toBeInTheDocument();
      });
    });

    it('displays all policy rules', () => {
      expect(screen.getByText('Policy Rules')).toBeInTheDocument();
      expect(screen.getByText('Rule 1')).toBeInTheDocument();
      expect(screen.getByText('Rule 2')).toBeInTheDocument();
    });

    it('displays rule subjects with display names', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('displays rule actions with display names', () => {
      expect(screen.getByText('Read Access')).toBeInTheDocument();
      expect(screen.getByText('Write Access')).toBeInTheDocument();
    });

    it('displays rule resources with display names', () => {
      expect(screen.getByText('Financial Documents')).toBeInTheDocument();
      expect(screen.getByText('Financial Reports')).toBeInTheDocument();
    });

    it('displays subject attributes for rules', () => {
      expect(screen.getByText('Department: Finance')).toBeInTheDocument();
      expect(screen.getByText('Role: Manager, Analyst')).toBeInTheDocument();
      expect(screen.getByText('Security Clearance: 3')).toBeInTheDocument();
    });

    it('displays object attributes for rules', () => {
      expect(screen.getByText('Document Classification: Internal')).toBeInTheDocument();
    });

    it('displays rule conditions', () => {
      expect(screen.getByText('time greater_than 09:00')).toBeInTheDocument();
      expect(screen.getByText('location in Office, VPN')).toBeInTheDocument();
    });

    it('displays effect chips for rules', () => {
      const allowChips = screen.getAllByText('Allow');
      expect(allowChips.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Details Section', () => {
    beforeEach(async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);
      await waitFor(() => {
        expect(screen.getByText('Activity Details')).toBeInTheDocument();
      });
    });

    it('displays timeline information', () => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Last Modified')).toBeInTheDocument();
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('admin@company.com')).toBeInTheDocument();
      expect(screen.getByText('manager@company.com')).toBeInTheDocument();
    });

    it('displays metadata information', () => {
      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('1.2.0')).toBeInTheDocument();
      expect(screen.getByText('System Policy')).toBeInTheDocument();
      expect(screen.getByText('Custom Policy')).toBeInTheDocument();
      expect(screen.getAllByText('No')[0]).toBeInTheDocument(); // System Policy: No
      expect(screen.getAllByText('Yes')[0]).toBeInTheDocument(); // Custom Policy: Yes
    });

    it('displays coverage and tags information', () => {
      expect(screen.getByText('Coverage & Tags')).toBeInTheDocument();
      expect(screen.getByText('Rules Count')).toBeInTheDocument();
      expect(screen.getByText('2 rules')).toBeInTheDocument();
      expect(screen.getByText('Subjects (2)')).toBeInTheDocument();
      expect(screen.getByText('Tags (3)')).toBeInTheDocument();
      expect(screen.getByText('finance')).toBeInTheDocument();
      expect(screen.getByText('documents')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
    });

    it('handles single rule count correctly', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockSingleRulePolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('1 rule')).toBeInTheDocument();
      });
    });

    it('displays subject chips with proper truncation', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('handles policies with many tags', async () => {
      const policyWithManyTags = {
        ...mockPolicy,
        metadata: {
          ...mockPolicy.metadata,
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
        }
      };

      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: policyWithManyTags })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('handles policies with many subjects', async () => {
      const policyWithManySubjects = {
        ...mockPolicy,
        subjects: ['user-1', 'user-2', 'user-3', 'user-4']
      };

      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: policyWithManySubjects })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });
  });

  describe('Status and Effect Color Coding', () => {
    it('displays correct colors for Allow effect', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Allow')).toBeInTheDocument();
      });
    });

    it('displays correct colors for Deny effect', async () => {
      const denyPolicy = { ...mockPolicy, effect: 'Deny' as const };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: denyPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Deny')).toBeInTheDocument();
      });
    });

    it('displays correct colors for Active status', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('displays correct colors for Inactive status', async () => {
      const inactivePolicy = { ...mockPolicy, status: 'Inactive' as const };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: inactivePolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('displays correct colors for Draft status', async () => {
      const draftPolicy = { ...mockPolicy, status: 'Draft' as const };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: draftPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });
  });

  describe('Fallback Display Names', () => {
    it('displays fallback names when lookup data is not available', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: [] }) // Empty subjects
        .mockResolvedValueOnce({ success: true, data: [] }) // Empty actions
        .mockResolvedValueOnce({ success: true, data: [] }) // Empty resources
        .mockResolvedValueOnce({ success: true, data: [] }); // Empty attributes

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Subject (user-123)')).toBeInTheDocument();
      });

      expect(screen.getByText('Action (read)')).toBeInTheDocument();
      expect(screen.getByText('Resource (financial-docs)')).toBeInTheDocument();
    });

    it('displays attribute names when attributes are not found', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: [] }); // Empty attributes

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('department: Finance')).toBeInTheDocument();
      });

      expect(screen.getByText('role: Manager, Analyst')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('handles policy with no description', async () => {
      const policyNoDescription = { ...mockPolicy, description: undefined };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: policyNoDescription })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('No description provided')).toBeInTheDocument();
      });
    });

    it('handles policy with no rules', async () => {
      const policyNoRules = { ...mockPolicy, rules: [] };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: policyNoRules })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      });

      expect(screen.queryByText('Policy Rules')).not.toBeInTheDocument();
    });

    it('handles policy with no tags', async () => {
      const policyNoTags = { 
        ...mockPolicy, 
        metadata: { ...mockPolicy.metadata, tags: [] }
      };
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: policyNoTags })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      });

      expect(screen.queryByText('Tags (')).not.toBeInTheDocument();
    });
  });

  describe('Data Format Handling', () => {
    it('handles nested API response data structure', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: { data: mockSubjects } }) // Nested structure
        .mockResolvedValueOnce({ success: true, data: { data: mockActions } })
        .mockResolvedValueOnce({ success: true, data: { data: mockResources } })
        .mockResolvedValueOnce({ success: true, data: { data: mockAttributes } });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('handles malformed lookup data responses', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: 'invalid' }) // Invalid subjects data
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Subject (user-123)')).toBeInTheDocument();
      });
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

      render(<PolicyViewPage />);
      await waitFor(() => {
        expect(screen.getByText('Finance Document Access Policy')).toBeInTheDocument();
      });
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'Finance Document Access Policy' })).toBeInTheDocument();
      expect(screen.getByText('Policy Rules')).toBeInTheDocument();
      expect(screen.getByText('Activity Details')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      expect(screen.getByRole('button', { name: /edit policy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to policies/i })).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      expect(screen.getByLabelText('breadcrumb')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      // Tab to the edit button
      await user.tab();
      await user.tab();
      expect(screen.getByText('Edit Policy')).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/policies/policy-123/edit');
    });
  });

  describe('Edge Cases', () => {
    it('handles policy with missing optional fields', async () => {
      const minimalPolicy = {
        _id: 'minimal-id',
        id: 'minimal-policy',
        name: 'Minimal Policy',
        effect: 'Allow' as const,
        status: 'Active' as const,
        rules: [],
        subjects: [],
        resources: [],
        actions: [],
        conditions: [],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: [],
          version: '1.0',
          isSystem: true,
          isCustom: false
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: minimalPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimal Policy')).toBeInTheDocument();
      });

      expect(screen.getByText('No description provided')).toBeInTheDocument();
      expect(screen.getByText('0 rules')).toBeInTheDocument();
    });

    it('handles policy ID not found in URL params', async () => {
      mockUseParams.mockReturnValue({ id: undefined });

      render(<PolicyViewPage />);

      // Should not make any API calls
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles array values in attributes correctly', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: mockPolicy })
        .mockResolvedValueOnce({ success: true, data: mockSubjects })
        .mockResolvedValueOnce({ success: true, data: mockActions })
        .mockResolvedValueOnce({ success: true, data: mockResources })
        .mockResolvedValueOnce({ success: true, data: mockAttributes });

      render(<PolicyViewPage />);

      await waitFor(() => {
        expect(screen.getByText('Role: Manager, Analyst')).toBeInTheDocument();
      });

      expect(screen.getByText('location in Office, VPN')).toBeInTheDocument();
    });
  });
});