import { Schema, model, Document } from 'mongoose';

// Policy Rule interfaces
export interface IPolicyAttribute {
  name: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals' | 'not_contains' | 'not_in';
  value: string | string[];
}

export interface IPolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
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
  subjects: string[]; // Subject IDs this policy applies to
  resources: string[]; // Resource/Object IDs this policy applies to
  actions: string[]; // Action IDs this policy applies to
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
      values: ['equals', 'contains', 'in', 'not_equals', 'not_contains', 'not_in'],
      message: 'Operator must be one of: equals, contains, in, not_equals, not_contains, not_in',
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
      values: ['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'],
      message: 'Operator must be one of: equals, contains, greater_than, less_than, in, not_in',
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

// Pre-save middleware to generate id if not provided
PolicySchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const Policy = model<IPolicy>('Policy', PolicySchema);
export default Policy;