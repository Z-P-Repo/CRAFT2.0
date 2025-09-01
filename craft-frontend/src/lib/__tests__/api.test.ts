// Create comprehensive axios mock with interceptor support
let requestInterceptor: any;
let responseInterceptor: any;
let requestErrorHandler: any;  
let responseErrorHandler: any;

// Create a function that can be called like an axios instance
const mockAxiosInstance = jest.fn();

// Add interceptors
mockAxiosInstance.interceptors = {
  request: { 
    use: jest.fn().mockImplementation((success, error) => {
      requestInterceptor = success;
      requestErrorHandler = error;
      return 1;
    })
  },
  response: { 
    use: jest.fn().mockImplementation((success, error) => {
      responseInterceptor = success;
      responseErrorHandler = error;
      return 1;
    })
  },
};

// Add HTTP methods
mockAxiosInstance.request = jest.fn();
mockAxiosInstance.get = jest.fn();
mockAxiosInstance.post = jest.fn();
mockAxiosInstance.put = jest.fn();
mockAxiosInstance.patch = jest.fn();
mockAxiosInstance.delete = jest.fn();

// Make the function callable and delegate to request method
mockAxiosInstance.mockImplementation((config: any) => mockAxiosInstance.request(config));

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

// Import after mocks are set up
import { ApiClient, testApiClient } from '../api';

