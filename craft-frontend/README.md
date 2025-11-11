# CRAFT Frontend - Permission System Dashboard

A modern, responsive React-based dashboard for managing the CRAFT (Attribute-Based Access Control) Permission System. Built with Next.js 15, TypeScript, and Material-UI with a professional collapsible sidebar layout.

![Version](https://img.shields.io/badge/version-1.3.21-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3-blue.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![Jest](https://img.shields.io/badge/Jest-29-orange.svg)
![Azure AD](https://img.shields.io/badge/Azure%20AD-MSAL-blue.svg)
![Testing Library](https://img.shields.io/badge/Testing%20Library-16-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Core Features

### 🔐 Authentication & Security
- **Azure AD SSO Integration** - Microsoft MSAL authentication with seamless enterprise login
- **JWT Token Management** - Automatic token refresh, secure storage, and validation
- **Role-Based Access Control** - Three-tier hierarchy (Super Admin, Admin, Basic) with granular permissions
- **Protected Route System** - Comprehensive route protection with role-based access control
- **Public User Registration** - Self-service registration with default Basic role assignment

### 🏢 Multi-Tenant Architecture
- **Hierarchical Workspace System** - Complete Workspace → Applications → Environments architecture
- **Workspace Context Management** - React context providers with authentication-aware state management
- **Dynamic Navigation** - Context-aware navigation with workspace/application switching capabilities
- **Workspace Assignment System** - User-workspace assignment with proper access control
- **Environment Auto-Generation** - Intelligent environment name generation with display name synchronization

### 📋 ABAC Policy Management
- **Enhanced 5-Step Policy Wizard** - Separated Action & Resource selection with professional stepper UI
- **Policy Dependency Tracking** - Real-time policy count display with tooltips showing up to 5 policy names
- **Interactive Policy Tester** - Comprehensive policy evaluation and testing with detailed results
- **Policy View/Edit Pages** - Dedicated pages for policy viewing and editing with role-based access
- **Attribute Value Management** - Professional modal for adding new attribute values with duplicate validation

### 👥 Entity Management System
- **Subject Management** - Handle users, groups, and roles with detailed profiles and policy tracking
- **Resource Management** - Manage system resources, files, databases, and APIs with hierarchy support and comprehensive Additional Resources functionality
- **Action Management** - Define and categorize system actions with risk levels and policy dependencies
- **Advanced Attribute System** - Multi-category ABAC attributes with conditional scope selection and category filtering
- **User Management** - Complete user lifecycle with role changes and workspace assignments

### ⚡ Performance & Optimization
- **Intelligent API Optimization** - Request batching, deduplication, and caching mechanisms
- **Standardized Search Debouncing** - Consistent 300ms debouncing across all search interfaces
- **Rate Limiting Protection** - Built-in 429 error handling with exponential backoff
- **Real-time Updates** - Live data synchronization with automatic refresh patterns
- **Bundle Optimization** - Code splitting, tree shaking, and automatic optimizations

### 📊 Monitoring & Analytics
- **Comprehensive Activity System** - Real-time activity feed with 8 categories and 4 severity levels
- **Advanced Filtering** - Filter by category, severity, type, actor, and date range
- **Export Capabilities** - CSV and JSON export for compliance and reporting
- **Dashboard Statistics** - Live metrics, charts, and activity tracking
- **Audit Trail** - Complete system audit capabilities with detailed activity views

### 🎨 Professional UI/UX
- **Responsive Dashboard Layout** - Collapsible sidebar navigation with mobile support
- **Material-UI v7 Components** - Professional design system with consistent theming
- **Standardized Delete Modals** - Clean confirmation dialogs with system protection warnings
- **Professional Modals** - Enhanced attribute value creation with top-right close buttons
- **Deletion Protection UI** - User-friendly error messages for referenced entities
- **Loading States** - Comprehensive loading indicators and progress feedback

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
NEXT_PUBLIC_APP_VERSION=1.3.9

# Azure AD Configuration (Optional - for SSO)
NEXT_PUBLIC_AZURE_CLIENT_ID=your-azure-client-id
NEXT_PUBLIC_AZURE_TENANT_ID=your-azure-tenant-id
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3002/auth/callback
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
- **Resources** (`/resources`): Resource management with policy dependency tracking, manual refresh button, and comprehensive Additional Resources tabbed interface (view-only for Basic users)
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
// Authentication & User Management
apiClient.login(credentials)
apiClient.register(userData)  // Creates Basic role user by default
apiClient.logout()
apiClient.getProfile()
apiClient.validateToken()
apiClient.refreshToken()

// Azure AD SSO
apiClient.getAzureToken()
apiClient.validateAzureToken(token)

// Activity Management
apiClient.getActivities(params)
apiClient.getActivity(id)
apiClient.createActivity(activity)
apiClient.getActivityStats()
apiClient.exportActivities(filters)

// ABAC Entity Management
apiClient.getPolicies(params)
apiClient.createPolicy(policy)
apiClient.getSubjects(params)
apiClient.createSubject(subject)
apiClient.getResources(params)
apiClient.createResource(resource)
apiClient.getActions(params)
apiClient.createAction(action)
apiClient.getAttributes(params)
apiClient.createAttribute(attribute)
apiClient.updateAttributeValues(id, values)

// Workspace Management
apiClient.getWorkspaces(params)
apiClient.createWorkspace(workspace)
apiClient.getApplications(workspaceId)
apiClient.createApplication(application)
apiClient.getEnvironments(applicationId)
apiClient.createEnvironment(environment)

// User & Role Management
apiClient.getUsers(params)
apiClient.updateUserRole(userId, role)
apiClient.assignUserToWorkspace(userId, workspaceId)
apiClient.unassignUserFromWorkspace(userId, workspaceId)

// Generic CRUD with Advanced Features
apiClient.get(url, params)        // With intelligent caching
apiClient.post(url, data)         // With request deduplication
apiClient.put(url, data)          // With optimistic updates
apiClient.patch(url, data)        // For partial updates
apiClient.delete(url)             // With dependency checking
```

## 🧪 Testing

### Comprehensive Test Suite
- **Jest 29** - Latest testing framework with enhanced performance
- **React Testing Library 16** - Modern React component testing
- **Performance Testing** - API optimization and debouncing verification
- **Integration Testing** - Full user workflow testing
- **Coverage Reporting** - Comprehensive test coverage analysis
- **Mocking Strategies** - Advanced mocking for API calls and external services

### Test Categories
```typescript
// Component Testing
test('renders policy creation wizard', () => {
  render(<PolicyCreationWizard />);
  expect(screen.getByText('Create New Policy')).toBeInTheDocument();
});

// API Integration Testing
test('handles attribute value creation', async () => {
  const mockResponse = { success: true, data: newAttribute };
  apiClient.post.mockResolvedValue(mockResponse);
  // ... test implementation
});

// Performance Testing
test('debounces search requests', async () => {
  const searchInput = screen.getByRole('textbox', { name: /search/i });
  userEvent.type(searchInput, 'test query');
  await waitFor(() => {
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  }, { timeout: 400 });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report with detailed metrics
npm run test:coverage

# Performance and API optimization tests
npm run test:performance
```

## 📖 Development Guidelines

### Code Style & Standards
- **TypeScript Strict Mode** - Full type safety with strict compilation
- **ESLint & Prettier** - Automated code formatting and linting
- **Consistent Naming** - camelCase for variables, PascalCase for components
- **Component Organization** - Logical folder structure with feature-based grouping
- **Hook Patterns** - Custom hooks for reusable logic and state management

### Architecture Best Practices
- **Context Providers** - Centralized state management for authentication and workspace data
- **API Client Patterns** - Intelligent request handling with caching and deduplication
- **Error Boundaries** - Graceful error handling with user-friendly fallbacks
- **Type Safety** - Complete TypeScript interfaces for all API responses and data structures
- **Performance Optimization** - Debouncing, memoization, and intelligent re-rendering

### UI/UX Standards
- **Material-UI Consistency** - Standardized component usage across the application
- **Accessibility** - WCAG 2.1 compliance with proper ARIA labels and keyboard navigation
- **Responsive Design** - Mobile-first approach with breakpoint-specific layouts
- **Loading States** - Comprehensive feedback for all async operations
- **Error Handling** - User-friendly error messages with actionable guidance

### Testing Standards
- **Component Coverage** - Minimum 80% test coverage for all components
- **Integration Tests** - End-to-end user workflow testing
- **Performance Tests** - API optimization and debouncing verification
- **Accessibility Tests** - Automated accessibility testing with jest-axe
- **Mock Strategies** - Consistent mocking patterns for external dependencies

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

- [CRAFT Backend](../craft-backend/) - Express.js API server with MongoDB and Azure AD
- [CRAFT Documentation](../docs/) - System documentation and API reference
- [Azure AD Configuration](../docs/azure-setup.md) - Enterprise SSO setup guide

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

*Last updated: October 22, 2025*
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*

## 🔄 Recent Updates (Version 1.3.18)

### Data-Type-Aware Attribute Value Management & DateTime Support (October 22, 2025)
- **🎯 Intelligent Value Input System**: Implemented comprehensive data-type-aware "Add Value" dialog system that adapts input controls based on attribute's dataType property across all policy creation and edit workflows
- **🔢 Boolean Type Support**: Select dropdown with true/false options for boolean attributes ensuring proper value selection with Material-UI Select component
- **🔢 Number Type Support**: Dedicated numeric TextField with type="number", proper validation preventing non-numeric input, and user-friendly error messages for invalid numbers
- **📝 String Type Support**: Standard TextField with appropriate placeholder text and helper guidance for descriptive value entry
- **📅 Enhanced DateTime Input**: Changed date input from type="date" to type="datetime-local" enabling users to select both date and time components for precise timestamp values in date-type attributes
- **📝 Array Type Support**: Multiline TextField (3 rows) with monospace font (Monaco/"Lucida Console") for JSON array input with placeholder like `["item1", "item2", "item3"]` and JSON validation
- **📝 Object Type Support**: Multiline TextField (3 rows) with monospace font for JSON object input with placeholder like `{"key": "value", "name": "example"}` and strict object validation preventing arrays
- **✨ Professional Dialog Design**: Modern modal styling with data-type labels in descriptions showing "(boolean type)", "(number type)", etc., enhanced helper text, and Material-UI compliant layout patterns
- **🔍 Comprehensive Validation**: Implemented isValueValid() helper function with switch-case logic validating input based on attribute's dataType including JSON parsing for array/object types
- **⚡ State Reset Management**: Added resetValueInputs() helper clearing all type-specific state variables (newBooleanValue, newNumberValue, newStringValue, newDateValue, newArrayValue, newObjectValue) on dialog close
- **🎨 Uniform Styling**: Consistent borderRadius: 1.5, proper InputLabelProps for date inputs, helper text for each type, and professional spacing matching attribute creation flow
- **🚀 Implementation Scope**: Applied to policy create page (`/policies/create/page.tsx:4267-4412`) and edit page (`/policies/[id]/edit/page.tsx:4510-4655`) ensuring feature parity
- **📍 Multiple Integration Points**: Works across Step 4 Resource Attributes and Step 5 Additional Resource Attributes in both creation and editing workflows
- **✅ Build Success**: Clean TypeScript compilation with zero errors, successful Next.js build generating all 21 static/dynamic routes
- **🔄 Complete Attribute Support**: Extended Attribute interface adding 'array' | 'object' to dataType union type for complete type coverage

## Previous Updates (Version 1.3.17)

### Policy Attribute State Management & Real-Time Dropdown Updates (October 21, 2025)
- **🔧 Additional Resource Attribute Persistence Fix**: Resolved critical issue where additional resource attribute values weren't being saved when editing policies - fixed `handleSubmit` in edit page (`/app/policies/[id]/edit/page.tsx:1313-1338`) to use correct state variables (`selectedAdditionalResourceAttributesList` and `selectedAdditionalResourceAttributeValues`)
- **📊 Policy Detail Page Display Restoration**: Additional resource attributes now display correctly in human-readable format on policy detail page after saving edits with proper attribute ID to displayName resolution ensuring accurate policy information presentation
- **⚡ Instant Attribute Value Dropdown Updates**: Fixed attribute value dropdowns to reflect newly created values immediately without page refresh across all policy creation and edit flow steps for seamless user experience
- **🔄 Comprehensive State Array Synchronization**: Enhanced `handleCreateValue` function to update all 4 state arrays in create page (`attributes`, `selectedAttributes`, `selectedResourceAttributes`, `resourceAttributes`) and 7 state arrays in edit page for complete UI reactivity
- **📝 Multi-Step Dropdown Support**: Attribute value creation now instantly updates dropdowns in Step 4 Subject Attributes, Step 4 Resource Attributes, and Step 5 Additional Resource Attributes ensuring consistency across entire policy workflow
- **🎯 Edit Page State Management Enhancement**: Improved `handleCreateValue` to update `selectedAdditionalResourceAttributesList` for all resources containing the updated attribute preventing stale dropdown data
- **✨ Real-Time User Feedback**: Eliminated manual page refreshes when adding attribute values - changes propagate instantly to all active dropdown components improving workflow efficiency
- **🚀 Complete Flow Coverage**: Fixed instant updates for both subject attributes and resource attributes in policy creation Step 4 ensuring uniform behavior across all attribute types and policy steps

## Previous Updates (Version 1.3.15)

### Additional Resource Attributes Complete Display System (October 18, 2025)
- **📊 Policy Details Enhancement**: Added comprehensive "Additional Resources (Conditions)" section to policy details page displaying each resource with its configured attributes as professional green-bordered chips
- **💬 Natural Language Policy Statements**: Enhanced human-readable policy descriptions to include additional resource attribute conditions in format: "if L3 Ticket (when status is approved and priority is high)"
- **✨ Create Flow Attribute Display**: Updated Review & Create step (Stepper 6) to show additional resource attributes in both human-readable statement and detailed technical details section
- **📝 Edit Flow Attribute Display**: Enhanced Review & Save step in edit flow to display additional resource attributes in human-readable policy summary with proper formatting
- **🎨 Comprehensive Edit Flow UI Overhaul**: Completely redesigned Additional Resources section (Stepper 4) in policy edit page with professional Autocomplete-based attribute selection interface
- **🔍 Advanced Attribute Selection**: Multi-select Autocomplete dropdown with intelligent filtering by 'additional-resource' category, searchable by name, description, type, and category
- **🎯 Data-Type-Specific Controls**: Individual attribute cards with appropriate input controls for different data types - text fields, number inputs, boolean switches, select dropdowns, multi-select Autocomplete
- **➕ Inline Attribute Creation**: "Create New Attribute" button in edit flow that automatically pre-selects 'additional-resource' category for streamlined attribute creation workflow
- **🎨 Professional Visual Indicators**: Color-coded dots for required/optional attributes (red/green), required attribute chips, and polished hover effects on attribute cards
- **🔄 Dual State Management**: Smart handlers that update both new comprehensive state variables and existing data structures for full backward compatibility with previous implementations
- **📭 Empty State Handling**: Professional "No attributes configured" messages displayed for additional resources without any configured attributes
- **🛡️ Backend Category Validation**: Updated Attribute model schema to properly support 'additional-resource' as a valid category in MongoDB enum validation rules
- **✅ Complete Feature Parity**: Achieved full consistency between policy create and edit flows for additional resource attribute management across all policy pages

## Previous Updates (Version 1.3.14)

### Comprehensive Dashboard Implementation (October 15, 2025)
- **📊 Real-Time Data Dashboard**: Complete redesign from static content to dynamic real-time data visualization with live statistics from 8 parallel API endpoints
- **🎨 Beautiful Gradient Cards**: 4 main statistics cards with stunning gradient backgrounds, hover animations, and smooth transitions for Policies, Subjects, Actions, and Resources
- **👋 Professional Welcome Header**: Personalized gradient header with user avatar (initial-based), role badge (Super Admin/Admin/Basic), department chip, and refresh button
- **⚡ Quick Actions Panel**: 4 action buttons with rich descriptions - Create Policy, Test Policy, Settings Configuration, and Activity Log for instant access
- **📈 Policy Status Overview**: Visual progress bars with intelligent color coding displaying Active (green), Draft (yellow), and Inactive (red) policy distribution
- **🕐 Recent Activity Feed**: Dynamic feed displaying latest 5 policy activities with relative timestamps ("Just now", "5 minutes ago", "2 hours ago")
- **✨ Feature Highlights**: 4 informative cards showcasing major features - ABAC Components, Workspace Hierarchy, Additional Resources, and Policy Testing
- **📊 Secondary Statistics Grid**: 4 additional stat cards for Attributes, Workspaces, Users, and Additional Resources with color-coded icon indicators
- **📱 Responsive Flexbox Layout**: Modern Box-based responsive grid system replacing Material-UI Grid for superior browser compatibility and enhanced performance
- **🔗 Interactive Navigation**: All cards are clickable with intelligent route navigation to respective management pages for seamless user workflow
- **🛠️ Material-UI v7 Compatibility**: Complete refactoring using Box and flexbox instead of Grid2/Unstable_Grid2 for improved stability and compatibility
- **⚠️ Comprehensive Error Handling**: User-friendly snackbar notifications, loading states, and graceful error recovery for all API operations
- **🚀 Build System Resolution**: Fixed Material-UI Grid API compatibility issues ensuring clean TypeScript compilation and successful production builds
- **⏱️ Timestamp Formatting**: Smart relative time display with context-aware formatting (minutes, hours, days) for better user experience
- **🎯 Gradient Color Scheme**: Professional gradient designs using purple (#667eea to #764ba2), pink (#f093fb to #f5576c), blue (#4facfe to #00f2fe), and green (#43e97b to #38f9d7)

## 🔄 Previous Updates (Version 1.3.13)

### Policy Edit Flow Feature Parity (October 15, 2025)
- **✨ Complete Edit/Create Parity**: Achieved complete feature parity between policy creation and edit flows across all 6 stepper steps ensuring consistent user experience
- **📝 Step 2 Enhancements**: Added inline attribute creation, value management, and Autocomplete-based attribute selection matching create flow functionality
- **🎯 Step 3 Professional UI**: Replaced basic Switch toggles with elegant Autocomplete multi-select featuring search, filter, and inline action creation capabilities
- **🗃️ Step 4 Resource Management**: Enabled inline resource and resource attribute creation with pre-selected categories for streamlined workflow
- **🔄 Step 5 UI Consistency**: Updated Additional Resources section with professional Card styling, Alert box, Paper wrapper, and reordered grid columns
- **📊 Enhanced Selected Resources**: Detailed Box layout with "Add Attribute" buttons, resource attribute management, and professional empty states
- **🔧 State Management**: Added `selectedAdditionalResourceAttributes` state with comprehensive handler functions for attribute management
- **⚡ Auto-Selection**: Newly created entities automatically added to both resources and additional resources lists with immediate selection
- **🎨 Dual-List Updates**: Resource creation now updates both regular and additional resource lists simultaneously for seamless user experience
- **📦 Bundle Optimization**: Improved code efficiency with better component reuse (16 kB → 13.4 kB in Action Selection step)

## Previous Updates (Version 1.3.11)

### Comprehensive Additional Resources Implementation (September 24, 2025)
- **📊 Additional Resources Management**: Implemented complete tabular view for Additional Resources tab with identical UI/UX to Resources tab including pagination, search, sort, and filter functionality
- **🔄 Dynamic Header System**: Enhanced header section with tab-aware content showing appropriate titles, counts, and button labels for seamless tab switching experience
- **⚡ Backend API Integration**: Created comprehensive Additional Resources API with full CRUD operations, server-side pagination, and advanced filtering capabilities
- **🗃️ Flexible Database Schema**: Designed database model supporting 5 resource types (conditions, states, workflows, templates, rules) with evaluation rules and dependencies for complex policy scenarios
- **🎯 UI Uniformity**: Achieved perfect UI consistency with Resources tab including search section, filter section with popover controls, pagination controls, and professional table headers
- **📝 Professional Modal Design**: Standardized create/edit modal dialogs with consistent styling, proper PaperProps, DialogTitle formatting, and Material-UI design patterns matching other pages
- **🔧 Event-Driven Architecture**: Implemented custom event system (`createAdditionalResource` event) for seamless communication between header create button and table component
- **📱 Responsive Design**: Professional table layout with proper column sizing (Name, Type, Priority, Active status), action buttons, and mobile-friendly responsive behavior
- **🛡️ Role-Based Access**: Integrated workspace-based access control with proper admin/super_admin permission handling and view-only access for basic users
- **⚙️ Advanced Filtering**: Comprehensive filter options by type, priority, category, tags, owner, system status, and workspace/application/environment with Toolbar-based popover interface

## Previous Updates (Version 1.3.10)

### Resources Page Enhancement & Terminology Consistency (September 23, 2025)
- **🏷️ Terminology Standardization**: Renamed "Conditional Resources" to "Additional Resources" throughout entire frontend codebase for better clarity and user understanding
- **🎨 Tabbed Interface Implementation**: Redesigned Resources page with professional Material-UI tabbed interface separating "Resources" and "Additional Resources" for improved organization
- **🗂️ Resource Dependency Tree Removal**: Removed Resource Dependency Tree section from main resources view to reduce visual clutter and improve focus on core functionality
- **📱 Enhanced User Experience**: Clean tab navigation with automatic selection clearing when switching between resource management modes for better state isolation
- **🔧 Component Architecture**: Enhanced AdditionalResourceCard component with improved isolation in dedicated tab for complex policy management
- **⚡ State Management**: Improved tab switching with proper state isolation, clean user interface transitions, and comprehensive selection management
- **🎯 Professional Styling**: Material-UI tabs with consistent borders, typography, and Material Design principles for intuitive navigation and visual consistency
- **🛡️ Backward Compatibility**: Maintained all existing functionality while improving information architecture and user workflow patterns
- **📊 Component Updates**: Updated ResourceDependencyTree type definitions from "conditional" to "additional" for consistent terminology
- **✨ Visual Consistency**: Standardized styling across all resource management interfaces with professional, organized layout design and consistent UI patterns

### Previous Updates (Version 1.3.9) - Professional Attribute Value Management & Enhanced User Experience (September 23, 2025)
- **🎯 Professional Add Value Modal**: Complete redesign of "Add New Attribute Value" modal with modern styling, top-right close button, professional layout, and enhanced accessibility features
- **🔍 Duplicate Value Validation**: Implemented comprehensive case-insensitive duplicate checking with user-friendly error messages preventing duplicate attribute values from being added
- **⚡ Real-Time Dropdown Updates**: Added immediate local state synchronization ensuring newly added values appear instantly in dropdown menus without requiring API refresh or page reload
- **🔧 Backend ObjectId Handling**: Fixed critical TypeScript compilation errors by implementing proper ObjectId validation for custom string IDs vs MongoDB ObjectIds in attribute controllers
- **🛡️ Enhanced API Error Resolution**: Resolved 400 errors in attribute API through improved ID parameter validation, comprehensive null checking, and proper error handling
- **🎨 Consistent Icon Standardization**: Updated FlashOn icon usage across Actions navigation menu, page titles, and policy creation dropdowns for visual consistency and better user experience
- **📊 State Management Enhancement**: Enhanced state synchronization by updating both attributes and selectedAttributes state arrays ensuring complete UI consistency during value additions
- **✨ Modal UX Improvements**: Added professional styling with rounded corners, subtle shadows, descriptive helper text, improved spacing, and Material-UI design best practices
- **🚀 Build System Validation**: Successfully validated compilation of both frontend and backend projects with all TypeScript errors resolved and ESLint compliance verified

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