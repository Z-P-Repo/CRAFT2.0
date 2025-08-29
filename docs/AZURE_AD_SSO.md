# Azure AD Single Sign-On (SSO) Integration

This document provides comprehensive instructions for setting up and configuring Azure AD SSO with the CRAFT 2.0 ABAC Permission System.

## Overview

The Azure AD SSO integration allows users to authenticate using their Microsoft/Azure Active Directory credentials instead of creating separate local accounts. This implementation supports:

- **OAuth 2.0/OpenID Connect** authentication flow
- **Automatic user provisioning** from Azure AD to local database
- **Role-based access control** with default `basic` role assignment
- **Hybrid authentication** (both local and Azure AD users supported)
- **Secure token management** with JWT tokens

## Prerequisites

Before setting up Azure AD SSO, ensure you have:

1. **Azure AD tenant** with admin privileges
2. **Application registration** permissions in Azure AD
3. **CRAFT 2.0** backend and frontend running locally or on a server
4. **Administrative access** to modify environment configurations

## Azure AD Setup

### Step 1: Register Application in Azure AD

1. **Navigate to Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com)
   - Sign in with your admin account

2. **Create App Registration**
   - Navigate to **Azure Active Directory** → **App registrations**
   - Click **"New registration"**
   - Fill in the details:
     - **Name**: `CRAFT Permission System`
     - **Supported account types**: `Accounts in this organizational directory only`
     - **Redirect URI**: `Web` → `http://localhost:3000/auth/callback` (for development)

3. **Configure Authentication**
   - Go to **Authentication** in your app registration
   - Under **Redirect URIs**, add:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
   - Under **Implicit grant and hybrid flows**, enable:
     - ✅ **Access tokens**
     - ✅ **ID tokens**
   - Set **Logout URL**: `http://localhost:3000/login`

4. **Generate Client Secret**
   - Go to **Certificates & secrets**
   - Click **"New client secret"**
   - Add description: `CRAFT Backend Secret`
   - Set expiration (recommended: 24 months)
   - **Copy the secret value** (you won't see it again!)

5. **Configure API Permissions**
   - Go to **API permissions**
   - Ensure these Microsoft Graph permissions are granted:
     - `openid` (delegated)
     - `profile` (delegated) 
     - `email` (delegated)
     - `User.Read` (delegated)
   - Click **"Grant admin consent"** if required

6. **Note Down Configuration Values**
   - **Application (client) ID**
   - **Directory (tenant) ID** 
   - **Client secret** (from step 4)

### Step 2: Configure Backend Environment

Update your backend `.env` file with Azure AD configuration:

```env
# Azure AD SSO Configuration
AZURE_AD_CLIENT_ID=your-application-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-directory-tenant-id
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Example:**
```env
AZURE_AD_CLIENT_ID=12345678-1234-1234-1234-123456789012
AZURE_AD_CLIENT_SECRET=abcdef~123456789012345678901234567890
AZURE_AD_TENANT_ID=87654321-4321-4321-4321-210987654321
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/87654321-4321-4321-4321-210987654321
AZURE_AD_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Step 3: Configure Frontend Environment

Update your frontend `.env.local` file:

```env
# Azure AD SSO Configuration
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-application-client-id
NEXT_PUBLIC_AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
```

**Example:**
```env
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=12345678-1234-1234-1234-123456789012
NEXT_PUBLIC_AZURE_AD_AUTHORITY=https://login.microsoftonline.com/87654321-4321-4321-4321-210987654321
```

## Configuration Verification

### Backend Configuration Check

Start your backend and check the configuration:

```bash
cd craft-backend
npm run dev
```

Visit `http://localhost:3001/api/v1/azure-ad/config` to verify Azure AD is enabled:

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "azuread"
  }
}
```

### Frontend Configuration Check

Start your frontend:

```bash
cd craft-frontend
npm run dev
```

Navigate to `http://localhost:3000/login` - you should see the **"Sign in with Microsoft"** button if Azure AD is properly configured.

## User Authentication Flow

### 1. User Initiates Login
- User clicks **"Sign in with Microsoft"** on login page
- Frontend redirects to Azure AD login

### 2. Azure AD Authentication
- User enters Microsoft credentials
- Azure AD validates user
- User consents to permissions (first time only)

