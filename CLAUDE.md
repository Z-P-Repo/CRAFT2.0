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

## Latest Features (v1.3.0)
- Multiple API call optimization with intelligent request batching and deduplication
- Standardized search debouncing (300ms) across all pages for optimal performance
- Enhanced boolean attribute display with improved visual indicators
- Comprehensive error handling and local state management improvements
- Improved policy creation with advanced searchable dropdowns
- Full Jest configuration with React Testing Library for robust testing
- Enhanced UI/UX polish with refined interaction patterns

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
- Frontend: `cd craft-frontend && npm run dev`
- Backend: `cd craft-backend && npm run dev`