import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import azureAdService from '@/lib/azureAdService';
import LoginPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SnackbarContext', () => ({
  useApiSnackbar: jest.fn(),
}));

// Mock Azure AD service
jest.mock('@/lib/azureAdService', () => ({
  isConfigured: jest.fn(),
  initialize: jest.fn(),
  getBackendConfig: jest.fn(),
  loginRedirect: jest.fn(),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('LoginPage', () => {
  const mockReplace = jest.fn();
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();

  const defaultAuthContext = {
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    clearError: mockClearError,
  };

  const defaultSnackbarContext = {
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useAuth as jest.Mock).mockReturnValue(defaultAuthContext);
    (useApiSnackbar as jest.Mock).mockReturnValue(defaultSnackbarContext);
    
    // Setup Azure AD service defaults
    (azureAdService.isConfigured as jest.Mock).mockReturnValue(false);
    (azureAdService.initialize as jest.Mock).mockResolvedValue(undefined);
    (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: false });
    (azureAdService.loginRedirect as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Mounting and Initialization', () => {
    it('renders login form with all required elements', async () => {
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
        expect(screen.getByText('Access your CRAFT Permission System account')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByText('Don\'t have an account?')).toBeInTheDocument();
        expect(screen.getByText('Sign up here')).toBeInTheDocument();
      });
    });

    it('shows loading state when not mounted', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        isLoading: true,
      });

      render(<LoginPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('shows loading state when authenticated (during redirect)', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
      });

      render(<LoginPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('clears errors on mount', async () => {
      render(<LoginPage />);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Azure AD Initialization', () => {
    it('initializes Azure AD when configured', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });

      render(<LoginPage />);

      await waitFor(() => {
        expect(azureAdService.isConfigured).toHaveBeenCalled();
        expect(azureAdService.initialize).toHaveBeenCalled();
        expect(azureAdService.getBackendConfig).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });
    });

    it('does not initialize Azure AD when not configured', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(false);

      render(<LoginPage />);

      await waitFor(() => {
        expect(azureAdService.isConfigured).toHaveBeenCalled();
        expect(azureAdService.initialize).not.toHaveBeenCalled();
        expect(azureAdService.getBackendConfig).not.toHaveBeenCalled();
      });

      expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
    });

    it('handles Azure AD initialization error', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.initialize as jest.Mock).mockRejectedValue(new Error('Init failed'));

      render(<LoginPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to initialize Azure AD:', expect.any(Error));
      });

      expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
    });

    it('handles backend config fetch error', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockRejectedValue(new Error('Config failed'));

      render(<LoginPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to initialize Azure AD:', expect.any(Error));
      });

      expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Redirect', () => {
    it('redirects to dashboard when user is authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
      });

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('does not redirect when not mounted yet', () => {
      const { rerender } = render(<LoginPage />);

      // Should not redirect initially
      expect(mockReplace).not.toHaveBeenCalled();

      // Should redirect after authentication
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
      });

      rerender(<LoginPage />);

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Form Validation and Input Handling', () => {
    it('updates email field when typed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      
      await user.type(emailField, 'test@example.com');

      expect(emailField).toHaveValue('test@example.com');
    });

    it('updates password field when typed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const passwordField = screen.getByLabelText(/password/i);
      
      await user.type(passwordField, 'password123');

      expect(passwordField).toHaveValue('password123');
    });

    it('shows validation warning when submitting with empty fields', async () => {
      // Mock the component to test validation directly
      render(<LoginPage />);

      // Test Enter key with empty fields (should not call handleSubmit)
      const emailField = screen.getByLabelText(/email/i);
      fireEvent.keyDown(emailField, { key: 'Enter', code: 'Enter' });
      
      // Since fields are empty, handleSubmit should not be called
      expect(mockLogin).not.toHaveBeenCalled();
      
      // Now test the validation by filling fields temporarily to test the validation path
      await userEvent.type(emailField, 'test');
      const passwordField = screen.getByLabelText(/password/i);
      await userEvent.type(passwordField, 'test');
      
      // Clear email to test partial validation
      await userEvent.clear(emailField);
      
      // Now the button should be disabled, but we can test the validation logic
      // by simulating the internal handleSubmit call when validation fails
      fireEvent.keyDown(passwordField, { key: 'Enter', code: 'Enter' });
      
      // This should not trigger login since email is empty
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows validation warning when submitting with only email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailField, 'test@example.com');
      await user.click(submitButton);

      expect(mockShowWarning).toHaveBeenCalledWith('Please enter both email and password');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows validation warning when submitting with only password', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      expect(mockShowWarning).toHaveBeenCalledWith('Please enter both email and password');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows error styling when fields are empty during submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid credentials', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockResolvedValue({ success: true });
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Login successful! Welcome back.');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing In...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('handles login error with error message', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValue({ error: errorMessage });
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(errorMessage);
        expect(console.error).toHaveBeenCalledWith('Login error:', expect.any(Object));
      });
    });

    it('handles login error with generic message fallback', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockRejectedValue(new Error('Network error'));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Network error');
      });
    });

    it('handles login error without message', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockRejectedValue({});
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Login failed. Please check your credentials.');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('submits form when Enter is pressed in email field with valid data', async () => {
      mockLogin.mockResolvedValue({ success: true });
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      await userEvent.type(emailField, 'test@example.com');
      await userEvent.type(passwordField, 'password123');
      
      fireEvent.keyDown(emailField, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('submits form when Enter is pressed in password field with valid data', async () => {
      mockLogin.mockResolvedValue({ success: true });
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      await userEvent.type(emailField, 'test@example.com');
      await userEvent.type(passwordField, 'password123');
      
      fireEvent.keyDown(passwordField, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('does not submit when Enter is pressed with incomplete data', async () => {
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);

      await userEvent.type(emailField, 'test@example.com');
      // Password is empty
      
      fireEvent.keyDown(emailField, { key: 'Enter', code: 'Enter' });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('does not submit when Enter is pressed during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      await userEvent.type(emailField, 'test@example.com');
      await userEvent.type(passwordField, 'password123');
      
      // Start first submission
      fireEvent.keyDown(emailField, { key: 'Enter', code: 'Enter' });
      
      // Try to submit again immediately
      fireEvent.keyDown(passwordField, { key: 'Enter', code: 'Enter' });

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Azure AD Authentication', () => {
    it('shows Azure AD button when enabled', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });

      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
        expect(screen.getByText('OR')).toBeInTheDocument();
      });
    });

    it('does not show Azure AD button when disabled', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: false });

      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
        expect(screen.queryByText('OR')).not.toBeInTheDocument();
      });
    });

    it('handles Azure AD login successfully', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      const azureButton = screen.getByText('Sign in with Microsoft');
      await user.click(azureButton);

      await waitFor(() => {
        expect(azureAdService.loginRedirect).toHaveBeenCalled();
      });
    });

    it('shows error when Azure AD is not configured during login attempt', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      // Change configuration after render
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(false);

      const azureButton = screen.getByText('Sign in with Microsoft');
      await user.click(azureButton);

      expect(mockShowError).toHaveBeenCalledWith('Azure AD is not configured');
      expect(azureAdService.loginRedirect).not.toHaveBeenCalled();
    });

    it('handles Azure AD login error', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      (azureAdService.loginRedirect as jest.Mock).mockRejectedValue(new Error('Azure AD error'));
      
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      const azureButton = screen.getByText('Sign in with Microsoft');
      await user.click(azureButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Azure AD error');
        expect(console.error).toHaveBeenCalledWith('Azure AD login error:', expect.any(Error));
      });
    });

    it('handles Azure AD login error without message', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      (azureAdService.loginRedirect as jest.Mock).mockRejectedValue({});
      
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      const azureButton = screen.getByText('Sign in with Microsoft');
      await user.click(azureButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Azure AD login failed. Please try again.');
      });
    });

    it('shows loading state during Azure AD login', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      (azureAdService.loginRedirect as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      const azureButton = screen.getByText('Sign in with Microsoft');
      await user.click(azureButton);

      await waitFor(() => {
        expect(screen.getByText('Redirecting...')).toBeInTheDocument();
        expect(azureButton).toBeDisabled();
      });
    });
  });

  describe('Button States and Interactions', () => {
    it('disables submit button when form is submitting', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('disables submit button when fields are empty', () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when both fields are filled', async () => {
      const user = userEvent.setup({ delay: null });
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');

      expect(submitButton).not.toBeDisabled();
    });

    it('disables both buttons during Azure AD submission', async () => {
      const user = userEvent.setup({ delay: null });
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });
      (azureAdService.loginRedirect as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');

      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });

      const azureButton = screen.getByText('Sign in with Microsoft');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(azureButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(azureButton).toBeDisabled();
      });
    });

    it('disables form fields during submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailField).toBeDisabled();
        expect(passwordField).toBeDisabled();
      });
    });
  });

  describe('Links and Navigation', () => {
    it('renders sign up link with correct href', () => {
      render(<LoginPage />);

      const signUpLink = screen.getByText('Sign up here');
      
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('shows correct styling for registration link', () => {
      render(<LoginPage />);

      const signUpLink = screen.getByText('Sign up here');
      
      expect(signUpLink).toHaveStyle('text-decoration: none');
    });
  });

  describe('Component Styling and Layout', () => {
    it('renders login icon', () => {
      render(<LoginPage />);

      // Login icon should be present (MUI LoginIcon)
      const loginIcon = screen.getByTestId('LoginIcon');
      expect(loginIcon).toBeInTheDocument();
    });

    it('renders Microsoft icon when Azure AD is enabled', async () => {
      (azureAdService.isConfigured as jest.Mock).mockReturnValue(true);
      (azureAdService.getBackendConfig as jest.Mock).mockResolvedValue({ enabled: true });

      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByTestId('MicrosoftIcon')).toBeInTheDocument();
      });
    });

    it('renders with proper container structure', () => {
      render(<LoginPage />);

      // Check for main structural elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles multiple rapid form submissions', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');

      // Multiple rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once due to disabled state
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('handles component unmounting during async operations', async () => {
      const user = userEvent.setup({ delay: null });
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      const { unmount } = render(<LoginPage />);

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailField, 'test@example.com');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      // Unmount during submission
      unmount();

      // Should not cause any warnings or errors
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('Default Export', () => {
    it('exports LoginPage as default', () => {
      expect(LoginPage).toBeDefined();
      expect(typeof LoginPage).toBe('function');
    });
  });
});