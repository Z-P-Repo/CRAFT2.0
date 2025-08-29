# Subject Management Documentation

The Subject Management module handles entities that can request access to resources in the ABAC system. Subjects can be users, groups, roles, or any entity with attributes that participate in access control decisions.

## ✅ Latest Features (August 2025)

- **Policy Dependency Protection**: Prevents deletion of subjects referenced in active policies with ValidationError responses
- **Real-time Policy Counting**: Accurate policy count tracking using ID-based entity mapping
- **Enhanced Error Handling**: Standardized error responses for frontend delete modal integration
- **Schema Consistency**: Fixed entity-policy mapping ensuring accurate dependency tracking
- **Optimized Queries**: MongoDB lean() queries for efficient policy counting

## Overview

The subject management system provides a flexible way to define and manage entities that require access control evaluation. Subjects are characterized by their attributes and relationships within the organizational structure.

## Data Model

### Subject Schema

**Location**: `/src/models/Subject.ts`

```typescript
interface ISubject extends Document {
  id: string;
  name: string;
  type: 'user' | 'group' | 'role' | 'service' | 'device';
  description?: string;
  attributes: Map<string, any>;
  parentId?: string;
  children: string[];
  active: boolean;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    externalId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema Definition

```typescript
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
    maxlength: [100, 'Name cannot exceed 100 characters'],
    index: true,
  },
  type: {
    type: String,
    required: [true, 'Subject type is required'],
    enum: ['user', 'group', 'role', 'service', 'device'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
  parentId: {
    type: String,
    ref: 'Subject',
    index: true,
  },
  children: [{
    type: String,
    ref: 'Subject',
  }],
  active: {
    type: Boolean,
    default: true,
    index: true,
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
    externalId: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
}, {
  timestamps: true,
  versionKey: false,
});
```

### Virtual Properties

```typescript
// Get all descendant subjects
SubjectSchema.virtual('descendants', {
  ref: 'Subject',
  localField: 'id',
  foreignField: 'parentId',
  justOne: false,
});

// Get parent subject
SubjectSchema.virtual('parent', {
  ref: 'Subject',
  localField: 'parentId',
  foreignField: 'id',
  justOne: true,
});
```

### Pre-save Middleware

```typescript
SubjectSchema.pre<ISubject>('save', async function (next) {
  // Update parent's children array if parentId changes
  if (this.isModified('parentId')) {
    // Remove from old parent's children
    if (this.isModified('parentId') && this.get('_original_parentId')) {
      await Subject.findOneAndUpdate(
        { id: this.get('_original_parentId') },
        { $pull: { children: this.id } }
      );
    }
    
    // Add to new parent's children
    if (this.parentId) {
      await Subject.findOneAndUpdate(
        { id: this.parentId },
        { $addToSet: { children: this.id } }
      );
    }
  }
  
  // Set lastModifiedBy if not set
  if (this.isModified() && !this.metadata.lastModifiedBy) {
    this.metadata.lastModifiedBy = this.metadata.createdBy;
  }
  
  next();
});
```

## Controller Implementation

### Subject Controller

**Location**: `/src/controllers/SubjectController.ts`

```typescript
export class SubjectController {
  // Get all subjects with filtering and pagination
  static async getSubjects(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        active,
        search,
        parentId,
        tags,
      } = req.query;

      const filter: any = {};
      
      // Apply filters
      if (type) filter.type = type;
      if (active !== undefined) filter.active = active === 'true';
      if (parentId) filter.parentId = parentId;
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter['metadata.tags'] = { $in: tagArray };
      }
      
      // Search in name and description
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [subjects, total] = await Promise.all([
        Subject.find(filter)
          .populate('parent', 'id name type')
          .populate('children', 'id name type')
          .sort({ name: 1 })
          .skip(skip)
          .limit(Number(limit)),
        Subject.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          subjects,
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
        code: 'SUBJECT_FETCH_ERROR',
      });
    }
  }
}
```

#### Create Subject

```typescript
static async createSubject(req: Request, res: Response): Promise<void> {
  try {
    const {
      id,
      name,
      type,
      description,
      attributes,
      parentId,
      tags,
      externalId,
    } = req.body;

    // Validate required fields
    if (!id || !name || !type) {
      res.status(400).json({
        success: false,
        error: 'ID, name, and type are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ id });
    if (existingSubject) {
      res.status(409).json({
        success: false,
        error: 'Subject with this ID already exists',
        code: 'SUBJECT_ALREADY_EXISTS',
      });
      return;
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Subject.findOne({ id: parentId });
      if (!parent) {
        res.status(400).json({
          success: false,
          error: 'Invalid parent ID',
          code: 'INVALID_PARENT_ID',
        });
        return;
      }
    }

    // Create new subject
    const subjectData = {
      id,
      name: name.trim(),
      type,
      description: description?.trim(),
      attributes: new Map(Object.entries(attributes || {})),
      parentId,
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        tags: tags || [],
        externalId,
      },
    };

    const subject = new Subject(subjectData);
    await subject.save();

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Subject with this ID already exists',
        code: 'DUPLICATE_SUBJECT_ID',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'SUBJECT_CREATION_ERROR',
      });
    }
  }
}
```

#### Update Subject

```typescript
static async updateSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate subject exists
    const existingSubject = await Subject.findOne({ id });
    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Validate parent if being updated
    if (updates.parentId) {
      if (updates.parentId === id) {
        res.status(400).json({
          success: false,
          error: 'Subject cannot be its own parent',
          code: 'INVALID_PARENT_REFERENCE',
        });
        return;
      }

      const parent = await Subject.findOne({ id: updates.parentId });
      if (!parent) {
        res.status(400).json({
          success: false,
          error: 'Invalid parent ID',
          code: 'INVALID_PARENT_ID',
        });
        return;
      }
    }

    // Convert attributes to Map if provided
    if (updates.attributes) {
      updates.attributes = new Map(Object.entries(updates.attributes));
    }

    // Update metadata
    if (!updates.metadata) {
      updates.metadata = existingSubject.metadata;
    }
    updates.metadata.lastModifiedBy = req.user.id;

    const subject = await Subject.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    ).populate('parent', 'id name type')
     .populate('children', 'id name type');

    res.status(200).json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SUBJECT_UPDATE_ERROR',
    });
  }
}
```

#### Delete Subject (with Policy Protection)

```typescript
static async deleteSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const subject = await Subject.findOne({ id });
    if (!subject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    // Check if subject is used in any active policies
    const checkUsageInPolicies = async (subjectId: string) => {
      const policies = await Policy.find({
        $or: [
          { subjects: subjectId },
          { 'rules.subject': subjectId }
        ],
        status: 'Active'
      }).select('id name').lean();
      
      return policies;
    };

    const policiesUsingSubject = await checkUsageInPolicies(id);
    if (policiesUsingSubject.length > 0) {
      const policyNames = policiesUsingSubject.slice(0, 5).map(p => p.name);
      const additionalCount = Math.max(0, policiesUsingSubject.length - 5);
      
      res.status(400).json({
        success: false,
        error: `Cannot delete subject. It is currently used in ${policiesUsingSubject.length} active ${policiesUsingSubject.length === 1 ? 'policy' : 'policies'}: ${policyNames.join(', ')}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}`,
        code: 'VALIDATION_ERROR',
        details: {
          type: 'ENTITY_IN_USE',
          entityType: 'subject',
          entityId: id,
          policyCount: policiesUsingSubject.length,
          policyNames: policyNames
        }
      });
      return;
    }

    // Check if subject has children
    if (subject.children && subject.children.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete subject with children. Delete or reassign children first.',
        code: 'SUBJECT_HAS_CHILDREN',
      });
      return;
    }

    // Remove from parent's children array
    if (subject.parentId) {
      await Subject.findOneAndUpdate(
        { id: subject.parentId },
        { $pull: { children: id } }
      );
    }

    await Subject.findOneAndDelete({ id });

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SUBJECT_DELETION_ERROR',
    });
  }
}
```

#### Get Subject Hierarchy

```typescript
static async getSubjectHierarchy(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    const buildHierarchy = async (subjectId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const subject = await Subject.findOne({ id: subjectId })
        .select('id name type description active parentId children');

      if (!subject) return null;

      const result: any = subject.toObject();
      
      // Get children recursively
      if (subject.children && subject.children.length > 0) {
        result.childrenDetails = await Promise.all(
          subject.children.map(childId => 
            buildHierarchy(childId, currentDepth - 1)
          )
        );
        result.childrenDetails = result.childrenDetails.filter(child => child !== null);
      }

      return result;
    };

    const hierarchy = await buildHierarchy(id, Number(depth));

    if (!hierarchy) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'HIERARCHY_FETCH_ERROR',
    });
  }
}
```

## Routes Configuration

**Location**: `/src/routes/subjectRoutes.ts`

```typescript
import express from 'express';
import { SubjectController } from '../controllers/SubjectController';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createSubjectSchema,
  updateSubjectSchema,
  subjectQuerySchema 
} from '../schemas/subjectSchemas';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Subject CRUD routes
router.get('/', validateRequest(subjectQuerySchema, 'query'), SubjectController.getSubjects);
router.get('/:id', SubjectController.getSubjectById);
router.post('/', validateRequest(createSubjectSchema), SubjectController.createSubject);
router.put('/:id', validateRequest(updateSubjectSchema), SubjectController.updateSubject);
router.delete('/:id', SubjectController.deleteSubject);

