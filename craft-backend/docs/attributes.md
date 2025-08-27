# Attribute Management Documentation

The Attribute Management module defines and manages the attributes used in ABAC policy evaluation. Attributes provide contextual information about subjects, resources, actions, and the environment for making access control decisions.

## Overview

The attribute management system provides comprehensive management of attribute definitions, schemas, validation rules, and value constraints that are used across all ABAC components for policy evaluation. Attributes now support multiple categories (Subject and Resource) and have role-based access control with Basic users having view-only access.

## Data Model

### Attribute Schema

**Location**: `/src/models/Attribute.ts`

```typescript
interface IAttribute extends Document {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  categories: ('subject' | 'resource')[];
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
```

### Schema Definition

```typescript
const AttributeSchema = new Schema<IAttribute>({
  id: {
    type: String,
    required: [true, 'Attribute ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    index: true,
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [150, 'Display name cannot exceed 150 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  categories: {
    type: [String],
    required: [true, 'At least one category is required'],
    validate: {
      validator: function(categories: string[]) {
        return categories && categories.length > 0;
      },
      message: 'At least one category must be selected'
    },
    enum: {
      values: ['subject', 'resource'],
      message: '{VALUE} is not a valid category. Only subject and resource are allowed'
    }
  },
  dataType: {
    type: String,
    required: [true, 'Data type is required'],
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
    index: true,
  },
  isRequired: {
    type: Boolean,
    default: false,
    index: true,
  },
  isMultiValue: {
    type: Boolean,
    default: false,
  },
  defaultValue: {
    type: Schema.Types.Mixed,
  },
  constraints: {
    minLength: {
      type: Number,
      min: 0,
    },
    maxLength: {
      type: Number,
      min: 0,
    },
    minValue: {
      type: Number,
    },
    maxValue: {
      type: Number,
    },
    pattern: {
      type: String,
      trim: true,
    },
    enumValues: [{
      type: Schema.Types.Mixed,
    }],
    format: {
      type: String,
      enum: ['email', 'url', 'phone', 'date', 'time', 'datetime', 'ipv4', 'ipv6'],
    },
  },
  validation: {
    isEmail: {
      type: Boolean,
      default: false,
    },
    isUrl: {
      type: Boolean,
      default: false,
    },
    isPhoneNumber: {
      type: Boolean,
      default: false,
    },
    customValidator: {
      type: String,
      trim: true,
    },
  },
  metadata: {
    createdBy: {
      type: String,
      required: true,
    },
    lastModifiedBy: {
      type: String,
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: true,
      index: true,
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
  mapping: {
    sourceField: {
      type: String,
      trim: true,
    },
    transformFunction: {
      type: String,
      trim: true,
    },
    cacheTime: {
      type: Number,
      min: 0,
      default: 300, // 5 minutes default cache time
    },
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});
```

### Pre-save Middleware

```typescript
AttributeSchema.pre<IAttribute>('save', function (next) {
  // Validate constraints based on data type
  if (this.dataType === 'string') {
    if (this.constraints.minValue || this.constraints.maxValue) {
      return next(new Error('String type cannot have minValue or maxValue constraints'));
    }
  } else if (this.dataType === 'number') {
    if (this.constraints.minLength || this.constraints.maxLength || this.constraints.pattern) {
      return next(new Error('Number type cannot have length or pattern constraints'));
    }
  }

  // Set validation flags based on format
  if (this.constraints.format === 'email') {
    this.validation.isEmail = true;
  } else if (this.constraints.format === 'url') {
    this.validation.isUrl = true;
  } else if (this.constraints.format === 'phone') {
    this.validation.isPhoneNumber = true;
  }

  // Update lastModifiedBy if modified
  if (this.isModified()) {
    this.metadata.lastModifiedBy = this.metadata.lastModifiedBy || this.metadata.createdBy;
  }

  next();
});
```

## Built-in System Attributes

