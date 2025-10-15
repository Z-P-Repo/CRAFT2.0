import { Schema, model, Document } from 'mongoose';

// Additional Resource Types
export type AdditionalResourceType = 'condition' | 'state' | 'approval' | 'status' | 'ticket';

// Dependency relationship for additional resources
export interface IAdditionalResourceDependency {
  dependsOn: string[]; // Other additional resource IDs this depends on
  operator: 'AND' | 'OR'; // How to combine dependencies
  required: boolean; // Whether this dependency is mandatory
}

// Evaluation rule for complex conditions
export interface IEvaluationRule {
  field: string; // Field to evaluate
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any; // Expected value(s)
  caseInsensitive?: boolean; // For string comparisons
}

// Additional Resource Document Interface
export interface IAdditionalResource extends Document {
  _id: string;
  id: string;
  name: string; // Unique identifier name
  displayName: string; // Human-readable name
  type: AdditionalResourceType;
  description?: string;

  // Core attributes that define the resource
  attributes: Map<string, any>;

  // Evaluation rules for conditional logic
  evaluationRules?: IEvaluationRule[];

  // Dependencies on other additional resources
  dependencies?: IAdditionalResourceDependency;

  // Hierarchy Context - same as regular resources
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  environmentId: string; // Reference to Environment

  // Resource metadata
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    category?: string; // Additional categorization
    priority?: 'low' | 'medium' | 'high' | 'critical';
    isSystem: boolean; // System-defined vs user-defined
    isTemplate: boolean; // Can be used as template for creating new resources
    version: string;
    externalId?: string; // Integration with external systems
  };

  // Configuration and state
  config?: Map<string, any>; // Additional configuration parameters
  active: boolean;

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastEvaluatedAt?: Date; // When this resource was last evaluated
  evaluationCount: number; // How many times this resource has been evaluated
}

// Sub-schemas
const EvaluationRuleSchema = new Schema<IEvaluationRule>({
  field: {
    type: String,
    required: true,
    trim: true,
  },
  operator: {
    type: String,
    enum: {
      values: ['equals', 'not_equals', 'in', 'not_in', 'contains', 'greater_than', 'less_than', 'between'],
      message: 'Operator must be one of: equals, not_equals, in, not_in, contains, greater_than, less_than, between',
    },
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  caseInsensitive: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const AdditionalResourceDependencySchema = new Schema<IAdditionalResourceDependency>({
  dependsOn: [{
    type: String,
    trim: true,
  }],
  operator: {
    type: String,
    enum: {
      values: ['AND', 'OR'],
      message: 'Dependency operator must be AND or OR',
    },
    default: 'AND',
  },
  required: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// Main Additional Resource Schema
const AdditionalResourceSchema = new Schema<IAdditionalResource>({
  id: {
    type: String,
    required: [true, 'Additional resource ID is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_-]+$/, 'ID must contain only lowercase letters, numbers, hyphens, and underscores'],
  },
  name: {
    type: String,
    required: [true, 'Additional resource name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [200, 'Display name cannot exceed 200 characters'],
  },
  type: {
    type: String,
    enum: {
      values: ['condition', 'state', 'approval', 'status', 'ticket'],
      message: 'Type must be one of: condition, state, approval, status, ticket',
    },
    required: [true, 'Additional resource type is required'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },

  // Core attributes using Map for flexible key-value storage
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => new Map(),
  },

  // Evaluation rules for complex logic
  evaluationRules: [EvaluationRuleSchema],

  // Dependencies on other additional resources
  dependencies: AdditionalResourceDependencySchema,

  // Hierarchy Context
  workspaceId: {
    type: String,
    required: [true, 'Workspace ID is required'],
    ref: 'Workspace',
  },
  applicationId: {
    type: String,
    required: [true, 'Application ID is required'],
    ref: 'Application',
  },
  environmentId: {
    type: String,
    required: [true, 'Environment ID is required'],
    ref: 'Environment',
  },

  // Metadata
  metadata: {
    owner: {
      type: String,
      required: [true, 'Owner is required'],
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      trim: true,
    },
    lastModifiedBy: {
      type: String,
      required: [true, 'Last modified by is required'],
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    category: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be one of: low, medium, high, critical',
      },
      default: 'medium',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    externalId: {
      type: String,
      trim: true,
    },
  },

  // Configuration
  config: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => new Map(),
  },

  // Status
  active: {
    type: Boolean,
    default: true,
  },

  // Audit fields
  lastEvaluatedAt: {
    type: Date,
  },
  evaluationCount: {
    type: Number,
    default: 0,
    min: [0, 'Evaluation count cannot be negative'],
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      // Convert Maps to Objects for JSON serialization
      if (ret.attributes && ret.attributes instanceof Map) {
        ret.attributes = Object.fromEntries(ret.attributes) as any;
      }
      if (ret.config && ret.config instanceof Map) {
        ret.config = Object.fromEntries(ret.config) as any;
      }

      return ret;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      // Convert Maps to Objects
      if (ret.attributes && ret.attributes instanceof Map) {
        ret.attributes = Object.fromEntries(ret.attributes) as any;
      }
      if (ret.config && ret.config instanceof Map) {
        ret.config = Object.fromEntries(ret.config) as any;
      }

      return ret;
    }
  }
});

// Compound indexes for efficient querying
AdditionalResourceSchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1 });
AdditionalResourceSchema.index({ type: 1, active: 1 });
AdditionalResourceSchema.index({ 'metadata.tags': 1 });
AdditionalResourceSchema.index({ name: 'text', displayName: 'text', description: 'text' });
AdditionalResourceSchema.index({ createdAt: -1 });
AdditionalResourceSchema.index({ updatedAt: -1 });
AdditionalResourceSchema.index({ 'metadata.priority': 1, active: 1 });

// Pre-save middleware to ensure data consistency
AdditionalResourceSchema.pre('save', function(this: IAdditionalResource, next) {
  // Auto-generate ID from name if not provided
  if (!this.id && this.name) {
    this.id = this.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  }

  // Ensure lastModifiedBy is set
  if (this.isModified() && this.metadata) {
    this.metadata.lastModifiedBy = this.metadata.lastModifiedBy || this.metadata.createdBy;
  }

  next();
});

// Static methods for common queries
AdditionalResourceSchema.statics.findByType = function(type: AdditionalResourceType, environmentId: string) {
  return this.find({
    type,
    environmentId,
    active: true
  }).sort({ displayName: 1 });
};

AdditionalResourceSchema.statics.findByWorkspace = function(workspaceId: string, applicationId: string, environmentId: string) {
  return this.find({
    workspaceId,
    applicationId,
    environmentId,
    active: true
  }).sort({ type: 1, displayName: 1 });
};

AdditionalResourceSchema.statics.findByTags = function(tags: string[], environmentId: string) {
  return this.find({
    'metadata.tags': { $in: tags },
    environmentId,
    active: true
  });
};

// Instance methods
AdditionalResourceSchema.methods.evaluate = function(this: IAdditionalResource, context: any = {}): boolean {
  // Increment evaluation count
  this.evaluationCount += 1;
  this.lastEvaluatedAt = new Date();

  // If no evaluation rules, return true (always available)
  if (!this.evaluationRules || this.evaluationRules.length === 0) {
    return true;
  }

  // Evaluate all rules (AND logic by default)
  return this.evaluationRules.every(rule => {
    const fieldValue = context[rule.field];

    switch (rule.operator) {
      case 'equals':
        return rule.caseInsensitive && typeof fieldValue === 'string' && typeof rule.value === 'string'
          ? fieldValue.toLowerCase() === rule.value.toLowerCase()
          : fieldValue === rule.value;

      case 'not_equals':
        return rule.caseInsensitive && typeof fieldValue === 'string' && typeof rule.value === 'string'
          ? fieldValue.toLowerCase() !== rule.value.toLowerCase()
          : fieldValue !== rule.value;

      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);

      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);

      case 'contains':
        return typeof fieldValue === 'string' && typeof rule.value === 'string' &&
               fieldValue.toLowerCase().includes(rule.value.toLowerCase());

      case 'greater_than':
        return fieldValue > rule.value;

      case 'less_than':
        return fieldValue < rule.value;

      case 'between':
        return Array.isArray(rule.value) && rule.value.length === 2 &&
               fieldValue >= rule.value[0] && fieldValue <= rule.value[1];

      default:
        return false;
    }
  });
};

AdditionalResourceSchema.methods.canBeUsedBy = function(this: IAdditionalResource, userId: string, userRoles: string[] = []): boolean {
  // System resources are available to all users
  if (this.metadata.isSystem) {
    return true;
  }

  // Owner can always use their resources
  if (this.metadata.owner === userId || this.metadata.createdBy === userId) {
    return true;
  }

  // Additional role-based logic can be added here
  return true;
};

// Export the model
export default model<IAdditionalResource>('AdditionalResource', AdditionalResourceSchema);