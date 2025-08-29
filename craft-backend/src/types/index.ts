// Core Permission System Types

export interface IAttributeDefinition {
  _id?: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value: any;
  description?: string;
  applicableToEntity: ('subject' | 'object')[];
  usedInSubjects?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubject {
  _id?: string;
  name: string;
  attributeIds: string[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResourceObject {
  _id?: string;
  name: string;
  attributeIds: string[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAction {
  _id?: string;
  name: string;
  description?: string;
  category: string;
  attributeIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPolicyRule {
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

export interface IPolicy {
  _id?: string;
  name: string;
  description?: string;
  subject: {
    type: 'specific' | 'attribute_based';
    reference?: string;
    rules?: IPolicyRule[];
  };
  object: {
    type: 'specific' | 'attribute_based';
    reference?: string;
    rules?: IPolicyRule[];
  };
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: IPolicyRule[];
  rules?: IPolicyRule[];
  active: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'basic';
  attributes: Record<string, any>;
  active: boolean;
  managerId?: string;
  department?: string;
  authProvider?: 'local' | 'azuread';
  azureAdId?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPolicyEvaluationContext {
  subject: ISubject;
  object: IResourceObject;
  action: string;
  environment?: Record<string, any>;
}

export interface IPolicyEvaluationResult {
  decision: 'allow' | 'deny' | 'not_applicable';
  matchedPolicies: IPolicy[];
  reason: string;
}

// Request/Response Types
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: Omit<IUser, 'password'>;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Service Layer Types
export interface IServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Repository Layer Types
export interface IRepository<T> {
  findAll(options?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// JWT Types
export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface IAuthRequest extends Request {
  user?: Omit<IUser, 'password'> | undefined;
}

// Error Types
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface IAppError {
  code: ErrorCodes;
  message: string;
  statusCode: number;
  details?: any;
}