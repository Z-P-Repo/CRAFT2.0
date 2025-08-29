# CRAFT Backend - Permission System API

A robust, scalable Node.js backend API for the CRAFT (Attribute-Based Access Control) Permission System. Built with Express.js, TypeScript, MongoDB, and comprehensive security features.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Express](https://img.shields.io/badge/Express-4.19-black.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **🔐 JWT Authentication** with refresh tokens and secure password hashing
- **📋 ABAC Policy Engine** - Comprehensive Attribute-Based Access Control
- **👥 User Management** - Complete user, role, and permission system with three-tier roles (Super Admin, Admin, Basic)
- **🔑 User Registration** - Public registration endpoint with default Basic role assignment
- **🛡️ Role Management** - Hierarchical role change functionality with strict permission validation
- **🔒 Permission Control** - Basic users have view-only access; Admin/Super Admin have full CRUD access
- **📁 Resource Management** - Handle files, databases, APIs, and system resources
- **⚡ Action Framework** - Categorized system actions with risk assessment
- **🏷️ Attribute System** - Multi-category attribute management (Subject/Resource) for ABAC
- **📊 Policy Dependency Tracking** - Real-time policy count display and dependency visualization across all entities
- **🔒 Deletion Protection** - Prevents deletion of entities (subjects, actions, resources, attributes) currently referenced in active policies
- **🎨 Standardized UI Integration** - Backend supports frontend's standardized delete confirmation dialogs with consistent error responses and system protection features
- **🧪 Policy Evaluation** - Real-time policy testing and validation
- **📊 Comprehensive Logging** - Structured logging with Winston
- **🛡️ Security Features** - Rate limiting, CORS, helmet, and input validation
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
PORT=3001
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
│   ├── Action.ts    # Action data model
│   ├── Attribute.ts # Attribute data model
│   ├── Policy.ts    # Policy data model
│   ├── Resource.ts  # Resource data model
│   ├── Subject.ts   # Subject data model
│   └── User.ts      # User data model with role management
├── routes/          # API routes
│   ├── actionRoutes.ts    # Action endpoints
│   ├── attributeRoutes.ts # Attribute endpoints
│   ├── auth.ts           # Authentication endpoints
│   ├── policyRoutes.ts    # Policy endpoints
│   ├── resourceRoutes.ts  # Resource endpoints
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

### Attributes
- `GET /api/v1/attributes` - List attributes with pagination, filtering, and policy count tracking
- `POST /api/v1/attributes` - Create new attribute
- `GET /api/v1/attributes/:id` - Get specific attribute with policy dependency information
- `PUT /api/v1/attributes/:id` - Update attribute
- `DELETE /api/v1/attributes/:id` - Delete attribute (with policy dependency protection)

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

*Last updated: August 29, 2025*  
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*