```typescript
// Default system attributes that are created during system initialization
export const SYSTEM_ATTRIBUTES = [
  // Subject attributes
  {
    id: 'subject.id',
    name: 'subjectId',
    displayName: 'Subject ID',
    description: 'Unique identifier of the subject',
    categories: ['subject'],
    dataType: 'string',
    isRequired: true,
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'subject.name',
    name: 'subjectName',
    displayName: 'Subject Name',
    description: 'Display name of the subject',
    categories: ['subject'],
    dataType: 'string',
    isRequired: true,
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'subject.email',
    name: 'subjectEmail',
    displayName: 'Subject Email',
    description: 'Email address of the subject',
    categories: ['subject'],
    dataType: 'string',
    constraints: { format: 'email' },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'subject.role',
    name: 'subjectRole',
    displayName: 'Subject Role',
    description: 'Role assigned to the subject',
    categories: ['subject'],
    dataType: 'string',
    constraints: { enumValues: ['admin', 'manager', 'user'] },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'subject.department',
    name: 'subjectDepartment',
    displayName: 'Subject Department',
    description: 'Department of the subject',
    categories: ['subject'],
    dataType: 'string',
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },

  // Resource attributes
  {
    id: 'resource.id',
    name: 'resourceId',
    displayName: 'Resource ID',
    description: 'Unique identifier of the resource',
    categories: ['resource'],
    dataType: 'string',
    isRequired: true,
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'resource.type',
    name: 'resourceType',
    displayName: 'Resource Type',
    description: 'Type of the resource',
    categories: ['resource'],
    dataType: 'string',
    constraints: { enumValues: ['file', 'document', 'api', 'database', 'service', 'folder', 'application'] },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'resource.classification',
    name: 'resourceClassification',
    displayName: 'Resource Classification',
    description: 'Security classification of the resource',
    categories: ['resource'],
    dataType: 'string',
    constraints: { enumValues: ['public', 'internal', 'confidential', 'restricted'] },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'resource.owner',
    name: 'resourceOwner',
    displayName: 'Resource Owner',
    description: 'Owner of the resource',
    categories: ['resource'],
    dataType: 'string',
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },

  // Action attributes
  {
    id: 'action.id',
    name: 'actionId',
    displayName: 'Action ID',
    description: 'Unique identifier of the action',
    categories: ['action'],
    dataType: 'string',
    isRequired: true,
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'action.verb',
    name: 'actionVerb',
    displayName: 'Action Verb',
    description: 'Verb describing the action',
    categories: ['action'],
    dataType: 'string',
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'action.riskLevel',
    name: 'actionRiskLevel',
    displayName: 'Action Risk Level',
    description: 'Risk level associated with the action',
    categories: ['action'],
    dataType: 'string',
    constraints: { enumValues: ['low', 'medium', 'high', 'critical'] },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },

  // Environment attributes
  {
    id: 'environment.currentTime',
    name: 'currentTime',
    displayName: 'Current Time',
    description: 'Current timestamp of the request',
    categories: ['environment'],
    dataType: 'date',
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'environment.ipAddress',
    name: 'ipAddress',
    displayName: 'IP Address',
    description: 'IP address of the request',
    categories: ['environment'],
    dataType: 'string',
    constraints: { format: 'ipv4' },
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  },
  {
    id: 'environment.userAgent',
    name: 'userAgent',
    displayName: 'User Agent',
    description: 'User agent string from the request',
    categories: ['environment'],
    dataType: 'string',
    metadata: { isSystem: true, isCustom: false, version: '1.0.0' }
  }
];
```

## Controller Implementation

### Attribute Controller

**Location**: `/src/controllers/AttributeController.ts`

```typescript
export class AttributeController {
  // Get all attributes with filtering and pagination
  static async getAttributes(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        dataType,
        isRequired,
        active,
        search,
        isSystem,
        isCustom,
      } = req.query;

      const filter: any = {};
      
      // Apply filters
      if (category) filter.category = category;
      if (dataType) filter.dataType = dataType;
      if (isRequired !== undefined) filter.isRequired = isRequired === 'true';
      if (active !== undefined) filter.active = active === 'true';
      if (isSystem !== undefined) filter['metadata.isSystem'] = isSystem === 'true';
      if (isCustom !== undefined) filter['metadata.isCustom'] = isCustom === 'true';
      
      // Search in name, displayName, and description
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [attributes, total] = await Promise.all([
        Attribute.find(filter)
          .sort({ category: 1, isRequired: -1, name: 1 })
          .skip(skip)
          .limit(Number(limit)),
        Attribute.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          attributes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ATTRIBUTE_FETCH_ERROR',
      });
    }
  }
}
```

