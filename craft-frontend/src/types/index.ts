// Frontend-specific types for CRAFT Permission System

export interface User {
  _id?: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'basic';
  attributes: Record<string, any>;
  active: boolean;
  managerId?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
  department?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Subject {
  _id?: string;
  name: string;
  attributeIds: string[] | AttributeDefinition[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceObject {
  _id?: string;
  name: string;
  attributeIds: string[] | AttributeDefinition[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Action {
  _id?: string;
  name: string;
  description?: string;
  category: string;
  attributeIds: string[] | AttributeDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeDefinition {
  _id?: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value: any;
  description?: string;
  applicableToEntity: ('subject' | 'object')[];
  usedInSubjects?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'time_between' | 'day_of_week' | 'requires_approval' | 'requires_ticket';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  metadata?: {
    approvalLevels?: number;
    approverRoles?: string[];
    ticketType?: string;
    timeZone?: string;
    startTime?: string;
    endTime?: string;
    workflowId?: string;
    businessDays?: boolean;
  };
}

export interface Policy {
  _id?: string;
  name: string;
  description?: string;
  subject: {
    type: 'specific' | 'attribute_based';
    reference?: string;
    rules?: PolicyRule[];
  };
  object: {
    type: 'specific' | 'attribute_based';
    reference?: string;
    rules?: PolicyRule[];
  };
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: PolicyRule[];
  rules?: PolicyRule[];
  active: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyEvaluation {
  decision: 'allow' | 'deny' | 'not_applicable';
  matchedPolicies: Policy[];
  reason: string;
}

export interface PolicyEvaluationRequest {
  subject: Subject | { name: string; [key: string]: any };
  object: ResourceObject | { name: string; [key: string]: any };
  action: string;
  context?: Record<string, any>;
}

// UI Component Props Types
export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  sortable?: boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'number';
  required?: boolean;
  options?: { label: string; value: any }[];
  validation?: any;
  placeholder?: string;
  helperText?: string;
}

export interface NotificationState {
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Theme types
export interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Application state
export interface AppState {
  auth: AuthState;
  theme: ThemeState;
  notifications: NotificationState;
  loading: boolean;
  error: string | null;
}

// API client types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Form types
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType;
  children?: NavItem[];
  roles?: string[];
  badge?: string | number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Filter and sort types
export interface FilterState {
  search?: string;
  filters: Record<string, any>;
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    pageSize: number;
  };
}

// Permission types for UI
export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
  reason?: string;
}