### 3. Authorization Code Flow
- Azure AD redirects back with authorization code
- Backend exchanges code for access token
- Backend retrieves user profile from Microsoft Graph

### 4. Local User Provisioning
- Backend checks if user exists in local database
- If new user: creates account with `basic` role
- If existing user: updates profile information
- Sets `authProvider: 'azuread'` and `azureAdId`

### 5. JWT Token Generation
- Backend generates local JWT access token
- Returns user data and tokens to frontend
- User is authenticated and redirected to dashboard

## User Management

### Default Role Assignment
New Azure AD users are assigned the `basic` role by default. Administrators can change roles through the user management interface.

### User Profile Mapping
Azure AD profile fields are mapped to local user fields:

| Azure AD Field | Local User Field | Notes |
|----------------|------------------|-------|
| `mail` or `userPrincipalName` | `email` | Primary identifier |
| `displayName` | `name` | Full display name |
| `department` | `department` | Optional department |
| `id` | `azureAdId` | Azure AD unique identifier |

### Existing User Handling
If a local user already exists with the same email:
- Profile information is updated from Azure AD
- `authProvider` is set to `'azuread'`
- `azureAdId` is populated
- User can now login via Azure AD or local credentials

## API Endpoints

The Azure AD integration adds these API endpoints:

### `GET /api/v1/azure-ad/config`
Returns Azure AD configuration status.

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "azuread"
  }
}
```

### `GET /api/v1/azure-ad/auth-url`
Generates Azure AD authentication URL.

**Response:**
```json
{
  "success": true,
  "message": "Azure AD auth URL generated",
  "data": {
    "authUrl": "https://login.microsoftonline.com/...",
    "enabled": true
  }
}
```

### `GET /api/v1/azure-ad/callback?code=...`
Handles OAuth callback with authorization code.

**Response:**
```json
{
  "success": true,
  "message": "Azure AD authentication successful",
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token",
    "authProvider": "azuread"
  }
}
```

## Security Considerations

### Token Security
- Client secrets are stored securely in backend environment
- JWT tokens are generated locally for session management
- Azure AD tokens are not stored persistently

### CORS Configuration
Ensure your CORS settings allow the frontend domain:
```env
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### HTTPS in Production
Always use HTTPS in production:
- Update redirect URIs to use `https://`
- Configure secure cookie settings
- Update CORS origins to HTTPS URLs

## Troubleshooting

### Common Issues

#### 1. "Azure AD is not configured" Error
**Cause:** Missing or incorrect environment variables
**Solution:** 
- Verify all Azure AD environment variables are set
- Check `.env` files are loaded correctly
- Restart backend server after changes

#### 2. "Invalid redirect URI" Error
**Cause:** Redirect URI mismatch between app registration and environment
**Solution:**
- Ensure `AZURE_AD_REDIRECT_URI` matches app registration
- Check for HTTP vs HTTPS mismatches
- Verify port numbers are correct

#### 3. "Failed to authenticate with Azure AD" Error
**Cause:** Client secret expired or incorrect
**Solution:**
- Generate new client secret in Azure AD
- Update `AZURE_AD_CLIENT_SECRET` in environment
- Restart backend server

#### 4. Microsoft Button Not Showing
**Cause:** Frontend Azure AD configuration missing
**Solution:**
- Set `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` in frontend `.env.local`
- Set `NEXT_PUBLIC_AZURE_AD_AUTHORITY` correctly
- Restart frontend development server

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

Check backend logs for detailed authentication flow information.

## Production Deployment

### Environment Variables
Update production environment with:
- Production Azure AD app registration
- HTTPS redirect URIs
- Secure client secrets
- Production frontend URL

### Azure AD App Registration Updates
- Add production redirect URI
- Update logout URL
- Configure production CORS origins
- Review and update API permissions

### Security Checklist
- [ ] Client secrets are securely managed
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Debug logging is disabled
- [ ] Token expiration is appropriate
- [ ] Backup authentication method available

## Support

For additional support:
- Check Azure AD audit logs for authentication failures
- Review CRAFT system logs for backend errors
- Test with a minimal Azure AD setup first
- Consult Microsoft Graph documentation for API issues

---

**Last Updated:** August 29, 2025  
**Version:** 1.1.0  
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*