// Hierarchy and relationship routes
router.get('/:id/hierarchy', SubjectController.getSubjectHierarchy);
router.get('/:id/ancestors', SubjectController.getSubjectAncestors);
router.get('/:id/descendants', SubjectController.getSubjectDescendants);
router.post('/:id/move', SubjectController.moveSubject);

// Attribute management routes
router.get('/:id/attributes', SubjectController.getSubjectAttributes);
router.put('/:id/attributes', SubjectController.updateSubjectAttributes);
router.post('/:id/attributes/:key', SubjectController.addSubjectAttribute);
router.delete('/:id/attributes/:key', SubjectController.removeSubjectAttribute);

// Bulk operations
router.post('/bulk/create', SubjectController.bulkCreateSubjects);
router.put('/bulk/update', SubjectController.bulkUpdateSubjects);
router.delete('/bulk/delete', SubjectController.bulkDeleteSubjects);

export default router;
```

## Service Layer

### Subject Service

**Location**: `/src/services/SubjectService.ts`

```typescript
export class SubjectService {
  static async findSubjectById(id: string): Promise<ISubject | null> {
    return await Subject.findOne({ id }).populate('parent children');
  }

  static async findSubjectsByType(type: string): Promise<ISubject[]> {
    return await Subject.find({ type, active: true });
  }

