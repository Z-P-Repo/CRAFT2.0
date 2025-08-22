import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, RegisterData, User, ApiClientConfig } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: config.withCredentials,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            await this.refreshToken();
            
            // Retry original request
            const token = this.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh-token', {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    
    this.setToken(token);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  }

  private handleAuthError(): void {
    this.removeToken();
    
    // Dispatch custom event for auth error
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:error'));
    }
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config);
      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data) {
        throw error.response.data;
      }
      
      // Handle network errors
      throw {
        success: false,
        error: error.message || 'Network error occurred',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    token: string;
    refreshToken?: string;
    user: User;
  }>> {
    const response = await this.request<{
      token: string;
      refreshToken?: string;
      user: User;
    }>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    });

    // Store tokens
    if (response.success && response.data) {
      this.setToken(response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    });
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.request({
        method: 'POST',
        url: '/auth/logout',
      });
    } finally {
      this.removeToken();
    }

    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'GET',
      url: '/auth/profile',
    });
  }

  async validateToken(): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/auth/validate-token',
    });
  }

  // Generic CRUD methods
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
    });
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/health',
      baseURL: this.baseURL.replace('/api/v1', ''), // Health endpoint is at root
    });
  }
}

// Create API client instance
const apiConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
  withCredentials: false,
};

export const apiClient = new ApiClient(apiConfig);
export default apiClient;