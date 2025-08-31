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

## Project Structure
- Frontend: `/craft-frontend` (Next.js 15, TypeScript, Material-UI, Azure AD MSAL)
- Backend: `/craft-backend` (Node.js, Express, TypeScript, MongoDB, Azure AD SSO)

## Build Commands
- Frontend: `cd craft-frontend && npm run build`
- Backend: `cd craft-backend && npm run build`

## Development Commands
- Frontend: `cd craft-frontend && npm run dev`
- Backend: `cd craft-backend && npm run dev`