  static async findSubjectsByAttribute(
    attributeKey: string, 
    attributeValue: any
  ): Promise<ISubject[]> {
    const filter = {};
    filter[`attributes.${attributeKey}`] = attributeValue;
    return await Subject.find(filter);
  }

  static async getSubjectAncestors(subjectId: string): Promise<ISubject[]> {
    const ancestors: ISubject[] = [];
    let currentSubject = await Subject.findOne({ id: subjectId });

    while (currentSubject && currentSubject.parentId) {
      const parent = await Subject.findOne({ id: currentSubject.parentId });
      if (parent) {
        ancestors.unshift(parent);
        currentSubject = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  static async getSubjectDescendants(subjectId: string): Promise<ISubject[]> {
    const descendants: ISubject[] = [];
    
    const collectDescendants = async (id: string) => {
      const children = await Subject.find({ parentId: id });
      for (const child of children) {
        descendants.push(child);
        await collectDescendants(child.id);
      }
    };

    await collectDescendants(subjectId);
    return descendants;
  }

  static async moveSubject(
    subjectId: string, 
    newParentId: string | null
  ): Promise<ISubject | null> {
    const subject = await Subject.findOne({ id: subjectId });
    if (!subject) return null;

    // Validate new parent exists (if provided)
    if (newParentId) {
      const newParent = await Subject.findOne({ id: newParentId });
      if (!newParent) {
        throw new Error('Invalid parent ID');
      }
    }

    // Remove from old parent's children
    if (subject.parentId) {
      await Subject.findOneAndUpdate(
        { id: subject.parentId },
        { $pull: { children: subjectId } }
      );
    }

    // Add to new parent's children
    if (newParentId) {
      await Subject.findOneAndUpdate(
        { id: newParentId },
        { $addToSet: { children: subjectId } }
      );
    }

    // Update subject's parent
    subject.parentId = newParentId;
    return await subject.save();
  }

  static async bulkCreateSubjects(subjects: Partial<ISubject>[]): Promise<ISubject[]> {
    const validatedSubjects = subjects.map(subject => ({
      ...subject,
      attributes: new Map(Object.entries(subject.attributes || {})),
    }));

    return await Subject.insertMany(validatedSubjects);
  }

  static async getSubjectStatistics(): Promise<any> {
    const stats = await Subject.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$active', true] }, 1, 0]
            }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          }
        }
      },
      {
        $unwind: '$byType'
      },
      {
        $group: {
          _id: '$byType.type',
          total: { $first: '$total' },
          active: { $first: '$active' },
          count: { $sum: 1 }
        }
      }
    ]);

    return stats;
  }
}
```

## Validation Schemas

### Subject Validation

**Location**: `/src/schemas/subjectSchemas.ts`

```typescript
import Joi from 'joi';

