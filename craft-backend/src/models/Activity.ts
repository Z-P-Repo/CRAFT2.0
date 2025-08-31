import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: string;
  category: string;
  action: string;
  resource: {
    type: string;
    id: string;
    name: string;
  };
  actor: {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'system' | 'service';
  };
  target?: {
    type: string;
    id: string;
    name: string;
  };
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    changes?: Record<string, { from: any; to: any }>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    duration?: number;
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
    additionalData?: Record<string, any>;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  type: {
    type: String,
    required: true,
    enum: [
      'authentication',
      'authorization',
      'policy_management',
      'user_management',
      'resource_management',
      'system_configuration',
      'audit',
      'security_event',
      'data_modification',
      'access_request',
      'workflow',
      'integration',
      'maintenance'
    ],
    index: true
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'security',
      'administration',
      'compliance',
      'operation',
      'configuration',
      'integration',
      'monitoring',
      'user_activity'
    ],
    index: true
  },

  action: {
    type: String,
    required: true,
    index: true
  },

  resource: {
    type: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },

  actor: {
    id: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['user', 'system', 'service']
    }
  },

  target: {
    type: {
      type: String
    },
    id: {
      type: String
    },
    name: {
      type: String
    }
  },

  description: {
    type: String,
    required: true,
    index: 'text' // Enable text search
  },

  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },

  metadata: {
    changes: {
      type: Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    sessionId: {
      type: String,
      index: true
    },
    duration: {
      type: Number
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending']
    },
    errorMessage: {
      type: String
    },
    additionalData: {
      type: Schema.Types.Mixed
    }
  },

  tags: [{
    type: String,
    index: true
  }]
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'activities'
});

// Indexes for performance
ActivitySchema.index({ timestamp: -1 }); // Most recent first
ActivitySchema.index({ 'actor.id': 1, timestamp: -1 }); // Actor activities
ActivitySchema.index({ category: 1, severity: 1 }); // Filtering
ActivitySchema.index({ type: 1, timestamp: -1 }); // Type-based queries
ActivitySchema.index({ 'metadata.sessionId': 1 }); // Session tracking

// TTL index for automatic cleanup (optional - remove if you want to keep all activities)
// ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

// Virtual for ID
ActivitySchema.virtual('id').get(function(this: any) {
  return this._id?.toHexString();
});

// Ensure virtual fields are serialized
ActivitySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware
ActivitySchema.pre('save', function(next) {
  // Add default tags based on category and severity
  if (!this.tags || this.tags.length === 0) {
    this.tags = [this.category, this.severity + '-priority'];
  }
  
  next();
});

// Static methods
ActivitySchema.statics.getRecentActivities = function(hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ timestamp: { $gte: cutoff } })
    .sort({ timestamp: -1 })
    .limit(100);
};

ActivitySchema.statics.getActivityStats = function() {
  return Promise.all([
    this.countDocuments(),
    this.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])
  ]);
};

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);