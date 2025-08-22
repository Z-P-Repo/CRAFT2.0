import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '@/types';

export interface UserDocument extends IUser, Document {}

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
    required: [true, 'Password is required'],
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
      values: ['admin', 'user', 'manager', 'senior_manager'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user'
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
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ department: 1 });

// Virtual for full user info without password
UserSchema.virtual('safeUser').get(function() {
  const { password, ...safeUser } = this.toObject();
  return safeUser;
});

export const User = mongoose.model<UserDocument>('User', UserSchema);
export default User;