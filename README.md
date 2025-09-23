# CRAFT 2.0 - ABAC Permission System

A comprehensive Attribute-Based Access Control (ABAC) permission system built with Next.js frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Z-P-Repo/CRAFT2.0.git
   cd CRAFT2.0
   ```

2. **Backend Setup**
   ```bash
   cd craft-backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd craft-frontend
   npm install
   cp .env.local.example .env.local
   # Configure your environment variables
   npm run dev
   ```

### Quick Commands

- **Build & Fix Errors**: When you prompt "build", it means fix all build errors for both frontend and backend:
  ```bash
  # This command will:
  # 1. Check and fix TypeScript errors in both projects
  # 2. Resolve compilation issues
  # 3. Fix linting errors
  # 4. Ensure both projects build successfully
  build
  ```

- **Commit and Push**: After making changes, simply run any of these:
  ```bash
  # Option 1: Using the script directly
  ./commit-push.sh

  # Option 2: Using npm scripts (after running npm install)
  npm run commit-push
  npm run commit
  npm run push

  # Option 3: With custom message
  ./commit-push.sh "Your custom commit message"

  # Option 4: Quick command - just type "push"
  push
  ```

- **Development**: Start both frontend and backend:
  ```bash
  npm run dev
  ```

- **Install Dependencies**: Install all dependencies for both projects:
  ```bash
  npm run install-all
  ```

## 📁 Project Structure

```
CRAFT2.0/
├── craft-backend/          # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models (including Workspace, Application, Environment)
│   │   ├── routes/         # API routes (including hierarchical routes)
│   │   ├── middleware/     # Authentication & validation
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── docs/               # Backend documentation
├── craft-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages (including Settings, Workspaces, and all ABAC pages)
│   │   │   ├── workspaces/ # Workspace management pages with CRUD operations
│   │   │   ├── policies/   # Policy management with 5-step creation wizard
│   │   │   ├── activity/   # Activity monitoring and audit logs
│   │   │   └── auth/       # Azure AD authentication callback
│   │   ├── components/     # Reusable components (including WorkspaceSwitcher)
│   │   ├── contexts/       # React contexts (WorkspaceContext, AuthContext)
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript types
│   └── docs/               # Frontend documentation
└── README.md              # This file
```

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-provider Authentication**: Local accounts and Azure AD Single Sign-On (SSO)
- **JWT-based authentication** with refresh tokens
- **Azure AD SSO Integration**: OAuth 2.0/OpenID Connect with automatic user provisioning
- **Three-tier role-based access control** (Super Admin, Admin, Basic)
- **User registration** with automatic Basic role assignment  
- **Role management** with hierarchical permissions (only Admin/Super Admin can change roles)
- **Basic users** have view-only access to all system entities
- **Admin/Super Admin** have full CRUD access to all entities
- **Secure password hashing** with bcrypt
- **Token validation** and automatic refresh
- **Hybrid authentication** supporting both local and Azure AD users

### 📊 Dashboard
- Modern, responsive dashboard with Material-UI
- Collapsible sidebar navigation
- Real-time statistics and analytics
- Mobile-friendly responsive design

### 🏢 Hierarchical Workspace Architecture
- **Workspace Management**: Multi-tenant architecture supporting multiple organizations with full workspace context management
- **Application Management**: Organize projects and services within workspaces with seamless application switching
- **Environment Management**: Manage deployment stages (development, testing, staging, production) with environment-specific configurations
- **Unified Settings**: Single-page setup wizard for creating complete workspace hierarchies with step-by-step guidance
- **Workspace Switching**: Dynamic workspace and application selection with comprehensive context awareness and real-time updates
- **Context Providers**: Comprehensive React context system for workspace state management integrated with authentication flow

### 🏗️ ABAC Components
- **Policies**: Define access control rules with enhanced 5-step wizard and separated resource attribute selection (view-only access for Basic users)
- **Subjects**: Manage users, groups, roles with comprehensive attributes and real-time policy count tracking (view-only access for Basic users)
- **Resources**: Protected resources and assets with attribute support and policy dependency visualization (view-only access for Basic users)
- **Actions**: Operations that can be performed with categorization and policy usage tracking (view-only access for Basic users)
- **Attributes**: Contextual information with conditional scope selection for subjects/resources, multi-select dropdowns, and category filtering (view-only access for Basic users)
- **Users**: Complete user management with three-tier role system and role change restrictions

### 📋 Policy Management
- **Enhanced Step-by-step Creation**: 5-step wizard for policy creation with separated Action & Resource selection
- **Resource Attribute Selection**: Dedicated resource attribute selection interface matching subject selection pattern
- **Dedicated View/Edit Pages**: Full-page policy management instead of modals
- **Advanced Filtering**: Search, filter by status/effect, and sorting
- **Bulk Operations**: Select and delete multiple policies
- **Human-readable Rules**: Natural language policy display
- **Comprehensive Pagination**: Full pagination support across all entities
- **Policy Dependency Tracking**: Real-time policy count display across all entity management pages with consistent ID-based entity mapping
- **Advanced API Optimization**: Multiple API call prevention with intelligent request batching and 300ms search debouncing
- **Request Deduplication**: Smart API client preventing duplicate requests and optimizing network performance
- **Enhanced Boolean Attributes**: Improved display and handling of boolean attribute types with better visual feedback
- **Rate Limiting Protection**: Built-in API rate limiting to prevent 429 errors and server overload with exponential backoff
- **Deletion Protection**: Prevents deletion of entities currently referenced in active policies with user-friendly error messages
- **Schema Consistency**: Fixed entity-policy mapping to ensure accurate policy counts and deletion protection
- **Standardized Delete Modals**: Clean, professional delete confirmation dialogs with close icons and consistent design across all modules
- **Local State Management**: Enhanced error handling and recovery mechanisms for better user experience

### 🧪 Policy Testing
- Interactive policy evaluation tool
- Test access scenarios in real-time
- Debug policy decisions
- Simulate different contexts

### 🔧 Technical Stack
- **Frontend**: Next.js 15.4.6, React 19, Material-UI v7, TypeScript 5.5
- **Backend**: Node.js 18+, Express 4.19, MongoDB 7.0+, Mongoose 8.5, TypeScript 5.5
- **Authentication**: JWT, bcrypt, Azure AD SSO with MSAL, comprehensive context integration
- **Testing**: Jest 29, React Testing Library 16 with comprehensive test coverage including performance tests
- **Performance**: Advanced search debouncing (300ms), request deduplication, API call optimization, intelligent request batching
- **Security**: Enhanced rate limiting, request throttling, 429 error handling with exponential backoff
- **Architecture**: Hierarchical workspace system with multi-tenant support and comprehensive context management
- **Documentation**: Comprehensive markdown docs with automated maintenance

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch** (optional):
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to the codebase

3. **Commit and push** (this will push to the current branch):
   ```bash
   git add .
   git commit -m "Add your descriptive commit message"
   git push origin main  # or your feature branch
   ```

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/craft_abac
DATABASE_NAME=craft_abac

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Server Configuration
PORT=3005
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3002

# Azure AD SSO (optional)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3002/auth/callback
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=CRAFT 2.0
NEXT_PUBLIC_APP_VERSION=1.3.2

# Azure AD SSO (optional)
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-azure-ad-client-id
NEXT_PUBLIC_AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
```

