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
- **👥 User Management** - Complete user, role, and permission system
- **📁 Resource Management** - Handle files, databases, APIs, and system resources
- **⚡ Action Framework** - Categorized system actions with risk assessment
- **🏷️ Attribute System** - Flexible attribute management for ABAC
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
FRONTEND_URL=http://localhost:3000
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
├── config/           # Configuration files
│   ├── database.ts   # Database connection
│   └── environment.ts # Environment variables
├── controllers/      # Route controllers
├── services/         # Business logic
├── repositories/     # Data access layer
├── models/          # Database models
├── middleware/      # Express middleware
├── routes/          # API routes
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── exceptions/      # Custom error classes
├── validators/      # Request validators
├── scripts/         # Database scripts
└── __tests__/       # Test files
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
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/logout` - User logout

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
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and rules
- **Repositories**: Data access abstraction
- **Models**: Data structures and validation

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