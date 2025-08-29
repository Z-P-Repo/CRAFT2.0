import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RegisterPage from '../page';

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

// Mock response helper
const mockApiResponse = (data: any, success: boolean = true, error: string | null = null) => ({
  data,
  success,
  error,
});

// Mock user data
const mockUser = {
  _id: '1',
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'basic',
  active: true,
};

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock AuthContext
const mockRegister = jest.fn();
const mockClearError = jest.fn();
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  describe('Rendering', () => {
    it('renders registration form', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByText('Create your CRAFT Permission System account')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders login link', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
      expect(screen.getByText('Sign in here')).toBeInTheDocument();
    });

    it('renders terms and privacy notice', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(/By signing up, you agree to our Terms of Service and Privacy Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/New accounts are created with Basic user permissions/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Redirect', () => {
    it('redirects to dashboard if already authenticated', () => {
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        clearError: mockClearError,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Form Validation', () => {
    it('shows error for empty name', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty email', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty password', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for password too short', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
      });
    });

    it('shows error for missing confirm password', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      });
    });

    it('shows error for password mismatch', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('clears errors when user types', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Registration Process', () => {
    it('successfully registers user', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('includes department when provided', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const departmentInput = screen.getByLabelText(/department/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(departmentInput, { target: { value: 'IT Department' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          department: 'IT Department',
        });
      });
    });

    it('shows loading state during registration', async () => {
      let resolveRegister: (value: any) => void;
      const registerPromise = new Promise((resolve) => {
        resolveRegister = resolve;
      });
      mockRegister.mockReturnValue(registerPromise);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Resolve the registration
      resolveRegister!(mockUser);
      
      await waitFor(() => {
        expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
      });
    });

    it('shows success message and redirects', async () => {
      jest.useFakeTimers();
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Account created successfully!/i)).toBeInTheDocument();
      });
      
      // Fast-forward time to trigger redirect
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
      });

      jest.useRealTimers();
    });

    it('handles registration failure', async () => {
      const errorMessage = 'Email already exists';
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
        clearError: mockClearError,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('submits form on Enter key', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      fireEvent.keyDown(confirmPasswordInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('does not submit incomplete form on Enter', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      
      fireEvent.keyDown(nameInput, { key: 'Enter' });
      
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('disables submit button when form is incomplete', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeDisabled();
      
      // Fill some fields
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      
      expect(submitButton).toBeDisabled();
      
      // Fill all required fields
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      expect(submitButton).not.toBeDisabled();
    });

    it('disables form when registration is successful', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Account created successfully!/i)).toBeInTheDocument();
      });
      
      // All inputs should be disabled
      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays auth context error', () => {
      const errorMessage = 'Registration failed';
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
        clearError: mockClearError,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('clears error when alert is closed', () => {
      const errorMessage = 'Registration failed';
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
        clearError: mockClearError,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('calls clearError on component mount', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    it('trims and processes form data', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const departmentInput = screen.getByLabelText(/department/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: '  Test User  ' } });
      fireEvent.change(emailInput, { target: { value: '  TEST@EXAMPLE.COM  ' } });
      fireEvent.change(departmentInput, { target: { value: '  IT Department  ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          department: 'IT Department',
        });
      });
    });

    it('excludes empty department from registration data', async () => {
      mockRegister.mockResolvedValue(mockUser);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const departmentInput = screen.getByLabelText(/department/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(departmentInput, { target: { value: '   ' } }); // Empty/whitespace
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Sign Up');
    });

    it('has autofocus on first input', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput).toHaveAttribute('autoFocus');
    });
  });

  describe('Edge Cases', () => {
    it('handles register function throwing error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRegister.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});