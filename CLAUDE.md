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
- Frontend: `/craft-frontend` (Next.js 15.4.6, TypeScript 5.5, Material-UI v7, Azure AD MSAL, Jest 29 Testing)
- Backend: `/craft-backend` (Node.js 18+, Express 4.19, TypeScript 5.5, MongoDB 7.0+, Azure AD SSO, Advanced Rate Limiting)

## Latest Features (v1.3.6)
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
- Frontend: `cd craft-frontend && npm run dev` (runs on port 3002)
- Backend: `cd craft-backend && PORT=3005 npm run dev` (runs on port 3005)