export const createSubjectSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('user', 'group', 'role', 'service', 'device').required(),
  description: Joi.string().max(500).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const updateSubjectSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  type: Joi.string().valid('user', 'group', 'role', 'service', 'device').optional(),
  description: Joi.string().max(500).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  active: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const subjectQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('user', 'group', 'role', 'service', 'device').optional(),
  active: Joi.boolean().optional(),
  search: Joi.string().optional(),
  parentId: Joi.string().optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
});
```

## Database Indexes

```typescript
// Primary identifier
SubjectSchema.index({ id: 1 }, { unique: true });

// Type-based queries
SubjectSchema.index({ type: 1 });

// Status filtering
SubjectSchema.index({ active: 1 });

// Hierarchy navigation
SubjectSchema.index({ parentId: 1 });

// Text search
SubjectSchema.index({ name: 'text', description: 'text' });

// Compound indexes for common queries
SubjectSchema.index({ type: 1, active: 1 });
SubjectSchema.index({ parentId: 1, active: 1 });

// Metadata indexes
SubjectSchema.index({ 'metadata.tags': 1 });
SubjectSchema.index({ 'metadata.externalId': 1 }, { sparse: true });

// Attribute queries
SubjectSchema.index({ 'attributes': 1 }, { sparse: true });
```

## Error Handling

### Subject-specific Errors

```typescript
export class SubjectError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'SUBJECT_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'SubjectError';
  }
}

export class SubjectNotFoundError extends SubjectError {
  constructor(id: string) {
    super(`Subject with ID '${id}' not found`, 404, 'SUBJECT_NOT_FOUND');
  }
}

export class DuplicateSubjectError extends SubjectError {
  constructor(id: string) {
    super(`Subject with ID '${id}' already exists`, 409, 'SUBJECT_ALREADY_EXISTS');
  }
}

