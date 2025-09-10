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
  
  // Hierarchy Context for proper audit trails
  workspaceId: string; // Reference to Workspace
  applicationId: string; // Reference to Application
  environmentId: string; // Reference to Environment
  
  // Enhanced audit trail context
  hierarchyContext?: {
    workspaceName: string;
    applicationName: string;
    environmentName: string;
    crossEnvironmentActivity: boolean; // Tracks if this spans multiple environments
  };
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
  
  // Enhanced audit trail context
  hierarchyContext: {
    workspaceName: {
      type: String,
      required: true
    },
    applicationName: {
      type: String,
      required: true
    },
    environmentName: {
      type: String,
      required: true
    },
    crossEnvironmentActivity: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  
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

// Hierarchy-based compound indexes for performance and audit trails
ActivitySchema.index({ environmentId: 1, timestamp: -1 }); // Most recent within environment
ActivitySchema.index({ workspaceId: 1, applicationId: 1, environmentId: 1, timestamp: -1 }); // Hierarchy navigation
ActivitySchema.index({ environmentId: 1, 'actor.id': 1, timestamp: -1 }); // Actor activities within environment
ActivitySchema.index({ environmentId: 1, category: 1, severity: 1 }); // Filtering within environment
ActivitySchema.index({ environmentId: 1, type: 1, timestamp: -1 }); // Type-based queries within environment
ActivitySchema.index({ environmentId: 1, 'metadata.sessionId': 1 }); // Session tracking within environment
ActivitySchema.index({ 'hierarchyContext.crossEnvironmentActivity': 1, timestamp: -1 }); // Cross-environment activities
ActivitySchema.index({ workspaceId: 1, timestamp: -1 }); // Workspace-level audit queries
ActivitySchema.index({ applicationId: 1, timestamp: -1 }); // Application-level audit queries

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

// Enhanced static methods for hierarchical audit queries
ActivitySchema.statics.getRecentActivities = function(environmentId: string, hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ environmentId, timestamp: { $gte: cutoff } })
    .sort({ timestamp: -1 })
    .limit(100);
};

ActivitySchema.statics.getActivityStats = function(environmentId: string) {
  return Promise.all([
    this.countDocuments({ environmentId }),
    this.aggregate([
      { $match: { environmentId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { environmentId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])
  ]);
};

ActivitySchema.statics.getHierarchyActivities = function(workspaceId: string, applicationId?: string, environmentId?: string, hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const query: any = { workspaceId, timestamp: { $gte: cutoff } };
  if (applicationId) query.applicationId = applicationId;
  if (environmentId) query.environmentId = environmentId;
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(500);
};

ActivitySchema.statics.getCrossEnvironmentActivities = function(workspaceId: string, hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    workspaceId, 
    'hierarchyContext.crossEnvironmentActivity': true,
    timestamp: { $gte: cutoff } 
  })
    .sort({ timestamp: -1 })
    .limit(100);
};

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);