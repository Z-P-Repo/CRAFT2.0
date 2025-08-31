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
  id?: string;
  name: string;
  displayName?: string;
  email?: string;
  type?: 'user' | 'group' | 'role';
  role?: string;
  department?: string;
  description?: string;
  status?: 'active' | 'inactive';
  active?: boolean;
  permissions?: string[];
  attributeIds?: string[] | AttributeDefinition[];
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  metadata?: {
    createdBy?: string;
    lastModifiedBy?: string;
    tags?: string[];
    isSystem?: boolean;
    isCustom?: boolean;
    version?: string;
    externalId?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceObject {
  _id?: string;
  id?: string;
  name: string;
  displayName?: string;
  type?: string;
  uri?: string;
  description?: string;
  active?: boolean;
  attributeIds?: string[] | AttributeDefinition[];
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  parentId?: string;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    admin: boolean;
  };
  metadata?: {
    classification?: string;
    tags?: string[];
    owner?: string;
    createdBy?: string;
    lastModifiedBy?: string;
    isSystem?: boolean;
    isCustom?: boolean;
    version?: string;
    externalId?: string;
    mimeType?: string;
    size?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Action {
  _id?: string;
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  category: string;
  httpMethod?: string;
  endpoint?: string;
  riskLevel?: string;
  active?: boolean;
  attributeIds: string[] | AttributeDefinition[];
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeDefinition {
  _id?: string;
  name: string;
  displayName?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  value: any;
  description?: string;
  applicableToEntity: ('subject' | 'object')[];
  categories?: ('subject' | 'resource')[];
  usedInSubjects?: string[];
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  isRequired?: boolean;
  isMultiValue?: boolean;
  active?: boolean;
  metadata?: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
    externalId?: string;
  };
  constraints?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    enumValues?: any[];
    format?: string;
  };
  validation?: {
    isEmail?: boolean;
    isUrl?: boolean;
    isPhoneNumber?: boolean;
    customValidator?: string;
  };
  mapping?: {
    sourceField?: string;
    transformFunction?: string;
    cacheTime?: number;
  };
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

// Activity tracking types
export interface Activity {
  _id?: string;
  id?: string;
  type: ActivityType;
  category: ActivityCategory;
  action: string;
  resource: {
    type: string;
    id: string;
    name: string;
  };
  actor: {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'system' | 'service';
  };
  target?: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: {
    changes?: Record<string, { from: any; to: any }>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    duration?: number;
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
    additionalData?: Record<string, any>;
  };
  description: string;
  timestamp: string;
  severity: ActivitySeverity;
  tags?: string[];
}

export type ActivityType = 
  | 'authentication'
  | 'authorization' 
  | 'policy_management'
  | 'user_management'
  | 'resource_management'
  | 'system_configuration'
  | 'audit'
  | 'security_event'
  | 'data_modification'
  | 'access_request'
  | 'workflow'
  | 'integration'
  | 'maintenance';

export type ActivityCategory = 
  | 'security'
  | 'administration'
  | 'compliance'
  | 'operation'
  | 'configuration'
  | 'integration'
  | 'monitoring'
  | 'user_activity';

export type ActivitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ActivityFilter {
  type?: ActivityType[];
  category?: ActivityCategory[];
  severity?: ActivitySeverity[];
  actor?: string;
  resource?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  tags?: string[];
}