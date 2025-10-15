# Claude Code Configuration

This file contains custom command configurations for Claude Code interactions with this project.

## Custom Commands

### "build"
When user prompts "build", fix all build errors for both frontend and backend:
1. Run build commands for both projects
2. Fix any TypeScript compilation errors
3. Fix any ESLint configuration issues
4. Ensure both projects build successfully

### "update"
When user prompts "update", update all .md files:
1. Update all README files with current project information
2. Update documentation with latest features and changes
3. Ensure consistency across all markdown documentation

### "test"
When user prompts "test", run the comprehensive test coverage command:
- Command: `npm run test:coverage`
- This will run all tests with full coverage reporting including performance tests
- Tests use Jest 29 and React Testing Library 16 for comprehensive coverage
- Includes API optimization tests and debouncing verification
- Tests cover request deduplication and error handling scenarios

### "deploy"
When user prompts "deploy", prepare the application for production deployment:
1. Run build commands for both projects
2. Verify all tests pass
3. Check environment configuration
4. Ensure no build warnings or errors

## Project Structure
- **Frontend**: `/craft-frontend` (Next.js 15.4.6, React 19, TypeScript 5.5.4, Material-UI v7.3.1, Azure AD MSAL, Jest 29, React Testing Library 16)
- **Backend**: `/craft-backend` (Node.js 18+, Express 4.19.2, TypeScript 5.5.4, MongoDB 8.5.2, Mongoose ODM, Azure AD SSO, Advanced Rate Limiting, Redis Caching)
- **Additional**: Zustand state management, TanStack React Query, Axios HTTP client, React Hook Form, Yup validation, Storybook, ESLint, Prettier

## Latest Features (v1.3.14)
- **Comprehensive Dashboard Implementation**: Complete redesign of dashboard from static content to real-time data visualization
- **Real-Time Statistics**: Live data fetching from 8 API endpoints in parallel (policies, subjects, actions, resources, additional resources, attributes, workspaces, users)
- **Beautiful Gradient Cards**: 4 main statistics cards with stunning gradient backgrounds and hover animations for Policies, Subjects, Actions, and Resources
- **Professional Welcome Header**: Personalized gradient header with user avatar, role badge, department chip, and refresh button
- **Quick Actions Panel**: 4 action buttons with descriptions for Create Policy, Test Policy, Settings, and Activity Log
- **Policy Status Overview**: Visual progress bars with color coding showing Active (green), Draft (yellow), and Inactive (red) policy distribution
- **Recent Activity Feed**: Dynamic feed showing latest 5 policy activities with relative timestamps ("Just now", "5 minutes ago")
- **Feature Highlights**: 4 informative cards showcasing ABAC Components, Workspace Hierarchy, Additional Resources, and Policy Testing
- **Secondary Statistics Grid**: 4 additional stat cards for Attributes, Workspaces, Users, and Additional Resources with icon indicators
- **Responsive Flexbox Layout**: Box-based responsive grid system replacing Material-UI Grid for better browser compatibility and performance
- **Interactive Navigation**: All cards clickable with route navigation to respective pages for seamless user experience
- **Material-UI v7 Compatibility**: Complete refactoring to use Box and flexbox instead of Grid2/Unstable_Grid2 for better stability
- **Error Handling**: Comprehensive error handling with user-friendly snackbar notifications and loading states
- **Build System Fix**: Resolved Material-UI Grid API compatibility issues ensuring clean production builds

