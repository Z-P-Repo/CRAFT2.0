import mongoose, { Schema, Document } from 'mongoose';

export interface IEnvironmentConfiguration {
  variables: Record<string, string>;
  endpoints: Record<string, string>;
  features: Record<string, boolean>;
  secrets?: Record<string, string>; // Encrypted in database
  databases?: {
    primary: {
      host: string;
      port: number;
      database: string;
      ssl: boolean;
    };
    replica?: {
      host: string;
      port: number;
      database: string;
      ssl: boolean;
    };
  };
  cache?: {
    enabled: boolean;
    type: 'redis' | 'memory';
    host?: string;
    port?: number;
    ttl: number; // in seconds
  };
  monitoring?: {
    enabled: boolean;
    metricsEndpoint?: string;
    logsEndpoint?: string;
    alerting?: {
      enabled: boolean;
      channels: string[]; // email, slack, webhook
    };
  };
}

export interface IEnvironmentMetadata {
  owner: string | any; // User ID/object
  createdBy: string | any;
  lastModifiedBy: string | any;
  tags: string[];
  isDefault: boolean;
  promotionRules?: {
    autoPromoteFrom?: string; // Environment ID
    requireApproval: boolean;
    approvers: string[] | any[]; // User IDs/objects
  };
  backup?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // in days
    lastBackup?: Date;
  };
}

export interface IEnvironment extends Document {
  _id: string;
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  name: string;
  displayName: string;
  description?: string;
  type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
  status: 'active' | 'inactive' | 'maintenance' | 'provisioning' | 'terminating';
  configuration: IEnvironmentConfiguration;
  metadata: IEnvironmentMetadata;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnvironmentConfigurationSchema = new Schema<IEnvironmentConfiguration>({
  variables: { 
    type: Map, 
    of: String, 
    default: new Map()
  },
  endpoints: { 
    type: Map, 
    of: String, 
    default: new Map(),
    validate: {
      validator: function(v: Map<string, string>) {
        for (const [, url] of v) {
          if (!/^https?:\/\/.+/.test(url)) {
            return false;
          }
        }
        return true;
      },
      message: 'All endpoint URLs must be valid HTTP/HTTPS URLs'
    }
  },
  features: { 
    type: Map, 
    of: Boolean, 
    default: new Map()
  },
  secrets: { 
    type: Map, 
    of: String, 
    default: new Map(),
    select: false // Don't return secrets by default
  },
  databases: {
    primary: {
      host: { type: String, required: false },
      port: { type: Number, min: 1, max: 65535, required: false },
      database: { type: String, required: false },
      ssl: { type: Boolean, default: true }
    },
    replica: {
      host: { type: String, required: false },
      port: { type: Number, min: 1, max: 65535, required: false },
      database: { type: String, required: false },
      ssl: { type: Boolean, default: true }
    }
  },
  cache: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['redis', 'memory'], default: 'memory' },
    host: { type: String },
    port: { type: Number, min: 1, max: 65535 },
    ttl: { type: Number, default: 3600, min: 60, max: 86400 } // 1 hour default, max 24 hours
  },
  monitoring: {
    enabled: { type: Boolean, default: false },
    metricsEndpoint: { type: String },
    logsEndpoint: { type: String },
    alerting: {
      enabled: { type: Boolean, default: false },
      channels: [{ type: String, enum: ['email', 'slack', 'webhook'] }]
    }
  }
}, { _id: false });

const EnvironmentMetadataSchema = new Schema<IEnvironmentMetadata>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, index: true }],
  isDefault: { type: Boolean, default: false, index: true },
  promotionRules: {
    autoPromoteFrom: { type: String, ref: 'Environment' },
    requireApproval: { type: Boolean, default: true },
    approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  backup: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    retention: { type: Number, default: 30, min: 1, max: 365 }, // 30 days default
    lastBackup: { type: Date }
  }
}, { _id: false });

const EnvironmentSchema = new Schema<IEnvironment>({
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
  name: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 50,
    match: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
  },
  displayName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    index: true
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: 500 
  },
  type: { 
    type: String, 
    enum: ['development', 'testing', 'staging', 'production', 'preview', 'hotfix'], 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance', 'provisioning', 'terminating'], 
    default: 'provisioning',
    index: true 
  },
  configuration: { 
    type: EnvironmentConfigurationSchema, 
    default: () => ({})
  },
  metadata: { 
    type: EnvironmentMetadataSchema, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true, 
    index: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, name: 1 }, { unique: true });
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, type: 1 });
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, status: 1 });
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, 'metadata.isDefault': 1 });
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, 'metadata.owner': 1 });
EnvironmentSchema.index({ workspaceId: 1, applicationId: 1, active: 1, createdAt: -1 });

