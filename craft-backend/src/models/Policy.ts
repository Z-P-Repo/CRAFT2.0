import { Schema, model, Document } from 'mongoose';
import { IResourceState, IResourceDependency } from './Resource';

// Policy Rule interfaces
export interface IPolicyAttribute {
  name: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals' | 'not_contains' | 'not_in' | 'includes' | 'not_includes' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal';
  value: string | string[] | number;
}

export interface IPolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'in' | 'not_in' | 'includes' | 'not_includes';
  value: string | number | string[];
}

export interface IAdditionalResource {
  id: string; // Additional Resource ID
  attributes: IPolicyAttribute[]; // Attributes for the additional resource
}

export interface IPolicyRule {
  id: string;
  subject: {
    type: string; // Subject ID/type
    attributes: IPolicyAttribute[];
  };
  action: {
    name: string; // Action ID
    displayName: string; // Action display name
  };
  object: {
    type: string; // Object ID/type
    attributes: IPolicyAttribute[];
  };
  conditions: IPolicyCondition[];
}

// Complex Policy interfaces for advanced scenarios
export interface ITimeConstraint {
  startTime: Date;
  endTime: Date;
  timezone: string;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    pattern?: string; // Cron-like pattern for custom recurrence
    endDate?: Date;
  };
  enabled: boolean;
}

export interface IDependencyRule {
  id: string;
  name: string;
  description?: string;
  triggerResource: string; // Resource ID that triggers this rule
  triggerConditions: IPolicyCondition[]; // Conditions that must be met
  enabledResources: string[]; // Resources that become available when triggered
  disabledResources?: string[]; // Resources that become unavailable when triggered
  logicalOperator: 'AND' | 'OR'; // How to combine trigger conditions
  priority: number; // Rule evaluation priority (lower = higher priority)
  enabled: boolean;
}

export interface IConditionalResource {
  resourceId: string;
  conditions: IResourceDependency;
  accessLevel: 'read' | 'write' | 'execute' | 'admin' | 'custom';
  timeConstraints?: ITimeConstraint[];
  enabled: boolean;
}

export interface IComplexPolicyRule extends IPolicyRule {
  // Enhanced resource conditions for complex scenarios
  resourceConditions: {
    primary: string[]; // Always available resources
    additional: IConditionalResource[]; // Resources available based on conditions
    logicalOperator: 'AND' | 'OR'; // How to combine resource conditions
  };

  // Time-based constraints
  timeConstraints?: ITimeConstraint[];

  // Dynamic dependency rules
  dependencyRules: IDependencyRule[];

  // Rule evaluation metadata
  evaluationMetadata: {
    maxEvaluationTime?: number; // Max time in ms for rule evaluation
    cacheable: boolean; // Whether results can be cached
    cacheExpirationTime?: number; // Cache expiration in seconds
    evaluationCount?: number; // Number of times this rule has been evaluated
    lastEvaluated?: Date;
  };
}

export interface IPolicy extends Document {
  _id: string;
  id: string;
  
  // Hierarchy Context
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  environmentId: string; // Reference to Environment
  
  name: string;
  description: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  rules: IPolicyRule[];

  // Complex Policy Support
  complexRules?: IComplexPolicyRule[]; // Advanced rules with additional resources and time constraints
  policyType: 'simple' | 'complex'; // Policy complexity type

  subjects: string[]; // Subject IDs this policy applies to
  resources: string[]; // Resource/Object IDs this policy applies to
  actions: string[]; // Action IDs this policy applies to
  additionalResources: IAdditionalResource[]; // Additional Resources with attributes
  conditions: IPolicyCondition[]; // Global policy conditions
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    version: string;
    isSystem: boolean;
    isCustom: boolean;
  };
  
  // Inheritance rules
  inheritanceRules?: {
    fromParentEnvironments: boolean;
    fromApplicationDefaults: boolean;
    fromWorkspaceDefaults: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas for nested objects
const PolicyAttributeSchema = new Schema<IPolicyAttribute>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  operator: {
    type: String,
    enum: {
      values: ['equals', 'contains', 'in', 'not_equals', 'not_contains', 'not_in', 'includes', 'not_includes', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'],
      message: 'Operator must be one of: equals, contains, in, not_equals, not_contains, not_in, includes, not_includes, greater_than, less_than, greater_than_or_equal, less_than_or_equal',
    },
    required: true,
  },
  value: {
    type: Schema.Types.Mixed, // Can be string or array of strings
    required: true,
  },
}, { _id: false });

const PolicyConditionSchema = new Schema<IPolicyCondition>({
  field: {
    type: String,
    required: true,
    trim: true,
  },
  operator: {
    type: String,
    enum: {
      values: ['equals', 'contains', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'in', 'not_in', 'includes', 'not_includes'],
      message: 'Operator must be one of: equals, contains, greater_than, less_than, greater_than_or_equal, less_than_or_equal, in, not_in, includes, not_includes',
    },
    required: true,
  },
  value: {
    type: Schema.Types.Mixed, // Can be string, number, or array
    required: true,
  },
}, { _id: false });

const PolicyRuleSchema = new Schema<IPolicyRule>({
  id: {
    type: String,
    required: true,
  },
  subject: {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    attributes: [PolicyAttributeSchema],
  },
  action: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  object: {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    attributes: [PolicyAttributeSchema],
  },
  conditions: [PolicyConditionSchema],
}, { _id: false });

const AdditionalResourceSchema = new Schema<IAdditionalResource>({
  id: {
    type: String,
    required: true,
    trim: true,
  },
  attributes: [PolicyAttributeSchema],
}, { _id: false });

