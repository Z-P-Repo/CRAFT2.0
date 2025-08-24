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
    unique: true,
    trim: true,
    index: true,
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
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better query performance
SubjectSchema.index({ id: 1 });
SubjectSchema.index({ type: 1, active: 1 });
SubjectSchema.index({ status: 1 });
SubjectSchema.index({ department: 1 });
SubjectSchema.index({ role: 1 });
SubjectSchema.index({ 'metadata.tags': 1 });
SubjectSchema.index({ createdAt: -1 });
SubjectSchema.index({ displayName: 'text', email: 'text', description: 'text' });

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
SubjectSchema.statics.findByType = function(type: string) {
  return this.find({ type, active: true });
};

SubjectSchema.statics.findActive = function() {
  return this.find({ active: true, status: 'active' });
};

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);