# API Client Documentation

The CRAFT frontend uses a comprehensive API client built on Axios that provides authentication, error handling, automatic token refresh, and request tracking for seamless backend integration.

## Overview

The API client (`ApiClient`) is a centralized HTTP client that handles all communication with the CRAFT backend API, providing consistent request/response handling, authentication, and error management.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │───▶│   API Client    │───▶│  Backend API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  State Update   │◀───│  Interceptors   │◀───│   Responses     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Implementation

### ApiClient Class

**Location**: `/src/lib/api.ts`

```typescript
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
}
```

### Configuration Interface

```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
}

const apiConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
  withCredentials: false,
};
```

## Request Interceptors

### Authentication Header Injection

```typescript
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
  (error) => Promise.reject(error)
);
```

### Request ID Generation

```typescript
private generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

## Response Interceptors

### Automatic Token Refresh

```typescript
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await this.refreshToken();
        
        // Retry original request with new token
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
```

## Token Management

### Token Storage

```typescript
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
```

### Refresh Token Logic

```typescript
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
```

## Generic Request Method

### Error Handling and Response Wrapping

```typescript
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
```

## Authentication Methods

### Login

```typescript
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

  // Store tokens automatically
  if (response.success && response.data) {
    this.setToken(response.data.token);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
  }

  return response;
}
```

### Registration

```typescript
async register(userData: RegisterData): Promise<ApiResponse<User>> {
  return this.request<User>({
    method: 'POST',
    url: '/auth/register',
    data: userData,
  });
}
```

### Profile Management

```typescript
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
```

### Logout

```typescript
async logout(): Promise<ApiResponse> {
  try {
    await this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  } finally {
    // Always remove tokens, even if logout request fails
    this.removeToken();
  }

  return { success: true, message: 'Logged out successfully' };
}
```

## Generic CRUD Methods

### GET Requests

```typescript
async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
  return this.request<T>({
    method: 'GET',
    url,
    params,
  });
}
```

### POST Requests

```typescript
async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return this.request<T>({
    method: 'POST',
    url,
    data,
  });
}
```

### PUT Requests

```typescript
async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return this.request<T>({
    method: 'PUT',
    url,
    data,
  });
}
```

### PATCH Requests

```typescript
async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return this.request<T>({
    method: 'PATCH',
    url,
    data,
  });
}
```

### DELETE Requests

```typescript
async delete<T = any>(url: string): Promise<ApiResponse<T>> {
  return this.request<T>({
    method: 'DELETE',
    url,
  });
}
```

## Health Check

```typescript
async healthCheck(): Promise<ApiResponse> {
  return this.request({
    method: 'GET',
    url: '/health',
    baseURL: this.baseURL.replace('/api/v1', ''), // Health endpoint is at root
  });
}
```

## Type Definitions

### API Response Interface

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}
```

### Authentication Types

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
  department?: string;
  managerId?: string;
}

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  attributes?: Record<string, any>;
  active: boolean;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Usage Examples

### Basic Usage

```typescript
import { apiClient } from '@/lib/api';

// GET request
const users = await apiClient.get('/users');

// POST request
const newUser = await apiClient.post('/users', {
  email: 'user@example.com',
  name: 'John Doe',
});

// Authentication
await apiClient.login({
  email: 'admin@example.com',
  password: 'Admin123!',
});
```

### With Error Handling

```typescript
try {
  const response = await apiClient.get('/policies');
  
  if (response.success) {
    setPolicies(response.data);
  } else {
    setError(response.error || 'Failed to fetch policies');
  }
} catch (error: any) {
  setError(error.error || error.message || 'Network error');
}
```

### Azure AD Integration

```typescript
import azureAdService from '@/lib/azureAdService';

// Check if Azure AD is enabled
const isAzureAdEnabled = azureAdService.isConfigured();

// Get Azure AD configuration from backend
const config = await apiClient.get('/azure-ad/config');

// Handle Azure AD callback
const result = await apiClient.get(`/azure-ad/callback?code=${code}`);
```

### In React Components

