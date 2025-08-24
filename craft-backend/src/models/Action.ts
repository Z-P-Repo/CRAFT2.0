import { Schema, model, Document } from 'mongoose';

export interface IAction extends Document {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'read' | 'write' | 'execute' | 'delete' | 'admin';
  httpMethod?: string;
  endpoint?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActionSchema = new Schema<IAction>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: {
      values: ['read', 'write', 'execute', 'delete', 'admin'],
      message: 'Category must be one of: read, write, execute, delete, admin',
    },
    required: true,
    index: true,
  },
  httpMethod: {
    type: String,
    enum: {
      values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      message: 'HTTP method must be one of: GET, POST, PUT, DELETE, PATCH',
    },
  },
  endpoint: {
    type: String,
    trim: true,
  },
  riskLevel: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Risk level must be one of: low, medium, high, critical',
    },
    required: true,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
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
}, {
  timestamps: true,
});

// Indexes for better query performance
ActionSchema.index({ name: 1, category: 1 });
ActionSchema.index({ 'metadata.tags': 1 });
ActionSchema.index({ category: 1, active: 1 });
ActionSchema.index({ riskLevel: 1, active: 1 });

// Pre-save middleware to generate id if not provided
ActionSchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const Action = model<IAction>('Action', ActionSchema);
export default Action;