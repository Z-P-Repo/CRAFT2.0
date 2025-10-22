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
- **Dual Authentication Methods**: Local email/password with bcrypt + Azure AD SSO with Microsoft MSAL integration
- **Advanced JWT System**: Access tokens with automatic refresh, secure session management, persistent storage
- **Azure AD SSO Integration**: Complete OAuth 2.0/OpenID Connect with automatic user provisioning and role mapping
- **Three-tier RBAC System**:
  - **Super Admin**: Full cross-workspace system access and global administration
  - **Admin**: Workspace-scoped administration with user management within assigned workspaces
  - **Basic**: View-only access to assigned workspaces and ABAC entities
- **Workspace-Based Access Control**: Users assigned to specific workspaces with granular permission management
- **Advanced Security**: Secure password hashing, token expiration management, session validation, security headers
- **Cross-Environment User Linking**: Global user IDs with environment-specific assignments
- **Role Inheritance**: Hierarchical permission system with override capabilities

### 📊 Dashboard
- Modern, responsive dashboard with Material-UI
- Collapsible sidebar navigation
- Real-time statistics and analytics
- Mobile-friendly responsive design

### 🏢 Advanced Hierarchical Workspace System
- **Three-Level Architecture**: Workspace → Applications → Environments with complete organizational hierarchy
- **Workspace Features**:
  - Settings management (default environments, domains, SSO, branding)
  - Resource limits (applications, users, policies, storage, API calls)
  - Plan management (Free, Professional, Enterprise) with billing integration
  - Access control (owner/admin roles, workspace-specific assignments)
- **Application Types**: Web, API, Mobile, Desktop, Service, Microservice with environment containers
- **Environment Types**: Development, Testing, Staging, Production, Preview, Hotfix with auto-generation
- **Template System**: Pre-configured workspace templates for quick setup (Web App, Microservices, Simple API)
- **Auto-Generation**: Intelligent environment name generation from display names with consistency validation
- **Unified Settings Wizard**: Single-page setup with enhanced stepper UI and step-by-step guidance
- **Dynamic Context Management**: Real-time workspace switching with authentication-aware state management

### 🏗️ Comprehensive ABAC System
- **Advanced Policy Engine**:
  - 5-step creation wizard (Details → Subjects → Actions → Resources → Conditions)
  - Policy lifecycle management (Draft → Active → Inactive)
  - Complex conditions with multiple operators (equals, contains, greater_than, less_than, in, not_in)
  - Policy inheritance across workspace hierarchy with version control
  - Batch operations and bulk policy management
- **Subject Management**:
  - User management with email, department, manager hierarchy
  - Group-based organization with nested membership
  - Role-based permissions with inheritance
  - Cross-environment user linking with global user IDs
  - Real-time subject creation during policy workflow
- **Resource Management**:
  - Multiple resource types (file, document, api, database, service, folder, application)
  - URI-based resource identification with hierarchical structure
  - Permission matrix (read, write, delete, execute, admin)
  - Classification levels (public, internal, confidential, restricted)
  - Parent-child relationships with inheritance
- **Action System**:
  - Categorized operations (read, write, execute, delete, admin)
  - Risk level classification (low, medium, high, critical)
  - HTTP method and endpoint mapping for API actions
  - System and custom action definitions
- **Advanced Attributes**:
  - Multi-category support (Subject/Resource) with scope management
  - Data types (string, number, boolean, date, array, object)
  - Validation (email, URL, phone) with custom validators
  - Constraints (length, ranges, regex, enum values)
  - Scope inheritance (environment, application, workspace-level)
  - Real-time attribute value management with duplicate prevention

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

### 🔧 Advanced Technical Stack

#### **Frontend Architecture**
- **Framework**: Next.js 15.4.6 with React 19.0.0 and App Router
- **Language**: TypeScript 5.5.4 with strict type checking
- **UI Library**: Material-UI v7.3.1 with Emotion styling engine
- **State Management**: Zustand 5.0.2 with React Context for global state
- **HTTP Client**: Axios 1.7.7 with automatic retry and intelligent error handling
- **Form Management**: React Hook Form 7.53.2 with Yup validation schemas
- **Data Fetching**: TanStack React Query 5.59.16 for server state management
- **Date Handling**: Date-fns 4.1.0 for comprehensive date manipulation

#### **Backend Architecture**
- **Runtime**: Node.js 18+ with Express.js 4.19.2 framework
- **Language**: TypeScript 5.5.4 with strict compilation settings
- **Database**: MongoDB 8.5.2 with Mongoose ODM for data modeling
- **Authentication**: JWT with bcrypt password hashing and refresh token support
- **Security**: Helmet for security headers, CORS configuration, advanced rate limiting
- **Session Management**: Express-session with Redis support for scalability
- **Dependency Injection**: Inversify 6.0.2 for IoC container management
- **Validation**: Joi 17.13.3 and express-validator 7.1.0 for data validation