#### Create Attribute

```typescript
static async createAttribute(req: Request, res: Response): Promise<void> {
  try {
    const {
      id,
      name,
      displayName,
      description,
      category,
      dataType,
      isRequired,
      isMultiValue,
      defaultValue,
      constraints,
      validation,
      mapping,
      tags,
      externalId,
    } = req.body;

    // Validate required fields
    if (!id || !name || !displayName || !category || !dataType) {
      res.status(400).json({
        success: false,
        error: 'ID, name, displayName, category, and dataType are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Check if attribute already exists
    const existingAttribute = await Attribute.findOne({ id });
    if (existingAttribute) {
      res.status(409).json({
        success: false,
        error: 'Attribute with this ID already exists',
        code: 'ATTRIBUTE_ALREADY_EXISTS',
      });
      return;
    }

    // Validate constraints based on data type
    const constraintValidation = AttributeController.validateConstraints(dataType, constraints || {});
    if (!constraintValidation.valid) {
      res.status(400).json({
        success: false,
        error: constraintValidation.error,
        code: 'INVALID_CONSTRAINTS',
      });
      return;
    }

    // Create new attribute
    const attributeData = {
      id,
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim(),
      category,
      dataType,
      isRequired: isRequired || false,
      isMultiValue: isMultiValue || false,
      defaultValue,
      constraints: constraints || {},
      validation: validation || {},
      mapping: mapping || {},
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        tags: tags || [],
        isSystem: false,
        isCustom: true,
        version: '1.0.0',
        externalId,
      },
    };

    const attribute = new Attribute(attributeData);
    await attribute.save();

    res.status(201).json({
      success: true,
      data: attribute,
      message: 'Attribute created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Attribute with this ID already exists',
        code: 'DUPLICATE_ATTRIBUTE_ID',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ATTRIBUTE_CREATION_ERROR',
      });
    }
  }
}
```

#### Validate Attribute Value

