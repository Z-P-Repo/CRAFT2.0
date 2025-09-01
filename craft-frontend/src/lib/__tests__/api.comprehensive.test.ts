import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiClientConfig } from '@/types';

// Create proper mocks for axios
jest.mock('axios', () => ({
  create: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true,
});

// Mock Math.random for consistent testing
const mockMathRandom = jest.spyOn(Math, 'random');

describe('ApiClient Comprehensive Tests', () => {
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;
  let requestInterceptor: any;
  let responseInterceptor: any;
  let requestErrorHandler: any;
  let responseErrorHandler: any;
  let apiClient: any;

  const mockConfig: ApiClientConfig = {
    baseURL: 'http://localhost:3001/api/v1',
    timeout: 30000,
    withCredentials: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    (window.dispatchEvent as jest.Mock).mockClear();
    mockMathRandom.mockReturnValue(0.123456789);

    // Create a proper mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn().mockImplementation((success, error) => {
            requestInterceptor = success;
            requestErrorHandler = error;
            return 1; // mock interceptor id
          }),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn().mockImplementation((success, error) => {
            responseInterceptor = success;
            responseErrorHandler = error;
            return 1; // mock interceptor id
          }),
          eject: jest.fn(),
        },
      },
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {},
      },
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Use the exported apiClient instance
    apiClient = require('../api').apiClient;
  });

  describe('Constructor and Setup', () => {
    it('creates axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockConfig.baseURL,
        timeout: mockConfig.timeout,
        withCredentials: mockConfig.withCredentials,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('sets up request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Request Interceptor', () => {
    beforeEach(() => {
      // Interceptors are already set up during module load
      // We can use the interceptor functions directly
    });

    it('adds authorization header when token is available', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const config = {
        headers: {},
        url: '/test',
        method: 'GET',
      };

      const result = requestInterceptor(config);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result.headers.Authorization).toBe('Bearer test-token');
      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('does not add authorization header when no token', () => {
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

    it('handles request interceptor error', () => {
      const error = new Error('Request error');
      
      expect(() => requestErrorHandler(error)).rejects.toEqual(error);
    });

    it('works in SSR environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const config = {
        headers: {},
        url: '/test',
        method: 'GET',
      };

      const result = requestInterceptor(config);

      global.window = originalWindow;

      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('Response Interceptor', () => {
    beforeEach(() => {
      // Interceptors are already set up during module load
      // We can use the interceptor functions directly
    });

    it('passes through successful responses', () => {
      const response = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
      };

      const result = responseInterceptor(response);

      expect(result).toEqual(response);
    });

    it('handles 401 error with successful token refresh', async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('refresh-token') // for refreshToken()
        .mockReturnValueOnce('new-access-token'); // for retry request

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
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
      expect(originalRequest.headers.Authorization).toBe('Bearer new-access-token');
      expect(originalRequest._retry).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(originalRequest);
    });

    it('handles 401 error with failed token refresh', async () => {
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

      await expect(responseErrorHandler(error)).rejects.toEqual(
        new Error('Refresh failed')
      );

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('auth:error')
      );
    });

    it('handles 401 error when no refresh token available', async () => {
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
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('auth:error')
      );
    });

    it('handles 401 error that has already been retried', async () => {
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

    it('handles non-401 errors', async () => {
      const error = {
        response: { status: 500 },
        config: { headers: {} },
      };

      await expect(responseErrorHandler(error)).rejects.toEqual(error);

      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('handles refresh token without new refresh token', async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce('new-access-token');

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          token: 'new-access-token',
          // No refreshToken in response
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

      await responseErrorHandler(error);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-access-token');
      // Should not set refreshToken when not provided in response
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('handles auth error in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

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

      global.window = originalWindow;

      // Should not call window.dispatchEvent in SSR
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Private Method Coverage', () => {
    it('generates unique request IDs', () => {
      mockMathRandom
        .mockReturnValueOnce(0.123456789)
        .mockReturnValueOnce(0.987654321);

      const config1 = { headers: {}, url: '/test1', method: 'GET' };
      const config2 = { headers: {}, url: '/test2', method: 'GET' };

      const result1 = requestInterceptor(config1);
      const result2 = requestInterceptor(config2);

      expect(result1.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(result2.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(result1.headers['X-Request-ID']).not.toEqual(result2.headers['X-Request-ID']);
    });

    it('handles token storage in SSR during login', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const loginData = {
        success: true,
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          user: { email: 'test@example.com', id: '1' },
        },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      await apiClient.login({
        email: 'test@example.com',
        password: 'password',
      });

      global.window = originalWindow;

      // Should not call localStorage in SSR
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles token removal in SSR during logout', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true },
      });

      await apiClient.logout();

      global.window = originalWindow;

      // Should not call localStorage in SSR
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Request Method Error Handling', () => {
    it('handles API error response', async () => {
      const errorData = { success: false, error: 'API Error', code: 'API_ERROR' };
      const error = {
        response: { data: errorData },
      } as AxiosError;

      mockAxiosInstance.request.mockRejectedValueOnce(error);

      await expect(apiClient.get('/test')).rejects.toEqual(errorData);
    });

    it('handles network error with message', async () => {
      const networkError = new Error('Network timeout');
      mockAxiosInstance.request.mockRejectedValueOnce(networkError);

      await expect(apiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network timeout',
        code: 'NETWORK_ERROR',
      });
    });

    it('handles error without message', async () => {
      const unknownError = {};
      mockAxiosInstance.request.mockRejectedValueOnce(unknownError);

      await expect(apiClient.get('/test')).rejects.toEqual({
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('Authentication Methods', () => {
    it('handles successful login with both tokens', async () => {
      const loginData = {
        success: true,
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { email: 'test@example.com', id: '1' },
        },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password',
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

    it('handles successful login without refresh token', async () => {
      const loginData = {
        success: true,
        data: {
          token: 'access-token',
          user: { email: 'test@example.com', id: '1' },
        },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: loginData });

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password',
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
        password: 'wrong-password',
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(loginData);
    });

    it('handles logout successfully', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: { success: true },
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

      // Should still remove tokens even if server request fails
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
    });

    it('handles register', async () => {
      const registerData = {
        success: true,
        data: { email: 'test@example.com', id: '1' },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({ data: registerData });

      const result = await apiClient.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/register',
        data: { email: 'test@example.com', password: 'password', name: 'Test User' },
      });
      expect(result).toEqual(registerData);
    });

    it('handles getProfile', async () => {
      const profileData = {
        success: true,
        data: { email: 'test@example.com', id: '1' },
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
        data: { email: 'test@example.com', id: '1' },
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

      const result = await apiClient.get('/users', { page: 1, limit: 10 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: { page: 1, limit: 10 },
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

    it('handles PUT request', async () => {
      const responseData = { success: true, data: { id: 1 } };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.put('/users/1', { name: 'Updated User' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data: { name: 'Updated User' },
      });
      expect(result).toEqual(responseData);
    });

    it('handles PATCH request', async () => {
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

    it('handles DELETE request', async () => {
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
      const responseData = { success: true, message: 'Force deleted' };
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
        baseURL: 'http://localhost:3001',
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('Activity Management', () => {
    it('handles getActivities with params', async () => {
      const responseData = { success: true, data: [] };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.getActivities({
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

      const result = await apiClient.getActivities();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities',
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles getActivity', async () => {
      const responseData = {
        success: true,
        data: { id: 'activity-1', type: 'login' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.getActivity('activity-1');

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
          type: 'user' as const,
        },
        resource: {
          type: 'user',
          id: 'user-1',
          name: 'John Doe',
        },
        severity: 'low' as const,
      };

      const responseData = {
        success: true,
        data: { ...activityData, _id: 'activity-1', timestamp: '2023-01-01T00:00:00Z' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.createActivity(activityData);

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
          byCategory: { security: 50, system: 30, user: 20 },
          bySeverity: { low: 60, medium: 30, high: 10 },
          recentCount: 25,
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.getActivityStats();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/activities/stats',
      });
      expect(result).toEqual(responseData);
    });

    it('handles exportActivities with filters', async () => {
      const responseData = {
        success: true,
        data: { downloadUrl: 'https://example.com/download/activities.csv' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.exportActivities({ category: 'security' });

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
        data: { downloadUrl: 'https://example.com/download/activities.csv' },
      };
      mockAxiosInstance.request.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.exportActivities();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/activities/export',
        data: { filters: undefined },
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('handles refresh token process in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      // This should not cause errors in the getToken/setToken methods
      const result = requestInterceptor({
        headers: {},
        url: '/test',
        method: 'GET',
      });

      global.window = originalWindow;

      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers['X-Request-ID']).toBeDefined();
    });

    it('handles auth error dispatch in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      // Simulate auth error handling
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

      global.window = originalWindow;

      // In SSR, window.dispatchEvent should not be called
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});