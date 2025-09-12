import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationConfiguration {
  defaultEnvironment?: string;
  authSettings?: {
    requireAuthentication: boolean;
    authProviders: string[];
    sessionTimeout: number; // in minutes
    mfaRequired: boolean;
  };
  baseUrl?: string;
  apiKeys?: string[];
  cors?: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  rateLimit?: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface IApplicationMetadata {
  owner: string | any; // User ID/object
  maintainers: string[] | any[]; // User IDs/objects with maintainer access
  createdBy: string | any;
  lastModifiedBy: string | any;
  tags: string[];
  version: string;
  repository?: {
    url: string;
    branch: string;
    lastCommit?: string;
  };
  deployment?: {
    status: 'deployed' | 'deploying' | 'failed' | 'stopped';
    lastDeployment?: Date;
    deploymentHistory?: {
      version: string;
      timestamp: Date;
      deployedBy: string;
      status: 'success' | 'failed';
    }[];
  };
}

export interface IApplication extends Document {
  _id: string;
  workspaceId: string; // Reference to Workspace
  name: string;
  displayName: string;
  description?: string;
  type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
  status: 'active' | 'inactive' | 'development' | 'deprecated' | 'archived';
  configuration: IApplicationConfiguration;
  metadata: IApplicationMetadata;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationConfigurationSchema = new Schema<IApplicationConfiguration>({
  defaultEnvironment: { type: String },
  authSettings: {
    requireAuthentication: { type: Boolean, default: true },
    authProviders: [{ type: String, enum: ['local', 'azure-ad', 'oauth2', 'saml'] }],
    sessionTimeout: { type: Number, default: 480, min: 5, max: 1440 }, // 8 hours default
    mfaRequired: { type: Boolean, default: false }
  },
  baseUrl: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Base URL must be a valid HTTP/HTTPS URL'
    }
  },
  apiKeys: [{ type: String }],
  cors: {
    allowedOrigins: [{ type: String }],
    allowedMethods: [{ type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }],
    allowedHeaders: [{ type: String }]
  },
  rateLimit: {
    enabled: { type: Boolean, default: false },
    requestsPerMinute: { type: Number, default: 60, min: 1, max: 10000 },
    burstLimit: { type: Number, default: 100, min: 1, max: 10000 }
  }
}, { _id: false });

const ApplicationMetadataSchema = new Schema<IApplicationMetadata>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  maintainers: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, index: true }],
  version: { 
    type: String, 
    default: '1.0.0',
    validate: {
      validator: function(v: string) {
        return /^\d+\.\d+\.\d+/.test(v);
      },
      message: 'Version must follow semantic versioning (e.g., 1.0.0)'
    }
  },
  repository: {
    url: { type: String },
    branch: { type: String, default: 'main' },
    lastCommit: { type: String }
  },
  deployment: {
    status: { 
      type: String, 
      enum: ['deployed', 'deploying', 'failed', 'stopped'], 
      default: 'stopped' 
    },
    lastDeployment: { type: Date },
    deploymentHistory: [{
      version: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      deployedBy: { type: String, required: true },
      status: { type: String, enum: ['success', 'failed'], required: true }
    }]
  }
}, { _id: false });

const ApplicationSchema = new Schema<IApplication>({
  workspaceId: { 
    type: String, 
    required: true, 
    index: true,
    ref: 'Workspace'
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: /^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/
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
    enum: ['web', 'api', 'mobile', 'desktop', 'service', 'microservice'], 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'development', 'deprecated', 'archived'], 
    default: 'development',
    index: true 
  },
  configuration: { 
    type: ApplicationConfigurationSchema, 
    default: () => ({})
  },
  metadata: { 
    type: ApplicationMetadataSchema, 
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
ApplicationSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
ApplicationSchema.index({ workspaceId: 1, status: 1, type: 1 });
ApplicationSchema.index({ workspaceId: 1, 'metadata.owner': 1 });
ApplicationSchema.index({ workspaceId: 1, 'metadata.maintainers': 1 });
ApplicationSchema.index({ workspaceId: 1, 'metadata.tags': 1 });
ApplicationSchema.index({ workspaceId: 1, active: 1, createdAt: -1 });

// Virtual for environments count
ApplicationSchema.virtual('environmentsCount', {
  ref: 'Environment',
  localField: '_id',
  foreignField: 'applicationId',
  count: true
});

// Virtual for environments
ApplicationSchema.virtual('environments', {
  ref: 'Environment',
  localField: '_id',
  foreignField: 'applicationId',
  match: { active: true }
});

// Pre-save middleware
ApplicationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static methods
ApplicationSchema.statics.findByWorkspace = function(workspaceId: string) {
  return this.find({ workspaceId, active: true });
};

ApplicationSchema.statics.findByOwner = function(workspaceId: string, ownerId: string) {
  return this.find({ workspaceId, 'metadata.owner': ownerId, active: true });
};

ApplicationSchema.statics.findByMaintainer = function(workspaceId: string, maintainerId: string) {
  return this.find({ 
    workspaceId,
    $or: [
      { 'metadata.owner': maintainerId },
      { 'metadata.maintainers': maintainerId }
    ],
    active: true 
  });
};

ApplicationSchema.statics.findByType = function(workspaceId: string, type: string) {
  return this.find({ workspaceId, type, active: true });
};

ApplicationSchema.statics.findByStatus = function(workspaceId: string, status: string) {
  return this.find({ workspaceId, status, active: true });
};

// Instance methods
ApplicationSchema.methods.isOwner = function(userId: string): boolean {
  return this.metadata.owner === userId;
};

ApplicationSchema.methods.isMaintainer = function(userId: string): boolean {
  return this.metadata.owner === userId || this.metadata.maintainers.includes(userId);
};

ApplicationSchema.methods.addMaintainer = function(userId: string): void {
  if (!this.metadata.maintainers.includes(userId) && this.metadata.owner !== userId) {
    this.metadata.maintainers.push(userId);
  }
};

ApplicationSchema.methods.removeMaintainer = function(userId: string): void {
  const index = this.metadata.maintainers.indexOf(userId);
  if (index > -1) {
    this.metadata.maintainers.splice(index, 1);
  }
};

ApplicationSchema.methods.addDeployment = function(deployment: {
  version: string;
  deployedBy: string;
  status: 'success' | 'failed';
}): void {
  if (!this.metadata.deployment) {
    this.metadata.deployment = {
      status: 'stopped',
      deploymentHistory: []
    };
  }
  
  this.metadata.deployment.deploymentHistory = this.metadata.deployment.deploymentHistory || [];
  this.metadata.deployment.deploymentHistory.push({
    ...deployment,
    timestamp: new Date()
  });
  
  // Keep only last 50 deployments
  if (this.metadata.deployment.deploymentHistory.length > 50) {
    this.metadata.deployment.deploymentHistory = this.metadata.deployment.deploymentHistory.slice(-50);
  }
  
  if (deployment.status === 'success') {
    this.metadata.deployment.lastDeployment = new Date();
    this.metadata.deployment.status = 'deployed';
    this.metadata.version = deployment.version;
  }
};

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;