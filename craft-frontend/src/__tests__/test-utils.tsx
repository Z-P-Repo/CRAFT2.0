import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthContext } from '@/contexts/AuthContext';
import { SnackbarContext } from '@/contexts/SnackbarContext';

// Mock theme
const mockTheme = createTheme();

// Mock user data
export const mockUser = {
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
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// Mock auth context value
export const mockAuthContextValue = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  checkAuth: jest.fn(),
};

// Mock snackbar context value
export const mockSnackbarContextValue = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  handleApiResponse: jest.fn(),
  handleApiError: jest.fn(),
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<typeof mockAuthContextValue>;
  snackbarValue?: Partial<typeof mockSnackbarContextValue>;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  authValue?: Partial<typeof mockAuthContextValue>;
  snackbarValue?: Partial<typeof mockSnackbarContextValue>;
}> = ({ children, authValue = {}, snackbarValue = {} }) => {
  return (
    <ThemeProvider theme={mockTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ ...mockAuthContextValue, ...authValue }}>
        <SnackbarContext.Provider value={{ ...mockSnackbarContextValue, ...snackbarValue }}>
          {children}
        </SnackbarContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  { authValue, snackbarValue, ...options }: CustomRenderOptions = {}
) =>
  render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} authValue={authValue} snackbarValue={snackbarValue} />
    ),
    ...options,
  });

// Mock API responses
export const mockApiResponse = <T = any>(data: T, success = true) => ({
  success,
  data,
  error: success ? undefined : 'Mock error',
  message: success ? 'Success' : 'Error',
});

export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  getProfile: jest.fn(),
  validateToken: jest.fn(),
};

// Mock entities
export const mockSubject = {
  _id: '1',
  id: '1',
  displayName: 'Test Subject',
  description: 'Test description',
  name: 'testsubject',
  type: 'user' as const,
  role: 'User',
  department: 'IT',
  status: 'active' as const,
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
  },
  policyCount: 2,
  usedInPolicies: [
    { id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' },
    { id: 'policy2', name: 'Policy 2', displayName: 'Policy 2' },
  ],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

export const mockAction = {
  _id: '1',
  id: '1',
  displayName: 'Test Action',
  description: 'Test action description',
  name: 'testaction',
  category: 'system' as const,
  riskLevel: 'medium' as const,
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
  },
  policyCount: 1,
  usedInPolicies: [{ id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' }],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

export const mockResource = {
  _id: '1',
  id: '1',
  displayName: 'Test Resource',
  description: 'Test resource description',
  name: 'testresource',
  type: 'file' as const,
  category: 'document' as const,
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
  },
  policyCount: 1,
  usedInPolicies: [{ id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' }],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

export const mockAttribute = {
  _id: '1',
  id: '1',
  displayName: 'Test Attribute',
  description: 'Test attribute description',
  name: 'testattribute',
  category: 'Subject' as const,
  dataType: 'string' as const,
  possibleValues: ['value1', 'value2'],
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
  },
  policyCount: 1,
  usedInPolicies: [{ id: 'policy1', name: 'Policy 1', displayName: 'Policy 1' }],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

export const mockPolicy = {
  _id: '1',
  id: '1',
  name: 'Test Policy',
  description: 'Test policy description',
  effect: 'Allow' as const,
  status: 'Active' as const,
  priority: 1,
  rules: [
    {
      id: 'rule1',
      condition: 'subject.role == "Admin"',
      description: 'Allow admin access',
    },
  ],
  subjects: ['1'],
  resources: ['1'],
  actions: ['1'],
  metadata: {
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    tags: ['test'],
    isSystem: false,
    isCustom: true,
    version: '1.0.0',
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };