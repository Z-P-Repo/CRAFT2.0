import { Schema, model, Document } from 'mongoose';

// Resource state condition interface for complex policies
export interface IResourceState {
  resourceId: string;
  attributeName: string;
  operator: 'equals' | 'in' | 'contains' | 'not_equals' | 'not_in' | 'greater_than' | 'less_than';
  expectedValue: any;
}

// Resource dependency interface for additional resources
export interface IResourceDependency {
  dependsOn: string[]; // Resource IDs this resource depends on
  requiredStates: IResourceState[]; // Required states of dependent resources
  logicalOperator: 'AND' | 'OR'; // How to combine multiple conditions
  enabled: boolean; // Whether this dependency is active
}

// Resource relationship interface for hierarchical structures
export interface IResourceRelationship {
  parent?: string; // Parent resource ID
  children: string[]; // Child resource IDs
  type: 'hierarchical' | 'dependency' | 'additional' | 'compositional';
  strength: 'weak' | 'strong'; // Weak = optional, Strong = required
  metadata?: {
    description?: string;
    createdBy: string;
    createdAt: Date;
  };
}

export interface IResource extends Document {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  type: 'file' | 'document' | 'api' | 'database' | 'service' | 'folder' | 'application';
  uri: string;
  description?: string;
  attributes: Map<string, any>;
  parentId?: string;
  children: string[];

  // Complex Policy Support
  conditions?: IResourceDependency; // Conditional access rules
  relationships?: IResourceRelationship; // Resource relationships and hierarchy

  // Hierarchy Context
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  environmentId: string; // Reference to Environment
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    admin: boolean;
  };
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    externalId?: string;
    size?: number;
    mimeType?: string;
    isSystem: boolean;
    isCustom: boolean;
    version: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas for complex policy support
const ResourceStateSchema = new Schema<IResourceState>({
  resourceId: {
    type: String,
    required: true,
    trim: true,
  },
  attributeName: {
    type: String,
    required: true,
    trim: true,
  },
  operator: {
    type: String,
    enum: {
      values: ['equals', 'in', 'contains', 'not_equals', 'not_in', 'greater_than', 'less_than'],
      message: 'Operator must be one of: equals, in, contains, not_equals, not_in, greater_than, less_than',
    },
    required: true,
  },
  expectedValue: {
    type: Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

const ResourceDependencySchema = new Schema<IResourceDependency>({
  dependsOn: [{
    type: String,
    trim: true,
  }],
  requiredStates: [ResourceStateSchema],
  logicalOperator: {
    type: String,
    enum: {
      values: ['AND', 'OR'],
      message: 'Logical operator must be AND or OR',
    },
    default: 'AND',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const ResourceRelationshipSchema = new Schema<IResourceRelationship>({
  parent: {
    type: String,
    trim: true,
  },
  children: [{
    type: String,
    trim: true,
  }],
  type: {
    type: String,
    enum: {
      values: ['hierarchical', 'dependency', 'additional', 'compositional'],
      message: 'Relationship type must be one of: hierarchical, dependency, additional, compositional',
    },
    default: 'hierarchical',
  },
  strength: {
    type: String,
    enum: {
      values: ['weak', 'strong'],
      message: 'Relationship strength must be weak or strong',
    },
    default: 'weak',
  },
  metadata: {
    description: String,
    createdBy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
}, { _id: false });

const ResourceSchema = new Schema<IResource>({
  // Hierarchy Context Fields
  workspaceId: {
    type: String,
    required: [true, 'Workspace ID is required'],
    index: true,
    ref: 'Workspace'
  },
  applicationId: {
    type: String,
    required: [true, 'Application ID is required'],
    index: true,
    ref: 'Application'
  },
  environmentId: {
    type: String,
    required: [true, 'Environment ID is required'],
    index: true,
    ref: 'Environment'
  },
  
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: {
      values: ['file', 'document', 'api', 'database', 'service', 'folder', 'application'],
      message: 'Type must be one of: file, document, api, database, service, folder, application',
    },
    required: true,
    index: true,
  },
  uri: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
  parentId: {
    type: String,
    index: true,
  },
  children: [{
    type: String,
  }],

  // Complex Policy Support Fields
  conditions: {
    type: ResourceDependencySchema,
    required: false,
  },
  relationships: {
    type: ResourceRelationshipSchema,
    required: false,
  },

  permissions: {
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    execute: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
  },
  metadata: {
    owner: {
      type: String,
      default: 'system',
    },
    createdBy: {
      type: String,
      default: null,
    },
    lastModifiedBy: {
      type: String,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    classification: {
      type: String,
      enum: {
        values: ['public', 'internal', 'confidential', 'restricted'],
        message: 'Classification must be public, internal, confidential, or restricted',
      },
      default: 'internal',
      index: true,
    },
    externalId: String,
    size: Number,
    mimeType: String,
    isSystem: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Hierarchy-based compound indexes for better query performance
ResourceSchema.index({ environmentId: 1, id: 1 }, { unique: true }); // Unique within environment
ResourceSchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1 }); // Hierarchy navigation
ResourceSchema.index({ environmentId: 1, name: 1, type: 1 });
ResourceSchema.index({ environmentId: 1, 'metadata.classification': 1, active: 1 });
ResourceSchema.index({ environmentId: 1, 'metadata.tags': 1 });
ResourceSchema.index({ environmentId: 1, parentId: 1, active: 1 });
ResourceSchema.index({ environmentId: 1, type: 1, active: 1 }); // Common type-based queries
ResourceSchema.index({ environmentId: 1, uri: 1 }, { sparse: true }); // URI lookups within environment

// Complex Policy Support Indexes
ResourceSchema.index({ environmentId: 1, 'conditions.dependsOn': 1 }, { sparse: true }); // Resource dependency queries
ResourceSchema.index({ environmentId: 1, 'relationships.parent': 1 }, { sparse: true }); // Parent-child relationship queries
ResourceSchema.index({ environmentId: 1, 'relationships.children': 1 }, { sparse: true }); // Child lookup queries
ResourceSchema.index({ environmentId: 1, 'relationships.type': 1 }, { sparse: true }); // Relationship type queries
ResourceSchema.index({ environmentId: 1, 'conditions.enabled': 1, active: 1 }, { sparse: true }); // Active additional resources

// Pre-save middleware to generate id if not provided
ResourceSchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const Resource = model<IResource>('Resource', ResourceSchema);
export default Resource;