// Virtual for policies count
EnvironmentSchema.virtual('policiesCount', {
  ref: 'Policy',
  localField: '_id',
  foreignField: 'environmentId',
  count: true
});

// Virtual for subjects count
EnvironmentSchema.virtual('subjectsCount', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'environmentId',
  count: true
});

// Virtual for resources count
EnvironmentSchema.virtual('resourcesCount', {
  ref: 'Resource',
  localField: '_id',
  foreignField: 'environmentId',
  count: true
});

// Pre-save middleware
EnvironmentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Automatically set status to active when provisioning is complete
  if (this.isModified('configuration') && this.status === 'provisioning') {
    this.status = 'active';
  }
  
  next();
});

// Ensure only one default environment per application
EnvironmentSchema.pre('save', async function(next) {
  if (this.metadata.isDefault && this.isModified('metadata.isDefault')) {
    // Remove default flag from other environments in the same application
    await mongoose.model('Environment').updateMany(
      { 
        workspaceId: this.workspaceId,
        applicationId: this.applicationId,
        _id: { $ne: this._id }
      },
      { $set: { 'metadata.isDefault': false } }
    );
  }
  next();
});

// Static methods
EnvironmentSchema.statics.findByApplication = function(workspaceId: string, applicationId: string) {
  return this.find({ workspaceId, applicationId, active: true });
};

EnvironmentSchema.statics.findDefault = function(workspaceId: string, applicationId: string) {
  return this.findOne({ 
    workspaceId, 
    applicationId, 
    'metadata.isDefault': true, 
    active: true 
  });
};

EnvironmentSchema.statics.findByType = function(workspaceId: string, applicationId: string, type: string) {
  return this.find({ workspaceId, applicationId, type, active: true });
};

EnvironmentSchema.statics.findByStatus = function(workspaceId: string, applicationId: string, status: string) {
  return this.find({ workspaceId, applicationId, status, active: true });
};

EnvironmentSchema.statics.findByOwner = function(workspaceId: string, applicationId: string, ownerId: string) {
  return this.find({ workspaceId, applicationId, 'metadata.owner': ownerId, active: true });
};

// Instance methods
EnvironmentSchema.methods.isOwner = function(userId: string): boolean {
  return this.metadata.owner === userId;
};

EnvironmentSchema.methods.canPromoteFrom = function(sourceEnvironmentId: string): boolean {
  return this.metadata.promotionRules?.autoPromoteFrom === sourceEnvironmentId;
};

EnvironmentSchema.methods.requiresApproval = function(): boolean {
  return this.metadata.promotionRules?.requireApproval ?? true;
};

EnvironmentSchema.methods.isApprover = function(userId: string): boolean {
  return this.metadata.promotionRules?.approvers?.includes(userId) ?? false;
};

EnvironmentSchema.methods.setVariable = function(key: string, value: string): void {
  this.configuration.variables.set(key, value);
  this.markModified('configuration.variables');
};

EnvironmentSchema.methods.removeVariable = function(key: string): void {
  this.configuration.variables.delete(key);
  this.markModified('configuration.variables');
};

EnvironmentSchema.methods.setEndpoint = function(name: string, url: string): void {
  if (!/^https?:\/\/.+/.test(url)) {
    throw new Error('Endpoint URL must be a valid HTTP/HTTPS URL');
  }
  this.configuration.endpoints.set(name, url);
  this.markModified('configuration.endpoints');
};

EnvironmentSchema.methods.removeEndpoint = function(name: string): void {
  this.configuration.endpoints.delete(name);
  this.markModified('configuration.endpoints');
};

EnvironmentSchema.methods.setFeature = function(name: string, enabled: boolean): void {
  this.configuration.features.set(name, enabled);
  this.markModified('configuration.features');
};

EnvironmentSchema.methods.removeFeature = function(name: string): void {
  this.configuration.features.delete(name);
  this.markModified('configuration.features');
};

EnvironmentSchema.methods.isProduction = function(): boolean {
  return this.type === 'production';
};

EnvironmentSchema.methods.isDevelopment = function(): boolean {
  return this.type === 'development';
};

export const Environment = mongoose.model<IEnvironment>('Environment', EnvironmentSchema);
export default Environment;