# CRAFT Frontend - Permission System Dashboard

A modern, responsive React-based dashboard for managing the CRAFT (Attribute-Based Access Control) Permission System. Built with Next.js 15, TypeScript, and Material-UI with a professional collapsible sidebar layout.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-6.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **📱 Responsive Dashboard Layout** with collapsible sidebar navigation
- **🔐 JWT Authentication** with automatic token refresh and secure routing
- **📋 Policy Management** - Create, edit, and manage ABAC policies with 4-step wizard and dedicated view/edit pages
- **👥 Subject Management** - Handle users, groups, and roles with detailed profiles
- **📁 Resource Management** - Manage system resources, files, databases, and APIs
- **⚡ Action Management** - Define and categorize system actions with risk levels
- **🏷️ Attribute Management** - Configure ABAC attributes for subjects, resources, and environment
- **🧪 Policy Tester** - Interactive policy evaluation and testing with detailed results
- **📊 Real-time Statistics** - Dashboard with live metrics and activity tracking
- **🎨 Professional UI/UX** - Material-UI components with consistent theming

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- CRAFT Backend API running on port 3001

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd craft-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

## ⚙️ Configuration

Update the `.env.local` file with your settings:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Environment
NODE_ENV=development

# Application Settings
NEXT_PUBLIC_APP_NAME=CRAFT Permission System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:watch
npm run test:coverage

# Storybook
npm run storybook
npm run build-storybook

# Bundle analysis
npm run analyze
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── login/          # Login page
│   ├── dashboard/      # Dashboard page
│   ├── policies/       # Policy management pages
│   │   ├── create/     # Policy creation wizard
│   │   ├── [id]/       # Policy view/edit pages
│   │   └── page.tsx    # Main policies listing
│   ├── subjects/       # Subject management
│   ├── actions/        # Actions management
│   ├── resources/     # Resources management
│   ├── attributes/     # Attributes management
│   ├── layout.tsx      # Root layout with dashboard
│   └── page.tsx        # Home page
├── components/         # Reusable UI components
│   └── layout/         # Layout components
│       └── DashboardLayout.tsx # Main dashboard layout
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── lib/                # Libraries and utilities
│   └── api.ts          # API client with interceptors
├── types/              # TypeScript type definitions
│   └── index.ts        # Complete type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials
2. **Token Storage**: JWT tokens stored in localStorage
3. **Auto-Refresh**: Automatic token refresh on expiry
4. **Route Protection**: Protected routes redirect to login
5. **Logout**: Clear tokens and redirect to home

## 📱 Pages and Features

### Authentication
- **Home Page** (`/`): Landing page with system overview
- **Login Page** (`/login`): User authentication
- **Register Page** (`/register`): User registration

### Protected Routes
- **Dashboard** (`/dashboard`): Main application dashboard
- **Subjects** (`/subjects`): User and role management
- **Resources** (`/resources`): Resource management
- **Actions** (`/actions`): Action definitions
- **Policies** (`/policies`): Access policy management with comprehensive pagination and filtering
  - **Policy Creation** (`/policies/create`): 4-step wizard for policy creation
  - **Policy View** (`/policies/[id]`): Dedicated policy viewing page
  - **Policy Edit** (`/policies/[id]/edit`): Dedicated policy editing page
- **Attributes** (`/attributes`): System attributes
- **Tester** (`/tester`): Policy evaluation testing

## 🎨 UI Components

### Material-UI Theme
- **Primary Color**: Blue (#1976d2)
- **Secondary Color**: Pink (#dc004e)
- **Typography**: Roboto font family
- **Responsive**: Mobile-first design

### Component Library
- Authentication forms
- Data tables with pagination
- Modal dialogs
- Form components
- Navigation components
- Dashboard cards

## 🔧 API Integration

### API Client Features
- Automatic request/response interceptors
- JWT token management
- Error handling and retry logic
- Request ID tracking
- Automatic token refresh

### Available API Methods
```typescript
// Authentication
apiClient.login(credentials)
apiClient.register(userData)
apiClient.logout()
apiClient.getProfile()

// Generic CRUD
apiClient.get(url, params)
apiClient.post(url, data)
apiClient.put(url, data)
apiClient.delete(url)
```

## 🧪 Testing

### Test Setup
- Jest configuration
- React Testing Library
- Component testing
- Integration testing
- Coverage reporting

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📖 Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint and Prettier configuration
- Consistent naming conventions
- Component organization

### Best Practices
- Use TypeScript interfaces
- Implement error boundaries
- Follow React best practices
- Write meaningful tests
- Use semantic HTML

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t craft-frontend .

# Run container
docker run -p 3002:3002 craft-frontend
```

### Build Optimization
- Automatic code splitting
- Image optimization
- Bundle analysis
- Tree shaking
- Compression

## 🔍 Performance

### Optimization Features
- Next.js automatic optimizations
- Image optimization with next/image
- Code splitting and lazy loading
- Bundle size analysis
- Performance monitoring

### Lighthouse Scores
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## 📊 Monitoring

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Storybook for component development
- Bundle analyzer for optimization

### Error Handling
- Error boundaries for graceful failures
- API error handling and user feedback
- Form validation and error display
- Loading states and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔗 Related Projects

- [CRAFT Backend](../craft-backend/) - Express.js API server
- [CRAFT Documentation](../docs/) - System documentation