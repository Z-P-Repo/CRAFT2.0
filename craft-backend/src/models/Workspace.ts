import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceBranding {
  logo?: string;
  primaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface IWorkspaceSettings {
  defaultEnvironment?: string;
  allowedDomains?: string[];
  ssoConfiguration?: Record<string, any>;
  branding?: IWorkspaceBranding;
  notifications?: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

export interface IWorkspaceLimits {
  maxApplications: number;
  maxUsers: number;
  maxPolicies: number;
  storageQuota: number; // in MB
  apiCallsPerMonth: number;
}

export interface IWorkspaceMetadata {
  owner: string | any; // User ID/object of workspace owner
  admins: string[] | any[]; // User IDs/objects with admin access
  createdBy: string | any;
  lastModifiedBy: string | any;
  tags: string[];
  isSystem: boolean;
  plan: 'free' | 'professional' | 'enterprise';
  billingInfo?: {
    customerId?: string;
    subscriptionId?: string;
    lastBillingDate?: Date;
    nextBillingDate?: Date;
  };
}

export interface IWorkspace extends Document {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  settings: IWorkspaceSettings;
  limits: IWorkspaceLimits;
  metadata: IWorkspaceMetadata;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isOwner(userId: string): boolean;
  isAdmin(userId: string): boolean;
  addAdmin(userId: string): void;
  removeAdmin(userId: string): void;
}

const WorkspaceBrandingSchema = new Schema<IWorkspaceBranding>({
  logo: { type: String },
  primaryColor: { type: String, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
}, { _id: false });

const WorkspaceSettingsSchema = new Schema<IWorkspaceSettings>({
  defaultEnvironment: { type: String },
  allowedDomains: [{ type: String }],
  ssoConfiguration: { type: Schema.Types.Mixed },
  branding: WorkspaceBrandingSchema,
  notifications: {
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false },
    webhook: { type: String }
  }
}, { _id: false });

const WorkspaceLimitsSchema = new Schema<IWorkspaceLimits>({
  maxApplications: { type: Number, default: 10, min: 1, max: 1000 },
  maxUsers: { type: Number, default: 100, min: 1, max: 10000 },
  maxPolicies: { type: Number, default: 1000, min: 10, max: 100000 },
  storageQuota: { type: Number, default: 1024, min: 100, max: 1000000 }, // 1GB default
  apiCallsPerMonth: { type: Number, default: 100000, min: 1000, max: 10000000 }
}, { _id: false });

const WorkspaceMetadataSchema = new Schema<IWorkspaceMetadata>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, index: true }],
  isSystem: { type: Boolean, default: false, index: true },
  plan: { 
    type: String, 
    enum: ['free', 'professional', 'enterprise'], 
    default: 'free',
    index: true 
  },
  billingInfo: {
    customerId: { type: String },
    subscriptionId: { type: String },
    lastBillingDate: { type: Date },
    nextBillingDate: { type: Date }
  }
}, { _id: false });

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 50,
    match: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    index: true
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
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'deleted'], 
    default: 'active',
    index: true 
  },
  settings: { 
    type: WorkspaceSettingsSchema, 
    default: () => ({})
  },
  limits: { 
    type: WorkspaceLimitsSchema, 
    default: () => ({})
  },
  metadata: { 
    type: WorkspaceMetadataSchema, 
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

// Indexes for performance
WorkspaceSchema.index({ 'metadata.owner': 1, status: 1 });
WorkspaceSchema.index({ 'metadata.admins': 1, status: 1 });
WorkspaceSchema.index({ 'metadata.plan': 1, status: 1 });
WorkspaceSchema.index({ 'metadata.tags': 1 });
WorkspaceSchema.index({ createdAt: -1 });
WorkspaceSchema.index({ updatedAt: -1 });

// Virtual for applications count
WorkspaceSchema.virtual('applicationsCount', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'workspaceId',
  count: true
});

// Pre-save middleware
WorkspaceSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static methods
WorkspaceSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ 'metadata.owner': ownerId, active: true });
};

WorkspaceSchema.statics.findByAdmin = function(adminId: string) {
  return this.find({ 
    $or: [
      { 'metadata.owner': adminId },
      { 'metadata.admins': adminId }
    ],
    active: true 
  });
};

WorkspaceSchema.statics.findByPlan = function(plan: string) {
  return this.find({ 'metadata.plan': plan, active: true });
};

// Instance methods
WorkspaceSchema.methods.isOwner = function(userId: string): boolean {
  return this.metadata.owner === userId;
};

WorkspaceSchema.methods.isAdmin = function(userId: string): boolean {
  return this.metadata.owner === userId || this.metadata.admins.includes(userId);
};

WorkspaceSchema.methods.addAdmin = function(userId: string): void {
  if (!this.metadata.admins.includes(userId) && this.metadata.owner !== userId) {
    this.metadata.admins.push(userId);
  }
};

WorkspaceSchema.methods.removeAdmin = function(userId: string): void {
  const index = this.metadata.admins.indexOf(userId);
  if (index > -1) {
    this.metadata.admins.splice(index, 1);
  }
};

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default Workspace;