## 📚 Documentation

### Authentication Documentation
- [Azure AD SSO Setup](./docs/AZURE_AD_SSO.md) - Complete Azure AD integration guide

### Frontend Documentation
- [Layout System](./craft-frontend/docs/layout.md) - Dashboard layout and navigation
- [Authentication](./craft-frontend/docs/authentication.md) - Local auth implementation
- [API Client](./craft-frontend/docs/api-client.md) - HTTP client and API integration
- [Policy Management](./craft-frontend/docs/policies.md) - Policy CRUD operations
- [Subject Management](./craft-frontend/docs/subjects.md) - User and role management

### Backend Documentation
- [Authentication](./craft-backend/docs/authentication.md) - JWT auth system
- [User Management](./craft-backend/docs/users.md) - User CRUD and validation
- [Policy Engine](./craft-backend/docs/policies.md) - Policy evaluation logic
- [Subject Management](./craft-backend/docs/subjects.md) - Subject entities
- [Resource Management](./craft-backend/docs/resources.md) - Protected resources
- [Action Management](./craft-backend/docs/actions.md) - Permitted actions
- [Attribute Management](./craft-backend/docs/attributes.md) - ABAC attributes

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start the backend**:
   ```bash
   cd craft-backend
   npm run dev
   ```
   Backend will run on http://localhost:3005