#### **Performance & Security**
- **API Optimization**: Request batching, deduplication, intelligent caching with Redis
- **Search Performance**: 300ms debouncing across all search interfaces
- **Rate Limiting**: Configurable limits with exponential backoff and 429 error handling
- **Security Features**: XSS protection, SQL injection prevention, input sanitization
- **Caching Strategy**: Multi-layer caching (browser, API, database) for optimal performance
- **Bundle Optimization**: Tree shaking, dynamic imports, and code splitting

#### **Testing & Quality**
- **Frontend Testing**: Jest 29 + React Testing Library 16 with 95% coverage requirements
- **Backend Testing**: Jest 29 with TypeScript support and in-memory MongoDB
- **Quality Assurance**: ESLint strict rules, Prettier formatting, pre-commit hooks
- **Visual Testing**: Storybook 8.4.7 for component documentation and testing
- **Performance Testing**: API optimization tests and debouncing verification

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
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Azure AD SSO (optional)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

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
   Backend will run on http://localhost:3001

3. **Start the frontend**:
   ```bash
   cd craft-frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

### Production Build

```bash
# Backend
cd craft-backend
npm run build
PORT=3001 npm start

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
   # Kill process on port 3001 (backend)
   lsof -ti:3001 | xargs kill -9

   # Kill process on port 3000 (frontend)
   lsof -ti:3000 | xargs kill -9
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
   - Verify backend is running on port 3001
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

*Last updated: October 22, 2025*
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*

## ⭐ Latest Updates

### Version 1.3.18 - Data-Type-Aware Attribute Value Management & DateTime Support (October 22, 2025)
- **🎯 Intelligent Value Input Dialogs**: Implemented data-type-aware "Add Value" dialogs that adapt based on attribute type across policy creation and edit flows
- **🔢 Type-Specific Input Controls**: Boolean attributes show Select dropdown (true/false), Number attributes use numeric input with validation, String attributes use standard text fields
- **📅 Enhanced Date-Time Support**: Date attributes now use datetime-local input allowing users to select both date and time for precise timestamp values
- **📝 JSON Input for Complex Types**: Array and object attributes feature multiline textarea with monospace font (Monaco/Lucida Console) for JSON input with real-time validation
- **✨ Professional UX Design**: All input dialogs include data-type labels, helper text, and appropriate placeholders matching attribute creation flow patterns
- **🔍 Smart Validation**: Type-specific validation ensuring boolean selections are made, numbers are valid, dates are selected, and JSON is properly formatted
- **🎨 Consistent Styling**: Uniform dialog design with borderRadius: 1.5, proper spacing, and Material-UI theming across all data types
- **⚡ State Management**: Enhanced resetValueInputs() and isValueValid() helper functions managing separate state variables for each data type
- **🚀 Complete Coverage**: Applied consistently to Step 4 (Resource Attributes) and Step 5 (Additional Resource Attributes) in both create and edit flows
- **✅ Build Verification**: Successfully compiled frontend with all TypeScript validations passing and zero build errors

### Version 1.3.17 - Policy Attribute State Management & Real-Time Dropdown Updates (October 21, 2025)
- **🔧 Additional Resource Attribute Persistence**: Fixed critical bug where additional resource attributes weren't saving when editing policies - updated handleSubmit to use correct state variables
- **📊 Policy Detail Page Display**: Additional resource attributes now display correctly in human-readable format after saving policy edits with proper attribute name resolution
- **⚡ Instant Dropdown Updates**: New attribute values now appear immediately in dropdowns without page refresh across all policy creation and edit steps
- **🔄 State Synchronization**: Enhanced handleCreateValue to update 4 state arrays in create page and 7 state arrays in edit page for complete UI reactivity
- **📝 Multi-Step Coverage**: Attribute value creation instantly updates Subject Attributes, Resource Attributes, and Additional Resource Attributes dropdowns
- **🎯 Edit Page Enhancement**: Improved state management to update selectedAdditionalResourceAttributesList for all resources with the updated attribute
- **✨ User Experience**: Eliminated manual page refreshes - attribute value changes propagate instantly to all active dropdown components
- **🚀 Complete Workflow**: Both subject and resource attributes in Step 4 now update instantly ensuring uniform behavior across all attribute types

