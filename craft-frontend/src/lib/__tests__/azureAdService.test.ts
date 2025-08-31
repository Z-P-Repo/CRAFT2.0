import { azureAdService } from '../azureAdService';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

// Mock the azureAdConfig module
jest.mock('../azureAdConfig', () => ({
  msalInstance: null,
  loginRequest: { scopes: ['openid', 'profile', 'email', 'User.Read'] },
  isAzureAdConfigured: jest.fn(() => false),
}));

// Mock the api module
jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// Mock MSAL
const mockMsalInstance = {
  initialize: jest.fn(),
  loginRedirect: jest.fn(),
  loginPopup: jest.fn(),
  handleRedirectPromise: jest.fn(),
  getAllAccounts: jest.fn(),
  logoutRedirect: jest.fn(),
  acquireTokenSilent: jest.fn(),
};

describe('AzureAdService', () => {
  const mockAccount: AccountInfo = {
    homeAccountId: 'test-home-account-id',
    localAccountId: 'test-local-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthResult: AuthenticationResult = {
    uniqueId: 'test-unique-id',
    tenantId: 'test-tenant-id',
    scopes: ['openid', 'profile'],
    account: mockAccount,
    idToken: 'test-id-token',
    idTokenClaims: {},
    accessToken: 'test-access-token',
    fromCache: false,
    expiresOn: new Date(),
    correlationId: 'test-correlation-id',
    extExpiresOn: new Date(),
    familyId: '',
    tokenType: 'Bearer',
    state: '',
    cloudGraphHostName: '',
    msGraphHost: '',
    fromNativeBroker: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service instance state
    (azureAdService as any).msalInstance = null;
  });

  describe('Configuration Check', () => {
    it('returns false when not configured', () => {
      const { isAzureAdConfigured } = require('../azureAdConfig');
      isAzureAdConfigured.mockReturnValue(false);

      expect(azureAdService.isConfigured()).toBe(false);
    });

    it('returns true when configured with MSAL instance', () => {
      const { isAzureAdConfigured } = require('../azureAdConfig');
      isAzureAdConfigured.mockReturnValue(true);
      
      (azureAdService as any).msalInstance = mockMsalInstance;
      
      expect(azureAdService.isConfigured()).toBe(true);
    });
  });

  describe('Initialize', () => {
    it('returns early when MSAL instance is null', async () => {
      await expect(azureAdService.initialize()).resolves.toBeUndefined();
      expect(mockMsalInstance.initialize).not.toHaveBeenCalled();
    });

    it('initializes MSAL successfully', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await azureAdService.initialize();

      expect(mockMsalInstance.initialize).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('MSAL initialized successfully');
      
      consoleSpy.mockRestore();
    });

    it('handles initialization error', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;

      const initError = new Error('Initialization failed');
      mockMsalInstance.initialize.mockRejectedValue(initError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.initialize()).rejects.toThrow('Initialization failed');
      expect(consoleSpy).toHaveBeenCalledWith('MSAL initialization failed:', initError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Login Methods', () => {
    beforeEach(() => {
      (azureAdService as any).msalInstance = mockMsalInstance;
    });

    it('handles login redirect successfully', async () => {
      await azureAdService.loginRedirect();

      expect(mockMsalInstance.loginRedirect).toHaveBeenCalledWith({
        scopes: ['openid', 'profile', 'email', 'User.Read']
      });
    });

    it('throws error for login redirect when not configured', async () => {
      (azureAdService as any).msalInstance = null;

      await expect(azureAdService.loginRedirect()).rejects.toThrow('Azure AD is not configured');
    });

    it('handles login redirect error', async () => {
      const loginError = new Error('Login redirect failed');
      mockMsalInstance.loginRedirect.mockRejectedValue(loginError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.loginRedirect()).rejects.toThrow('Login redirect failed');
      expect(consoleSpy).toHaveBeenCalledWith('Azure AD login redirect failed:', loginError);
      
      consoleSpy.mockRestore();
    });

    it('handles login popup successfully', async () => {
      mockMsalInstance.loginPopup.mockResolvedValue(mockAuthResult);

      const result = await azureAdService.loginPopup();

      expect(mockMsalInstance.loginPopup).toHaveBeenCalledWith({
        scopes: ['openid', 'profile', 'email', 'User.Read']
      });
      expect(result).toBe(mockAuthResult);
    });

    it('throws error for login popup when not configured', async () => {
      (azureAdService as any).msalInstance = null;

      await expect(azureAdService.loginPopup()).rejects.toThrow('Azure AD is not configured');
    });

    it('handles login popup error', async () => {
      const loginError = new Error('Login popup failed');
      mockMsalInstance.loginPopup.mockRejectedValue(loginError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.loginPopup()).rejects.toThrow('Login popup failed');
      expect(consoleSpy).toHaveBeenCalledWith('Azure AD login popup failed:', loginError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Redirect Promise Handling', () => {
    it('returns null when MSAL instance is null', async () => {
      const result = await azureAdService.handleRedirectPromise();
      expect(result).toBeNull();
    });

    it('handles redirect promise successfully', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.handleRedirectPromise.mockResolvedValue(mockAuthResult);

      const result = await azureAdService.handleRedirectPromise();

      expect(mockMsalInstance.handleRedirectPromise).toHaveBeenCalled();
      expect(result).toBe(mockAuthResult);
    });

    it('handles redirect promise returning null', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);

      const result = await azureAdService.handleRedirectPromise();

      expect(result).toBeNull();
    });

    it('handles redirect promise error', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      const redirectError = new Error('Redirect promise failed');
      mockMsalInstance.handleRedirectPromise.mockRejectedValue(redirectError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.handleRedirectPromise()).rejects.toThrow('Redirect promise failed');
      expect(consoleSpy).toHaveBeenCalledWith('Azure AD redirect promise handling failed:', redirectError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Account Management', () => {
    it('returns empty array when MSAL instance is null', () => {
      const result = azureAdService.getAccounts();
      expect(result).toEqual([]);
    });

    it('returns accounts from MSAL instance', () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      const accounts = [mockAccount];
      mockMsalInstance.getAllAccounts.mockReturnValue(accounts);

      const result = azureAdService.getAccounts();

      expect(mockMsalInstance.getAllAccounts).toHaveBeenCalled();
      expect(result).toBe(accounts);
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true,
      });
    });

    it('returns early when MSAL instance is null', async () => {
      await expect(azureAdService.logout()).resolves.toBeUndefined();
      expect(mockMsalInstance.logoutRedirect).not.toHaveBeenCalled();
    });

    it('handles logout successfully', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;

      await azureAdService.logout();

      expect(mockMsalInstance.logoutRedirect).toHaveBeenCalledWith({
        postLogoutRedirectUri: 'https://example.com/login',
      });
    });

    it('handles logout error', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      const logoutError = new Error('Logout failed');
      mockMsalInstance.logoutRedirect.mockRejectedValue(logoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.logout()).rejects.toThrow('Logout failed');
      expect(consoleSpy).toHaveBeenCalledWith('Azure AD logout failed:', logoutError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Access Token', () => {
    it('returns null when MSAL instance is null', async () => {
      const result = await azureAdService.getAccessToken();
      expect(result).toBeNull();
    });

    it('returns null when no accounts', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      const result = await azureAdService.getAccessToken();
      expect(result).toBeNull();
    });

    it('returns null when account is null', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.getAllAccounts.mockReturnValue([null]);

      const result = await azureAdService.getAccessToken();
      expect(result).toBeNull();
    });

    it('acquires token silently successfully', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'silent-access-token',
      });

      const result = await azureAdService.getAccessToken();

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        account: mockAccount,
      });
      expect(result).toBe('silent-access-token');
    });

    it('handles token acquisition error', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      const tokenError = new Error('Token acquisition failed');
      mockMsalInstance.acquireTokenSilent.mockRejectedValue(tokenError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await azureAdService.getAccessToken();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to acquire token silently:', tokenError);
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Backend Integration', () => {
    let mockApiClient: any;

    beforeEach(() => {
      const { apiClient } = require('../api');
      mockApiClient = apiClient;
    });

    it('authenticates with backend successfully', async () => {
      const backendResponse = { data: { token: 'backend-token', user: { id: 1 } } };
      mockApiClient.get.mockResolvedValue(backendResponse);

      const result = await azureAdService.authenticateWithBackend('auth-code-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/azure-ad/callback?code=auth-code-123');
      expect(result).toBe(backendResponse.data);
    });

    it('handles backend authentication error', async () => {
      const authError = new Error('Backend auth failed');
      mockApiClient.get.mockRejectedValue(authError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(azureAdService.authenticateWithBackend('auth-code-123')).rejects.toThrow('Backend auth failed');
      expect(consoleSpy).toHaveBeenCalledWith('Backend authentication failed:', authError);
      
      consoleSpy.mockRestore();
    });

    it('encodes special characters in auth code', async () => {
      mockApiClient.get.mockResolvedValue({ data: { token: 'token' } });

      await azureAdService.authenticateWithBackend('code+with&special=chars');

      expect(mockApiClient.get).toHaveBeenCalledWith('/azure-ad/callback?code=code%2Bwith%26special%3Dchars');
    });

    it('gets backend config successfully', async () => {
      const configResponse = { data: { data: { enabled: true } } };
      mockApiClient.get.mockResolvedValue(configResponse);

      const result = await azureAdService.getBackendConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/azure-ad/config');
      expect(result).toEqual({ enabled: true });
    });

    it('handles backend config error', async () => {
      const configError = new Error('Config fetch failed');
      mockApiClient.get.mockRejectedValue(configError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await azureAdService.getBackendConfig();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get Azure AD config from backend:', configError);
      expect(result).toEqual({ enabled: false });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Service Exports', () => {
    it('exports azureAdService instance', () => {
      expect(azureAdService).toBeDefined();
      expect(typeof azureAdService.isConfigured).toBe('function');
      expect(typeof azureAdService.initialize).toBe('function');
      expect(typeof azureAdService.loginRedirect).toBe('function');
      expect(typeof azureAdService.loginPopup).toBe('function');
      expect(typeof azureAdService.handleRedirectPromise).toBe('function');
      expect(typeof azureAdService.getAccounts).toBe('function');
      expect(typeof azureAdService.logout).toBe('function');
      expect(typeof azureAdService.getAccessToken).toBe('function');
      expect(typeof azureAdService.authenticateWithBackend).toBe('function');
      expect(typeof azureAdService.getBackendConfig).toBe('function');
    });

    it('exports azureAdService as default', () => {
      const azureAdServiceDefault = require('../azureAdService').default;
      expect(azureAdServiceDefault).toBeDefined();
      expect(azureAdServiceDefault).toBe(azureAdService);
    });
  });

  describe('Complete Flow Testing', () => {
    it('handles complete authentication flow', async () => {
      (azureAdService as any).msalInstance = mockMsalInstance;
      
      // Reset mocks to avoid interference
      mockMsalInstance.initialize.mockResolvedValue(undefined);
      
      // Test initialization
      await azureAdService.initialize();
      expect(mockMsalInstance.initialize).toHaveBeenCalled();
      
      // Test getting accounts
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      const accounts = azureAdService.getAccounts();
      expect(accounts).toEqual([mockAccount]);
      
      // Test getting access token
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'access-token',
      });
      const token = await azureAdService.getAccessToken();
      expect(token).toBe('access-token');
    });

    it('handles all methods when not configured', async () => {
      // Service starts with null msalInstance
      expect(azureAdService.isConfigured()).toBe(false);
      await expect(azureAdService.initialize()).resolves.toBeUndefined();
      expect(azureAdService.getAccounts()).toEqual([]);
      await expect(azureAdService.logout()).resolves.toBeUndefined();
      expect(await azureAdService.getAccessToken()).toBeNull();
      expect(await azureAdService.handleRedirectPromise()).toBeNull();
    });
  });
});