describe('ApiClient', () => {
  let testApiClient: any;

  beforeAll(() => {
    testApiClient = testApiClient;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset specific mock functions
    mockAxiosInstance.request.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.patch.mockReset();
    mockAxiosInstance.delete.mockReset();
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

      const result = await testApiClient.login({
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

      const result = await testApiClient.login({
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

      const result = await testApiClient.login({
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

      const result = await testApiClient.register({
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

      const result = await testApiClient.logout();

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

      const result = await testApiClient.logout();

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

      const result = await testApiClient.getProfile();

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

      const result = await testApiClient.validateToken();

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

      const result = await testApiClient.get('/users', { page: 1 });

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

      const result = await testApiClient.get('/users');

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

      const result = await testApiClient.post('/users', { name: 'New User' });

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

      const result = await testApiClient.post('/users');

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

      const result = await testApiClient.put('/users/1', { name: 'Updated User' });

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

      const result = await testApiClient.put('/users/1');

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

      const result = await testApiClient.patch('/users/1', { active: false });

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

      const result = await testApiClient.patch('/users/1');

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

      const result = await testApiClient.delete('/users/1');

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

      const result = await testApiClient.delete('/users/1', { force: true });

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

      const result = await testApiClient.healthCheck();

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

      await expect(testApiClient.get('/test')).rejects.toEqual(errorData);
    });

    it('handles network error with message', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValueOnce(networkError);

      await expect(testApiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network Error',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles unknown error without message', async () => {
      const unknownError = {};
      mockAxiosInstance.request.mockRejectedValueOnce(unknownError);

      await expect(testApiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles error without response but with message', async () => {
      const error = { message: 'Request timeout' };
      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(testApiClient.get('/test')).rejects.toEqual({
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

      const result = await testApiClient.get('/test-ssr');

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

      await testApiClient.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('covers removeToken method through logout', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true }
      });

      await testApiClient.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('covers generateRequestId method through request', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({ data: { success: true } });

      await testApiClient.get('/test');

      expect(mockAxiosInstance.request).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles login with failed response data access', async () => {
      const loginData = { success: false, error: 'Unauthorized' };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await testApiClient.login({
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

      await testApiClient.login({
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

      await testApiClient.logout();

      global.window = originalWindow;

      // Should not call localStorage in SSR
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Interceptor Functionality', () => {
    it('request interceptor adds auth token when available', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const config = {
        headers: {},
        url: '/test',
        method: 'GET',
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('request interceptor works without token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const config = {
        headers: {},
        url: '/test', 
        method: 'GET',
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('request interceptor handles errors', () => {
      const error = new Error('Request error');
      expect(requestErrorHandler(error)).rejects.toEqual(error);
    });

    it('response interceptor passes through successful responses', () => {
      const response = { data: { success: true }, status: 200 };
      const result = responseInterceptor(response);
      expect(result).toEqual(response);
    });

    it('response interceptor handles 401 with successful token refresh', async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('refresh-token') // for refreshToken call
        .mockReturnValueOnce('new-access-token'); // for retry

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      const originalRequest = {
        headers: {},
        _retry: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await responseErrorHandler(error);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: 'refresh-token',
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-access-token');
      expect(originalRequest._retry).toBe(true);
    });

    it('response interceptor handles 401 with failed refresh', async () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token');
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh failed'));

      const originalRequest = {
        headers: {},
        _retry: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(responseErrorHandler(error)).rejects.toEqual(new Error('Refresh failed'));

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(window.dispatchEvent).toHaveBeenCalledWith(new CustomEvent('auth:error'));
    });

    it('response interceptor handles 401 without refresh token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const originalRequest = {
        headers: {},
        _retry: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(responseErrorHandler(error)).rejects.toEqual(
        new Error('No refresh token available')
      );

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(window.dispatchEvent).toHaveBeenCalledWith(new CustomEvent('auth:error'));
    });

    it('response interceptor skips already retried 401 requests', async () => {
      const originalRequest = {
        headers: {},
        _retry: true, // Already retried
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(responseErrorHandler(error)).rejects.toEqual(error);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('response interceptor handles non-401 errors', async () => {
      const error = {
        response: { status: 500 },
        config: { headers: {} },
      };

      await expect(responseErrorHandler(error)).rejects.toEqual(error);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });
  });

  describe('Activity Management', () => {
    it('handles getActivities with params', async () => {
      const responseData = { success: true, data: [] };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.getActivities({
        page: 1,
        limit: 10,
        filters: { category: 'security' },
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities',
        params: {
          page: 1,
          limit: 10,
          filters: { category: 'security' },
        },
      });
      expect(result).toEqual(responseData);
    });

    it('handles getActivities without params', async () => {
      const responseData = { success: true, data: [] };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.getActivities();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities',
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles getActivity', async () => {
      const responseData = { success: true, data: { id: '1' } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.getActivity('activity-1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities/activity-1',
      });
      expect(result).toEqual(responseData);
    });

    it('handles createActivity', async () => {
      const activityData = {
        type: 'login',
        category: 'security',
        action: 'user_login',
        description: 'User logged in',
        actor: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          type: 'user',
        },
        resource: {
          type: 'user',
          id: 'user-1',
          name: 'John Doe',
        },
        severity: 'low',
      };

      const responseData = { success: true, data: { ...activityData, _id: 'activity-1' } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.createActivity(activityData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/activities',
        data: activityData,
      });
      expect(result).toEqual(responseData);
    });

    it('handles getActivityStats', async () => {
      const responseData = {
        success: true,
        data: {
          total: 100,
          byCategory: { security: 50 },
          bySeverity: { low: 60 },
          recentCount: 25,
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.getActivityStats();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities/stats',
      });
      expect(result).toEqual(responseData);
    });

    it('handles exportActivities', async () => {
      const responseData = {
        success: true,
        data: { downloadUrl: 'https://example.com/download.csv' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.exportActivities({ category: 'security' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/activities/export',
        data: { filters: { category: 'security' } },
      });
      expect(result).toEqual(responseData);
    });

    it('handles exportActivities without filters', async () => {
      const responseData = {
        success: true,
        data: { downloadUrl: 'https://example.com/download.csv' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await testApiClient.exportActivities();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/activities/export',
        data: { filters: undefined },
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('Module Exports', () => {
    it('exports testApiClient instance', () => {
      expect(testApiClient).toBeDefined();
      expect(typeof testApiClient.login).toBe('function');
      expect(typeof testApiClient.register).toBe('function');
      expect(typeof testApiClient.logout).toBe('function');
      expect(typeof testApiClient.getProfile).toBe('function');
      expect(typeof testApiClient.validateToken).toBe('function');
      expect(typeof testApiClient.get).toBe('function');
      expect(typeof testApiClient.post).toBe('function');
      expect(typeof testApiClient.put).toBe('function');
      expect(typeof testApiClient.patch).toBe('function');
      expect(typeof testApiClient.delete).toBe('function');
      expect(typeof testApiClient.healthCheck).toBe('function');
      expect(typeof testApiClient.getActivities).toBe('function');
      expect(typeof testApiClient.getActivity).toBe('function');
      expect(typeof testApiClient.createActivity).toBe('function');
      expect(typeof testApiClient.getActivityStats).toBe('function');
      expect(typeof testApiClient.exportActivities).toBe('function');
    });

    it('exports default export', () => {
      const defaultExport = require('../api').default;
      expect(defaultExport).toBe(testApiClient);
    });
  });
});