### Version 1.3.14 - Comprehensive Dashboard Implementation (October 15, 2025)
- **📊 Real-Time Data Visualization**: Complete dashboard redesign from static content to dynamic real-time data visualization with live statistics from 8 parallel API endpoints
- **🎨 Beautiful Gradient Cards**: 4 main statistics cards with stunning gradient backgrounds (purple, pink, blue, green), hover animations, and smooth transitions
- **👋 Professional Welcome Header**: Personalized gradient header with user avatar (initial-based), role badge display, department chip, and refresh button functionality
- **⚡ Quick Actions Panel**: 4 action buttons with rich descriptions - Create Policy, Test Policy, Settings Configuration, and Activity Log for instant user access
- **📈 Policy Status Overview**: Visual progress bars with intelligent color coding displaying Active (green), Draft (yellow), and Inactive (red) policy distribution
- **🕐 Recent Activity Feed**: Dynamic feed displaying latest 5 policy activities with relative timestamps ("Just now", "5 minutes ago", "2 hours ago")
- **✨ Feature Highlights**: 4 informative cards showcasing major platform features - ABAC Components, Workspace Hierarchy, Additional Resources, and Policy Testing
- **📊 Secondary Statistics Grid**: 4 additional stat cards for Attributes, Workspaces, Users, and Additional Resources with color-coded icon indicators and route navigation
- **📱 Responsive Flexbox Layout**: Modern Box-based responsive grid system replacing Material-UI Grid for superior browser compatibility and enhanced rendering performance
- **🔗 Interactive Navigation**: All cards are clickable with intelligent route navigation to respective management pages ensuring seamless user workflow
- **🛠️ Material-UI v7 Compatibility**: Complete refactoring using Box and flexbox instead of Grid2/Unstable_Grid2 for improved stability and cross-browser compatibility
- **⚠️ Comprehensive Error Handling**: User-friendly snackbar notifications, loading states, graceful error recovery, and proper API error messages
- **🚀 Build System Resolution**: Fixed Material-UI Grid API compatibility issues in frontend and TypeScript compilation errors in backend ensuring clean builds
- **🔧 Backend TypeScript Fixes**: Resolved 17 user ID reference errors (user?.id → user?._id) and Map-to-Object type conversions in Additional Resources
- **⏱️ Smart Timestamp Formatting**: Context-aware relative time display with intelligent formatting (minutes, hours, days) for better user experience
- **🎯 Professional Color Scheme**: Consistent gradient designs using purple, pink, blue, and green color palettes matching Material-UI design principles

### Version 1.3.13 - Policy Edit Flow Complete Feature Parity (October 15, 2025)
- **📝 Enhanced Policy Edit Workflow**: Complete UI consistency achieved across all 5 stepper steps with streamlined navigation and improved user experience
- **🎯 Inline Entity Creation**: Added inline creation capabilities for Subjects, Actions, Resources, and Attributes directly within policy edit flow, eliminating context switching
- **⚡ State Management Enhancement**: Comprehensive state handling for additional resource attributes with proper TypeScript typing and validation
- **🎨 UI Uniformity**: Standardized Card styling, Alert boxes, Paper wrappers, and Grid layouts across all policy edit steps matching create flow exactly
- **🔄 Additional Resources Parity**: Complete Step 5 implementation with Selected/Available resources grid layout and comprehensive attribute management
- **🛡️ Error Resolution**: Fixed critical ReferenceErrors in policy edit flow with proper state variable declarations and handler function implementations
- **📊 Professional Layout**: Consistent Grid column ordering with Available resources (md:5) on left and Selected resources (md:7) on right for optimal UX
- **🎯 Attribute Management**: Added comprehensive attribute selection handlers and delete functions for managing additional resource attributes
- **📱 Responsive Design**: Enhanced mobile-friendly layouts with proper Material-UI grid breakpoints and responsive behavior
- **✅ Complete Feature Parity**: All policy edit features now match policy creation with identical user experience and interaction patterns

### Version 1.3.12 - Human-Readable Policy Display Format (October 14, 2025)
- **📝 Unified Policy Format**: Implemented consistent human-readable policy display format across policy list, detail pages, and creation wizard
- **✨ Stepper 6 Format Matching**: Policy display now matches exact format from Review & Create step (Stepper 6) throughout the application
- **🎯 Professional Sentence Structure**: Complete natural language sentences showing ALLOWS/DENIES, subjects with conditions, actions, resources with attributes, and additional resources
- **🔧 Policy Formatter Utility**: Created centralized policy formatter utility (/src/utils/policyFormatter.ts) for consistent formatting logic
- **📊 Detail Page Enhancement**: Updated policy detail page to generate sentence exactly matching stepper 6 format using subjects/actions/resources arrays
- **🎨 Attribute Formatting**: Proper formatting for subject attributes (when...) and resource attributes (where...) with comma-separated conditions and "and" before last item
- **📱 Grammar Handling**: Intelligent grammar for multiple items (1 item, 2 items with "and", 3+ items with commas and "and")
- **🔄 Action Name Display**: Lowercase action names with proper connector text ("to perform ... actions on")
- **✅ Build Verification**: Successfully validated both frontend and backend builds with all TypeScript errors resolved
- **🎭 Single-Line Display**: Clean, professional single-line policy descriptions replacing technical "1, 2, 3" section format

