import { isAzureAdConfigured, msalInstance, loginRequest, graphConfig } from '../azureAdConfig';

// Mock @azure/msal-browser
jest.mock('@azure/msal-browser', () => ({
  Configuration: jest.fn(),
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    getAllAccounts: jest.fn(),
    loginRedirect: jest.fn(),
    loginPopup: jest.fn(),
    logoutRedirect: jest.fn(),
    handleRedirectPromise: jest.fn(),
    acquireTokenSilent: jest.fn(),
  })),
}));

describe('azureAdConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isAzureAdConfigured', () => {
    it('returns true when both client ID and authority are configured', () => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';

      const { isAzureAdConfigured } = require('../azureAdConfig');
      expect(isAzureAdConfigured()).toBe(true);
    });

    it('returns false when client ID is missing', () => {
      delete process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';

      const { isAzureAdConfigured } = require('../azureAdConfig');
      expect(isAzureAdConfigured()).toBe(false);
    });

    it('returns false when authority is missing', () => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      delete process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY;

      const { isAzureAdConfigured } = require('../azureAdConfig');
      expect(isAzureAdConfigured()).toBe(false);
    });

    it('returns false when both are missing', () => {
      delete process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY;

      const { isAzureAdConfigured } = require('../azureAdConfig');
      expect(isAzureAdConfigured()).toBe(false);
    });

    it('returns false when both are empty strings', () => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = '';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = '';

      const { isAzureAdConfigured } = require('../azureAdConfig');
      expect(isAzureAdConfigured()).toBe(false);
    });
  });

  describe('msalInstance', () => {
    it('creates MSAL instance when Azure AD is configured', () => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';

      const { PublicClientApplication } = require('@azure/msal-browser');
      const { msalInstance } = require('../azureAdConfig');

      expect(PublicClientApplication).toHaveBeenCalled();
      expect(msalInstance).toBeTruthy();
    });

    it('returns null when Azure AD is not configured', () => {
      delete process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY;

      const { PublicClientApplication } = require('@azure/msal-browser');
      const { msalInstance } = require('../azureAdConfig');

      expect(msalInstance).toBeNull();
    });
  });

  describe('Configuration Object', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';
    });

    it('creates correct auth configuration', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.auth.clientId).toBe('test-client-id');
      expect(configCall.auth.authority).toBe('https://login.microsoftonline.com/tenant-id');
    });

    it('sets correct redirect URIs with window', () => {
      const mockLocation = {
        origin: 'https://example.com'
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.auth.redirectUri).toBe('https://example.com/auth/callback');
      expect(configCall.auth.postLogoutRedirectUri).toBe('https://example.com/login');
    });

    it('sets fallback redirect URIs without window', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.auth.redirectUri).toBe('/auth/callback');
      expect(configCall.auth.postLogoutRedirectUri).toBe('/login');

      global.window = originalWindow;
    });

    it('sets correct cache configuration', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.cache.cacheLocation).toBe('sessionStorage');
      expect(configCall.cache.storeAuthStateInCookie).toBe(false);
    });

    it('sets correct logger configuration for development', () => {
      process.env.NODE_ENV = 'development';

      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.system.loggerOptions.piiLoggingEnabled).toBe(false);
      expect(configCall.system.loggerOptions.logLevel).toBe(3);
    });

    it('sets correct logger configuration for production', () => {
      process.env.NODE_ENV = 'production';

      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      
      expect(configCall.system.loggerOptions.logLevel).toBe(1);
    });
  });

  describe('Logger Callback', () => {
    let consoleSpy: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';
      
      consoleSpy = {
        error: jest.spyOn(console, 'error').mockImplementation(() => {}),
        warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
        info: jest.spyOn(console, 'info').mockImplementation(() => {}),
        log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    it('handles error level logging', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      const loggerCallback = configCall.system.loggerOptions.loggerCallback;
      
      loggerCallback(0, 'Test error message', false);
      expect(consoleSpy.error).toHaveBeenCalledWith('MSAL Error: Test error message');
    });

    it('handles warning level logging', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      const loggerCallback = configCall.system.loggerOptions.loggerCallback;
      
      loggerCallback(1, 'Test warning message', false);
      expect(consoleSpy.warn).toHaveBeenCalledWith('MSAL Warning: Test warning message');
    });

    it('handles info level logging', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      const loggerCallback = configCall.system.loggerOptions.loggerCallback;
      
      loggerCallback(2, 'Test info message', false);
      expect(consoleSpy.info).toHaveBeenCalledWith('MSAL Info: Test info message');
    });

    it('handles verbose level logging', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      const loggerCallback = configCall.system.loggerOptions.loggerCallback;
      
      loggerCallback(3, 'Test debug message', false);
      expect(consoleSpy.log).toHaveBeenCalledWith('MSAL Debug: Test debug message');
    });

    it('ignores PII messages', () => {
      const { PublicClientApplication } = require('@azure/msal-browser');
      require('../azureAdConfig');

      const configCall = PublicClientApplication.mock.calls[0][0];
      const loggerCallback = configCall.system.loggerOptions.loggerCallback;
      
      loggerCallback(0, 'Test error with PII', true);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Static Exports', () => {
    it('exports loginRequest configuration', () => {
      const { loginRequest } = require('../azureAdConfig');
      
      expect(loginRequest).toEqual({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
      });
    });

    it('exports graphConfig configuration', () => {
      const { graphConfig } = require('../azureAdConfig');
      
      expect(graphConfig).toEqual({
        graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
      });
    });

    it('exports azureAdConfig as default', () => {
      process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY = 'https://login.microsoftonline.com/tenant-id';

      const azureAdConfigDefault = require('../azureAdConfig').default;
      expect(azureAdConfigDefault).toBeDefined();
      expect(azureAdConfigDefault.auth).toBeDefined();
      expect(azureAdConfigDefault.cache).toBeDefined();
      expect(azureAdConfigDefault.system).toBeDefined();
    });
  });
});