3. **Start the frontend**:
   ```bash
   cd craft-frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3002

### Production Build

```bash
# Backend
cd craft-backend
npm run build
PORT=3005 npm start

# Frontend
cd craft-frontend
npm run build
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd craft-backend
npm test

# Frontend tests
cd craft-frontend
npm test
```

## 📦 Deployment

### Docker Deployment (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

### Manual Deployment

1. **Set up MongoDB** on your production server
2. **Configure environment variables** for production
3. **Build and deploy backend**:
   ```bash
   cd craft-backend
   npm run build
   pm2 start dist/server.js --name craft-backend
   ```
4. **Build and deploy frontend**:
   ```bash
   cd craft-frontend
   npm run build
   # Deploy to your hosting provider (Vercel, Netlify, etc.)
   ```

## 🔄 Git Workflow

### Simple Workflow (Recommended)
```bash
# Make your changes to any files
# ...

# Commit and push everything with one command
./commit-push.sh

# Or with a custom message
./commit-push.sh "Add new feature: user dashboard"

# Or simply type this quick command
push
```

### Standard Workflow
```bash
# Pull latest changes
git pull origin main

# Make your changes
# ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push to remote
git push origin main
```

### Commit Message Conventions
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 🚨 Troubleshooting

### Quick Fix Command
- **"build" Prompt**: When you simply say "build", it means:
  - Fix all TypeScript compilation errors in both frontend and backend
  - Resolve any linting issues
  - Ensure both projects build successfully without errors
  - Address any import/export issues or type mismatches

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process on port 3005 (backend)
   lsof -ti:3005 | xargs kill -9
   
   # Kill process on port 3002 (frontend)
   lsof -ti:3002 | xargs kill -9
   ```

2. **MongoDB connection issues**:
   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify database permissions

3. **Module not found errors**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript errors**:
   ```bash
   # Check TypeScript compilation
   npx tsc --noEmit
   ```

5. **Policies not loading in frontend**:
   - Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache or open in incognito mode
   - Check browser console for JavaScript errors
   - Verify backend is running on port 3005
   - Ensure frontend API client is pointing to correct backend URL

