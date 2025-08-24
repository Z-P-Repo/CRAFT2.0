import mongoose, { Schema, Document } from 'mongoose';

export interface IAttribute extends Document {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'subject' | 'resource' | 'action' | 'environment';
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isRequired: boolean;
  isMultiValue: boolean;
  defaultValue?: any;
  constraints: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    enumValues?: any[];
    format?: string;
  };
  validation: {
    isEmail?: boolean;
    isUrl?: boolean;
    isPhoneNumber?: boolean;
    customValidator?: string;
  };
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
    externalId?: string;
  };
  mapping: {
    sourceField?: string;
    transformFunction?: string;
    cacheTime?: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttributeSchema = new Schema<IAttribute>({
  id: {
    type: String,
    required: [true, 'Attribute ID is required'],
    trim: true,
    maxlength: [100, 'ID cannot exceed 100 characters']
  },
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['subject', 'resource', 'action', 'environment'],
      message: '{VALUE} is not a valid category'
    }
  },
  dataType: {
    type: String,
    required: [true, 'Data type is required'],
    enum: {
      values: ['string', 'number', 'boolean', 'date', 'array', 'object'],
      message: '{VALUE} is not a valid data type'
    }
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isMultiValue: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: Schema.Types.Mixed
  },
  constraints: {
    minLength: {
      type: Number,
      min: [0, 'Min length cannot be negative']
    },
    maxLength: {
      type: Number,
      min: [0, 'Max length cannot be negative']
    },
    minValue: {
      type: Number
    },
    maxValue: {
      type: Number
    },
    pattern: {
      type: String,
      trim: true
    },
    enumValues: [{
      type: Schema.Types.Mixed
    }],
    format: {
      type: String,
      enum: ['email', 'url', 'phone', 'ipv4', 'ipv6', '']
    }
  },
  validation: {
    isEmail: {
      type: Boolean,
      default: false
    },
    isUrl: {
      type: Boolean,
      default: false
    },
    isPhoneNumber: {
      type: Boolean,
      default: false
    },
    customValidator: {
      type: String,
      trim: true
    }
  },
  metadata: {
    createdBy: {
      type: String,
      required: [true, 'Created by is required']
    },
    lastModifiedBy: {
      type: String,
      required: [true, 'Last modified by is required']
    },
    tags: [{
      type: String,
      trim: true
    }],
    isSystem: {
      type: Boolean,
      default: false
    },
    isCustom: {
      type: Boolean,
      default: true
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    externalId: {
      type: String,
      trim: true
    }
  },
  mapping: {
    sourceField: {
      type: String,
      trim: true
    },
    transformFunction: {
      type: String,
      trim: true
    },
    cacheTime: {
      type: Number,
      min: [0, 'Cache time cannot be negative']
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Add the id field from _id for consistency
      ret.id = ret.id || ret._id.toString();
      return ret;
    }
  }
});

// Indexes
AttributeSchema.index({ id: 1 }, { unique: true });
AttributeSchema.index({ category: 1, active: 1 });
AttributeSchema.index({ dataType: 1 });
AttributeSchema.index({ 'metadata.isSystem': 1 });
AttributeSchema.index({ 'metadata.isCustom': 1 });
AttributeSchema.index({ name: 'text', displayName: 'text', description: 'text' });

// Validate constraints based on data type
AttributeSchema.pre('save', function(this: IAttribute, next) {
  // Validate constraints based on data type
  if (this.dataType === 'string') {
    if (this.constraints.minValue !== undefined || this.constraints.maxValue !== undefined) {
      return next(new Error('String type cannot have numeric value constraints'));
    }
  } else if (this.dataType === 'number') {
    if (this.constraints.minLength !== undefined || this.constraints.maxLength !== undefined || this.constraints.pattern !== undefined) {
      return next(new Error('Number type cannot have string constraints'));
    }
  } else if (this.dataType === 'boolean') {
    if (Object.keys(this.constraints).length > 0 && !this.constraints.enumValues) {
      return next(new Error('Boolean type can only have enum constraints'));
    }
  }

  // Validate min/max constraints
  if (this.constraints.minLength !== undefined && this.constraints.maxLength !== undefined) {
    if (this.constraints.minLength > this.constraints.maxLength) {
      return next(new Error('Min length cannot be greater than max length'));
    }
  }

  if (this.constraints.minValue !== undefined && this.constraints.maxValue !== undefined) {
    if (this.constraints.minValue > this.constraints.maxValue) {
      return next(new Error('Min value cannot be greater than max value'));
    }
  }

  next();
});

export const Attribute = mongoose.model<IAttribute>('Attribute', AttributeSchema);
export default Attribute;