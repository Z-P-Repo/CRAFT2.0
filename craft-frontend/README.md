# CRAFT Frontend - Permission System Dashboard

A modern, responsive React-based dashboard for managing the CRAFT (Attribute-Based Access Control) Permission System. Built with Next.js 15, TypeScript, and Material-UI with a professional collapsible sidebar layout.

![Version](https://img.shields.io/badge/version-1.3.8-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3-blue.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![Jest](https://img.shields.io/badge/Jest-29-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **📱 Responsive Dashboard Layout** with collapsible sidebar navigation
- **🔐 JWT Authentication** with automatic token refresh and secure routing
- **👥 User Registration** - Public registration with default Basic role assignment
- **🛡️ User Management** - Complete user management system with three-tier role hierarchy (Super Admin, Admin, Basic)
- **🔒 Role-Based Access Control** - Basic users have view-only access; Admin/Super Admin have full CRUD access
- **📋 Policy Management** - Create, edit, and manage ABAC policies with enhanced 5-step wizard, separated Action & Resource selection, and dedicated view/edit pages (Admin/Super Admin only)
- **👥 Subject Management** - Handle users, groups, and roles with detailed profiles (view-only for Basic users)
- **📁 Resource Management** - Manage system resources, files, databases, and APIs (view-only for Basic users)
- **⚡ Action Management** - Define and categorize system actions with risk levels (view-only for Basic users)
- **🏷️ Attribute Management** - Enhanced multi-category ABAC attributes (Subject/Resource) with conditional scope selection, multi-select dropdowns, and category filtering (view-only for Basic users)
- **📈 Policy Dependency Tracking** - Real-time policy count display with tooltips showing up to 5 policy names across all entity management pages
- **⚡ Advanced Performance Optimization** - Multiple API call prevention, intelligent request batching, standardized 300ms search debouncing, comprehensive request deduplication, and 429 error handling with exponential backoff
- **🛡️ Deletion Protection UI** - User-friendly error messages when attempting to delete entities referenced in active policies
- **🗑️ Standardized Delete Modals** - Clean, professional delete confirmation dialogs with close icons, system item warnings, and consistent design across all modules (Subjects, Resources, Actions, Attributes, Users)
- **📋 Activity Monitoring** - Comprehensive activity logging and audit trail system with real-time activity feed, advanced filtering, and detailed activity views
- **🧪 Policy Tester** - Interactive policy evaluation and testing with detailed results
- **🏢 Hierarchical Workspace Management** - Complete multi-tenant workspace system with Workspace → Applications → Environments hierarchy and authentication integration
- **🏗️ Environment Management** - Intelligent environment name auto-generation, enhanced creation workflows, and improved validation with display name synchronization
- **⚙️ Unified Settings Page** - Single-page setup wizard with enhanced stepper UI and step-by-step guidance for creating complete workspace hierarchies
- **🎨 Enhanced Stepper UI** - Policy Creation-inspired stepper design with circular progress indicators, completion states, and Material-UI theming
- **🔄 Workspace Context Management** - Comprehensive React context providers with authentication-aware workspace, application, and environment state management
- **🌐 Dynamic Navigation** - Context-aware navigation with workspace/application switching capabilities and real-time updates
- **🚀 Multiple API Call Optimization** - Intelligent request batching and deduplication preventing redundant server calls across all components
- **⚡ Standardized Search Debouncing** - Consistent 300ms search debouncing implemented across all search interfaces for optimal performance
- **🔄 Request Deduplication** - Advanced API client with smart caching mechanisms preventing duplicate network requests
- **📊 Real-time Statistics** - Dashboard with live metrics and activity tracking
- **🎨 Professional UI/UX** - Material-UI components with consistent theming

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- CRAFT Backend API running on port 3005

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd craft-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

## ⚙️ Configuration

Update the `.env.local` file with your settings:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Environment
NODE_ENV=development

# Application Settings
NEXT_PUBLIC_APP_NAME=CRAFT Permission System
NEXT_PUBLIC_APP_VERSION=1.3.5
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:watch
npm run test:coverage

# Storybook
npm run storybook
npm run build-storybook

# Bundle analysis
npm run analyze
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── login/          # Login page
│   ├── register/       # User registration page
│   ├── dashboard/      # Dashboard page
│   ├── users/          # User management page
│   ├── policies/       # Policy management pages
│   │   ├── create/     # Policy creation wizard
│   │   ├── [id]/       # Policy view/edit pages
│   │   │   └── edit/   # Policy editing page
│   │   └── page.tsx    # Main policies listing
│   ├── subjects/       # Subject management
│   ├── actions/        # Actions management
│   ├── resources/     # Resources management
│   ├── attributes/     # Attributes management
│   ├── activity/       # Activity monitoring and audit logs
│   ├── settings/       # Workspace settings and setup
│   │   └── create/     # Workspace creation wizard
│   ├── workspaces/     # Workspace management
│   │   ├── create/     # Workspace creation page
│   │   └── [workspaceId]/ # Individual workspace pages
│   │       ├── edit/   # Workspace editing
│   │       └── settings/ # Workspace-specific settings
│   ├── auth/           # Authentication callback
│   │   └── callback/   # Azure AD callback page
│   ├── tester/         # Policy evaluation testing
│   ├── layout.tsx      # Root layout with dashboard
│   └── page.tsx        # Home page
├── components/         # Reusable UI components
│   ├── activity/       # Activity-related components
│   │   └── ActivityDetailModal.tsx # Activity detail modal
│   ├── workspace/      # Workspace-related components
│   │   └── WorkspaceSwitcher.tsx # Workspace/Application switcher
│   └── layout/         # Layout components
│       └── DashboardLayout.tsx # Main dashboard layout
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication context
│   └── WorkspaceContext.tsx # Workspace management context
├── hooks/              # Custom React hooks
├── lib/                # Libraries and utilities
│   ├── api.ts          # API client with interceptors
│   └── activityService.ts # Activity tracking service
├── types/              # TypeScript type definitions
│   └── index.ts        # Complete type definitions (includes Activity types)
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials
2. **Token Storage**: JWT tokens stored in localStorage
3. **Auto-Refresh**: Automatic token refresh on expiry
4. **Route Protection**: Protected routes redirect to login
5. **Logout**: Clear tokens and redirect to home

## 📱 Pages and Features

### Authentication
- **Home Page** (`/`): Landing page with system overview
- **Login Page** (`/login`): User authentication
- **Register Page** (`/register`): User registration

### Protected Routes
- **Dashboard** (`/dashboard`): Main application dashboard (all users)
- **Users** (`/users`): Complete user management with role changes (Admin/Super Admin only for CUD operations)
- **Subjects** (`/subjects`): User and role management with policy count display and auto-refresh (view-only for Basic users)
- **Resources** (`/resources`): Resource management with policy dependency tracking and manual refresh button (view-only for Basic users)
- **Actions** (`/actions`): Action definitions with policy count badges and deletion protection (view-only for Basic users)
- **Policies** (`/policies`): Access policy management with comprehensive pagination and filtering (view-only for Basic users)
  - **Policy Creation** (`/policies/create`): Enhanced 5-step wizard for policy creation with separated Action & Resource selection (Admin/Super Admin only)
  - **Policy View** (`/policies/[id]`): Dedicated policy viewing page (all users)
  - **Policy Edit** (`/policies/[id]/edit`): Dedicated policy editing page (Admin/Super Admin only)
- **Attributes** (`/attributes`): Multi-category attribute system with policy count tooltips and auto-refresh (view-only for Basic users)
- **Workspaces** (`/workspaces`): Comprehensive workspace management with pagination, search, and filtering (Admin/Super Admin for CUD operations)
  - **Workspace Creation** (`/workspaces/create`): Step-by-step workspace creation wizard (Admin/Super Admin only)
  - **Workspace View** (`/workspaces/[workspaceId]`): Individual workspace details and management (assigned users)
  - **Workspace Edit** (`/workspaces/[workspaceId]/edit`): Workspace editing interface (Admin/Super Admin only)
  - **Workspace Settings** (`/workspaces/[workspaceId]/settings`): Workspace-specific configuration (Admin/Super Admin only)
- **Settings** (`/settings`): Unified workspace settings and setup wizard with step-by-step guidance (Admin/Super Admin only)
  - **Settings Creation** (`/settings/create`): Alternative workspace creation flow with templates (Admin/Super Admin only)
- **Activity** (`/activity`): Comprehensive activity monitoring with real-time audit logs, advanced filtering, and detailed activity views (all users)
- **Tester** (`/tester`): Policy evaluation testing (all users)

### Authentication Callback
- **Auth Callback** (`/auth/callback`): Azure AD authentication callback handler for SSO integration

## 🎨 UI Components

### Material-UI Theme
- **Primary Color**: Blue (#1976d2)
- **Secondary Color**: Pink (#dc004e)
- **Typography**: Roboto font family
- **Responsive**: Mobile-first design

### Component Library
- Authentication forms
- Data tables with pagination and sortable policy count columns
- Standardized delete confirmation dialogs with professional design and system protection warnings
- Form components with validation
- Navigation components
- Dashboard cards
- Policy count chips with Material-UI tooltips
- Refresh buttons with loading states
- Shared DeleteConfirmationDialog component used across all entity management pages

## 🔧 API Integration

### API Client Features
- Intelligent request batching and deduplication to prevent multiple identical API calls
- Automatic request/response interceptors with advanced rate limiting and 300ms search debouncing
- JWT token management and automatic refresh with enhanced security
- Sophisticated error handling and retry logic with 429 rate limit protection and exponential backoff
- Request ID tracking and request queue management with performance monitoring
- Real-time policy count fetching with consistent ID-based entity mapping and optimized caching
- Enhanced boolean attribute handling with improved display and validation logic
- Local state management with comprehensive error recovery and user feedback mechanisms
- Fixed schema consistency between frontend policy creation and backend policy tracking

### Available API Methods
```typescript
// Authentication
apiClient.login(credentials)
apiClient.register(userData)  // Creates Basic role user by default
apiClient.logout()
apiClient.getProfile()
apiClient.validateToken()

// Activity Management
apiClient.getActivities(params)
apiClient.getActivity(id)
apiClient.createActivity(activity)
apiClient.getActivityStats()
apiClient.exportActivities(filters)

// Generic CRUD
apiClient.get(url, params)
apiClient.post(url, data)
apiClient.put(url, data)
apiClient.patch(url, data)  // For role changes
apiClient.delete(url)
```

## 🧪 Testing

### Test Setup
- Jest configuration
- React Testing Library
- Component testing
- Integration testing
- Coverage reporting

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📖 Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint and Prettier configuration
- Consistent naming conventions
- Component organization

### Best Practices
- Use TypeScript interfaces for all API responses including policy count data
- Implement error boundaries
- Follow React best practices
- Write meaningful tests including policy dependency scenarios
- Use semantic HTML
- Implement consistent auto-refresh patterns across entity pages
- Use Material-UI Chip components for policy count display
- Add tooltips for enhanced user experience

### Policy Dependency UI Patterns
- **Policy Count Display**: Use `<Chip>` components with `color="primary"` for policy counts with accurate ID-based backend mapping
- **Tooltips**: Show up to 5 policy names in tooltips, with "and X more" for additional policies  
- **Auto-refresh**: Implement window focus and 30-second periodic refresh for data consistency
- **Manual Refresh**: Provide refresh buttons with loading states and descriptive tooltips
- **Column Headers**: Use single-line headers with appropriate widths (180px for "Created By")
- **Error Handling**: Display user-friendly messages for deletion protection errors
- **Data Consistency**: Policy creation and display now use consistent entity ID references ensuring accurate policy counts and deletion protection
- **Delete Modals**: Standardized DeleteConfirmationDialog component with close icons, clean design, system protection warnings, loading states, and entity-specific messaging

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t craft-frontend .

# Run container
docker run -p 3002:3002 craft-frontend
```

### Build Optimization
- Automatic code splitting
- Image optimization
- Bundle analysis
- Tree shaking
- Compression

## 🔍 Performance

### Optimization Features
- Next.js automatic optimizations
- Image optimization with next/image
- Code splitting and lazy loading
- Bundle size analysis
- Performance monitoring

### Lighthouse Scores
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## 📊 Monitoring

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Storybook for component development
- Bundle analyzer for optimization

### Error Handling
- Error boundaries for graceful failures
- API error handling and user feedback
- Form validation and error display
- Loading states and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔗 Related Projects

- [CRAFT Backend](../craft-backend/) - Express.js API server
- [CRAFT Documentation](../docs/) - System documentation

---

## 📋 Activity System

The CRAFT system includes a comprehensive activity monitoring and audit trail system that tracks all significant events across the application.

### Activity Features
- **Real-time Activity Feed** - Live updates of system activities with automatic refresh
- **Advanced Filtering** - Filter by category, severity, type, actor, and date range
- **Activity Categories** - 8 main categories: Security, Administration, Compliance, Operation, Configuration, Integration, Monitoring, User Activity
- **Severity Levels** - 4 levels: Low, Medium, High, Critical with color-coded indicators
- **Detailed Activity Views** - Modal dialogs with complete activity information including metadata
- **API Status Detection** - Automatic fallback to demo mode when backend is unavailable
- **Export Capabilities** - CSV and JSON export for compliance and reporting
- **Smart Activity Tracking** - Automatic activity creation throughout the application

### Activity Types Tracked
- **Authentication Events** - Login, logout, password changes
- **Authorization Events** - Access granted/denied, permission checks
- **Policy Management** - Policy creation, updates, deletions
- **User Management** - User account changes, role modifications
- **Resource Management** - Resource creation, updates, deletions
- **System Configuration** - Settings changes, configuration updates
- **Security Events** - Suspicious activities, security violations
- **Audit Activities** - Compliance checks, system audits

### Activity Service Integration
The activity system provides easy integration throughout the application:

```typescript
import { trackAuth, trackPolicy, trackUser } from '@/lib/activityService';

// Track authentication events
await trackAuth('login', true);

// Track policy changes
await trackPolicy('created', 'policy-123', 'New Security Policy');

// Track user management
await trackUser('updated', 'user-456', 'John Doe');
```

---

*Last updated: September 23, 2025*
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*

## 🔄 Recent Updates (Version 1.3.8)

### Latest Enhancements & ProtectedRoute Integration (September 23, 2025)
- **🔒 Enhanced Security Implementation**: Comprehensive ProtectedRoute component integration across all authenticated pages ensuring robust access control and security validation
- **📱 Improved Authentication Flow**: Streamlined user authentication experience with consistent route protection and proper navigation handling
- **🎨 UI Component Standardization**: Enhanced page structure consistency with standardized authentication checks and improved component architecture
- **🔧 Build System Enhancement**: Verified successful compilation with all TypeScript validations passing and comprehensive error handling improvements
- **📚 Documentation Updates**: Complete documentation refresh with latest features, version information, and system capabilities accurately reflected
- **🛡️ Security Strengthening**: Reinforced application security with proper route guards and enhanced authentication validation throughout all user interfaces
- **🚀 Performance Maintenance**: Continued optimization of component loading, API performance, and user experience enhancements across all modules
- **📊 Component Integration**: Seamless integration of security features with existing workspace management and ABAC functionality

### Previous Updates (Version 1.3.7) - Advanced Pagination & Filter/Sort Uniformity (September 23, 2025)
- **📄 Comprehensive Pagination Implementation**: Added complete server-side pagination to workspaces page matching users page functionality with search, filtering, and sorting capabilities
- **🔍 Real-time Workspace Validation**: Implemented instant workspace name validation checking ALL workspaces system-wide with red border error styling and Material-UI helperText integration
- **⚡ Pagination Performance Fix**: Resolved double pagination issue in users page by removing client-side filtering conflicts with server-side pagination
- **🔧 API Call Restoration**: Fixed missing useEffect in users page that was accidentally removed, ensuring proper data loading and user list population
- **📊 Enhanced Statistics Display**: Added comprehensive pagination statistics including active/draft counts and total applications with proper state management
- **🎯 Validation Error Handling**: Enhanced validation error display with proper Material-UI TextField error states and user-friendly messaging
- **📱 UI Consistency**: Standardized pagination controls, search functionality, and filter components across users and workspaces management pages
- **🔄 State Management Enhancement**: Improved pagination state handling with proper debouncing, loading states, and error recovery mechanisms
- **🚀 Performance Optimization**: Optimized API calls with intelligent request batching and proper dependency management for faster page loads
- **💼 User Experience**: Enhanced workspace management with consistent pagination patterns and improved data loading feedback
- **🎨 Filter/Sort Uniformity**: Implemented identical Toolbar-based filter and sort system in workspaces page with popover menus, checkbox filtering, and comprehensive sort options
- **🧹 UI Refinement**: Removed Clear button from workspaces filter section for cleaner interface while maintaining full filter/sort functionality through popover controls

### Version 1.3.6 - Workspace Visibility & User Assignment Enhancement (September 22, 2025)
- **🏢 Workspace Access Resolution**: Fixed workspace hierarchy display issues ensuring admin users can properly view applications within assigned workspaces
- **👥 User Assignment Integration**: Enhanced workspace user assignment system with proper validation and access control throughout the UI

### Version 1.3.5 - UI/UX Polish & System Reliability (September 19, 2025)
- **🎨 Workspace Access Badge Enhancement**: Redesigned User Management workspace access badges with elegant gradient styling, compact multi-workspace display, and interactive tooltips for improved user experience
- **🏷️ Badge Compactness**: Implemented single workspace display with "+N more" counters to prevent table row height issues when users have multiple workspace assignments
- **💡 Interactive Tooltips**: Added comprehensive hover tooltips showing all workspace names when users have multiple workspace assignments with rich formatting and detailed workspace information
- **🚀 Environment API Reliability**: Fixed intermittent 404 errors in environment API endpoints by correcting workspace access control logic and parameter validation
- **✨ Authentication Flow Polish**: Eliminated access denied screen flickering during page reloads with improved hydration timing, auth state management, and smoother transitions
- **🎯 Stepper Button Uniformity**: Standardized navigation button styling across workspace and policy creation wizards with consistent icons, variants, colors, and Material-UI design patterns
- **🔧 Build System Improvements**: Enhanced TypeScript compilation with proper parameter validation and error handling ensuring reliable builds and deployments
- **🎨 Visual Consistency**: Enhanced UI consistency across all stepper interfaces with matching Back/Cancel/Next button styles, proper icon placement, and cohesive user experience

### Previous Updates (Version 1.3.4)

### Role-Based Access Control & Enhanced UI (September 17, 2025)
- **🔐 Comprehensive RBAC Implementation**: Three-tier role system (super_admin, admin, basic) with proper access control throughout the UI
- **👤 Basic User Interface**: Basic users now have view-only access to all ABAC entities with disabled create/edit/delete buttons
- **🏢 Workspace Assignment System**: Admin users restricted to their assigned workspaces with proper context management
- **🔧 Environment API Configuration**: Fixed critical API connection issue by updating frontend to connect to correct backend port (3005)
- **🎨 Role-Based UI Filtering**: Conditional rendering of actions based on user roles across all components and navigation
- **📝 Workspace Name Display**: Fixed workspace edit form to show correct displayName instead of internal name field
- **💼 Professional Workspace Detail**: Redesigned workspace detail page with compact header, metrics cards, and professional table layout
- **🔧 React Fragment Resolution**: Fixed Material-UI Menu component errors by replacing React Fragments with arrays
- **⚙️ Context-Aware Navigation**: Enhanced WorkspaceSwitcher with proper role-based create button visibility
- **🛡️ Permission-Based Menu**: Updated DashboardLayout to show/hide menu items based on user roles and permissions
- **🌐 API Client Enhancement**: Corrected frontend API configuration to properly connect to backend services

### Recent Updates (Version 1.3.3)

### Environment Management Enhancement
- **🏗️ Environment Name Auto-Generation**: Intelligent generation of environment names from display names ensuring consistency and eliminating validation issues
- **📝 Synchronized Display Names**: Environment display names and internal names are now automatically synchronized for better user experience
- **✅ Improved Validation**: Streamlined environment validation process with automatic name normalization and sanitization
- **🔧 Silent Failure Resolution**: Fixed silent environment creation failures during workspace setup with comprehensive error tracking
- **🌐 Enhanced Workspace Creation**: Improved reliability of complete workspace hierarchy creation with better error reporting and recovery
- **📊 Better Error Tracking**: Added comprehensive error tracking for failed environments during bulk creation operations
- **🎯 Consistent Naming Pattern**: Environment names follow the same auto-generation pattern as applications for consistency across the platform

### Previous Updates (Version 1.3.2)

### UI/UX Polish & User Management Enhancement
- **🎨 Enhanced Workspace Cards**: Complete redesign of application count display with professional badge-like styling, improved visual hierarchy, and consistent Material-UI theming
- **✨ Professional Action Controls**: Restructured workspace card layout with integrated action buttons, proper element positioning, and optimized accordion structure for better content flow
- **📊 Badge Consistency**: Standardized status and application count badges with matching size, styling, visual weight, shadows, and rounded corners for professional appearance
- **🔧 Layout Optimization**: Fixed overlapping issues between action icons and expand arrows with improved spacing, alignment, and element ordering using CSS flexbox
- **🏷️ UI Simplification**: Removed redundant "Current" workspace indicator for cleaner presentation and better focus on essential information
- **⚡ Element Positioning**: Optimized accordion structure with proper CSS order properties, natural content flow, and enhanced interaction patterns
- **🖱️ Enhanced User Experience**: Improved hover states, interactive feedback, and visual polish across all workspace management components
- **🎯 Visual Hierarchy**: Better organization of workspace information with logical element placement and consistent spacing throughout

### Previous Updates (Version 1.3.1)

### Critical Bug Fix & Workspace Hierarchy Resolution
- **🏢 Workspace Hierarchy Display Fix**: Resolved critical issue preventing applications and environments from appearing under workspaces in the UI
- **✅ Functional Navigation**: Workspace hierarchy navigation now properly displays applications and environments with correct data loading
- **🔄 Context Integration**: WorkspaceContext and related components now correctly interface with fixed backend APIs
- **📱 Real-time Updates**: Application and environment counts now display correctly in workspace cards and navigation

### UI/UX Consistency & User Experience Improvements
- **🎨 Standardized Dropdown Format**: Consistent display format across all policy creation dropdowns (Subjects, Actions, Resources) showing only essential information
- **👥 Clean Subject Selection**: Subject dropdowns now show only displayName + email for improved readability and faster selection
- **⚡ Streamlined Action Selection**: Action dropdowns display displayName + description without category/risk level clutter for better focus
- **🗃️ Simplified Resource Selection**: Resource dropdowns show displayName + description/URI without type information for cleaner interface
- **⚠️ Cancel Protection**: Added confirmation dialog when canceling policy creation to prevent accidental data loss
- **🔄 Enhanced State Management**: Improved resources table real-time updates after user interactions including delete operations
- **🎯 Better User Feedback**: Enhanced error handling and confirmation dialogs throughout the application
- **🔧 Build Stability**: Fixed React useEffect/useCallback missing dependencies for better performance and reliability

### Recent Updates (Version 1.3.0)

### Hierarchical Workspace Architecture & Performance Optimization
- **🏢 Multi-Tenant Workspace System**: Complete workspace, application, and environment hierarchy with comprehensive React context management and authentication integration
- **⚙️ Unified Settings Page**: Single-page setup wizard with enhanced stepper UI, circular progress indicators, and step-by-step guidance
- **🔄 Workspace Context Provider**: Comprehensive state management for workspace, application, and environment selection with authentication-aware data loading
- **🌐 WorkspaceSwitcher Component**: Dynamic navigation component with context-aware workspace/application switching and real-time updates
- **🚀 Multiple API Call Optimization**: Intelligent request batching and deduplication system preventing redundant server calls across all pages
- **⚡ Standardized Search Debouncing**: Consistent 300ms debouncing implemented across all search interfaces for optimal performance
- **🔄 Request Deduplication**: Advanced API client with smart caching mechanisms preventing duplicate network requests and improving user experience
- **🎯 Enhanced Boolean Attributes**: Improved rendering and handling of boolean attribute types with better visual indicators and validation
- **🛡️ Enhanced Error Handling**: Comprehensive local state management with graceful error recovery and improved user feedback mechanisms
- **🎨 UI Consistency Improvements**: Standardized modal padding across create/edit dialogs for cohesive user experience
- **🔄 Table State Management**: Fixed resources table not updating properly after delete operations and other user interactions
- **🆔 Enhanced ID Handling**: Improved handling of mixed ID formats (_id vs id) across all table operations and API interactions
- **📊 Accurate Data Display**: Better table count calculations, pagination accuracy, and real-time data synchronization

### Previous Updates (Version 1.2.0)

### Advanced Performance Optimization
- **Multiple API Call Prevention**: Intelligent request batching and deduplication system preventing redundant server calls
- **Standardized Search Debouncing**: Consistent 300ms debouncing implemented across all search interfaces for optimal performance
- **Request Deduplication**: Advanced API client with smart caching mechanisms preventing duplicate network requests
- **Enhanced Error Handling**: Comprehensive local state management with graceful error recovery and user feedback

### UI/UX Enhancements
- **Boolean Attribute Display**: Improved rendering and handling of boolean attribute types with better visual indicators
- **Searchable Dropdowns**: Enhanced policy creation with advanced searchable dropdown components for better user experience
- **Material-UI v7**: Upgraded to latest Material-UI components with improved styling and performance
- **React 19**: Updated to latest React version with enhanced performance and developer experience

### Testing & Development
- **Comprehensive Test Setup**: Full Jest 29 configuration with React Testing Library 16 for robust testing coverage
- **Performance Testing**: Added tests for API optimization, debouncing, and request deduplication
- **TypeScript 5.5**: Updated to latest TypeScript with enhanced type checking and development experience
- **Build Optimizations**: Enhanced build process with improved error handling and faster compilation times

### Previous Updates (Version 1.2.0)
- **✅ Enhanced Policy Creation**: Upgraded from 4-step to 5-step wizard with separated Action & Resource selection
- **🎯 Resource Attribute Selection**: Dedicated resource attribute selection interface matching subject selection pattern
- **🔄 Attribute Scope Management**: Added conditional subject/resource selection in attribute creation with multi-select dropdowns
- **⚡ Performance Optimization**: Comprehensive fixes for infinite API calls and implemented global rate limiting
- **🛡️ Rate Limiting Protection**: Built-in API client rate limiting (250ms minimum) and 429 error handling with exponential backoff
- **🧪 Testing Infrastructure**: Added comprehensive Jest and React Testing Library test coverage
- **🔧 Build System Fixes**: Resolved all TypeScript compilation errors, React hooks dependencies, and ESLint issues
- **🎨 UI/UX Improvements**: Standardized delete modals, attribute filtering by category, and consistent design patterns