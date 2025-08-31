// Mock axios with a simplified approach focusing on testable functionality
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  request: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  default: { create: jest.fn(() => mockAxiosInstance) },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
});

import axios from 'axios';

// Import ApiClient class directly to test it
const ApiClient = require('../api').ApiClient || class ApiClient {
  constructor(config: any) {
    // Mock constructor for testing
  }
};

describe('ApiClient', () => {
  let apiClient: any;

  beforeAll(() => {
    apiClient = require('../api').apiClient;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset all mock functions
    Object.values(mockAxiosInstance).forEach(value => {
      if (typeof value === 'function') {
        (value as jest.Mock).mockReset();
      }
    });
    mockAxiosInstance.interceptors.request.use.mockReset();
    mockAxiosInstance.interceptors.response.use.mockReset();
  });

  describe('Module Setup', () => {
    it('creates axios instance', () => {
      expect(axios.create).toHaveBeenCalled();
    });

    it('sets up interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Authentication Methods', () => {
    it('handles login successfully with tokens', async () => {
      const loginData = {
        success: true,
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { email: 'test@example.com', id: '1' }
        }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/login',
        data: { email: 'test@example.com', password: 'password' },
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(result).toEqual(loginData);
    });

    it('handles login without refresh token', async () => {
      const loginData = {
        success: true,
        data: {
          token: 'access-token',
          user: { email: 'test@example.com', id: '1' }
        }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(result).toEqual(loginData);
    });

    it('handles failed login', async () => {
      const loginData = { success: false, error: 'Invalid credentials' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'wrong'
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(loginData);
    });

    it('handles register', async () => {
      const registerData = {
        success: true,
        data: { email: 'test@example.com', id: '1' }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: registerData });

      const result = await apiClient.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/register',
        data: { email: 'test@example.com', password: 'password', name: 'Test User' },
      });
      expect(result).toEqual(registerData);
    });

    it('handles logout successfully', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true }
      });

      const result = await apiClient.logout();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/logout',
      });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
    });

    it('handles logout with server error', async () => {
      mockAxiosInstance.request.mockRejectedValueOnce(new Error('Server error'));

      const result = await apiClient.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
    });

    it('handles getProfile', async () => {
      const profileData = {
        success: true,
        data: { email: 'test@example.com', id: '1' }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: profileData });

      const result = await apiClient.getProfile();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/auth/profile',
      });
      expect(result).toEqual(profileData);
    });

    it('handles validateToken', async () => {
      const tokenData = {
        success: true,
        data: { email: 'test@example.com', id: '1' }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: tokenData });

      const result = await apiClient.validateToken();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/validate-token',
      });
      expect(result).toEqual(tokenData);
    });
  });

  describe('CRUD Methods', () => {
    it('handles GET request with params', async () => {
      const responseData = { success: true, data: [] };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.get('/users', { page: 1 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: { page: 1 },
      });
      expect(result).toEqual(responseData);
    });

    it('handles GET request without params', async () => {
      const responseData = { success: true, data: [] };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.get('/users');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles POST request with data', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.post('/users', { name: 'New User' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data: { name: 'New User' },
      });
      expect(result).toEqual(responseData);
    });

    it('handles POST request without data', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.post('/users');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles PUT request with data', async () => {
      const responseData = { success: true, data: { id: 1, name: 'Updated' } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.put('/users/1', { name: 'Updated User' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data: { name: 'Updated User' },
      });
      expect(result).toEqual(responseData);
    });

    it('handles PUT request without data', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.put('/users/1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles PATCH request with data', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.patch('/users/1', { active: false });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/users/1',
        data: { active: false },
      });
      expect(result).toEqual(responseData);
    });

    it('handles PATCH request without data', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.patch('/users/1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/users/1',
        data: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles DELETE request without data', async () => {
      const responseData = { success: true, message: 'Deleted' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.delete('/users/1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/users/1',
        data: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles DELETE request with data', async () => {
      const responseData = { success: true, message: 'Deleted' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.delete('/users/1', { force: true });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/users/1',
        data: { force: true },
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('Health Check', () => {
    it('handles health check with modified base URL', async () => {
      const responseData = { success: true, status: 'healthy' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.healthCheck();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/health',
        baseURL: expect.any(String),
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('Error Handling', () => {
    it('handles API error response', async () => {
      const errorData = { success: false, error: 'API Error' };
      const error = { response: { data: errorData } };
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(apiClient.get('/test')).rejects.toEqual(errorData);
    });

    it('handles network error with message', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValueOnce(networkError);

      await expect(apiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network Error',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles unknown error without message', async () => {
      const unknownError = {};
      mockAxiosInstance.request.mockRejectedValueOnce(unknownError);

      await expect(apiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles error without response but with message', async () => {
      const error = { message: 'Request timeout' };
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(apiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Request timeout',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('Private Methods Coverage', () => {
    // These tests help achieve coverage of private methods through public methods
    
    it('covers getToken method in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = await apiClient.get('/test-ssr');

      global.window = originalWindow;
      
      // Should still make request without window
      expect(mockAxiosInstance.request).toHaveBeenCalled();
    });

    it('covers setToken method through successful login', async () => {
      const loginData = {
        success: true,
        data: {
          token: 'test-token',
          user: { email: 'test@example.com', id: '1' }
        }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      await apiClient.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('covers removeToken method through logout', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true }
      });

      await apiClient.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('covers generateRequestId method through request', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({ data: { success: true } });

      await apiClient.get('/test');

      expect(mockAxiosInstance.request).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles login with failed response data access', async () => {
      const loginData = { success: false, error: 'Unauthorized' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'wrong'
      });

      expect(result).toEqual(loginData);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles token storage in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const loginData = {
        success: true,
        data: {
          token: 'test-token',
          user: { email: 'test@example.com', id: '1' }
        }
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      await apiClient.login({
        email: 'test@example.com',
        password: 'password'
      });

      global.window = originalWindow;
      
      // Should not call localStorage in SSR
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles logout token removal in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true }
      });

      await apiClient.logout();

      global.window = originalWindow;

      // Should not call localStorage in SSR
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Module Exports', () => {
    it('exports apiClient instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.login).toBe('function');
      expect(typeof apiClient.register).toBe('function');
      expect(typeof apiClient.logout).toBe('function');
      expect(typeof apiClient.getProfile).toBe('function');
      expect(typeof apiClient.validateToken).toBe('function');
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.healthCheck).toBe('function');
    });

    it('exports default export', () => {
      const defaultExport = require('../api').default;
      expect(defaultExport).toBe(apiClient);
    });
  });
});