export class InvalidHierarchyError extends SubjectError {
  constructor(message: string) {
    super(message, 400, 'INVALID_HIERARCHY');
  }
}
```

## Testing

### Unit Tests

```typescript
describe('Subject Model', () => {
  test('should create subject with valid data', async () => {
    const subjectData = {
      id: 'user_001',
      name: 'John Doe',
      type: 'user',
      attributes: new Map([['department', 'IT'], ['level', 'senior']]),
      metadata: {
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        tags: ['employee', 'tech'],
      },
    };

    const subject = new Subject(subjectData);
    await subject.save();

    expect(subject.id).toBe('user_001');
    expect(subject.name).toBe('John Doe');
    expect(subject.type).toBe('user');
    expect(subject.active).toBe(true);
  });

  test('should maintain parent-child relationships', async () => {
    const parent = new Subject({
      id: 'group_001',
      name: 'IT Department',
      type: 'group',
      metadata: { createdBy: 'admin', lastModifiedBy: 'admin', tags: [] },
    });
    await parent.save();

    const child = new Subject({
      id: 'user_001',
      name: 'John Doe',
      type: 'user',
      parentId: 'group_001',
      metadata: { createdBy: 'admin', lastModifiedBy: 'admin', tags: [] },
    });
    await child.save();

    const updatedParent = await Subject.findOne({ id: 'group_001' });
    expect(updatedParent.children).toContain('user_001');
  });
});
```

### Integration Tests

```typescript
describe('Subject Controller', () => {
  test('GET /api/v1/subjects should return paginated subjects', async () => {
    const response = await request(app)
      .get('/api/v1/subjects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.subjects).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('POST /api/v1/subjects should create new subject', async () => {
    const subjectData = {
      id: 'test_subject_001',
      name: 'Test Subject',
      type: 'user',
      description: 'Test subject for integration testing',
    };

    const response = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${token}`)
      .send(subjectData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('test_subject_001');
  });
});
```

## Performance Optimizations

### Query Optimization

```typescript
// Use aggregation for complex queries
const getSubjectStatsByType = async () => {
  return await Subject.aggregate([
    { $match: { active: true } },
    { 
      $group: { 
        _id: '$type', 
        count: { $sum: 1 },
        attributes: { $push: '$attributes' }
      } 
    },
    { $sort: { count: -1 } }
  ]);
};

// Use projection to limit returned fields
const getSubjectSummary = async (id: string) => {
  return await Subject.findOne({ id })
    .select('id name type active parentId children')
    .populate('parent', 'id name type')
    .lean();
};
```

### Caching Strategy

```typescript
import NodeCache from 'node-cache';

const subjectCache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL

export const getCachedSubject = async (id: string): Promise<ISubject | null> => {
  const cacheKey = `subject_${id}`;
  let subject = subjectCache.get(cacheKey) as ISubject;

  if (!subject) {
    subject = await Subject.findOne({ id });
    if (subject) {
      subjectCache.set(cacheKey, subject);
    }
  }

  return subject;
};

export const invalidateSubjectCache = (id: string): void => {
  subjectCache.del(`subject_${id}`);
};
```

## Best Practices

1. **Hierarchical Design**: Plan subject hierarchy carefully to avoid circular references
2. **Attribute Management**: Use consistent attribute naming conventions
3. **Performance**: Index frequently queried fields and use aggregation for complex queries
4. **Data Integrity**: Validate parent-child relationships before updates
5. **Caching**: Cache frequently accessed subjects to improve performance
6. **Logging**: Log hierarchy changes for audit purposes
7. **Bulk Operations**: Use bulk operations for large-scale subject management

## Future Enhancements

- **Subject Templates**: Pre-defined subject templates for common types
- **Dynamic Attributes**: Runtime attribute schema validation
- **Subject Inheritance**: Attribute inheritance from parent subjects
- **Search Integration**: Full-text search with Elasticsearch
- **Import/Export**: Bulk subject import/export functionality
- **Version Control**: Track subject changes over time
- **API Integration**: Sync with external identity providers