# CRAFT 2.0 - ABAC Permission System
## Comprehensive Technical Documentation

**Version:** 1.3.22
**Document Date:** January 14, 2025
**Document Type:** Technical Documentation
**Target Audience:** Developers, System Architects, Technical Teams

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Core Modules](#4-core-modules)
5. [Feature Catalog](#5-feature-catalog)
6. [User Workflows](#6-user-workflows)
7. [API Architecture](#7-api-architecture)
8. [Security & Authentication](#8-security--authentication)
9. [Performance Optimization](#9-performance-optimization)
10. [Version History](#10-version-history)

---

## 1. System Overview

### 1.1 Introduction

CRAFT (Comprehensive Resource Access Framework & Toolkit) is an enterprise-grade Attribute-Based Access Control (ABAC) permission system designed to provide fine-grained access control for modern applications. Built with scalability, security, and usability in mind, CRAFT enables organizations to define complex access policies based on attributes of users, resources, actions, and contextual conditions.

### 1.2 Core Concepts

**Attribute-Based Access Control (ABAC)**
- Policies are defined based on attributes rather than fixed roles
- Supports dynamic policy evaluation at runtime
- Enables context-aware access decisions
- Provides fine-grained control over resources and actions

**Key Components:**
- **Subjects**: Users or entities requesting access (e.g., employees, systems, services)
- **Resources**: Protected assets or data (e.g., files, APIs, databases)
- **Actions**: Operations that can be performed (e.g., read, write, delete, approve)
- **Attributes**: Characteristics used in policy decisions (e.g., department, clearance level, time)
- **Policies**: Rules that define who can do what under which conditions
- **Additional Resources**: Conditional resources that add context to policy evaluation

### 1.3 Use Cases

- **Enterprise Access Management**: Control access to corporate resources based on employee attributes
- **Multi-Tenant Applications**: Isolated access control per workspace/tenant
- **Healthcare Systems**: HIPAA-compliant access to patient records based on role and relationship
- **Financial Services**: Enforce separation of duties and compliance requirements
- **Cloud Infrastructure**: Dynamic access control for cloud resources and services
- **API Management**: Fine-grained API access control based on caller attributes

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Next.js   │  │ React 19   │  │ Material   │            │
│  │  15.4.6    │  │ Components │  │ UI v7.3    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         ↓              ↓               ↓                     │
│  ┌─────────────────────────────────────────┐                │
│  │     State Management & API Layer        │                │
│  │   (Zustand, React Query, Axios)         │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                         ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Express   │  │    JWT     │  │   Azure    │            │
│  │  4.19.2    │  │   Auth     │  │   AD SSO   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         ↓              ↓               ↓                     │
│  ┌─────────────────────────────────────────┐                │
│  │        ABAC Policy Engine               │                │
│  │   (Policy Evaluation & Enforcement)     │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  MongoDB   │  │  Mongoose  │  │   Redis    │            │
│  │   8.5.2    │  │    ODM     │  │   Cache    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenant Architecture

**Hierarchical Workspace System:**
```
Organization
    └── Workspaces
            ├── Applications
            │       └── Environments
            │               ├── Development
            │               ├── Staging
            │               └── Production
            └── Users (Assigned to Workspaces)
```

**Key Features:**
- Complete workspace isolation for multi-tenancy
- Hierarchical context: Workspace → Application → Environment
- User assignment to specific workspaces
- Role-based access within workspace boundaries
- Context-aware policy evaluation

### 2.3 Design Patterns

**Frontend Patterns:**
- **Component Composition**: Reusable UI components with props drilling
- **Context API**: Global state for authentication and workspace context
- **Custom Hooks**: Encapsulated business logic (useAuth, useWorkspace, useApiSnackbar)
- **Protected Routes**: HOC pattern for route-level access control
- **Server Components**: Next.js 15 App Router with RSC support

**Backend Patterns:**
- **MVC Architecture**: Model-View-Controller separation
- **Repository Pattern**: Data access abstraction
- **Middleware Chain**: Request processing pipeline (auth, validation, rate limiting)
- **Factory Pattern**: Dynamic policy engine construction
- **Observer Pattern**: Real-time activity tracking

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.6 | React framework with SSR, App Router, and optimization |
| **React** | 19.0 | UI library with modern hooks and concurrent features |
| **TypeScript** | 5.5.4 | Type safety and enhanced developer experience |
| **Material-UI** | 7.3.1 | Component library for professional UI design |
| **Zustand** | Latest | Lightweight state management |
| **TanStack React Query** | Latest | Server state management and caching |
| **Axios** | Latest | HTTP client with interceptors |
| **React Hook Form** | Latest | Form state management and validation |
| **Yup** | Latest | Schema validation |
| **Jest** | 29 | Testing framework |
| **React Testing Library** | 16 | Component testing utilities |
| **Azure AD MSAL** | Latest | Microsoft authentication library |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 4.19.2 | Web application framework |
| **TypeScript** | 5.5.4 | Type-safe backend development |
| **MongoDB** | 8.5.2 | NoSQL database for flexible schemas |
| **Mongoose** | Latest | ODM for MongoDB with schema validation |
| **JWT** | Latest | Stateless authentication tokens |
| **bcrypt** | Latest | Password hashing |
| **Redis** | Latest | Caching and session management |
| **Jest** | 29 | Backend testing framework |

### 3.3 Development Tools

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Storybook**: Component development and documentation
- **Git**: Version control
- **npm**: Package management
- **tsx**: TypeScript execution for development

---

## 4. Core Modules

### 4.1 Dashboard Module

**Purpose**: Central hub providing system overview and quick access to key features.

**Features:**
- **Real-Time Statistics**: Live data from 8 API endpoints
  - Policies (total, active, draft, inactive)
  - Subjects, Actions, Resources, Additional Resources
  - Attributes, Workspaces, Users
- **Welcome Banner**: Personalized greeting with user avatar, role badge, and department chip
- **Quick Actions Panel**: One-click access to Create Policy, Test Policy, Settings, Activity Log
- **Policy Status Overview**: Visual progress bars showing policy distribution
- **Recent Activity Feed**: Latest 5 policy activities with relative timestamps
- **Feature Highlights**: Informative cards for ABAC Components, Workspace Hierarchy, Additional Resources
- **Interactive Navigation**: All cards clickable with route navigation
- **Responsive Layout**: Box-based flexbox system for optimal display across devices

**API Endpoints:**
- `GET /policies` - Fetch all policies
- `GET /subjects` - Fetch all subjects
- `GET /actions` - Fetch all actions
- `GET /resources` - Fetch all resources
- `GET /additional-resources` - Fetch all additional resources
- `GET /attributes` - Fetch all attributes
- `GET /workspaces` - Fetch all workspaces
- `GET /users` - Fetch all users

**Key Components:**
- Statistical gradient cards with hover animations
- Material-UI Box-based grid system (replaced Grid2 for stability)
- Comprehensive error handling with snackbar notifications
- Loading states during data fetch

---

### 4.2 Workspaces Module

**Purpose**: Multi-tenant workspace management with hierarchical application and environment structure.

**Architecture:**
```
Workspace (Tenant Level)
    ├── Name & Display Name
    ├── Description
    ├── Assigned Users
    └── Applications
            ├── Application Name
            ├── Description
            └── Environments
                    ├── Development
                    ├── Staging
                    └── Production
```

**Features:**
- **Workspace Creation**: Step-by-step wizard with automatic environment generation
- **Application Management**: Add/edit/delete applications within workspaces
- **Environment Auto-Generation**: Intelligent name normalization and synchronization
- **User Assignment**: Assign users to workspaces for access control
- **Access Control**: Admin users restricted to assigned workspaces; super_admin has global access
- **Context Switching**: Dynamic workspace/application selection with React context
- **Comprehensive Pagination**: Server-side pagination with search, filter, and sort
- **Global Validation**: Workspace name uniqueness check across entire system
- **Template System**: Pre-configured workspace templates for quick setup

**API Endpoints:**
- `POST /workspaces` - Create new workspace
- `GET /workspaces` - List workspaces with pagination
- `GET /workspaces/:id` - Get workspace details
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `POST /workspaces/:id/applications` - Add application
- `POST /workspaces/:id/users/assign` - Assign user
- `DELETE /workspaces/:id/users/:userId` - Unassign user

**Database Schema:**
```typescript
Workspace {
  _id: ObjectId
  name: string (unique)
  displayName: string
  description: string
  applications: Application[]
  assignedUsers: ObjectId[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

Application {
  _id: ObjectId
  name: string
  displayName: string
  description: string
  environments: Environment[]
}

Environment {
  _id: ObjectId
  name: string
  displayName: string
  description: string
}
```

---

### 4.3 Policies Module

**Purpose**: Core ABAC policy creation, management, and enforcement.

**Policy Structure:**
```
Policy
    ├── Basic Information
    │       ├── Policy Name
    │       ├── Description
    │       ├── Effect (Allow/Deny)
    │       └── Status (Active/Draft/Inactive)
    ├── Subject Selection
    │       ├── Selected Subjects
    │       └── Subject Attributes (Conditions)
    ├── Action Selection
    │       └── Multiple Actions with Risk Assessment
    ├── Resource Selection
    │       ├── Selected Resources
    │       └── Resource Attributes (Conditions)
    ├── Additional Resources (Optional)
    │       ├── Selected Additional Resources
    │       └── Global Attribute Conditions
    ├── Review & Create
    │       ├── Human-Readable Policy Statement
    │       └── Technical Details
    └── Workspace Context
            ├── Workspace
            ├── Application
            └── Environment
```

**Policy Creation Workflow:**

**Step 1: Basic Information**
- Policy name (min 3 characters, validated)
- Description (optional)
- Effect selection (Allow/Deny)
- Auto-draft status

**Step 2: Subject Selection**
- Multi-select Autocomplete for subjects
- Subject attribute configuration
- Conditional attribute values (when...)
- "Create New Subject" inline creation
- "Create New Subject Attribute" with category pre-selection

**Step 3: Action Selection**
- Professional multi-select Autocomplete
- Search and filter by name, description, category, risk level
- Action chips with color-coded risk indicators
- Inline action creation with "Create New Action" button

**Step 4: Resource Selection**
- Two-column layout (5-width available, 7-width selected)
- Resource selection dropdown
- Global resource attribute model
- Attribute selection Autocomplete with visual indicators
- Data-type-specific input cards (boolean, number, string, enum, date)
- "Create New Resource" inline creation
- "Create New Resource Attribute" with category pre-selection
- Attribute value management with "Add Value" button

**Step 5: Additional Resources (Optional)**
- Identical UI to Step 4 for consistency
- Global attribute model (same attributes apply to all selected additional resources)
- Additional resource selection dropdown
- Global attribute selection and value configuration
- Conditional resource evaluation (if...)
- "Create New Additional Resource" inline creation
- "Create New Additional Resource Attribute" with category pre-selection

**Step 6: Review & Create**
- Human-readable policy statement:
  ```
  "This policy ALLOWS [subjects] (when [subject conditions])
   to perform [actions] actions on [resources] (where [resource conditions])
   if [additional resources] (when [additional resource conditions])."
  ```
- Technical details panel with all selections
- Subject, Action, Resource breakdown with attribute chips
- Policy status indicators (Active/Draft/Inactive)
- Publish or Save as Draft options

**Features:**
- **6-Step Wizard**: Intuitive stepper with validation
- **Real-Time Validation**: Field-level and step-level validation
- **Auto-Save Draft**: Prevent data loss with draft saving
- **Cancel Confirmation**: Prevent accidental abandonment
- **Inline Entity Creation**: Create subjects, actions, resources without leaving wizard
- **Attribute Value Management**: Add enum values on-the-fly
- **Data-Type-Aware Inputs**: Intelligent input controls based on attribute data type
  - Boolean: Select dropdown (true/false)
  - Number: Numeric TextField with min/max validation
  - String: Standard TextField
  - Date: datetime-local picker
  - Array/Object: JSON textarea with validation
  - Enum: Select dropdown with "Add Value" functionality
- **Global Attribute Model**: Same attribute values for all additional resources (v1.3.22)
- **Policy Summary Fix**: Correct display in human-readable statement (v1.3.22)

**API Endpoints:**
- `POST /policies` - Create new policy
- `GET /policies` - List policies with filtering
- `GET /policies/:id` - Get policy details
- `PUT /policies/:id` - Update policy
- `DELETE /policies/:id` - Delete policy
- `PATCH /policies/:id/status` - Update policy status

**Database Schema:**
```typescript
Policy {
  _id: ObjectId
  name: string
  description: string
  effect: 'Allow' | 'Deny'
  status: 'Active' | 'Draft' | 'Inactive'
  subjects: ObjectId[]
  actions: ObjectId[]
  resources: ObjectId[]
  additionalResources: [{
    id: ObjectId
    attributes: [{
      name: string
      operator: 'equals' | 'in' | 'gt' | 'lt'
      value: any
    }]
  }]
  rules: Rule[]
  workspaceId: ObjectId
  applicationId: ObjectId
  environmentId: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.4 Subjects Module

**Purpose**: Manage users, systems, and entities that request access to resources.

**Features:**
- **Subject Types**: Users, Service Accounts, Systems, External Entities
- **Attribute Management**: Assign attributes to subjects (department, role, clearance)
- **Email Validation**: Unique email constraint
- **Professional Table UI**: Pagination, search, filter, sort
- **Bulk Operations**: Multi-select and batch actions
- **Deletion Protection**: Prevents deletion of subjects used in active policies
- **Policy Dependency Tracking**: Real-time count of policies using each subject
- **Inline Editing**: Quick edit without navigation
- **Export Functionality**: CSV/Excel export

**API Endpoints:**
- `POST /subjects` - Create subject
- `GET /subjects` - List subjects with pagination
- `GET /subjects/:id` - Get subject details
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject (with policy check)

**Database Schema:**
```typescript
Subject {
  _id: ObjectId
  name: string
  displayName: string
  email: string (unique)
  type: 'user' | 'service' | 'system' | 'external'
  attributes: Map<string, any>
  description: string
  workspaceId: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.5 Resources Module

**Purpose**: Define and manage protected assets and data.

**Resource Types:**
- **File**: Documents, images, videos
- **Document**: Structured documents (contracts, reports)
- **API**: RESTful endpoints, GraphQL queries
- **Database**: Tables, collections, schemas
- **Service**: Microservices, cloud services
- **Folder**: Directory structures
- **Application**: Software applications

**Features:**
- **Resource Creation**: Type-specific resource creation
- **URI/Path Tracking**: Resource location identifier
- **Attribute Assignment**: Assign resource attributes (classification, owner)
- **Additional Resources**: Separate management for conditional resources
- **Tabular View**: Dynamic header system adapting to active tab
- **CRUD Operations**: Full MongoDB integration
- **Deletion Protection**: Prevents deletion of resources in active policies
- **Policy Dependency Display**: Shows policy count per resource

**Additional Resources:**
- **Types**: Condition, State, Approval, Status, Ticket
- **Purpose**: Provide context for policy evaluation
- **Flexible Attributes**: Support evaluation rules and dependencies
- **Separate Management**: Independent table with dedicated API

**API Endpoints:**
- `POST /resources` - Create resource
- `GET /resources` - List resources with pagination
- `GET /resources/:id` - Get resource details
- `PUT /resources/:id` - Update resource
- `DELETE /resources/:id` - Delete resource
- `POST /additional-resources` - Create additional resource
- `GET /additional-resources` - List additional resources
- `PUT /additional-resources/:id` - Update additional resource
- `DELETE /additional-resources/:id` - Delete additional resource

**Database Schema:**
```typescript
Resource {
  _id: ObjectId
  name: string
  displayName: string
  type: 'file' | 'document' | 'api' | 'database' | 'service' | 'folder' | 'application'
  uri: string
  description: string
  attributes: Map<string, any>
  workspaceId: ObjectId
  owner: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

AdditionalResource {
  _id: ObjectId
  name: string
  displayName: string
  type: 'condition' | 'state' | 'approval' | 'status' | 'ticket'
  description: string
  evaluationRules: any
  dependencies: ObjectId[]
  workspaceId: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.6 Actions Module

**Purpose**: Define operations that can be performed on resources.

**Action Categories:**
- **Data Operations**: Read, Write, Update, Delete
- **Administrative**: Create, Configure, Manage
- **Workflow**: Approve, Reject, Review
- **System**: Execute, Deploy, Monitor

**Risk Levels:**
- **Low**: Read, View, List
- **Medium**: Update, Modify, Edit
- **High**: Delete, Execute, Deploy
- **Critical**: Admin, Configure, Manage

**Features:**
- **Category-Based Organization**: Actions grouped by category
- **Risk Assessment**: Color-coded risk indicators
- **Icon Assignment**: Visual representation for each action
- **Description Management**: Clear action purpose documentation
- **Policy Integration**: Used in policy creation flow
- **Deletion Protection**: Cannot delete actions used in policies
- **Dependency Tracking**: Real-time policy count

**API Endpoints:**
- `POST /actions` - Create action
- `GET /actions` - List actions with filtering
- `GET /actions/:id` - Get action details
- `PUT /actions/:id` - Update action
- `DELETE /actions/:id` - Delete action

**Database Schema:**
```typescript
Action {
  _id: ObjectId
  name: string
  displayName: string
  description: string
  category: 'data' | 'admin' | 'workflow' | 'system'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  icon: string
  workspaceId: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.7 Attributes Module

**Purpose**: Define characteristics used in policy conditions and evaluations.

**Attribute Categories:**
- **Subject Attributes**: User/entity characteristics (department, role, clearance)
- **Resource Attributes**: Asset properties (classification, sensitivity, owner)
- **Additional Resource Attributes**: Conditional resource properties (status, priority, state)

**Data Types:**
- **String**: Text values (name, department, email)
- **Number**: Numeric values (age, salary, quantity)
- **Boolean**: True/False flags (active, verified, approved)
- **Date**: Timestamps and dates (created_date, expiry_date)
- **Array**: Multiple values (tags, categories)
- **Object**: Complex structures (metadata, configuration)
- **Enum**: Predefined value lists (status: pending|approved|rejected)

**Features:**
- **Strict Category Enforcement**: Attributes filtered by category context (v1.3.20)
- **Smart Auto-Selection**: Category pre-selected based on creation context
- **Multi-Value Support**: Array-type attributes with multiple selections
- **Enum Management**: Predefined value lists with "Add Value" functionality
- **Constraints Definition**: Min/max for numbers, regex for strings
- **Required/Optional**: Attribute requirement configuration
- **Value Validation**: Type-specific validation rules
- **Migration Tools**: Database migration scripts for category cleanup
- **Policy Integration**: Used in subject, resource, and additional resource conditions

**API Endpoints:**
- `POST /attributes` - Create attribute
- `GET /attributes?categories=subject` - List attributes with category filter
- `GET /attributes/:id` - Get attribute details
- `PUT /attributes/:id` - Update attribute
- `POST /attributes/:id/values` - Add enum value
- `DELETE /attributes/:id` - Delete attribute

**Database Schema:**
```typescript
Attribute {
  _id: ObjectId
  name: string
  displayName: string
  description: string
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  categories: ('subject' | 'resource' | 'additional-resource')[]
  isRequired: boolean
  isMultiValue: boolean
  constraints: {
    enumValues: any[]
    minValue: number
    maxValue: number
    pattern: string
  }
  workspaceId: ObjectId
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.8 Users Module

**Purpose**: Manage system users with role-based access control.

**User Roles:**
- **Super Admin**: Global access to all workspaces and settings
- **Admin**: Workspace-specific administration
- **Basic**: View-only access to assigned workspaces

**Features:**
- **User Registration**: Public registration with default Basic role
- **Role Management**: Hierarchical role change with validation
- **Workspace Assignment**: Assign users to specific workspaces
- **Profile Management**: Name, email, department, contact information
- **Authentication**: JWT-based authentication with refresh tokens
- **Azure AD SSO**: Microsoft Enterprise authentication integration
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Redis-based session storage
- **Access Control**: Role-based feature visibility and CRUD permissions

**API Endpoints:**
- `POST /auth/register` - Public registration
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Refresh access token
- `GET /users` - List users with pagination
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `PATCH /users/:id/role` - Change user role
- `DELETE /users/:id` - Delete user

**Database Schema:**
```typescript
User {
  _id: ObjectId
  name: string
  email: string (unique)
  password: string (hashed)
  role: 'super_admin' | 'admin' | 'basic'
  department: string
  contactNumber: string
  assignedWorkspaces: ObjectId[]
  isActive: boolean
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

---

### 4.9 Activity Module

**Purpose**: Track and audit all system activities.

**Tracked Events:**
- Policy creation, updates, deletions
- Subject/Resource/Action/Attribute modifications
- User login/logout events
- Workspace changes
- Role assignments
- Access denials

**Features:**
- **Real-Time Activity Feed**: Latest activities with relative timestamps
- **Comprehensive Logging**: All CRUD operations tracked
- **User Attribution**: Activity linked to performing user
- **Timestamp Tracking**: Precise datetime for all events
- **Filtering**: Filter by type, user, date range
- **Audit Trail**: Complete history for compliance

**API Endpoints:**
- `GET /activities` - List activities with filtering
- `GET /activities/:id` - Get activity details

**Database Schema:**
```typescript
Activity {
  _id: ObjectId
  type: 'policy' | 'subject' | 'action' | 'resource' | 'attribute' | 'workspace' | 'user'
  action: 'created' | 'updated' | 'deleted' | 'accessed' | 'denied'
  entityId: ObjectId
  entityName: string
  userId: ObjectId
  userName: string
  details: any
  timestamp: Date
  workspaceId: ObjectId
}
```

---

### 4.10 Settings Module

**Purpose**: System configuration and workspace setup.

**Features:**
- **Workspace Creation Wizard**: Step-by-step workspace setup
- **Application Management**: Add/edit applications within workspaces
- **Environment Configuration**: Auto-generation and customization
- **Template System**: Pre-configured workspace templates
- **Global Settings**: System-wide configuration
- **Notification Preferences**: Email/SMS notification settings
- **Integration Configuration**: External system integrations

**API Endpoints:**
- `POST /settings/workspaces` - Create workspace with hierarchy
- `PUT /settings/:key` - Update setting value
- `GET /settings` - Get all settings

---

## 5. Feature Catalog

### 5.1 Version 1.3.22 (January 14, 2025)

**Global Additional Resource Attribute Model**
- Complete redesign of Step 5 in policy creation and edit flows
- Unified workflow matching Step 4 architecture
- Two-column layout: Available resources (5-width) + Attribute configuration (7-width)
- Professional Autocomplete with search/filter and visual indicators
- Data-type-specific input cards with appropriate controls
- Global handler functions for state management
- Updated submission logic for both create and edit
- Policy summary fix for correct attribute display
- Feature parity between create and edit flows
- Bundle optimization: 15.3 kB → 14.9 kB
- Dashboard UI cleanup: Removed refresh icon from welcome banner
- Smart policy sorting: Default sort by created date (newest first)
- Comprehensive technical documentation created (350+ lines)

### 5.2 Version 1.3.21 (October 22, 2025)

**Navigation Menu Reorganization**
- Logical menu ordering for improved UX
- ABAC components grouped together
- Policy Tester removed from navigation
- Activity and Settings moved to administrative section
- Clean build with 21 routes

### 5.3 Version 1.3.20 (October 22, 2025)

**Strict Attribute Scope Enforcement**
- Comprehensive attribute category filtering
- Smart auto-selection based on context
- Backend API category filtering support
- Database migration tool for category cleanup
- Updated category system (subject, resource, additional-resource)
- Multi-category support with filtering
- Double-layer filtering in dialogs

### 5.4 Version 1.3.19 (October 22, 2025)

**Resource Form Simplification**
- Removed unnecessary Data Type field
- Streamlined ResourceCreationDialog
- Schema verification and cleanup
- State optimization

### 5.5 Version 1.3.18 (October 22, 2025)

**Data-Type-Aware Attribute Management**
- Intelligent value input dialogs
- Type-specific input controls (boolean, number, string, date, array, object)
- Enhanced DateTime support with datetime-local picker
- JSON input validation for complex types
- Professional dialog design with type labels
- Smart validation system
- State reset management
- Complete implementation in create and edit flows

### 5.6 Version 1.3.17 (October 21, 2025)

**Policy Attribute State Management**
- Additional resource attribute save fix
- Policy detail page display improvements
- Instant attribute value dropdown updates
- Comprehensive state synchronization
- Multi-step attribute value support
- Real-time user feedback

### 5.7 Version 1.3.14 (October 15, 2025)

**Comprehensive Dashboard Implementation**
- Real-time statistics from 8 API endpoints
- Beautiful gradient cards with hover animations
- Professional welcome header with user avatar
- Quick actions panel
- Policy status overview with progress bars
- Recent activity feed
- Feature highlights
- Responsive flexbox layout
- Material-UI v7 compatibility

### 5.8 Version 1.3.13 (October 15, 2025)

**Policy Edit Flow Feature Parity**
- Step 2: Attribute management with inline creation
- Step 3: Professional action selection with Autocomplete
- Step 4: Resource creation and attribute management
- Step 5: UI consistency with Card styling and proper grid order
- State management enhancements
- Auto-selection for newly created entities

### 5.9 Version 1.3.11 (September 24, 2025)

**Additional Resources Complete Implementation**
- Comprehensive tabular view
- Backend API integration
- Dynamic header system
- Professional table UI
- Backend API with CRUD operations
- Database schema design
- Filter system standardization

### 5.10 Version 1.3.9 (September 23, 2025)

**Professional Attribute Value Management**
- Professional Add Value modal redesign
- Duplicate value validation
- Real-time state updates
- Backend ObjectId handling
- Enhanced API error resolution
- Icon consistency

### 5.11 Version 1.3.7 (September 23, 2025)

**Pagination & Filter/Sort Uniformity**
- Comprehensive server-side pagination
- Global workspace validation
- Admin access control fix
- Pagination performance enhancement
- Real-time validation UI
- Filter/Sort uniformity

### 5.12 Version 1.3.6 (September 22, 2025)

**Workspace Visibility & User Assignment**
- Automatic workspace assignment to creators
- User assignment management endpoints
- Enhanced workspace visibility logic
- Stepper button uniformity

### 5.13 Version 1.3.3 (September 14, 2025)

**Environment Management & Name Consistency**
- Environment name auto-generation
- Synchronized display names
- Fixed silent creation failures
- Enhanced workspace creation reliability
- Improved environment validation

### 5.14 Version 1.3.0 (September 12, 2025)

**Advanced Performance & Hierarchical Architecture**
- Hierarchical workspace system
- Unified settings page
- Multiple API call optimization
- Standardized search debouncing (300ms)
- Enhanced boolean attribute display
- Comprehensive error handling

### 5.15 Version 1.2.0 (September 10, 2025)

**Enhanced Policy Management**
- 5-step policy creation wizard
- Advanced rate limiting with 429 error handling
- Comprehensive test coverage with Jest
- Attribute system with conditional scope
- Performance optimization

### 5.16 Version 1.1.0 (September 1, 2025)

**Azure AD SSO Integration**
- Microsoft Enterprise authentication
- MSAL library integration
- Token refresh mechanisms
- Seamless SSO experience

---

## 6. User Workflows

### 6.1 Creating a Policy

**Objective**: Define an access control policy for resources.

**Steps:**

1. **Navigate to Policies**
   - Click "Policies" in sidebar navigation
   - Click "Create New Policy" button

2. **Step 1: Basic Information**
   - Enter policy name (min 3 characters)
   - Add description (optional)
   - Select effect (Allow/Deny)
   - Click "Next"

3. **Step 2: Subject Selection**
   - Select subjects from dropdown (multi-select)
   - Configure subject attributes:
     - Select attribute from dropdown
     - Choose value based on data type
     - Add multiple attributes as needed
   - Optional: Create new subject inline
   - Click "Next"

4. **Step 3: Action Selection**
   - Select actions from multi-select Autocomplete
   - Search by name, description, category, or risk level
   - Actions display with color-coded risk indicators
   - Optional: Create new action inline
   - Click "Next"

5. **Step 4: Resource Selection**
   - **Left Column**: Select resources from dropdown
   - **Right Column**: Configure resource attributes
     - Select attributes from Autocomplete
     - Configure values for each attribute:
       - Boolean: Switch toggle
       - Number: Numeric input with min/max
       - String: Text input
       - Enum: Select dropdown with "Add Value" option
       - Date: datetime-local picker
   - Optional: Create new resource or resource attribute inline
   - Click "Next"

6. **Step 5: Additional Resources (Optional)**
   - **Left Column**: Select additional resources
   - **Right Column**: Configure global attributes (same for all)
     - Select attributes from Autocomplete
     - Configure values (same as Step 4)
   - Optional: Create new additional resource or attribute inline
   - Click "Next"

7. **Step 6: Review & Create**
   - Review human-readable policy statement
   - Verify technical details
   - Choose action:
     - **Save as Draft**: Save without activation
     - **Publish Policy**: Activate immediately
   - Confirm creation

**Result**: Policy created and available in Policies list.

---

### 6.2 Managing Workspaces

**Objective**: Create and configure multi-tenant workspace structure.

**Steps:**

1. **Create Workspace**
   - Navigate to Settings → Create Workspace
   - Enter workspace details:
     - Workspace name (unique)
     - Display name
     - Description
   - Click "Next"

2. **Add Applications**
   - Click "Add Application"
   - Enter application details:
     - Application name
     - Display name
     - Description
   - Repeat for multiple applications
   - Click "Next"

3. **Configure Environments**
   - System auto-generates 3 environments per application:
     - Development
     - Staging
     - Production
   - Customize environment names if needed
   - Click "Create Workspace"

4. **Assign Users**
   - Navigate to Workspaces
   - Select workspace
   - Click "Assign Users"
   - Select users from list
   - Confirm assignment

**Result**: Workspace created with applications, environments, and assigned users.

---

### 6.3 Attribute Management

**Objective**: Create and manage attributes for policy conditions.

**Steps:**

1. **Create Attribute**
   - Navigate to Attributes
   - Click "Create New Attribute"
   - Enter attribute details:
     - Display name
     - Description
     - Category (subject, resource, additional-resource)
     - Data type (string, number, boolean, date, array, object)
   - Configure constraints:
     - For enum: Add predefined values
     - For number: Set min/max
     - For string: Set regex pattern
   - Set as required/optional
   - Enable multi-value if needed
   - Click "Create"

2. **Add Enum Values**
   - Select existing attribute
   - Click "Add Value"
   - Enter value based on data type:
     - Boolean: Select true/false
     - Number: Enter numeric value
     - String: Enter text value
     - Date: Select date and time
     - Array/Object: Enter valid JSON
   - Click "Save"

3. **Use in Policies**
   - Attributes automatically appear in policy creation
   - Filtered by category context
   - Values available in dropdowns

**Result**: Attributes available for policy condition configuration.

---

### 6.4 User Management

**Objective**: Manage system users and their access.

**Steps:**

1. **Register User**
   - User navigates to registration page
   - Enters details:
     - Name
     - Email (unique)
     - Password
     - Department
     - Contact number
   - Submits registration
   - Default role: Basic

2. **Assign Role (Admin/Super Admin only)**
   - Navigate to Users
   - Select user
   - Click "Change Role"
   - Select new role:
     - Basic: View-only access
     - Admin: Workspace-specific admin
     - Super Admin: Global access
   - Confirm role change

3. **Assign to Workspace**
   - Navigate to Workspaces
   - Select workspace
   - Click "Assign Users"
   - Select users
   - Confirm assignment

4. **Manage Access**
   - Users with Basic role: View-only
   - Users with Admin role: Full CRUD within assigned workspaces
   - Users with Super Admin role: Global access

**Result**: Users properly configured with appropriate access levels.

---

## 7. API Architecture

### 7.1 RESTful API Design

**Base URL**: `http://localhost:3001/api` (Development)

**Authentication**: Bearer Token (JWT)

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response Format**:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Format**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 7.2 API Endpoints Summary

**Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

**Policies**
- `POST /policies` - Create policy
- `GET /policies` - List policies
- `GET /policies/:id` - Get policy
- `PUT /policies/:id` - Update policy
- `DELETE /policies/:id` - Delete policy
- `PATCH /policies/:id/status` - Update status

**Subjects**
- `POST /subjects` - Create subject
- `GET /subjects` - List subjects
- `GET /subjects/:id` - Get subject
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject

**Actions**
- `POST /actions` - Create action
- `GET /actions` - List actions
- `GET /actions/:id` - Get action
- `PUT /actions/:id` - Update action
- `DELETE /actions/:id` - Delete action

**Resources**
- `POST /resources` - Create resource
- `GET /resources` - List resources
- `GET /resources/:id` - Get resource
- `PUT /resources/:id` - Update resource
- `DELETE /resources/:id` - Delete resource

**Additional Resources**
- `POST /additional-resources` - Create
- `GET /additional-resources` - List
- `GET /additional-resources/:id` - Get
- `PUT /additional-resources/:id` - Update
- `DELETE /additional-resources/:id` - Delete

**Attributes**
- `POST /attributes` - Create attribute
- `GET /attributes?categories=subject` - List with filter
- `GET /attributes/:id` - Get attribute
- `PUT /attributes/:id` - Update attribute
- `POST /attributes/:id/values` - Add value
- `DELETE /attributes/:id` - Delete attribute

**Workspaces**
- `POST /workspaces` - Create workspace
- `GET /workspaces` - List workspaces
- `GET /workspaces/:id` - Get workspace
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `POST /workspaces/:id/applications` - Add application
- `POST /workspaces/:id/users/assign` - Assign user
- `DELETE /workspaces/:id/users/:userId` - Unassign user

**Users**
- `GET /users` - List users
- `GET /users/:id` - Get user
- `PUT /users/:id` - Update user
- `PATCH /users/:id/role` - Change role
- `DELETE /users/:id` - Delete user

**Activities**
- `GET /activities` - List activities
- `GET /activities/:id` - Get activity

### 7.3 Pagination & Filtering

**Query Parameters**:
```
?page=1&limit=10&search=keyword&sortBy=name&sortOrder=asc
```

**Example Request**:
```
GET /policies?page=2&limit=20&status=Active&sortBy=createdAt&sortOrder=desc
```

**Example Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## 8. Security & Authentication

### 8.1 Authentication Flow

**JWT-Based Authentication**:
1. User submits credentials (email, password)
2. Backend validates credentials
3. Server generates:
   - Access Token (15 min expiry)
   - Refresh Token (7 days expiry)
4. Client stores tokens securely
5. Client includes access token in all requests
6. On access token expiry, client uses refresh token
7. Server validates refresh token and issues new access token

**Azure AD SSO**:
1. User clicks "Sign in with Microsoft"
2. Redirects to Azure AD login
3. User authenticates with Microsoft credentials
4. Azure AD returns authorization code
5. Backend exchanges code for access token
6. Backend creates/updates user record
7. Backend issues JWT tokens
8. User redirected to dashboard

### 8.2 Authorization

**Role-Based Access Control (RBAC)**:

| Feature | Super Admin | Admin | Basic |
|---------|-------------|-------|-------|
| View Policies | ✓ (All workspaces) | ✓ (Assigned workspaces) | ✓ (Assigned workspaces) |
| Create Policies | ✓ | ✓ | ✗ |
| Edit Policies | ✓ | ✓ | ✗ |
| Delete Policies | ✓ | ✓ | ✗ |
| Manage Subjects | ✓ | ✓ | ✗ |
| Manage Resources | ✓ | ✓ | ✗ |
| Manage Actions | ✓ | ✓ | ✗ |
| Manage Attributes | ✓ | ✓ | ✗ |
| Manage Workspaces | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| Change Roles | ✓ | ✗ | ✗ |
| View Activity | ✓ | ✓ | ✓ |

**Workspace Isolation**:
- Policies scoped to workspace context
- Users see only assigned workspace data
- Super Admin has cross-workspace visibility
- Admin restricted to assigned workspaces

### 8.3 Security Features

**Password Security**:
- bcrypt hashing with 10 salt rounds
- Minimum 8 characters
- Complexity requirements enforced
- Password reset with email verification

**Token Security**:
- JWT with RS256 signature
- Short-lived access tokens (15 min)
- Refresh token rotation
- Token blacklisting on logout

**API Security**:
- Rate limiting (100 requests/15 min per IP)
- Request validation with Joi schemas
- SQL injection prevention (MongoDB)
- XSS protection
- CSRF tokens for state-changing operations
- CORS configuration

**Data Security**:
- MongoDB connection encryption
- Environment variable management
- Secrets stored in .env (not in code)
- Redis for session management
- HTTPS in production

---

## 9. Performance Optimization

### 9.1 Frontend Optimization

**Code Splitting**:
- Next.js automatic code splitting
- Dynamic imports for large components
- Route-based chunking
- Vendor bundle separation

**Caching**:
- React Query for server state caching
- Stale-while-revalidate strategy
- Optimistic updates
- Cache invalidation on mutations

**API Optimization**:
- Request deduplication
- Parallel API calls with Promise.all()
- Debounced search (300ms)
- Pagination for large datasets

**Bundle Size**:
- Current bundle sizes optimized:
  - Dashboard: 14.9 kB
  - Policy Create: 14.5 kB
  - Policy Edit: 14.9 kB
- Tree shaking for unused code
- Minification and compression

### 9.2 Backend Optimization

**Database Optimization**:
- MongoDB indexes on frequently queried fields
- Aggregation pipelines for complex queries
- Limit and skip for pagination
- Projection to fetch only needed fields

**Caching Strategy**:
- Redis for frequently accessed data
- Cache policies, subjects, actions
- TTL-based cache expiration
- Cache invalidation on updates

**Rate Limiting**:
- 100 requests per 15 minutes per IP
- Sliding window algorithm
- 429 Too Many Requests response
- Exponential backoff on client

**Connection Pooling**:
- MongoDB connection pool (10-20 connections)
- Reuse database connections
- Connection timeout management

---

## 10. Version History

### Timeline of Major Releases

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| **1.3.22** | Jan 14, 2025 | Global Additional Resource Attribute Model |
| **1.3.21** | Oct 22, 2025 | Navigation Menu Reorganization |
| **1.3.20** | Oct 22, 2025 | Strict Attribute Scope Enforcement |
| **1.3.19** | Oct 22, 2025 | Resource Form Simplification |
| **1.3.18** | Oct 22, 2025 | Data-Type-Aware Attribute Management |
| **1.3.17** | Oct 21, 2025 | Policy Attribute State Management |
| **1.3.14** | Oct 15, 2025 | Comprehensive Dashboard Implementation |
| **1.3.13** | Oct 15, 2025 | Policy Edit Flow Feature Parity |
| **1.3.11** | Sep 24, 2025 | Additional Resources Complete Implementation |
| **1.3.9** | Sep 23, 2025 | Professional Attribute Value Management |
| **1.3.7** | Sep 23, 2025 | Pagination & Filter/Sort Uniformity |
| **1.3.6** | Sep 22, 2025 | Workspace Visibility & User Assignment |
| **1.3.3** | Sep 14, 2025 | Environment Management |
| **1.3.0** | Sep 12, 2025 | Hierarchical Architecture |
| **1.2.0** | Sep 10, 2025 | Enhanced Policy Management |
| **1.1.0** | Sep 1, 2025 | Azure AD SSO Integration |
| **1.0.0** | Aug 15, 2025 | Initial Release |

---

## Appendices

### Appendix A: Glossary

- **ABAC**: Attribute-Based Access Control
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token
- **SSO**: Single Sign-On
- **CRUD**: Create, Read, Update, Delete
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **ODM**: Object Document Mapper
- **TTL**: Time To Live
- **CORS**: Cross-Origin Resource Sharing
- **XSS**: Cross-Site Scripting
- **CSRF**: Cross-Site Request Forgery

### Appendix B: Contact Information

- **Repository**: [https://github.com/Z-P-Repo/CRAFT2.0](https://github.com/Z-P-Repo/CRAFT2.0)
- **Documentation**: This document
- **Support**: Create an issue on GitHub

---

**Document End**

*This documentation is maintained as part of the CRAFT 2.0 project and is updated with each major release.*

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
