import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalInstance, loginRequest, isAzureAdConfigured } from './azureAdConfig';
import { apiClient } from './api';

class AzureAdService {
  private msalInstance: PublicClientApplication | null;

  constructor() {
    this.msalInstance = msalInstance;
  }

  public isConfigured(): boolean {
    return isAzureAdConfigured() && this.msalInstance !== null;
  }

  public async initialize(): Promise<void> {
    if (!this.msalInstance) {
      return;
    }

    try {
      await this.msalInstance.initialize();
      console.log('MSAL initialized successfully');
    } catch (error) {
      console.error('MSAL initialization failed:', error);
      throw error;
    }
  }

  public async loginRedirect(): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('Azure AD is not configured');
    }

    try {
      await this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Azure AD login redirect failed:', error);
      throw error;
    }
  }

  public async loginPopup(): Promise<AuthenticationResult> {
    if (!this.msalInstance) {
      throw new Error('Azure AD is not configured');
    }

    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      return response;
    } catch (error) {
      console.error('Azure AD login popup failed:', error);
      throw error;
    }
  }

  public async handleRedirectPromise(): Promise<AuthenticationResult | null> {
    if (!this.msalInstance) {
      return null;
    }

    try {
      const response = await this.msalInstance.handleRedirectPromise();
      return response;
    } catch (error) {
      console.error('Azure AD redirect promise handling failed:', error);
      throw error;
    }
  }

  public getAccounts(): AccountInfo[] {
    if (!this.msalInstance) {
      return [];
    }

    return this.msalInstance.getAllAccounts();
  }

  public async logout(): Promise<void> {
    if (!this.msalInstance) {
      return;
    }

    try {
      await this.msalInstance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin + '/login',
      });
    } catch (error) {
      console.error('Azure AD logout failed:', error);
      throw error;
    }
  }

  public async getAccessToken(): Promise<string | null> {
    if (!this.msalInstance) {
      return null;
    }

    const accounts = this.getAccounts();
    if (accounts.length === 0) {
      return null;
    }

    try {
      const account = accounts[0];
      if (!account) {
        return null;
      }
      
      const silentRequest = {
        ...loginRequest,
        account,
      };
      
      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token silently:', error);
      return null;
    }
  }

  public async authenticateWithBackend(code: string): Promise<any> {
    try {
      const response = await apiClient.get(`/azure-ad/callback?code=${encodeURIComponent(code)}`);
      return response.data;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw error;
    }
  }

  public async getBackendConfig(): Promise<{ enabled: boolean }> {
    try {
      const response = await apiClient.get('/azure-ad/config');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get Azure AD config from backend:', error);
      return { enabled: false };
    }
  }
}

export const azureAdService = new AzureAdService();
export default azureAdService;