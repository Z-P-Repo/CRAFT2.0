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
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication & validation
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── docs/               # Backend documentation
├── craft-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript types
│   └── docs/               # Frontend documentation
└── README.md              # This file
```

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User)
- Secure password hashing with bcrypt
- Token validation and automatic refresh

### 📊 Dashboard
- Modern, responsive dashboard with Material-UI
- Collapsible sidebar navigation
- Real-time statistics and analytics
- Mobile-friendly responsive design

### 🏗️ ABAC Components
- **Policies**: Define access control rules with step-by-step wizard
- **Subjects**: Manage users, groups, roles with comprehensive attributes
- **Resources**: Protected objects and assets with attribute support
- **Actions**: Operations that can be performed with categorization
- **Attributes**: Contextual information for policy decisions with full CRUD

### 📋 Policy Management
- **Step-by-step Creation**: 4-step wizard for policy creation
- **Dedicated View/Edit Pages**: Full-page policy management instead of modals
- **Advanced Filtering**: Search, filter by status/effect, and sorting
- **Bulk Operations**: Select and delete multiple policies
- **Human-readable Rules**: Natural language policy display
- **Comprehensive Pagination**: Full pagination support across all entities

### 🧪 Policy Testing
- Interactive policy evaluation tool
- Test access scenarios in real-time
- Debug policy decisions
- Simulate different contexts

### 🔧 Technical Stack
- **Frontend**: Next.js 15, React 18, Material-UI, TypeScript
- **Backend**: Node.js, Express, MongoDB, Mongoose, TypeScript
- **Authentication**: JWT, bcrypt
- **Documentation**: Comprehensive markdown docs

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
FRONTEND_URL=http://localhost:3002
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=CRAFT 2.0
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📚 Documentation

### Frontend Documentation
- [Layout System](./craft-frontend/docs/layout.md) - Dashboard layout and navigation
- [Authentication](./craft-frontend/docs/authentication.md) - Auth implementation
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
   Frontend will run on http://localhost:3002

### Production Build

```bash
# Backend
cd craft-backend
npm run build
npm start

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

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process on port 3001 (backend)
   lsof -ti:3001 | xargs kill -9
   
   # Kill process on port 3002 (frontend)
   lsof -ti:3002 | xargs kill -9
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

🤖 *Generated with [Claude Code](https://claude.ai/code)*