import { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * Azure AD MSAL Configuration
 *
 * To configure your Azure AD app:
 * 1. Go to Azure Portal > Azure Active Directory > App registrations
 * 2. Create a new app registration or use existing
 * 3. Copy Client ID and Tenant ID
 * 4. Add redirect URI: http://localhost:3000/auth/callback (development)
 * 5. Add redirect URI: https://your-domain.com/auth/callback (production)
 * 6. Set these values in .env.local:
 *    NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
 *    NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
 *    NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
 */

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'http://localhost:3000/login',
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set to true for IE 11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error(message);
            return;
          case 1: // LogLevel.Warning
            console.warn(message);
            return;
          case 2: // LogLevel.Info
            console.info(message);
            return;
          case 3: // LogLevel.Verbose
            console.debug(message);
            return;
        }
      },
    },
  },
};

// Scopes for login request
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid'],
};

// Scopes for token request
export const tokenRequest = {
  scopes: ['User.Read'],
};

/**
 * Check if MSAL is configured
 */
export const isMsalConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_TENANT_ID
  );
};