// Complex Policy schemas
const TimeConstraintSchema = new Schema<ITimeConstraint>({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  timezone: {
    type: String,
    required: true,
    trim: true,
  },
  recurrence: {
    type: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly', 'custom'],
        message: 'Recurrence type must be one of: daily, weekly, monthly, custom',
      },
      required: true,
    },
    pattern: {
      type: String,
      trim: true,
    },
    endDate: {
      type: Date,
    },
  },
  enabled: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const DependencyRuleSchema = new Schema<IDependencyRule>({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  triggerResource: {
    type: String,
    required: true,
    trim: true,
  },
  triggerConditions: [PolicyConditionSchema],
  enabledResources: [{
    type: String,
    trim: true,
  }],
  disabledResources: [{
    type: String,
    trim: true,
  }],
  logicalOperator: {
    type: String,
    enum: {
      values: ['AND', 'OR'],
      message: 'Logical operator must be AND or OR',
    },
    default: 'AND',
  },
  priority: {
    type: Number,
    default: 0,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const ConditionalResourceSchema = new Schema<IConditionalResource>({
  resourceId: {
    type: String,
    required: true,
    trim: true,
  },
  conditions: {
    type: Schema.Types.Mixed, // References IResourceDependency from Resource model
    required: true,
  },
  accessLevel: {
    type: String,
    enum: {
      values: ['read', 'write', 'execute', 'admin', 'custom'],
      message: 'Access level must be one of: read, write, execute, admin, custom',
    },
    required: true,
  },
  timeConstraints: [TimeConstraintSchema],
  enabled: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const ComplexPolicyRuleSchema = new Schema<IComplexPolicyRule>({
  id: {
    type: String,
    required: true,
  },
  subject: {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    attributes: [PolicyAttributeSchema],
  },
  action: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  object: {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    attributes: [PolicyAttributeSchema],
  },
  conditions: [PolicyConditionSchema],

  // Enhanced resource conditions for complex scenarios
  resourceConditions: {
    primary: [{
      type: String,
      trim: true,
    }],
    additional: [ConditionalResourceSchema],
    logicalOperator: {
      type: String,
      enum: {
        values: ['AND', 'OR'],
        message: 'Logical operator must be AND or OR',
      },
      default: 'AND',
    },
  },

  // Time-based constraints
  timeConstraints: [TimeConstraintSchema],

  // Dynamic dependency rules
  dependencyRules: [DependencyRuleSchema],

  // Rule evaluation metadata
  evaluationMetadata: {
    maxEvaluationTime: {
      type: Number,
      default: 5000, // 5 seconds default
    },
    cacheable: {
      type: Boolean,
      default: true,
    },
    cacheExpirationTime: {
      type: Number,
      default: 300, // 5 minutes default
    },
    evaluationCount: {
      type: Number,
      default: 0,
    },
    lastEvaluated: {
      type: Date,
    },
  },
}, { _id: false });

const PolicySchema = new Schema<IPolicy>({
  id: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  
  // Hierarchy Context
  workspaceId: {
    type: String,
    required: true,
    index: true,
    ref: 'Workspace'
  },
  applicationId: {
    type: String,
    required: true,
    index: true,
    ref: 'Application'
  },
  environmentId: {
    type: String,
    required: true,
    index: true,
    ref: 'Environment'
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  effect: {
    type: String,
    enum: {
      values: ['Allow', 'Deny'],
      message: 'Effect must be either Allow or Deny',
    },
    required: true,
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Draft'],
      message: 'Status must be one of: Active, Inactive, Draft',
    },
    default: 'Draft',
  },
  rules: [PolicyRuleSchema],

  // Complex Policy Support
  complexRules: [ComplexPolicyRuleSchema], // Advanced rules with additional resources and time constraints
  policyType: {
    type: String,
    enum: {
      values: ['simple', 'complex'],
      message: 'Policy type must be simple or complex',
    },
    default: 'simple',
  },
  subjects: [{
    type: String,
    trim: true,
  }],
  resources: [{
    type: String,
    trim: true,
  }],
  actions: [{
    type: String,
    trim: true,
  }],
  additionalResources: [AdditionalResourceSchema],
  conditions: [PolicyConditionSchema],
  metadata: {
    createdBy: {
      type: String,
      default: 'system',
    },
    lastModifiedBy: {
      type: String,
      default: 'system',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    version: {
      type: String,
      default: '1.0.0',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
  },
  
  // Inheritance rules
  inheritanceRules: {
    fromParentEnvironments: {
      type: Boolean,
      default: false,
    },
    fromApplicationDefaults: {
      type: Boolean,
      default: false,
    },
    fromWorkspaceDefaults: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance with hierarchical structure
// Compound indexes for hierarchy-based queries
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, name: 1 }, { unique: true });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, status: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, effect: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, subjects: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, actions: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, resources: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, 'metadata.tags': 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, createdAt: -1 });

// Complex Policy Support Indexes
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, policyType: 1 });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, 'complexRules.dependencyRules.triggerResource': 1 }, { sparse: true });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, 'complexRules.resourceConditions.additional.resourceId': 1 }, { sparse: true });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, 'complexRules.timeConstraints.enabled': 1 }, { sparse: true });
PolicySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, 'complexRules.evaluationMetadata.cacheable': 1 }, { sparse: true });

// Pre-save middleware to generate id if not provided
PolicySchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const Policy = model<IPolicy>('Policy', PolicySchema);
export default Policy;