```typescript
static async validateAttributeValue(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { value } = req.body;

    const attribute = await Attribute.findOne({ id, active: true });
    if (!attribute) {
      res.status(404).json({
        success: false,
        error: 'Attribute not found',
        code: 'ATTRIBUTE_NOT_FOUND',
      });
      return;
    }

    const validationResult = await AttributeController.validateValue(attribute, value);

    res.status(200).json({
      success: true,
      data: {
        valid: validationResult.valid,
        errors: validationResult.errors,
        normalizedValue: validationResult.normalizedValue,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
    });
  }
}

private static async validateValue(attribute: IAttribute, value: any): Promise<{
  valid: boolean;
  errors: string[];
  normalizedValue?: any;
}> {
  const errors: string[] = [];
  let normalizedValue = value;

  // Check if required
  if (attribute.isRequired && (value === null || value === undefined || value === '')) {
    errors.push('Value is required');
    return { valid: false, errors };
  }

  // If value is empty and not required, it's valid
  if (!attribute.isRequired && (value === null || value === undefined || value === '')) {
    return { valid: true, errors: [], normalizedValue: attribute.defaultValue };
  }

  // Data type validation
  switch (attribute.dataType) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push('Value must be a string');
      } else {
        normalizedValue = value.toString();
        
        // String constraints
        if (attribute.constraints.minLength && normalizedValue.length < attribute.constraints.minLength) {
          errors.push(`Value must be at least ${attribute.constraints.minLength} characters`);
        }
        if (attribute.constraints.maxLength && normalizedValue.length > attribute.constraints.maxLength) {
          errors.push(`Value cannot exceed ${attribute.constraints.maxLength} characters`);
        }
        if (attribute.constraints.pattern) {
          const regex = new RegExp(attribute.constraints.pattern);
          if (!regex.test(normalizedValue)) {
            errors.push('Value does not match required pattern');
          }
        }
      }
      break;

    case 'number':
      normalizedValue = Number(value);
      if (isNaN(normalizedValue)) {
        errors.push('Value must be a valid number');
      } else {
        if (attribute.constraints.minValue !== undefined && normalizedValue < attribute.constraints.minValue) {
          errors.push(`Value must be at least ${attribute.constraints.minValue}`);
        }
        if (attribute.constraints.maxValue !== undefined && normalizedValue > attribute.constraints.maxValue) {
          errors.push(`Value cannot exceed ${attribute.constraints.maxValue}`);
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        normalizedValue = value === 'true' || value === '1' || value === 1;
      }
      break;

    case 'date':
      normalizedValue = new Date(value);
      if (isNaN(normalizedValue.getTime())) {
        errors.push('Value must be a valid date');
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push('Value must be an array');
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push('Value must be an object');
      }
      break;
  }

  // Enum validation
  if (attribute.constraints.enumValues && attribute.constraints.enumValues.length > 0) {
    if (!attribute.constraints.enumValues.includes(normalizedValue)) {
      errors.push(`Value must be one of: ${attribute.constraints.enumValues.join(', ')}`);
    }
  }

  // Format validation
  if (attribute.constraints.format && typeof normalizedValue === 'string') {
    const formatValid = AttributeController.validateFormat(attribute.constraints.format, normalizedValue);
    if (!formatValid) {
      errors.push(`Value must be a valid ${attribute.constraints.format}`);
    }
  }

  return { valid: errors.length === 0, errors, normalizedValue };
}

private static validateFormat(format: string, value: string): boolean {
  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'phone':
      return /^\+?[\d\s\-\(\)]{10,}$/.test(value);
    case 'ipv4':
      return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
    case 'ipv6':
      return /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value);
    default:
      return true;
  }
}

private static validateConstraints(dataType: string, constraints: any): { valid: boolean; error?: string } {
  switch (dataType) {
    case 'string':
      if (constraints.minValue !== undefined || constraints.maxValue !== undefined) {
        return { valid: false, error: 'String type cannot have numeric value constraints' };
      }
      break;
    case 'number':
      if (constraints.minLength !== undefined || constraints.maxLength !== undefined || constraints.pattern !== undefined) {
        return { valid: false, error: 'Number type cannot have string constraints' };
      }
      break;
    case 'boolean':
      if (Object.keys(constraints).length > 0 && !constraints.enumValues) {
        return { valid: false, error: 'Boolean type can only have enum constraints' };
      }
      break;
  }
  return { valid: true };
}
```

## Service Layer

### Attribute Service

**Location**: `/src/services/AttributeService.ts`