## Previous Features (v1.3.13)
- **Policy Edit Flow Feature Parity**: Complete feature parity between policy creation and edit flows across all 6 steps
- **Step 2 - Attribute Management**: Added inline attribute creation and value management in edit flow matching create flow functionality
- **Step 2 - Autocomplete Selection**: Implemented attribute selection dropdown before displaying configuration cards for consistent UX
- **Step 2 - Add Value Button**: Fixed "Add Value" button placement to show for all enum-type attributes (both single and multi-value)
- **Step 3 - Professional Action Selection**: Replaced basic Switch toggles with elegant Autocomplete multi-select with search and filter
- **Step 3 - Action Creation**: Added "Create New Action" button for inline action creation directly from edit flow
- **Step 4 - Resource Creation**: Enabled inline resource creation with "Create New Resource" button in resource selection step
- **Step 4 - Resource Attribute Creation**: Added "Create New Resource Attribute" button with pre-selected 'resource' category
- **Step 5 - UI Consistency**: Updated Additional Resources section with professional Card styling, Alert box, and Paper wrapper
- **Step 5 - Grid Order Fix**: Reordered columns - Available Resources (left, md:5) and Selected Resources (right, md:7)
- **Step 5 - Selected Resources Display**: Enhanced with detailed Box layout, "Add Attribute" buttons, and resource attribute management
- **Step 5 - Empty State**: Added professional empty state with centered icon and helpful messaging
- **State Management**: Added `selectedAdditionalResourceAttributes` state for managing attributes of additional resources
- **Handler Functions**: Implemented `handleAdditionalResourceDelete` and `handleAdditionalResourceAttributeSelection` for complete functionality
- **Auto-Selection**: Newly created entities automatically added to both resources and additional resources lists with immediate selection
- **Dual-List Updates**: Resource creation now updates both regular and additional resource lists simultaneously for seamless UX
- **Bundle Optimization**: Improved code efficiency with better component reuse (16 kB → 13.4 kB in Action Selection)

## Previous Features (v1.3.12)
- **Human-Readable Policy Display**: Implemented consistent policy display format matching Stepper 6 (Review & Create) across all pages
- **Policy Formatter Utility**: Created centralized policy formatting logic at /craft-frontend/src/utils/policyFormatter.ts for consistent sentence generation
- **Natural Language Sentences**: Complete natural language policy descriptions showing "This policy ALLOWS [subjects] (when [conditions]) to perform [actions] actions on [resources] (where [attributes]) and on additional resources [resources]"
- **Grammar Intelligence**: Proper handling of 1 item, 2 items with "and", 3+ items with commas and final "and" across subjects, actions, resources
- **Attribute Formatting**: Subject attributes display as "(when ...)" and resource attributes as "(where ...)" with comma-separated conditions
- **Lowercase Actions**: Action names displayed in lowercase with proper connector text "to perform ... actions on"
- **Single-Line Format**: Replaced technical "1, 2, 3" section format with professional single-line policy summaries
- **Detail Page Enhancement**: Updated policy detail page (/app/policies/[id]/page.tsx) to match exact stepper 6 sentence structure

## Latest Features (v1.3.11)
- **Additional Resources Complete Implementation**: Fully implemented Additional Resources functionality with comprehensive tabular view, backend API integration, and database schema
- **Dynamic Header System**: Intelligent header that adapts content (title, description, stats, button) based on active tab with proper routing to respective create dialogs
- **Professional Table UI**: Complete table implementation with uniform styling matching Resources page including header design, pagination, search, filter, and sort functionality
- **Backend API Integration**: Full CRUD operations with MongoDB schema supporting 5 resource types (Condition, State, Approval, Status, Ticket) with flexible attributes system
- **UI Uniformity Enhancements**: Standardized all UI components including toolbar, filter popovers, table headers, pagination styling, and modal dialogs to match application-wide patterns
- **Modal Dialog Consistency**: Updated Additional Resources dialogs with standard Paper styling, proper spacing, enhanced shadows, and Material-UI compliant layout patterns
- **Create Button Integration**: Restored header-based create functionality with custom event system for seamless tab-to-component communication and consistent user experience
- **Filter System Standardization**: Implemented Box-based filter layout with Typography sections matching Users page pattern for Type and Status filtering with proper checkbox behavior
- **Database Schema Design**: Flexible schema with evaluation rules, dependencies, workspace hierarchy integration, and comprehensive metadata tracking for complex policy conditions

## Previous Features (v1.3.9)
- **Professional Add Value Modal**: Complete redesign of attribute value creation modal with modern styling, top-right close button, and enhanced user experience
- **Duplicate Value Validation**: Case-insensitive duplicate checking with user-friendly error messages preventing duplicate attribute values from being added
- **Real-Time State Updates**: Immediate local state synchronization ensuring newly added values appear instantly in dropdowns without API refresh delays
- **Backend ObjectId Handling**: Fixed TypeScript compilation errors by implementing proper ObjectId validation for custom string IDs vs MongoDB ObjectIds
- **Enhanced API Error Resolution**: Resolved 400 errors in attribute API through improved ID parameter validation and comprehensive null checking
- **Icon Consistency**: Standardized FlashOn icon usage across Actions navigation, page titles, and policy creation dropdowns for visual uniformity
- **State Management Enhancement**: Updated both attributes and selectedAttributes state arrays ensuring complete UI consistency during value additions
- **Modal UX Improvements**: Professional styling with rounded corners, shadows, descriptive helper text, and enhanced accessibility features
- **Build System Validation**: Successfully validated compilation of both frontend and backend projects with all TypeScript errors resolved

