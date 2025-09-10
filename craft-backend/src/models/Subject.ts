import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  id: string;
  name: string;
  displayName: string;
  email?: string;
  type: 'user' | 'group' | 'role';
  role: string;
  department: string;
  description?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  children?: string[];
  
  // Hierarchy Context
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  environmentId: string; // Reference to Environment
  
  // Cross-environment user linking
  globalUserId?: string; // For linking users across environments
  metadata: {
    createdBy: string | null;
    lastModifiedBy: string | null;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
    externalId?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const SubjectSchema = new Schema<ISubject>({
  id: {
    type: String,
    required: [true, 'Subject ID is required'],
    trim: true,
  },
  
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
  
  // Cross-environment user linking
  globalUserId: {
    type: String,
    index: true,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters'],
    maxlength: [100, 'Display name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    sparse: true,
  },
  type: {
    type: String,
    enum: {
      values: ['user', 'group', 'role'],
      message: 'Type must be user, group, or role',
    },
    default: 'user',
  },
  role: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be active or inactive',
    },
    default: 'active',
  },
  permissions: [{
    type: String,
    trim: true,
  }],
  children: [{
    type: String,
    trim: true,
  }],
  metadata: {
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
      lowercase: true,
    }],
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
    externalId: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: function(doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
});

// Hierarchy-based compound indexes for better query performance
SubjectSchema.index({ environmentId: 1, id: 1 }, { unique: true }); // Unique within environment
SubjectSchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1 }); // Hierarchy navigation
SubjectSchema.index({ environmentId: 1, type: 1, active: 1 }); // Common queries within environment
SubjectSchema.index({ environmentId: 1, status: 1 });
SubjectSchema.index({ environmentId: 1, department: 1 });
SubjectSchema.index({ environmentId: 1, role: 1 });
SubjectSchema.index({ environmentId: 1, 'metadata.tags': 1 });
SubjectSchema.index({ globalUserId: 1 }, { sparse: true }); // Cross-environment user lookup
SubjectSchema.index({ environmentId: 1, createdAt: -1 });
SubjectSchema.index({ environmentId: 1, displayName: 'text', email: 'text', description: 'text' });

// Pre-save middleware
SubjectSchema.pre<ISubject>('save', function(next) {
  // Generate name from displayName if not provided
  if (!this.name) {
    this.name = this.displayName.toLowerCase().replace(/\s+/g, '');
  }
  
  // Ensure ID is set
  if (!this.id) {
    this.id = `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// Static methods
SubjectSchema.statics.findByType = function(environmentId: string, type: string) {
  return this.find({ environmentId, type, active: true });
};

SubjectSchema.statics.findActive = function(environmentId: string) {
  return this.find({ environmentId, active: true, status: 'active' });
};

SubjectSchema.statics.findByGlobalUserId = function(globalUserId: string) {
  return this.find({ globalUserId, active: true });
};

SubjectSchema.statics.findInHierarchy = function(workspaceId: string, applicationId?: string, environmentId?: string) {
  const query: any = { workspaceId };
  if (applicationId) query.applicationId = applicationId;
  if (environmentId) query.environmentId = environmentId;
  return this.find({ ...query, active: true });
};

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);