```typescript
export class AttributeService {
  static async findAttributeById(id: string): Promise<IAttribute | null> {
    return await Attribute.findOne({ id, active: true });
  }

  static async findAttributesByCategory(category: string): Promise<IAttribute[]> {
    return await Attribute.find({ category, active: true }).sort({ isRequired: -1, name: 1 });
  }

  static async getAttributeSchema(category: string): Promise<any> {
    const attributes = await Attribute.find({ category, active: true });
    
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    attributes.forEach(attr => {
      const property: any = {
        type: this.mapDataTypeToJsonSchema(attr.dataType),
        title: attr.displayName,
        description: attr.description,
      };

      // Add constraints
      if (attr.constraints.minLength) property.minLength = attr.constraints.minLength;
      if (attr.constraints.maxLength) property.maxLength = attr.constraints.maxLength;
      if (attr.constraints.minValue) property.minimum = attr.constraints.minValue;
      if (attr.constraints.maxValue) property.maximum = attr.constraints.maxValue;
      if (attr.constraints.pattern) property.pattern = attr.constraints.pattern;
      if (attr.constraints.enumValues) property.enum = attr.constraints.enumValues;
      if (attr.constraints.format) property.format = attr.constraints.format;

      // Add default value
      if (attr.defaultValue !== undefined) property.default = attr.defaultValue;

      // Handle multi-value attributes
      if (attr.isMultiValue) {
        schema.properties[attr.name] = {
          type: 'array',
          items: property,
          title: attr.displayName,
          description: attr.description,
        };
      } else {
        schema.properties[attr.name] = property;
      }

      // Add to required array if required
      if (attr.isRequired) {
        schema.required.push(attr.name);
      }
    });

    return schema;
  }

  private static mapDataTypeToJsonSchema(dataType: string): string {
    switch (dataType) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'date': return 'string';
      case 'array': return 'array';
      case 'object': return 'object';
      default: return 'string';
    }
  }

  static async validateAttributeSet(
    category: string, 
    attributeValues: Record<string, any>
  ): Promise<{
    valid: boolean;
    errors: Record<string, string[]>;
    normalizedValues: Record<string, any>;
  }> {
    const attributes = await Attribute.find({ category, active: true });
    const errors: Record<string, string[]> = {};
    const normalizedValues: Record<string, any> = {};

    // Validate each attribute
    for (const attribute of attributes) {
      const value = attributeValues[attribute.name];
      const validationResult = await this.validateAttributeValue(attribute, value);
      
      if (!validationResult.valid) {
        errors[attribute.name] = validationResult.errors;
      } else {
        normalizedValues[attribute.name] = validationResult.normalizedValue;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      normalizedValues,
    };
  }

  private static async validateAttributeValue(
    attribute: IAttribute, 
    value: any
  ): Promise<{ valid: boolean; errors: string[]; normalizedValue?: any }> {
    // This would call the same validation logic as in the controller
    // Implementation details omitted for brevity
    return { valid: true, errors: [], normalizedValue: value };
  }

  static async getAttributeStatistics(): Promise<any> {
    const stats = await Attribute.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          required: {
            $sum: { $cond: [{ $eq: ['$isRequired', true] }, 1, 0] }
          },
          custom: {
            $sum: { $cond: [{ $eq: ['$metadata.isCustom', true] }, 1, 0] }
          },
          system: {
            $sum: { $cond: [{ $eq: ['$metadata.isSystem', true] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Attribute.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          required: {
            $sum: { $cond: [{ $eq: ['$isRequired', true] }, 1, 0] }
          }
        }
      }
    ]);

    const dataTypeStats = await Attribute.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$dataType',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overview: stats[0] || { total: 0, active: 0, required: 0, custom: 0, system: 0 },
      byCategory: categoryStats,
      byDataType: dataTypeStats,
    };
  }

  static async initializeSystemAttributes(): Promise<IAttribute[]> {
    const systemAttributes: Partial<IAttribute>[] = SYSTEM_ATTRIBUTES.map(attr => ({
      ...attr,
      constraints: attr.constraints || {},
      validation: attr.validation || {},
      mapping: attr.mapping || {},
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        tags: ['system'],
        isSystem: true,
        isCustom: false,
        version: '1.0.0',
      }
    }));

    const createdAttributes: IAttribute[] = [];
    
    for (const attributeData of systemAttributes) {
      const existingAttribute = await Attribute.findOne({ id: attributeData.id });
      if (!existingAttribute) {
        const attribute = new Attribute(attributeData);
        await attribute.save();
        createdAttributes.push(attribute);
      }
    }

    return createdAttributes;
  }

  static async searchAttributes(
    query: string,
    filters: {
      category?: string;
      dataType?: string;
      isRequired?: boolean;
    } = {}
  ): Promise<IAttribute[]> {
    const searchFilter: any = {
      active: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    // Apply additional filters
    if (filters.category) searchFilter.category = filters.category;
    if (filters.dataType) searchFilter.dataType = filters.dataType;
    if (filters.isRequired !== undefined) searchFilter.isRequired = filters.isRequired;

    return await Attribute.find(searchFilter)
      .limit(50)
      .sort({ category: 1, isRequired: -1, name: 1 });
  }
}
```

## Routes Configuration

**Location**: `/src/routes/attributeRoutes.ts`

