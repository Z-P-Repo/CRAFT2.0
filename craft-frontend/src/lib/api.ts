import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, RegisterData, User, ApiClientConfig, Activity, ActivityFilter } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private requestQueue: Map<string, number> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private rateLimitDelay = 250; // 250ms minimum between identical requests
  private isRefreshing = false; // Flag to prevent multiple simultaneous refresh attempts
  private refreshSubscribers: Array<(token: string | null) => void> = []; // Queue for requests waiting for token refresh

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

  private checkRateLimit(url: string, method: string): Promise<void> {
    const key = `${method}:${url}`;
    const now = Date.now();
    const lastRequest = this.requestQueue.get(key) || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      return new Promise(resolve => {
        setTimeout(() => {
          this.requestQueue.set(key, Date.now());
          resolve();
        }, waitTime);
      });
    }

    this.requestQueue.set(key, now);
    return Promise.resolve();
  }

  private getRequestKey(url: string, method: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if identical request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute the request and cache the promise
    const requestPromise = requestFn().finally(() => {
      // Clean up the pending request when it completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Apply rate limiting
        await this.checkRateLimit(config.url || '', config.method || 'GET');

        // Add auth token if available
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Development bypass removed for security - permissions must be properly tested

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

        // Handle 401 errors with proper token refresh queue
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Skip refresh attempts for the refresh token endpoint itself
          if (originalRequest.url?.includes('/auth/refresh-token')) {
            this.handleAuthError();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          if (this.isRefreshing) {
            // If refresh is already in progress, queue this request
            return new Promise((resolve) => {
              this.addRefreshSubscriber((token: string | null) => {
                if (token) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                } else {
                  resolve(Promise.reject(error));
                }
              });
            });
          }

          this.isRefreshing = true;

          try {
            // Try to refresh token
            const newToken = await this.refreshToken();
            
            // Notify all queued requests about the new token
            this.onTokenRefreshed(newToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, notify all queued requests and clear auth
            this.onTokenRefreshed(null);
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle 429 (Too Many Requests) errors with exponential backoff
        if (error.response?.status === 429 && !originalRequest._rateLimitRetry) {
          originalRequest._rateLimitRetry = true;
          
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000; // Default 2s delay
          
          console.warn(`Rate limit hit, retrying after ${delay}ms`);
          
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(this.client(originalRequest));
            }, delay);
          });
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

  private onTokenRefreshed(token: string | null): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string | null) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout for refresh requests
        }
      );

      const { token, refreshToken: newRefreshToken } = response.data;
      
      this.setToken(token);
      if (newRefreshToken && typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      return token;
    } catch (error) {
      // If refresh fails, clear tokens and throw error
      this.removeToken();
      throw error;
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
    return this.get<User>('/auth/profile');
  }

  async validateToken(): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/auth/validate-token',
    });
  }

  // Generic CRUD methods with deduplication for GET requests
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const requestKey = this.getRequestKey(url, 'GET', params);
    
    return this.deduplicateRequest(requestKey, () => {
      return this.request<T>({
        method: 'GET',
        url,
        params,
      });
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

  async delete<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      data,
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

  // Activity Management
  async getActivities(params?: {
    page?: number;
    limit?: number;
    filters?: ActivityFilter;
  }): Promise<ApiResponse<Activity[]>> {
    return this.request({
      method: 'GET',
      url: '/activities',
      params,
    });
  }

  async getActivity(id: string): Promise<ApiResponse<Activity>> {
    return this.request({
      method: 'GET',
      url: `/activities/${id}`,
    });
  }

  async createActivity(activity: Omit<Activity, '_id' | 'id' | 'timestamp'>): Promise<ApiResponse<Activity>> {
    return this.request({
      method: 'POST',
      url: '/activities',
      data: activity,
    });
  }

  async getActivityStats(): Promise<ApiResponse<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
  }>> {
    return this.request({
      method: 'GET',
      url: '/activities/stats',
    });
  }

  async exportActivities(filters?: ActivityFilter): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.request({
      method: 'POST',
      url: '/activities/export',
      data: { filters },
    });
  }

  // Additional Resources API methods
  async getAdditionalResources(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    active?: boolean;
    priority?: string;
    category?: string;
    tags?: string;
    owner?: string;
    isSystem?: boolean;
    workspaceId?: string;
    applicationId?: string;
    environmentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/additional-resources',
      params,
    });
  }

  async getAdditionalResource(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/additional-resources/${id}`,
    });
  }

  async createAdditionalResource(data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/additional-resources',
      data,
    });
  }

  async updateAdditionalResource(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PUT',
      url: `/additional-resources/${id}`,
      data,
    });
  }

  async deleteAdditionalResource(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'DELETE',
      url: `/additional-resources/${id}`,
    });
  }

  async bulkDeleteAdditionalResources(ids: string[]): Promise<ApiResponse<any>> {
    return this.request({
      method: 'DELETE',
      url: '/additional-resources/bulk/delete',
      data: { ids },
    });
  }

  async getAdditionalResourcesByType(type: string, params?: {
    environmentId?: string;
  }): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: `/additional-resources/type/${type}`,
      params,
    });
  }

  async evaluateAdditionalResource(id: string, context?: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: `/additional-resources/${id}/evaluate`,
      data: { context },
    });
  }

  async updateAdditionalResourceAttributes(
    id: string,
    attributes: Record<string, any>,
    operation: 'merge' | 'replace' = 'merge'
  ): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PATCH',
      url: `/additional-resources/${id}/attributes`,
      data: { attributes, operation },
    });
  }

  async getAdditionalResourceStats(params?: {
    workspaceId?: string;
    applicationId?: string;
    environmentId?: string;
  }): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }>> {
    return this.request({
      method: 'GET',
      url: '/additional-resources/stats',
      params,
    });
  }
}

// Create API client instance
const apiConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1',
  timeout: 30000,
  withCredentials: false,
};

export const apiClient = new ApiClient(apiConfig);
export default apiClient;