```typescript
const useApiData = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<T>(url);
        
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.error || err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

## Error Handling

### Auth Error Handling

```typescript
private handleAuthError(): void {
  this.removeToken();
  
  // Dispatch custom event for auth error
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:error'));
  }
}
```

### Network Error Handling

```typescript
const handleNetworkError = (error: any): ApiResponse => {
  if (error.code === 'NETWORK_ERROR') {
    return {
      success: false,
      error: 'Network connection failed. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  if (error.code === 'TIMEOUT_ERROR') {
    return {
      success: false,
      error: 'Request timed out. Please try again.',
      code: 'TIMEOUT_ERROR',
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  };
};
```

## Request/Response Logging

### Development Logging

```typescript
if (process.env.NODE_ENV === 'development') {
  // Request logging
  this.client.interceptors.request.use(
    (config) => {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      });
      return config;
    }
  );

  // Response logging
  this.client.interceptors.response.use(
    (response) => {
      console.log('API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
      return response;
    },
    (error) => {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return Promise.reject(error);
    }
  );
}
```

## Performance Optimization

### Request Caching

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async getCached<T>(url: string): Promise<ApiResponse<T>> {
  const cacheKey = `GET:${url}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { success: true, data: cached.data };
  }

  const response = await this.get<T>(url);
  
  if (response.success) {
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
  }

  return response;
}
```

### Request Debouncing

```typescript
const debounceMap = new Map<string, NodeJS.Timeout>();

async debouncedRequest<T>(
  key: string,
  requestFn: () => Promise<ApiResponse<T>>,
  delay: number = 300
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const existingTimeout = debounceMap.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        debounceMap.delete(key);
      }
    }, delay);

    debounceMap.set(key, timeout);
  });
}
```

## Testing

### Mock API Client

```typescript
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
} as jest.Mocked<ApiClient>;

// Usage in tests
beforeEach(() => {
  jest.clearAllMocks();
});

test('should fetch users successfully', async () => {
  const mockUsers = [{ id: '1', name: 'John Doe' }];
  mockApiClient.get.mockResolvedValue({
    success: true,
    data: mockUsers,
  });

  const result = await mockApiClient.get('/users');
  
  expect(mockApiClient.get).toHaveBeenCalledWith('/users');
  expect(result.data).toEqual(mockUsers);
});
```

### Integration Tests

```typescript
describe('ApiClient Integration', () => {
  test('should handle authentication flow', async () => {
    // Mock successful login
    const mockResponse = {
      success: true,
      data: {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com' },
      },
    };

    jest.spyOn(apiClient, 'login').mockResolvedValue(mockResponse);

    const result = await apiClient.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('test@example.com');
  });
});
```

## Configuration

### Environment Variables

```typescript
// Default configuration
const defaultConfig: ApiClientConfig = {
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 30000,
  withCredentials: false,
};

// Environment-specific configuration
const getConfig = (): ApiClientConfig => ({
  baseURL: process.env.NEXT_PUBLIC_API_URL || defaultConfig.baseURL,
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  withCredentials: process.env.NEXT_PUBLIC_API_WITH_CREDENTIALS === 'true',
});
```

### Custom Headers

```typescript
const apiClient = new ApiClient({
  ...getConfig(),
  headers: {
    'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION,
    'X-Client-Platform': 'web',
  },
});
```

## Best Practices

1. **Error Handling**: Always handle both network and application errors
2. **Type Safety**: Use TypeScript interfaces for all API responses
3. **Token Management**: Handle token refresh automatically
4. **Request Tracking**: Use request IDs for debugging
5. **Caching**: Implement appropriate caching strategies
6. **Logging**: Log requests in development mode
7. **Testing**: Mock API calls in unit tests

## Future Enhancements

- **Request Retry Logic**: Automatic retry for failed requests
- **Offline Support**: Queue requests when offline
- **Upload Progress**: File upload progress tracking
- **WebSocket Integration**: Real-time updates
- **GraphQL Support**: GraphQL query support
- **Request Cancellation**: Cancel in-flight requests