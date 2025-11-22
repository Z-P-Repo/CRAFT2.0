# Azure AD SSO Setup Guide

## Current Configuration Status

✅ **Frontend credentials added** (`craft-frontend/.env.local`)
✅ **Frontend config updated** to support new variable names
⏳ **Backend credentials needed** (`craft-backend/.env`)

---

## Backend Configuration Required

Add these lines to `/craft-backend/.env`:

```bash
# Azure AD SSO Configuration
AZURE_AD_CLIENT_ID=1i0JRz3S5V0fCNMQSEweW9zFvkCOZxx8
AZURE_AD_CLIENT_SECRET=your-client-secret-here
AZURE_AD_TENANT_ID=nEalYAQGVANDj89X2Gv5sWpxhDyyKdHTWt7SBTZmVXTh0-vX-QjTRzNeKPzfZFHd
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/nEalYAQGVANDj89X2Gv5sWpxhDyyKdHTWt7SBTZmVXTh0-vX-QjTRzNeKPzfZFHd
AZURE_AD_REDIRECT_URI=http://localhost:3000/auth/callback
```

**IMPORTANT:** Replace `your-client-secret-here` with your actual Azure AD Client Secret.

---

## Where to Find Your Client Secret

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app registration
4. Go to **Certificates & secrets**
5. Under **Client secrets**, click **+ New client secret**
6. Add a description and select expiration period
7. Click **Add**
8. **COPY THE VALUE IMMEDIATELY** (you won't be able to see it again)
9. Paste the value in the backend `.env` file

---

## Azure AD App Registration Checklist

Ensure your Azure AD app has these settings:

### Redirect URIs
- ✅ Development: `http://localhost:3000/auth/callback`
- ⏳ Production: `https://your-domain.com/auth/callback` (add when deploying)

### API Permissions
Required permissions:
- ✅ `User.Read` (Microsoft Graph)
- ✅ `openid`
- ✅ `profile`
- ✅ `email`

### Supported Account Types
- Recommended: **Accounts in this organizational directory only** (Single tenant)
- Or: **Accounts in any organizational directory** (Multi-tenant)

---

## Testing SSO

After adding credentials:

1. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd craft-backend
   npm run dev

   # Terminal 2 - Frontend
   cd craft-frontend
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3000/login
   ```

3. **You should see:**
   - Email/Password login form (existing)
   - Divider line
   - **"Sign in with Microsoft"** button (new!)

4. **Test SSO:**
   - Click "Sign in with Microsoft"
   - Microsoft login page opens
   - Enter your Microsoft credentials
   - Redirects back to CRAFT
   - **Auto-creates user account** if first login
   - Redirects to dashboard

---

## Auto-User Registration

When a user logs in via SSO for the first time:

1. System checks if user email exists in database
2. If not, creates new user with:
   - **Name**: From Azure AD profile
   - **Email**: From Azure AD profile
   - **Role**: `basic` (default)
   - **Auth Provider**: `azuread`
3. Issues JWT tokens
4. Redirects to dashboard

Admins can later change the user's role to `admin` or `super_admin` from the Users page.

---

## Troubleshooting

### "Sign in with Microsoft" button not showing
- Check frontend `.env.local` has Azure AD variables
- Restart frontend server
- Clear browser cache

### "Azure AD is not configured" error
- Check backend `.env` has all Azure AD variables
- Verify Client Secret is correct
- Restart backend server

### Redirect URI mismatch
- Ensure redirect URI in Azure Portal matches exactly:
  - `http://localhost:3000/auth/callback` (development)
- Check for trailing slashes (should NOT have one)

### Token validation failed
- Verify Tenant ID is correct
- Check Client ID matches Azure Portal
- Ensure Client Secret hasn't expired

---

## Production Deployment

When deploying to production:

1. Update redirect URI in Azure Portal:
   - Add: `https://your-domain.com/auth/callback`

2. Update environment variables:
   ```bash
   # Frontend
   NEXT_PUBLIC_AZURE_REDIRECT_URI=https://your-domain.com/auth/callback

   # Backend
   AZURE_AD_REDIRECT_URI=https://your-domain.com/auth/callback
   ```

3. Ensure HTTPS is enabled (required by Azure AD)

---

## Security Best Practices

✅ **Client Secret** stored only in backend (never in frontend)
✅ **HTTP-only cookies** for tokens
✅ **Secure flag** enabled in production
✅ **Token expiration** enforced (24h access, 7d refresh)
✅ **HTTPS required** in production

---

**Last Updated:** January 14, 2025
**CRAFT Version:** 1.3.22
