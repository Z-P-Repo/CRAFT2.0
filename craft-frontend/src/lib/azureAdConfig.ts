import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// Azure AD configuration
const azureAdConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '',
    authority: process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY || '',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback',
    postLogoutRedirectUri: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(`MSAL Error: ${message}`);
            break;
          case 1: // Warning
            console.warn(`MSAL Warning: ${message}`);
            break;
          case 2: // Info
            console.info(`MSAL Info: ${message}`);
            break;
          case 3: // Verbose
            console.log(`MSAL Debug: ${message}`);
            break;
        }
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === 'development' ? 3 : 1,
    },
  },
};

// Check if Azure AD is configured
export const isAzureAdConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY
  );
};

// Create MSAL instance only if configured
export const msalInstance = isAzureAdConfigured() 
  ? new PublicClientApplication(azureAdConfig)
  : null;

// Login request configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// Graph API configuration
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

export default azureAdConfig;