### Version 1.3.10 - Resources Page Enhancement & Terminology Consistency (September 23, 2025)
- **🏷️ Terminology Standardization**: Renamed "Conditional Resources" to "Additional Resources" throughout entire codebase for better clarity and user understanding
- **🎨 Tabbed Interface Implementation**: Redesigned Resources page with professional tabbed interface separating "Resources" and "Additional Resources" for improved organization
- **🗂️ Resource Dependency Tree Removal**: Removed Resource Dependency Tree section from main resources view to reduce visual clutter and improve focus
- **📱 Enhanced User Experience**: Clean tab navigation with automatic selection clearing when switching between resource management modes
- **🔧 Comprehensive Code Updates**: Updated frontend components, backend models, services, and database schemas with consistent "additional" terminology
- **⚡ State Management**: Improved tab switching with proper state isolation and clean user interface transitions
- **🎯 Professional Styling**: Material-UI tabs with consistent borders, typography, and Material Design principles for intuitive navigation
- **🛡️ Backward Compatibility**: Maintained all existing functionality while improving information architecture and user workflow
- **📊 Component Architecture**: Enhanced AdditionalResourceCard component with improved isolation in dedicated tab for complex policy management
- **✨ Visual Consistency**: Standardized styling across all resource management interfaces with professional, organized layout design

### Version 1.3.9 - Professional Attribute Value Management & Enhanced User Experience (September 23, 2025)
- **🎯 Professional Add Value Modal**: Complete redesign of "Add New Attribute Value" modal with modern styling, close button in top-right corner, and professional layout
- **🔍 Duplicate Value Validation**: Implemented case-insensitive duplicate checking with user-friendly error messages preventing duplicate attribute values
- **⚡ Real-Time Dropdown Updates**: Added immediate local state updates ensuring newly added values appear instantly in dropdown without API refresh delays
- **🔧 Backend ObjectId Handling**: Fixed TypeScript compilation errors by adding proper ObjectId validation for custom string IDs vs MongoDB ObjectIds
- **🛡️ Enhanced API Error Handling**: Resolved 400 errors in attribute API by improving ID parameter validation and null checking
- **🎨 Consistent Icon Updates**: Standardized FlashOn icon usage across Actions navigation, page title, and policy creation dropdowns for visual consistency
- **📊 State Management Enhancement**: Updated both attributes and selectedAttributes state arrays for complete UI consistency during value additions
- **✨ Modal UX Improvements**: Added professional styling with rounded corners, shadows, helper text, and enhanced accessibility features
- **🚀 Build System Validation**: Successfully validated both frontend and backend builds with all TypeScript errors resolved

### Version 1.3.11 - Comprehensive Additional Resources Implementation (September 24, 2025)
- **📊 Additional Resources Management**: Implemented complete tabular view for Additional Resources tab with identical UI/UX to Resources tab
- **🔄 Dynamic Header System**: Enhanced header section with tab-aware content showing appropriate titles, counts, and button labels
- **⚡ Backend API Integration**: Created comprehensive Additional Resources API with full CRUD operations, pagination, search, sort, and filter functionality
- **🗃️ Flexible Database Schema**: Designed database model supporting 5 resource types (conditions, states, workflows, templates, rules) with evaluation rules and dependencies
- **🎯 UI Uniformity**: Achieved perfect UI consistency with Resources tab including search section, filter section, pagination controls, and table headers
- **📝 Professional Modal Design**: Standardized create/edit modal dialogs with consistent styling matching other pages throughout the application
- **🔧 Event-Driven Architecture**: Implemented custom event system for seamless communication between header create button and table component
- **📱 Responsive Design**: Professional table layout with proper column sizing, action buttons, and mobile-friendly responsive behavior
- **🛡️ Role-Based Access**: Integrated workspace-based access control with proper admin/super_admin permission handling
- **⚙️ Advanced Filtering**: Comprehensive filter options by type, priority, category, tags, owner, and system status with popover-based UI

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