import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '@/types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['super_admin', 'admin', 'basic'],
      message: '{VALUE} is not a valid role'
    },
    default: 'basic'
  },
  attributes: {
    type: Schema.Types.Mixed,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  },
  managerId: {
    type: String,
    default: null
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  authProvider: {
    type: String,
    enum: {
      values: ['local', 'azuread'],
      message: '{VALUE} is not a valid auth provider'
    },
    default: 'local'
  },
  azureAdId: {
    type: String,
    sparse: true,
    unique: true
  },
  lastLoginAt: {
    type: Date
  },
  
  // Workspace associations
  workspaces: [{
    type: String,
    ref: 'Workspace'
  }],
  currentWorkspace: {
    type: String,
    ref: 'Workspace'
  },
  
  // Workspace-specific roles and permissions
  workspaceRoles: {
    type: Map,
    of: {
      role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member'
      },
      permissions: [String],
      joinedAt: {
        type: Date,
        default: Date.now
      }
    },
    default: new Map()
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ azureAdId: 1 }, { sparse: true });
UserSchema.index({ authProvider: 1 });

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// Virtual for full user info without password
UserSchema.virtual('safeUser').get(function() {
  const { password, ...safeUser } = this.toObject();
  return safeUser;
});

export const User = mongoose.model<UserDocument>('User', UserSchema);
export default User;