```typescript
import express from 'express';
import { AttributeController } from '../controllers/AttributeController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/validation';
import { 
  createAttributeSchema,
  updateAttributeSchema,
  attributeQuerySchema 
} from '../schemas/attributeSchemas';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Attribute CRUD routes
router.get('/', validateRequest(attributeQuerySchema, 'query'), AttributeController.getAttributes);
router.get('/:id', AttributeController.getAttributeById);
router.post('/', validateRequest(createAttributeSchema), AttributeController.createAttribute);
router.put('/:id', validateRequest(updateAttributeSchema), AttributeController.updateAttribute);
router.delete('/:id', AttributeController.deleteAttribute);

// Validation routes
router.post('/:id/validate', AttributeController.validateAttributeValue);
router.post('/validate-set/:category', AttributeController.validateAttributeSet);

// Schema generation routes
router.get('/schema/:category', AttributeController.getAttributeSchema);
router.get('/categories/:category', AttributeController.getAttributesByCategory);

// Statistics and analytics
router.get('/stats/overview', AttributeController.getAttributeStatistics);
router.get('/stats/usage', AttributeController.getAttributeUsageStats);

// System attribute routes (admin only)
router.use('/system', adminAuth);
router.post('/system/initialize', AttributeController.initializeSystemAttributes);
router.get('/system/defaults', AttributeController.getSystemDefaults);

// Bulk operations (admin only)
router.post('/bulk/create', AttributeController.bulkCreateAttributes);
router.put('/bulk/update', AttributeController.bulkUpdateAttributes);
router.delete('/bulk/delete', AttributeController.bulkDeleteAttributes);

export default router;
```

## Validation Schemas

### Attribute Validation

**Location**: `/src/schemas/attributeSchemas.ts`

```typescript
import Joi from 'joi';

export const createAttributeSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().max(100).required(),
  displayName: Joi.string().max(150).required(),
  description: Joi.string().max(1000).optional(),
  categories: Joi.array().items(Joi.string().valid('subject', 'resource')).min(1).required(),
  dataType: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').required(),
  isRequired: Joi.boolean().default(false),
  isMultiValue: Joi.boolean().default(false),
  defaultValue: Joi.any().optional(),
  constraints: Joi.object({
    minLength: Joi.number().min(0).optional(),
    maxLength: Joi.number().min(0).optional(),
    minValue: Joi.number().optional(),
    maxValue: Joi.number().optional(),
    pattern: Joi.string().optional(),
    enumValues: Joi.array().items(Joi.any()).optional(),
    format: Joi.string().valid('email', 'url', 'phone', 'date', 'time', 'datetime', 'ipv4', 'ipv6').optional(),
  }).optional(),
  validation: Joi.object({
    isEmail: Joi.boolean().optional(),
    isUrl: Joi.boolean().optional(),
    isPhoneNumber: Joi.boolean().optional(),
    customValidator: Joi.string().optional(),
  }).optional(),
  mapping: Joi.object({
    sourceField: Joi.string().optional(),
    transformFunction: Joi.string().optional(),
    cacheTime: Joi.number().min(0).optional(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const updateAttributeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  displayName: Joi.string().max(150).optional(),
  description: Joi.string().max(1000).optional(),
  dataType: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').optional(),
  isRequired: Joi.boolean().optional(),
  isMultiValue: Joi.boolean().optional(),
  defaultValue: Joi.any().optional(),
  constraints: Joi.object({
    minLength: Joi.number().min(0).optional(),
    maxLength: Joi.number().min(0).optional(),
    minValue: Joi.number().optional(),
    maxValue: Joi.number().optional(),
    pattern: Joi.string().optional(),
    enumValues: Joi.array().items(Joi.any()).optional(),
    format: Joi.string().valid('email', 'url', 'phone', 'date', 'time', 'datetime', 'ipv4', 'ipv6').optional(),
  }).optional(),
  validation: Joi.object({
    isEmail: Joi.boolean().optional(),
    isUrl: Joi.boolean().optional(),
    isPhoneNumber: Joi.boolean().optional(),
    customValidator: Joi.string().optional(),
  }).optional(),
  mapping: Joi.object({
    sourceField: Joi.string().optional(),
    transformFunction: Joi.string().optional(),
    cacheTime: Joi.number().min(0).optional(),
  }).optional(),
  active: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const attributeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  categories: Joi.array().items(Joi.string().valid('subject', 'resource')).min(1).optional(),
  dataType: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').optional(),
  isRequired: Joi.boolean().optional(),
  active: Joi.boolean().optional(),
  search: Joi.string().optional(),
  isSystem: Joi.boolean().optional(),
  isCustom: Joi.boolean().optional(),
});
```

## Database Indexes

