# Azure AD SSO Troubleshooting - "Sign in with Microsoft" Button Missing

## Issue
The "Sign in with Microsoft" button is not showing on the login page.

## Root Cause
The button only appears when `azureAdEnabled` state is `true`. This requires:
1. ✅ Frontend environment variables are loaded
2. ✅ MSAL instance is created successfully
3. ⏳ Backend returns `enabled: true` from `/azure-ad/config` endpoint

## Quick Fixes

### 1. Restart Frontend Dev Server (MOST COMMON FIX)

Environment variables in Next.js are loaded at build/startup time.

```bash
# Stop the frontend server (Ctrl+C)
# Then restart:
cd craft-frontend
npm run dev
```

### 2. Verify Frontend Environment Variables

Open browser console on login page and check:

```javascript
// Should return your client ID
console.log(process.env.NEXT_PUBLIC_AZURE_CLIENT_ID)

// Should return your tenant ID
console.log(process.env.NEXT_PUBLIC_AZURE_TENANT_ID)

// Should return the redirect URI
console.log(process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI)
```

If these return `undefined`, the .env.local file isn't being loaded.

### 3. Bypass Backend Check (Temporary Test)

To test if it's a backend issue, temporarily show the button regardless:

**In `/craft-frontend/src/app/login/page.tsx` line 200:**

```typescript
// Change this:
{azureAdEnabled && (

// To this (temporary):
{(azureAdEnabled || true) && (
```

This will force the button to show even if backend isn't configured.

**IMPORTANT**: Revert this after testing!

## Step-by-Step Debugging

### Step 1: Check Frontend Config File

Run this in your browser console on the login page:

```javascript
// This should log the Azure AD configuration
localStorage.clear()
location.reload()
```

### Step 2: Check Network Tab

1. Open browser DevTools → Network tab
2. Refresh login page
3. Look for a request to `/api/v1/azure-ad/config`
4. Check the response:
   - ✅ Should return: `{ success: true, data: { enabled: true } }`
   - ❌ Currently returns: `{ success: true, data: { enabled: false } }`

### Step 3: Verify Backend Environment

```bash
# Check if backend has the variables
grep AZURE_AD /craft-backend/.env | grep -v "^#"

# Should show:
# AZURE_AD_CLIENT_ID=1i0JRz3S5V0fCNMQSEweW9zFvkCOZxx8
# AZURE_AD_CLIENT_SECRET=<your-actual-secret>
# AZURE_AD_TENANT_ID=nEalYAQGVANDj89X2Gv5sWpxhDyyKdHTWt7SBTZmVXTh0-vX-QjTRzNeKPzfZFHd
# etc.
```

## Most Likely Solution

The frontend dev server is running with OLD environment variables (before you added Azure AD config).

**Fix:**
1. Stop frontend: `Ctrl+C` in the terminal running `npm run dev`
2. Restart frontend: `npm run dev`
3. Refresh browser: `Ctrl+R` or `Cmd+R`
4. Button should appear!

## Verification Checklist

- [ ] Frontend .env.local has NEXT_PUBLIC_AZURE_CLIENT_ID
- [ ] Frontend .env.local has NEXT_PUBLIC_AZURE_TENANT_ID
- [ ] Frontend .env.local has NEXT_PUBLIC_AZURE_REDIRECT_URI
- [ ] Frontend dev server was restarted after adding variables
- [ ] Backend .env has AZURE_AD_CLIENT_ID
- [ ] Backend .env has AZURE_AD_CLIENT_SECRET (not placeholder)
- [ ] Backend .env has AZURE_AD_TENANT_ID
- [ ] Backend dev server was restarted after adding variables
- [ ] Browser cache cleared / hard refresh done

## Expected Behavior

When everything is configured:

1. Login page loads
2. Frontend checks `azureAdService.isConfigured()` → returns `true`
3. Frontend calls `/api/v1/azure-ad/config`
4. Backend returns `{ enabled: true }` (if client secret is valid)
5. `azureAdEnabled` state is set to `true`
6. "Sign in with Microsoft" button appears!

## Current Status Check

Run this command to check current config:

```bash
# Frontend check
echo "Frontend Config:"
grep "NEXT_PUBLIC_AZURE" /Users/vimalkumar/Documents/claude/Craft\ 2.0/craft-frontend/.env.local

# Backend check
echo -e "\nBackend Config:"
grep "AZURE_AD" /Users/vimalkumar/Documents/claude/Craft\ 2.0/craft-backend/.env | head -5
```

## If Button Still Doesn't Appear

The issue is likely one of these:

1. **Environment variables not loaded** → Restart dev server
2. **Backend returns enabled: false** → Check client secret is not placeholder
3. **MSAL initialization failed** → Check browser console for errors
4. **Frontend config check failing** → Verify variable names match exactly

---

**Next Step: Please restart your frontend dev server and try again!**
