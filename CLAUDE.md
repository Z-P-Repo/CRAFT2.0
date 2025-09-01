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
- This will run all tests with full coverage reporting
- Tests use Jest and React Testing Library for comprehensive coverage

### "deploy"
When user prompts "deploy", prepare the application for production deployment:
1. Run build commands for both projects
2. Verify all tests pass
3. Check environment configuration
4. Ensure no build warnings or errors

## Project Structure
- Frontend: `/craft-frontend` (Next.js 15.4.6, TypeScript, Material-UI v6, Azure AD MSAL, Jest Testing)
- Backend: `/craft-backend` (Node.js, Express, TypeScript, MongoDB, Azure AD SSO, Rate Limiting)

## Latest Features (v1.2.0)
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