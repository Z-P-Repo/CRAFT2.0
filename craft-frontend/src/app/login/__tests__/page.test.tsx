import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginPage from '../page';

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
  role: 'admin',
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

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Welcome to CRAFT')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders system description', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Attribute-Based Access Control/i)).toBeInTheDocument();
    });

    it('renders register link', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText('Sign up here')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error for empty email', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty password', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error for password too short', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login Process', () => {
    it('successfully logs in user', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('shows loading state during login', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockApiClient.post.mockReturnValue(loginPromise);

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Resolve the login
      resolveLogin!(mockApiResponse({ user: mockUser }));
      
      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });

    it('handles login failure', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse(null, false, 'Invalid credentials')
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('handles network error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login failed. please try again/i)).toBeInTheDocument();
      });
    });

    it('redirects to dashboard on successful login', async () => {
      mockApiClient.post.mockResolvedValue(
        mockApiResponse({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Remember Me', () => {
    it('renders remember me checkbox', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('toggles remember me checkbox', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const checkbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('navigates to register page', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const registerLink = screen.getByText('Sign up here');
      fireEvent.click(registerLink);
      
      expect(mockPush).toHaveBeenCalledWith('/register');
    });

    it('navigates to forgot password', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const forgotPasswordLink = screen.getByText(/forgot password/i);
      fireEvent.click(forgotPasswordLink);
      
      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      emailInput.focus();
      expect(emailInput).toHaveFocus();
      
      // Tab to password
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      passwordInput.focus();
      expect(passwordInput).toHaveFocus();
      
      // Tab to submit button
      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });

    it('shows password when show/hide button is clicked', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const showPasswordButton = screen.getByLabelText(/show password/i);
      
      expect(passwordInput.type).toBe('password');
      
      fireEvent.click(showPasswordButton);
      expect(passwordInput.type).toBe('text');
      
      fireEvent.click(showPasswordButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Error Display', () => {
    it('displays multiple validation errors', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('clears errors when user types', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty response from server', async () => {
      mockApiClient.post.mockResolvedValue(null);

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login failed. please try again/i)).toBeInTheDocument();
      });
    });

    it('handles server returning success false', async () => {
      mockApiClient.post.mockResolvedValue({
        success: false,
        error: 'Account locked',
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/account locked/i)).toBeInTheDocument();
      });
    });
  });
});