```typescript
// Primary identifier
AttributeSchema.index({ id: 1 }, { unique: true });

// Core fields for filtering
AttributeSchema.index({ name: 1 });
AttributeSchema.index({ category: 1 });
AttributeSchema.index({ dataType: 1 });
AttributeSchema.index({ isRequired: 1 });
AttributeSchema.index({ active: 1 });

// System vs custom attributes
AttributeSchema.index({ 'metadata.isSystem': 1 });
AttributeSchema.index({ 'metadata.isCustom': 1 });

// Text search
AttributeSchema.index({ name: 'text', displayName: 'text', description: 'text' });

// Compound indexes for common queries
AttributeSchema.index({ category: 1, active: 1 });
AttributeSchema.index({ category: 1, isRequired: -1 });
AttributeSchema.index({ dataType: 1, active: 1 });

// Metadata indexes
AttributeSchema.index({ 'metadata.tags': 1 });
AttributeSchema.index({ 'metadata.externalId': 1 }, { sparse: true });

// Performance indexes
AttributeSchema.index({ createdAt: -1 });
AttributeSchema.index({ updatedAt: -1 });
```

## Testing

### Unit Tests

```typescript
describe('Attribute Model', () => {
  test('should create attribute with valid data', async () => {
    const attributeData = {
      id: 'custom.department',
      name: 'customDepartment',
      displayName: 'Custom Department',
      description: 'Custom department attribute',
      categories: ['subject'],
      dataType: 'string',
      isRequired: false,
      constraints: {
        maxLength: 50,
        enumValues: ['IT', 'Finance', 'HR', 'Marketing']
      },
      metadata: {
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        tags: ['custom'],
        isSystem: false,
        isCustom: true,
        version: '1.0.0',
      },
    };

    const attribute = new Attribute(attributeData);
    await attribute.save();

    expect(attribute.id).toBe('custom.department');
    expect(attribute.name).toBe('customDepartment');
    expect(attribute.category).toBe('subject');
    expect(attribute.active).toBe(true);
  });

  test('should validate attribute value correctly', async () => {
    const attribute = {
      dataType: 'string',
      isRequired: true,
      constraints: {
        minLength: 3,
        maxLength: 20,
        enumValues: ['admin', 'user', 'manager']
      }
    };

    // Test valid value
    const validResult = await AttributeService.validateAttributeValue(attribute, 'admin');
    expect(validResult.valid).toBe(true);

    // Test invalid value
    const invalidResult = await AttributeService.validateAttributeValue(attribute, 'invalid');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('Value must be one of: admin, user, manager');
  });
});
```

### Integration Tests

```typescript
describe('Attribute Controller', () => {
  test('GET /api/v1/attributes should return paginated attributes', async () => {
    const response = await request(app)
      .get('/api/v1/attributes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.attributes).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('POST /api/v1/attributes should create new attribute', async () => {
    const attributeData = {
      id: 'test.attribute',
      name: 'testAttribute',
      displayName: 'Test Attribute',
      categories: ['subject'],
      dataType: 'string',
    };

    const response = await request(app)
      .post('/api/v1/attributes')
      .set('Authorization', `Bearer ${token}`)
      .send(attributeData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('test.attribute');
  });

  test('POST /api/v1/attributes/:id/validate should validate value', async () => {
    const response = await request(app)
      .post('/api/v1/attributes/subject.role/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'admin' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.valid).toBe(true);
  });
});
```

## Best Practices

1. **Naming Conventions**: Use consistent naming patterns (category.attributeName)
2. **Data Types**: Choose appropriate data types for values
3. **Constraints**: Define proper validation constraints
4. **Documentation**: Provide clear descriptions for all attributes
5. **Versioning**: Track attribute schema versions
6. **Performance**: Index frequently queried attributes
7. **Validation**: Implement comprehensive value validation
8. **Extensibility**: Design attributes to be easily extensible

## Future Enhancements

- **Dynamic Schemas**: Runtime attribute schema generation
- **Attribute Relationships**: Dependencies between attributes
- **Computed Attributes**: Attributes calculated from other attributes
- **Attribute History**: Track changes to attribute definitions
- **External Integration**: Sync attributes with external systems
- **Machine Learning**: Automatic attribute inference from data
- **Attribute Catalogs**: Centralized attribute discovery and documentation