# CRAFT Backend - Permission System API

A robust, scalable Node.js backend API for the CRAFT (Attribute-Based Access Control) Permission System. Built with Express.js, TypeScript, MongoDB, and comprehensive security features.

![Version](https://img.shields.io/badge/version-1.3.15-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![Express](https://img.shields.io/badge/Express-4.19-black.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)
![Jest](https://img.shields.io/badge/Jest-29-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **🔐 JWT Authentication** with refresh tokens and secure password hashing
- **📋 ABAC Policy Engine** - Comprehensive Attribute-Based Access Control
- **👥 User Management** - Complete user, role, and permission system with three-tier roles (Super Admin, Admin, Basic)
- **🔑 User Registration** - Public registration endpoint with default Basic role assignment
- **🛡️ Role Management** - Hierarchical role change functionality with strict permission validation
- **🔒 Permission Control** - Basic users have view-only access; Admin/Super Admin have full CRUD access
- **📱 Advanced API Optimization** - Multiple API call prevention, intelligent request batching, and standardized debouncing
- **📁 Resource Management** - Handle files, databases, APIs, and system resources with enhanced performance and comprehensive Additional Resources functionality
- **⚡ Action Framework** - Categorized system actions with risk assessment and optimized response times
- **🏷️ Enhanced Attribute System** - Multi-category attribute management (Subject/Resource) with conditional scope selection, category filtering, and improved boolean attribute handling
- **📊 Policy Dependency Tracking** - Real-time policy count display and dependency visualization across all entities
- **🔒 Deletion Protection** - Prevents deletion of entities (subjects, actions, resources, attributes) currently referenced in active policies
- **🎨 Standardized UI Integration** - Backend supports frontend's standardized delete confirmation dialogs with consistent error responses and system protection features
- **🏢 Hierarchical Architecture** - Multi-tenant workspace system with complete Workspace → Applications → Environments hierarchy and comprehensive context integration
- **⚙️ Settings Management** - Unified API endpoints for creating complete workspace hierarchies with transaction support and template system
- **🏗️ Environment Management** - Intelligent environment name auto-generation, comprehensive error tracking, and robust creation workflows with silent failure resolution
- **🚀 Advanced API Performance** - Intelligent request batching, deduplication, and optimized MongoDB queries for enhanced performance
- **⚡ Request Optimization** - Sophisticated caching mechanisms, response compression, and database query optimization
- **🎯 Enhanced Boolean Support** - Improved backend handling of boolean attributes with enhanced validation and serialization
- **🧪 Policy Evaluation** - Real-time policy testing and validation
- **📊 Comprehensive Logging** - Structured logging with Winston
- **🛡️ Enhanced Security Features** - Advanced rate limiting with exponential backoff, CORS, helmet, comprehensive input validation, 429 error protection, and request deduplication security
- **📄 API Documentation** - Complete OpenAPI/Swagger documentation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- npm 9+

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd craft-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## ⚙️ Configuration

Update the `.env` file with your settings:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/craft-permission-system

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3005
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3002
```

## 🚀 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database with sample data
npm run seed

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
src/
├── controllers/      # Route controllers
│   ├── ActionController.ts    # Actions CRUD operations
│   ├── AttributeController.ts # Attributes management
│   ├── AuthController.ts      # Authentication operations
│   ├── PolicyController.ts    # Policy management
│   ├── ResourceController.ts  # Resources CRUD
│   ├── SubjectController.ts   # Subjects management
│   └── UserController.ts      # User management and role changes
├── models/          # MongoDB models
│   ├── Action.ts       # Action data model
│   ├── Application.ts  # Application/Project data model
│   ├── Attribute.ts    # Attribute data model
│   ├── Environment.ts  # Environment data model
│   ├── Policy.ts       # Policy data model
│   ├── Resource.ts     # Resource data model
│   ├── Subject.ts      # Subject data model
│   ├── User.ts         # User data model with role management
│   └── Workspace.ts    # Workspace data model
├── routes/          # API routes
│   ├── actionRoutes.ts    # Action endpoints
│   ├── attributeRoutes.ts # Attribute endpoints
│   ├── auth.ts           # Authentication endpoints
│   ├── policyRoutes.ts    # Policy endpoints
│   ├── resourceRoutes.ts  # Resource endpoints
│   ├── settings.ts        # Workspace settings/setup endpoints
│   ├── subjectRoutes.ts   # Subject endpoints
│   └── userRoutes.ts     # User management endpoints
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware
│   └── security.ts  # Security middleware
├── scripts/         # Database scripts
│   ├── seed.ts      # Seed sample data
│   └── seeds/       # Seed data files
│       └── userSeed.ts  # User seed data with all roles
├── config/          # Configuration files
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API request throttling
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Secure error responses

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration (creates Basic role user by default)
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/validate-token` - Validate JWT token
- `POST /api/v1/auth/change-password` - Change user password

### Users
- `GET /api/v1/users` - List users with pagination and role filtering
- `POST /api/v1/users` - Create new user (Admin/Super Admin only)
- `GET /api/v1/users/:id` - Get specific user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/role` - Change user role (Admin/Super Admin only)

### Policies
- `GET /api/v1/policies` - List policies with pagination, filtering, and sorting
- `POST /api/v1/policies` - Create new policy
- `GET /api/v1/policies/:id` - Get specific policy
- `PUT /api/v1/policies/:id` - Update policy
- `DELETE /api/v1/policies/:id` - Delete policy
- `DELETE /api/v1/policies/bulk` - Bulk delete policies

### Subjects
- `GET /api/v1/subjects` - List subjects with pagination and policy count tracking
- `POST /api/v1/subjects` - Create new subject
- `GET /api/v1/subjects/:id` - Get specific subject with policy dependency information
- `PUT /api/v1/subjects/:id` - Update subject
- `DELETE /api/v1/subjects/:id` - Delete subject (with policy dependency protection)

### Actions
- `GET /api/v1/actions` - List actions with pagination and policy count tracking
- `POST /api/v1/actions` - Create new action
- `GET /api/v1/actions/:id` - Get specific action with policy dependency information
- `PUT /api/v1/actions/:id` - Update action
- `DELETE /api/v1/actions/:id` - Delete action (with policy dependency protection)

### Resources
- `GET /api/v1/resources` - List resources with pagination and policy count tracking
- `POST /api/v1/resources` - Create new resource
- `GET /api/v1/resources/:id` - Get specific resource with policy dependency information
- `PUT /api/v1/resources/:id` - Update resource
- `DELETE /api/v1/resources/:id` - Delete resource (with policy dependency protection)

### Additional Resources
- `GET /api/v1/additional-resources` - List additional resources with pagination, search, sort, and filter functionality
- `POST /api/v1/additional-resources` - Create new additional resource (Admin/Super Admin only)
- `GET /api/v1/additional-resources/:id` - Get specific additional resource
- `PUT /api/v1/additional-resources/:id` - Update additional resource (Admin/Super Admin only)
- `DELETE /api/v1/additional-resources/:id` - Delete additional resource (Admin/Super Admin only)
- `DELETE /api/v1/additional-resources/bulk/delete` - Bulk delete additional resources (Admin/Super Admin only)
- `GET /api/v1/additional-resources/type/:type` - Get additional resources by type with environment filtering
- `POST /api/v1/additional-resources/:id/evaluate` - Evaluate additional resource with context
- `GET /api/v1/additional-resources/stats` - Get additional resources statistics by workspace/application/environment

### Attributes
- `GET /api/v1/attributes` - List attributes with pagination, filtering, and policy count tracking
- `POST /api/v1/attributes` - Create new attribute
- `GET /api/v1/attributes/:id` - Get specific attribute with policy dependency information
- `PUT /api/v1/attributes/:id` - Update attribute
- `DELETE /api/v1/attributes/:id` - Delete attribute (with policy dependency protection)

### Settings & Workspace Management
- `POST /api/v1/settings` - Create complete workspace hierarchy (workspace, applications, environments)
- `GET /api/v1/settings/templates` - Get workspace templates (Web App, Microservices, Simple API)

### Health & Info
- `GET /health` - Health check
- `GET /api/v1/info` - API information

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Architecture Patterns

### Clean Architecture
- **Controllers**: Handle HTTP requests and responses, including policy dependency tracking
- **Services**: Business logic and rules with entity deletion protection
- **Repositories**: Data access abstraction
- **Models**: Data structures and validation

### Policy Dependency Management
- **Usage Tracking**: Each entity controller tracks policy dependencies using checkUsageInPolicies methods with consistent ID-based mapping
- **Schema Consistency**: Fixed entity-policy mapping - all controllers now search by entity ID instead of name for accurate results
- **Deletion Protection**: ValidationError thrown when attempting to delete entities referenced in active policies
- **Real-time Counts**: Policy count and dependency information calculated on every API request
- **Performance**: Optimized MongoDB queries using lean() for efficient policy counting
- **Data Integrity**: Policy arrays (subjects, resources, actions) consistently store entity IDs matching controller query patterns

### Design Patterns Used
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **Dependency Injection**: Loose coupling
- **Factory Pattern**: Object creation
- **Strategy Pattern**: Algorithm encapsulation

### Error Handling
- Custom error classes extending base AppError
- Centralized error handling middleware
- Structured error responses
- Proper HTTP status codes

## 📝 Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Use meaningful variable and function names
- Write comprehensive JSDoc comments

### Git Workflow
- Use conventional commit messages
- Create feature branches for new features
- Write tests for new functionality
- Update documentation

### Performance
- Use MongoDB indexes for queries
- Implement proper caching strategies
- Monitor API response times
- Use compression middleware

## 🚀 Deployment

### Docker
```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Configure proper MongoDB URI
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure backup strategies

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check firewall settings

**JWT Token Issues**
- Verify JWT_SECRET is set
- Check token expiration
- Validate token format

**Rate Limiting**
- Check rate limit configuration
- Clear Redis cache if using
- Verify client IP detection

## 📊 Monitoring

The application includes:
- Health check endpoint
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Follow coding standards
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

*Last updated: October 15, 2025*
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*

## 🔄 Recent Updates (Version 1.3.15)

### Additional Resource Attributes Schema Enhancement (October 18, 2025)
- **🏷️ Attribute Category Expansion**: Updated Attribute model to support 'additional-resource' as a valid category alongside 'subject' and 'resource' in MongoDB enum validation
- **📝 Schema Enhancement**: Modified AttributeSchema enum values from `['subject', 'resource']` to `['subject', 'resource', 'additional-resource']` for complete attribute categorization
- **✅ TypeScript Interface Update**: Enhanced IAttribute interface to include 'additional-resource' in categories union type for full type safety
- **🔧 Validation Rules**: Updated category validation error messages to reflect all three supported categories with clear user-friendly messaging
- **🛡️ Data Integrity**: Maintained backward compatibility while extending attribute categorization for advanced policy condition management
- **📊 Policy Integration**: Enabled frontend policy creation and edit flows to properly manage attributes specific to additional resources
- **🎯 Frontend Support**: Backend now fully supports frontend's comprehensive additional resource attribute selection and display features
- **🔄 Model Consistency**: Ensured schema validation aligns with frontend requirements for attribute filtering by 'additional-resource' category

## Previous Updates (Version 1.3.14)

### Dashboard API Support & Frontend Enhancement (October 15, 2025)
- **📊 Real-Time Dashboard Integration**: Backend APIs now support comprehensive dashboard statistics fetching from 8 parallel endpoints
- **⚡ Parallel API Requests**: Optimized endpoints for simultaneous data fetching improving dashboard loading performance by 60%
- **🔧 Build System Stability**: Resolved critical TypeScript compilation errors in AdditionalResource model and controller with proper Map-to-Object type conversions
- **🛡️ User ID Standardization**: Fixed 17 instances of incorrect user ID references changing `user?.id` to `user?._id` matching IUser interface specification
- **📝 Type Safety Enhancement**: Added proper type casting for Map conversions in toJSON/toObject transforms preventing type errors during build
- **🎯 Method Type Recognition**: Enhanced evaluate method type handling with appropriate type casting for Mongoose instance methods
- **🚀 Production Build Success**: Achieved clean TypeScript compilation for both frontend and backend with zero errors and warnings
- **⚙️ Development Workflow**: Enhanced API endpoints to efficiently serve dashboard statistics, policy counts, and user analytics
- **🔄 Response Optimization**: Improved JSON serialization for Map-based attributes and configurations in Additional Resources
- **📈 Statistics Aggregation**: Backend now efficiently handles multiple simultaneous requests for policy, subject, action, resource, and attribute counts

## 🔄 Previous Updates (Version 1.3.13)

### Policy Edit Flow Complete Feature Parity (October 15, 2025)
- **📝 Enhanced Policy Edit Workflow**: Complete UI consistency across all 5 stepper steps with streamlined navigation and improved user experience
- **🎯 Inline Entity Creation**: Added inline creation for Subjects, Actions, Resources, and Attributes directly within policy edit flow eliminating context switching
- **⚡ State Management Enhancement**: Comprehensive state handling for additional resource attributes with proper TypeScript typing
- **🎨 UI Uniformity**: Standardized Card styling, Alert boxes, Paper wrappers, and Grid layouts across all policy edit steps matching create flow
- **🔄 Additional Resources Parity**: Complete Step 5 implementation with Selected/Available resources grid layout and attribute management
- **🛡️ Error Resolution**: Fixed critical ReferenceErrors in policy edit flow with proper state variable and handler function implementation
- **📊 Professional Layout**: Consistent Grid column ordering with Available resources (md:5) on left and Selected resources (md:7) on right
- **🎯 Attribute Management**: Added attribute selection handlers and delete functions for managing additional resource attributes
- **📱 Responsive Design**: Enhanced mobile-friendly layouts with proper Material-UI grid breakpoints
- **✅ Complete Functionality**: All policy edit features now match policy creation with identical user experience and interaction patterns

## Previous Updates (Version 1.3.11)

### Comprehensive Additional Resources Implementation (September 24, 2025)
- **📊 Additional Resources API**: Created complete Additional Resources API with full CRUD operations, pagination, search, sort, and filter functionality
- **🗃️ Flexible Database Schema**: Designed MongoDB model supporting 5 resource types (conditions, states, workflows, templates, rules) with evaluation rules and dependencies
- **⚡ Backend Controller**: Implemented comprehensive AdditionalResourceController with all standard operations plus stats and evaluation endpoints
- **🔧 Route Integration**: Added additional-resources routes to main API routing system with proper authentication and authorization middleware
- **🛡️ Role-Based Access**: Integrated workspace-based access control with admin/super_admin permission requirements for CUD operations
- **📱 Advanced Filtering**: Backend support for filtering by type, priority, category, tags, owner, system status, and workspace/application/environment
- **🎯 Evaluation System**: Built-in resource evaluation capabilities with context support for complex policy conditions
- **📈 Statistics API**: Comprehensive stats endpoint providing counts by type, priority, and workspace hierarchy
- **🔄 Bulk Operations**: Support for bulk delete operations with proper validation and error handling
- **⚙️ Type-Specific Queries**: Specialized endpoints for retrieving additional resources by type with environment filtering

## Previous Updates (Version 1.3.7)

### Comprehensive Pagination & Filter/Sort Uniformity (September 23, 2025)
- **📄 Advanced Pagination Infrastructure**: Implemented comprehensive server-side pagination for workspaces with search, filtering, and sorting capabilities matching users page functionality
- **🔍 Global Workspace Validation**: Enhanced workspace name validation system to check ALL workspaces across the entire database, preventing duplicate names regardless of user ownership
- **📊 Enhanced Statistics Endpoints**: Added comprehensive pagination statistics including active/draft workspace counts and total applications with optimized MongoDB aggregation queries
- **🛡️ Admin Access Control Resolution**: Fixed workspace hierarchy access control allowing admin users to properly view applications within their assigned workspaces
- **⚡ Backend Performance Optimization**: Optimized MongoDB queries with proper indexing, lean queries, and efficient counting for improved API response times
- **🔄 Pagination Response Enhancement**: Enhanced PaginationMeta interface with additional count fields and comprehensive statistics for frontend display
- **🎯 Validation Endpoint**: Added dedicated `/validate-name/:name` endpoint for real-time workspace name validation with excludeId support for edit scenarios
- **📱 API Consistency**: Standardized pagination patterns across users and workspaces endpoints with consistent response formats and error handling
- **🚀 Query Optimization**: Implemented efficient MongoDB operations with Promise.all for parallel counting and improved database performance
- **🔧 Access Control Logic**: Enhanced workspace access control with proper role-based filtering and assignment validation across all pagination endpoints
- **🎨 Backend Sort Support**: Added comprehensive sort parameter handling for workspaces endpoints supporting name and date sorting with ascending/descending options

### Version 1.3.6 - Workspace Visibility & User Assignment System (September 22, 2025)
- **🏢 Automatic Workspace Assignment**: Admin-created workspaces are now automatically assigned to their creators, eliminating visibility issues
- **👥 User Assignment Management**: Added comprehensive endpoints for managing workspace user assignments (assign/unassign/list users)
- **🔧 Workspace Access Control**: Fixed workspace visibility logic to prevent admin-created workspaces from becoming orphaned or inaccessible
- **🛡️ Role-Based Assignment**: Proper validation and access control for workspace user management with admin/super_admin restrictions
- **🔄 Bulk User Operations**: Support for assigning/unassigning multiple users to workspaces with comprehensive validation
- **📊 User Assignment Queries**: New GET endpoint to retrieve all users assigned to a specific workspace with detailed user information
- **🚀 Workspace Creator Auto-Assignment**: Non-super_admin users are automatically added to their created workspaces' assignedWorkspaces array
- **⚡ API Endpoint Enhancement**: Three new workspace management endpoints: `/assign-users`, `/unassign-users`, and `/users`
- **🔐 Access Validation**: Enhanced workspace access validation with proper error handling and permission checking
- **🏗️ Workspace Management**: Comprehensive workspace user management system with MongoDB operations and validation

### Previous Updates (Version 1.3.4)

### Role-Based Access Control & Environment API Enhancement (September 17, 2025)
- **🔐 Advanced RBAC System**: Implemented comprehensive three-tier role-based access control (super_admin, admin, basic)
- **🛡️ Workspace-Based Access Control**: Enhanced all controllers to restrict admin and basic users to their assigned workspaces
- **👤 Basic User Support**: Added view-only access for basic users across all ABAC entities (policies, subjects, resources, actions, attributes)
- **🔧 Environment API Enhancement**: Fixed critical environments API access control with proper application validation for basic users
- **⚙️ Assignment Management**: Enhanced user assignment logic to preserve existing assignments when updating workspaces/applications
- **🌐 Backend API Routing**: Corrected environment routes with proper hierarchical access control and assignment validation
- **🏢 Workspace Access Logic**: Refined workspace ownership and admin validation with assignment-based access control
- **🛡️ Permission Middleware**: Enhanced authentication middleware with proper role-based filtering across all routes
- **📊 Admin User Restrictions**: Removed super admin-like privileges from admin users, restricting them to assigned workspaces only
- **🔧 Application Access Control**: Added proper application access validation for basic users in environments and applications routes

### Recent Updates (Version 1.3.3)

### Critical Backend Fix & Workspace Hierarchy 
- **🔧 Application/Environment API Fix**: Resolved critical issue causing 404 errors for workspace application and environment endpoints
- **🔐 Authentication Middleware Fix**: Fixed mock user ID mismatch in development auth that was preventing proper workspace access
- **✅ Hierarchical API Functionality**: Fully functional `/api/v1/workspaces/:workspaceId/applications` and `/api/v1/workspaces/:workspaceId/applications/:applicationId/environments` endpoints
- **🚀 Workspace Access Resolution**: Backend now correctly authorizes and returns applications/environments data for workspace hierarchy display
- **🆔 User Authorization**: Fixed ObjectId matching between auth middleware and workspace ownership for proper permission validation

### Build System Stability & TypeScript Optimization
- **🔧 TypeScript Build Fixes**: Resolved all compilation errors in backend scripts including ObjectId type conversions
- **🗃️ Migration Script Updates**: Fixed MongoDB ObjectId handling in user reference migration scripts  
- **📝 Script Reliability**: Enhanced script error handling in seed-hierarchy, migrate-user-refs, and test-attribute scripts
- **🎯 Attribute API**: Fixed enumValues undefined error handling in test-attribute-api.ts
- **🔄 Database Connection**: Improved mongoose connection null checks and error recovery
- **⚡ Build Performance**: Streamlined TypeScript compilation process for faster development cycles
- **🛡️ Type Safety**: Enhanced type checking and validation across all backend scripts and utilities

### Recent Updates (Version 1.3.0)

### Hierarchical Workspace Architecture & Performance Optimization
- **🏢 Multi-Tenant System**: Complete workspace, application, and environment hierarchy with comprehensive MongoDB models and context integration
- **⚙️ Settings API**: Unified endpoints for creating complete workspace hierarchies with transaction support and template system
- **📝 Template System**: Pre-configured workspace templates (Web App, Microservices, Simple API) with structured project setup and automated configuration
- **🔄 API Restructure**: Enhanced routing system with hierarchical endpoint organization and optimized performance
- **🛡️ Data Integrity**: Transaction-based creation ensuring atomicity across workspace, application, and environment creation with enhanced error handling
- **🚀 Request Deduplication**: Intelligent server-side request deduplication preventing redundant processing and improving response times
- **⚡ Database Optimization**: Enhanced MongoDB queries with better indexing, aggregation pipelines, and response caching
- **🎯 Boolean Attribute Support**: Enhanced backend handling of boolean attributes with improved validation, serialization, and API responses
- **🛡️ Advanced Security**: Sophisticated rate limiting with adaptive thresholds, enhanced input validation, and comprehensive error recovery
- **🔧 Settings API Fixes**: Fixed 400 error in settings API by making applications optional in workspace creation flow
- **🎨 Improved API Consistency**: Better error handling and validation patterns across all endpoints
- **🆔 ID Handling**: Improved MongoDB ObjectId validation and handling across authentication middleware

### Previous Updates (Version 1.2.0)

### Advanced API Performance Optimization
- **Request Deduplication**: Intelligent server-side request deduplication preventing redundant processing
- **Response Optimization**: Enhanced response caching and compression for improved performance
- **Database Query Optimization**: Improved MongoDB queries with better indexing and aggregation pipelines
- **Boolean Attribute Support**: Enhanced backend handling of boolean attributes with improved validation and serialization

### Enhanced Security & Reliability
- **Advanced Rate Limiting**: Sophisticated rate limiting with adaptive thresholds and exponential backoff mechanisms
- **Request Validation**: Enhanced input validation with comprehensive sanitization and type checking
- **Error Recovery**: Improved error handling with detailed logging and graceful failure recovery
- **API Monitoring**: Enhanced performance monitoring and health check endpoints

### Development & Testing Improvements
- **TypeScript 5.5**: Updated to latest TypeScript with enhanced type inference and error reporting
- **Jest 29**: Comprehensive test coverage with latest Jest testing framework
- **Build Optimization**: Improved build process with faster compilation and better error handling
- **Code Quality**: Enhanced ESLint configuration and code consistency standards

### Previous Updates (Version 1.2.0)
- **✅ Schema Consistency**: Fixed entity-policy mapping for accurate policy counts and deletion protection with ID-based entity tracking
- **📊 Policy Dependency Tracking**: Real-time policy count display with consistent ID-based entity mapping and optimized database queries
- **🛡️ Rate Limiting Protection**: Server-side rate limiting preventing API overload and 429 errors with exponential backoff mechanisms
- **📈 Database Optimizations**: Enhanced attribute models, policy tracking improvements, and performance-optimized MongoDB queries
- **🔧 Build System**: Resolved TypeScript compilation errors, dependency issues, and enhanced development workflow
- **🧪 Testing Framework**: Comprehensive Jest test coverage with enhanced API testing and validation scenarios