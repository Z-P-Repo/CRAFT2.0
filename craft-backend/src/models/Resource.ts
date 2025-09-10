import { Schema, model, Document } from 'mongoose';

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

// Pre-save middleware to generate id if not provided
ResourceSchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const Resource = model<IResource>('Resource', ResourceSchema);
export default Resource;