6. **API Response caching issues**:
   - Backend returns 304 (Not Modified) responses when browser caches data
   - Use browser developer tools → Network tab to check actual API calls
   - Add cache-busting parameters if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m "Add amazing feature"`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folders in both frontend and backend
- **Issues**: Report bugs and request features in GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🗺️ Roadmap

- [ ] Real-time policy evaluation
- [ ] Advanced audit logging
- [ ] Policy simulation engine
- [ ] Integration with external identity providers
- [ ] Advanced reporting and analytics
- [ ] Mobile application
- [ ] API rate limiting and caching
- [ ] Microservices architecture

---

**Built with ❤️ using Next.js, Node.js, and MongoDB**

*Last updated: September 23, 2025*
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*

## ⭐ Latest Updates

### Version 1.3.7 - Comprehensive Pagination & Filter/Sort Uniformity (September 23, 2025)
- **📄 Advanced Pagination System**: Implemented comprehensive server-side pagination for workspaces page matching users page functionality with search, filtering, and sorting capabilities
- **🔍 Global Workspace Validation**: Enhanced workspace name validation to check ALL workspaces system-wide, preventing duplicate names regardless of creator or ownership
- **🛡️ Admin Access Control Fix**: Resolved workspace hierarchy access issues allowing admin users to properly view applications within their assigned workspaces
- **⚡ Pagination Performance**: Fixed double pagination issues in users page by eliminating client-side filtering conflicts with server-side pagination
- **🔧 API Restoration**: Restored missing useEffect in users page that was accidentally removed, ensuring proper data loading and user list population
- **📊 Enhanced Statistics**: Added comprehensive pagination statistics including active/draft counts and total applications across both users and workspaces pages
- **🎯 Real-time Validation**: Implemented instant workspace name validation with red border error styling and proper Material-UI helperText integration
- **🔄 Backend Optimization**: Enhanced backend pagination endpoints with global statistics, proper filtering, and workspace access control validation
- **📱 UI Consistency**: Standardized pagination controls, search functionality, and filter components across users and workspaces management pages
- **🚀 Performance Improvements**: Optimized MongoDB queries with proper indexing and efficient counting for improved page load times
- **🎨 Filter/Sort Uniformity**: Implemented identical Toolbar-based filter and sort system in workspaces page matching users page with popover menus and comprehensive sort options
- **🧹 UI Refinement**: Removed Clear button from workspaces filter section for cleaner interface while maintaining full filter/sort functionality

### Version 1.3.6 - Workspace Visibility & User Assignment Fix (September 22, 2025)
- **🏢 Automatic Workspace Assignment**: Admin-created workspaces now automatically assign creators to their assignedWorkspaces, preventing access issues
- **👥 User Assignment Management**: Added comprehensive endpoints for managing workspace user assignments with validation and bulk operations
- **🔧 Workspace Access Control**: Enhanced workspace visibility logic ensuring admin users can access their created workspaces immediately
- **🛡️ Role-Based Assignment**: Proper validation for workspace user management with admin/super_admin access restrictions
- **📊 User Assignment Queries**: New endpoints to retrieve and manage users assigned to specific workspaces with detailed user information

### Version 1.3.5 - UI/UX Polish & System Reliability (September 19, 2025)
- **🎨 Workspace Access Badge Enhancement**: Redesigned User Management workspace access badges with elegant gradient styling, compact multi-workspace display, and informative tooltips
- **🏷️ Badge Compactness**: Implemented single workspace display with "+N more" counters to prevent table row height issues with multiple workspace assignments
- **💡 Interactive Tooltips**: Added comprehensive hover tooltips showing all workspace names when users have multiple workspace assignments
- **🚀 Environment API Reliability**: Fixed intermittent 404 errors in environment API endpoints by correcting workspace access control logic
- **✨ Authentication Flow Polish**: Eliminated access denied screen flickering during page reloads with improved hydration timing and auth state management
- **🎯 Stepper Button Uniformity**: Standardized navigation button styling across workspace and policy creation wizards with consistent icons, variants, and colors
- **🔧 TypeScript Build Fixes**: Resolved compilation errors in environment routes with proper parameter validation ensuring successful builds
- **🎨 Visual Consistency**: Enhanced UI consistency across all stepper interfaces with matching Back/Cancel/Next button styles and Material-UI design patterns

### Version 1.3.4 - Role-Based Access Control & Environments API Fix (September 17, 2025)
- **🔐 Role-Based Access Control**: Implemented comprehensive RBAC system with three user roles (super_admin, admin, basic)
- **👤 Basic User Permissions**: Basic users have view-only access to Policies, Subjects, Resources, Actions, and Attributes within assigned workspaces
- **🏢 Workspace Assignment System**: Admin users restricted to only their assigned workspaces, removing super admin privileges
- **🔧 Environment API Fix**: Resolved critical environments API failure by fixing port configuration mismatch (3001 → 3005)
- **🛡️ Enhanced Access Control**: Added proper application access validation for basic users in environments routes
- **⚙️ Workspace Context**: Fixed workspace hierarchy access control for admin and basic users with proper assignment validation
- **🎨 UI Role Filtering**: Conditional rendering of create/edit/delete actions based on user roles across all components
- **📝 Workspace Name Display**: Fixed workspace edit form to display correct displayName instead of internal name
- **💼 Professional UI**: Redesigned workspace detail page with compact header, metrics dashboard, and professional table layout
- **🔧 React Fragment Fix**: Resolved Material-UI Menu component errors by replacing React Fragments with arrays
- **🌐 API Configuration**: Updated frontend configuration to connect to correct backend port for all API operations

### Version 1.3.3 - Environment Management & Name Consistency (September 14, 2025)
- **🏗️ Environment Name Auto-Generation**: Implemented intelligent environment name generation from display names, ensuring consistency and valid naming conventions
- **🔧 Silent Failure Resolution**: Fixed critical silent failure pattern in workspace creation where environments were failing validation but not being reported to users
- **✨ Name Consistency**: Environment names now auto-generate from display names (similar to applications), removing need for manual name field validation
- **🛡️ Enhanced Error Tracking**: Added comprehensive environment creation failure tracking with detailed error categorization and reporting
- **⚡ Workspace Creation Reliability**: Resolved environment insertion and listing issues ensuring all requested environments are properly created and displayed
- **📝 Validation Improvements**: Streamlined environment validation by removing redundant name validation (auto-generated) while maintaining display name requirements
- **🔍 Debug Enhancement**: Added proper error logging and tracking for failed environment creation attempts during workspace setup
- **💪 Robustness**: Enhanced environment creation logic in both direct API calls and workspace creation workflows

### Version 1.3.2 - UI/UX Polish & User Management 
- **🔐 Superadmin User Creation**: Added automated superadmin user creation script with secure credentials and database integration
- **🎨 Enhanced Workspace Cards**: Redesigned application count display with professional badge-like styling and proper visual hierarchy
- **✨ Professional Action Controls**: Completely restructured workspace card layout with integrated action buttons and proper element positioning
- **📊 Badge Consistency**: Standardized status and application count badges with matching size, styling, and visual weight
- **🔧 Layout Optimization**: Fixed overlapping issues between action icons and expand arrows with improved spacing and alignment
- **👤 Authentication System**: Enhanced auth middleware with proper workspace deletion permissions for admin and super_admin roles
- **🏷️ Current Workspace Indicator**: Removed redundant "Current" workspace indicator for cleaner UI presentation
- **🎯 Visual Polish**: Improved workspace card aesthetics with consistent shadows, rounded corners, and professional appearance
- **⚡ Element Positioning**: Optimized accordion structure for better content flow and interaction patterns
- **🖱️ User Experience**: Enhanced hover states and interactive feedback for all workspace management actions

### Version 1.3.1 - Critical Bug Fix & UI/UX Consistency 
- **🔧 Application/Environment Display Fix**: Resolved critical issue preventing applications and environments from showing under workspaces in the UI hierarchy
- **🔐 Authentication Bug Resolution**: Fixed mock user ID mismatch in development auth middleware that was causing "Workspace not found" errors
- **✅ Workspace Hierarchy**: Fully functional workspace → applications → environments structure now working correctly
- **🚀 API Resolution**: Backend APIs now properly return applications and environments data with correct authorization
- **🎨 Consistent Dropdown Format**: Standardized all policy creation dropdowns (Subjects, Actions, Resources) to show only essential information - displayName and one relevant secondary field
- **📝 Subject Selection**: Shows displayName + email for cleaner selection interface
- **⚡ Action Selection**: Shows displayName + description without category/risk clutter  
- **🗃️ Resource Selection**: Shows displayName + description/URI without type information
- **⚠️ Cancel Confirmation**: Added user confirmation dialog when canceling policy creation to prevent accidental data loss
- **🔧 Build System**: Fixed all TypeScript compilation errors and ESLint warnings across frontend and backend
- **📊 State Management**: Enhanced resources table real-time updates after user interactions
- **🆔 ObjectId Handling**: Resolved MongoDB ObjectId type conversion issues in migration scripts
- **🔄 Hook Dependencies**: Fixed React useEffect/useCallback missing dependencies for better performance

### Version 1.3.0 - Advanced Performance & Hierarchical Architecture
- **🏢 Hierarchical Workspace System**: Complete multi-tenant architecture with Workspace → Applications → Environments hierarchy and comprehensive context management
- **⚙️ Unified Settings Page**: Single-page setup wizard for creating entire workspace hierarchies with enhanced stepper UI and step-by-step guidance
- **🎨 Enhanced Stepper UI**: Policy Creation-inspired stepper design with circular progress indicators, completion states, and Material-UI theming
- **🔄 Workspace Context Management**: Comprehensive React context providers for workspace, application, and environment state with authentication integration
- **🌐 Dynamic Navigation**: Context-aware navigation with workspace/application switching capabilities and real-time updates
- **🚀 Multiple API Call Optimization**: Intelligent request batching and deduplication preventing redundant server calls across all pages
- **⚡ Standardized Search Debouncing**: Consistent 300ms search debouncing implemented across all pages for optimal performance
- **🎯 Enhanced Boolean Attributes**: Improved display and handling of boolean attribute types with better visual feedback and validation
- **🛡️ Comprehensive Error Handling**: Enhanced local state management with graceful error recovery and improved user feedback mechanisms
- **📝 Template System**: Pre-configured workspace templates for quick setup (Web App, Microservices, Simple API)
- **🔧 Backend API Integration**: Complete RESTful API system for workspace, application, and environment management with optimized performance
- **🎨 UI Consistency**: Standardized modal padding and styling across all create/edit dialogs for better visual consistency
- **🔄 State Management Fixes**: Resolved resources table not updating after user interactions like delete operations
- **🆔 ID Handling**: Fixed inconsistent handling of object IDs (_id vs id) across all table operations and API interactions
- **📊 Count Accuracy**: Improved table count calculations and pagination for more accurate data display

### Version 1.2.0 - Enhanced Policy Management & Performance Optimization
- **✅ Enhanced Policy Creation**: Upgraded from 4-step to 5-step wizard with separated Action & Resource selection
- **🎯 Resource Attribute Selection**: Dedicated resource attribute selection interface matching subject selection pattern
- **🔄 Attribute Scope Management**: Added conditional subject/resource selection in attribute creation with multi-select dropdowns
- **⚡ Performance Optimization**: Comprehensive fixes for infinite API calls and implemented global rate limiting
- **🛡️ Rate Limiting Protection**: Built-in API client rate limiting (250ms minimum) and 429 error handling with exponential backoff
- **🧪 Testing Infrastructure**: Added comprehensive Jest and React Testing Library test coverage
- **🔧 Build System Fixes**: Resolved all TypeScript compilation errors, React hooks dependencies, and ESLint issues
- **🎨 UI/UX Improvements**: Standardized delete modals, attribute filtering by category, and consistent design patterns

### Version 1.2.0 - Enhanced Policy Management & Performance Optimization
- **✅ Enhanced Policy Creation**: Upgraded from 4-step to 5-step wizard with separated Action & Resource selection
- **🎯 Resource Attribute Selection**: Dedicated resource attribute selection interface matching subject selection pattern
- **🔄 Attribute Scope Management**: Added conditional subject/resource selection in attribute creation with multi-select dropdowns
- **⚡ Performance Optimization**: Comprehensive fixes for infinite API calls and implemented global rate limiting
- **🛡️ Rate Limiting Protection**: Built-in API client rate limiting (250ms minimum) and 429 error handling with exponential backoff
- **🧪 Testing Infrastructure**: Added comprehensive Jest and React Testing Library test coverage
- **🔧 Build System Fixes**: Resolved all TypeScript compilation errors, React hooks dependencies, and ESLint issues
- **🎨 UI/UX Improvements**: Standardized delete modals, attribute filtering by category, and consistent design patterns

### Version 1.1.0 - Azure AD SSO Integration
- **🔐 Azure AD Single Sign-On**: Complete OAuth 2.0/OpenID Connect integration
- **👤 Automatic User Provisioning**: Users are automatically created from Azure AD with default roles
- **🔄 Hybrid Authentication**: Support for both local accounts and Microsoft accounts
- **📚 Comprehensive Documentation**: Complete setup guide for Azure AD integration
- **🛡️ Enhanced Security**: Modern authentication standards and secure token management