## Previous Features (v1.3.7)
- **Comprehensive Pagination System**: Advanced server-side pagination for workspaces page with search, filtering, and sorting capabilities
- **Global Workspace Validation**: Enhanced workspace name validation checking ALL workspaces system-wide to prevent duplicates
- **Admin Access Control Fix**: Resolved workspace hierarchy access issues allowing admin users to view applications properly
- **Pagination Performance Enhancement**: Fixed double pagination conflicts and restored missing API calls in users page
- **Real-time Validation UI**: Implemented instant workspace name validation with Material-UI error styling and feedback
- **Filter/Sort Uniformity**: Implemented identical Toolbar-based filter and sort system in workspaces page matching users page with popover menus
- **UI Refinement**: Removed Clear button from workspaces filter section for cleaner interface while maintaining full functionality

## Previous Features (v1.3.6)
- **Workspace Visibility Fix**: Automatic assignment of admin-created workspaces to their creators, preventing access issues
- **User Assignment Management**: New endpoints for assigning/unassigning users to workspaces with comprehensive validation
- **Workspace Access Control**: Enhanced workspace visibility logic with proper role-based access restrictions
- **Stepper Button Uniformity**: Standardized navigation button styling across workspace and policy creation wizards
- Role-based access control (RBAC) with three user roles: super_admin, admin, basic
- Basic users have view-only access to all ABAC entities within assigned workspaces
- Admin users restricted to their assigned workspaces, no longer have super admin privileges
- Environment API fix - resolved critical API connection issue (port 3001 → 3005)
- Enhanced workspace-based access control across all backend controllers
- UI role filtering with conditional rendering of create/edit/delete actions
- Workspace assignment system preserving existing assignments during updates

## Previous Features (v1.3.3)
- Environment name auto-generation from display names ensuring consistency across workspace hierarchy
- Synchronized environment display names and internal names for improved user experience
- Fixed silent environment creation failures during workspace setup with comprehensive error tracking
- Enhanced workspace creation reliability with better error reporting and recovery mechanisms
- Improved environment validation with automatic name normalization and sanitization
- Consistent environment naming pattern matching application auto-generation for platform consistency
- Better error tracking for failed environments during bulk creation operations with detailed reporting

## Previous Features (v1.3.1)
- Consistent dropdown format across all policy creation dropdowns (Subjects, Actions, Resources) showing only essential information
- Subject selection dropdowns now show only displayName + email for cleaner interface
- Action selection dropdowns display only displayName + description without category/risk clutter
- Resource selection dropdowns show only displayName + description/URI without type information
- Added cancel confirmation dialog when canceling policy creation to prevent accidental data loss
- Fixed all TypeScript compilation errors and ESLint warnings across frontend and backend projects
- Enhanced resources table real-time updates after user interactions including delete operations
- Resolved MongoDB ObjectId type conversion issues in migration scripts with proper error handling
- Fixed React useEffect/useCallback missing dependencies for better performance and reliability
- Improved build system stability with streamlined compilation processes

## Previous Features (v1.3.0)
- Hierarchical workspace system with complete Workspace → Applications → Environments architecture
- Unified settings page with step-by-step setup wizard and template system
- Multiple API call optimization with intelligent request batching and deduplication
- Standardized search debouncing (300ms) across all pages for optimal performance
- Enhanced boolean attribute display with improved visual indicators
- Comprehensive error handling and local state management improvements

## Previous Features (v1.2.0)
- Enhanced 5-step policy creation wizard with separated Action & Resource selection
- Advanced rate limiting and 429 error handling with exponential backoff  
- Comprehensive test coverage with Jest and React Testing Library
- Attribute system with conditional scope selection and category filtering
- Performance optimization with resolved infinite API call issues

## Build Commands
- Frontend: `cd craft-frontend && npm run build`
- Backend: `cd craft-backend && npm run build`

## Development Commands
- Frontend: `cd craft-frontend && npm run dev` (runs on port 3000)
- Backend: `cd craft-backend && npm run dev` (runs on port 3001)