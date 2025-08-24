# Resource Management Documentation

The Resource Management module handles protected resources in the ABAC system. Resources represent any entity that requires access control, such as files, documents, APIs, databases, or business entities.

## Overview

The resource management system provides comprehensive management of protected resources with hierarchical organization, metadata tracking, and flexible attribute-based categorization for access control decisions.

## Data Model

### Resource Schema

**Location**: `/src/models/Resource.ts`

```typescript
interface IResource extends Document {
  id: string;
  name: string;
  type: 'file' | 'document' | 'api' | 'database' | 'service' | 'folder' | 'application';
  uri: string;
  description?: string;
  attributes: Map<string, any>;
  parentId?: string;
  children: string[];
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    admin: boolean;
  };
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    externalId?: string;
    size?: number;
    mimeType?: string;
    checksum?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema Definition

```typescript
const ResourceSchema = new Schema<IResource>({
  id: {
    type: String,
    required: [true, 'Resource ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters'],
    index: true,
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: ['file', 'document', 'api', 'database', 'service', 'folder', 'application'],
    index: true,
  },
  uri: {
    type: String,
    required: [true, 'Resource URI is required'],
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
  parentId: {
    type: String,
    ref: 'Resource',
    index: true,
  },
  children: [{
    type: String,
    ref: 'Resource',
  }],
  permissions: {
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    execute: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
  },
  metadata: {
    owner: {
      type: String,
      required: true,
      index: true,
    },
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
    classification: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted'],
      default: 'internal',
      index: true,
    },
    externalId: {
      type: String,
      trim: true,
      sparse: true,
    },
    size: {
      type: Number,
      min: 0,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    checksum: {
      type: String,
      trim: true,
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

### Virtual Properties

```typescript
// Get all child resources
ResourceSchema.virtual('childResources', {
  ref: 'Resource',
  localField: 'id',
  foreignField: 'parentId',
  justOne: false,
});

// Get parent resource
ResourceSchema.virtual('parentResource', {
  ref: 'Resource',
  localField: 'parentId',
  foreignField: 'id',
  justOne: true,
});

// Get resource path (full URI path including parents)
ResourceSchema.virtual('fullPath').get(function() {
  // This would be computed based on parent hierarchy
  return this.uri;
});
```

### Pre-save Middleware

```typescript
ResourceSchema.pre<IResource>('save', async function (next) {
  // Update parent's children array if parentId changes
  if (this.isModified('parentId')) {
    // Remove from old parent's children
    const originalParentId = this.get('_original_parentId');
    if (originalParentId) {
      await Resource.findOneAndUpdate(
        { id: originalParentId },
        { $pull: { children: this.id } }
      );
    }
    
    // Add to new parent's children
    if (this.parentId) {
      await Resource.findOneAndUpdate(
        { id: this.parentId },
        { $addToSet: { children: this.id } }
      );
    }
  }
  
  // Update lastModifiedBy if any field is modified
  if (this.isModified()) {
    this.metadata.lastModifiedBy = this.metadata.lastModifiedBy || this.metadata.createdBy;
  }
  
  // Generate checksum for file resources if content changes
  if (this.type === 'file' && this.isModified('uri')) {
    // This would integrate with file storage system
    // this.metadata.checksum = await generateChecksum(this.uri);
  }
  
  next();
});
```

## Controller Implementation

### Resource Controller

**Location**: `/src/controllers/ResourceController.ts`

```typescript
export class ResourceController {
  // Get all resources with filtering and pagination
  static async getResources(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        classification,
        active,
        search,
        parentId,
        owner,
        tags,
      } = req.query;

      const filter: any = {};
      
      // Apply filters
      if (type) filter.type = type;
      if (classification) filter['metadata.classification'] = classification;
      if (active !== undefined) filter.active = active === 'true';
      if (parentId) filter.parentId = parentId;
      if (owner) filter['metadata.owner'] = owner;
      
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter['metadata.tags'] = { $in: tagArray };
      }
      
      // Search in name, description, and URI
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { uri: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [resources, total] = await Promise.all([
        Resource.find(filter)
          .populate('parentResource', 'id name type uri')
          .populate('childResources', 'id name type uri')
          .sort({ 'metadata.classification': 1, name: 1 })
          .skip(skip)
          .limit(Number(limit)),
        Resource.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          resources,
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
        code: 'RESOURCE_FETCH_ERROR',
      });
    }
  }
}
```

#### Create Resource

```typescript
static async createResource(req: Request, res: Response): Promise<void> {
  try {
    const {
      id,
      name,
      type,
      uri,
      description,
      attributes,
      parentId,
      permissions,
      classification,
      tags,
      owner,
      externalId,
      mimeType,
      size,
    } = req.body;

    // Validate required fields
    if (!id || !name || !type || !uri) {
      res.status(400).json({
        success: false,
        error: 'ID, name, type, and URI are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Check if resource already exists
    const existingResource = await Resource.findOne({ id });
    if (existingResource) {
      res.status(409).json({
        success: false,
        error: 'Resource with this ID already exists',
        code: 'RESOURCE_ALREADY_EXISTS',
      });
      return;
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Resource.findOne({ id: parentId });
      if (!parent) {
        res.status(400).json({
          success: false,
          error: 'Invalid parent ID',
          code: 'INVALID_PARENT_ID',
        });
        return;
      }
    }

    // Create new resource
    const resourceData = {
      id,
      name: name.trim(),
      type,
      uri: uri.trim(),
      description: description?.trim(),
      attributes: new Map(Object.entries(attributes || {})),
      parentId,
      permissions: {
        read: permissions?.read ?? true,
        write: permissions?.write ?? false,
        delete: permissions?.delete ?? false,
        execute: permissions?.execute ?? false,
        admin: permissions?.admin ?? false,
      },
      metadata: {
        owner: owner || req.user.id,
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        classification: classification || 'internal',
        tags: tags || [],
        externalId,
        mimeType,
        size,
      },
    };

    const resource = new Resource(resourceData);
    await resource.save();

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Resource with this ID already exists',
        code: 'DUPLICATE_RESOURCE_ID',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'RESOURCE_CREATION_ERROR',
      });
    }
  }
}
```

#### Update Resource

```typescript
static async updateResource(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate resource exists
    const existingResource = await Resource.findOne({ id });
    if (!existingResource) {
      res.status(404).json({
        success: false,
        error: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
      });
      return;
    }

    // Check if user has permission to update
    if (existingResource.metadata.owner !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update resource',
        code: 'INSUFFICIENT_PERMISSIONS',
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
          error: 'Resource cannot be its own parent',
          code: 'INVALID_PARENT_REFERENCE',
        });
        return;
      }

      const parent = await Resource.findOne({ id: updates.parentId });
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
    if (updates.metadata) {
      updates.metadata = { ...existingResource.metadata.toObject(), ...updates.metadata };
    } else {
      updates.metadata = existingResource.metadata;
    }
    updates.metadata.lastModifiedBy = req.user.id;

    const resource = await Resource.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    ).populate('parentResource', 'id name type uri')
     .populate('childResources', 'id name type uri');

    res.status(200).json({
      success: true,
      data: resource,
      message: 'Resource updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'RESOURCE_UPDATE_ERROR',
    });
  }
}
```

#### Get Resource Tree

```typescript
static async getResourceTree(req: Request, res: Response): Promise<void> {
  try {
    const { rootId } = req.params;
    const { depth = 5, includePermissions = false } = req.query;

    const buildTree = async (resourceId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const selectFields = includePermissions === 'true' 
        ? 'id name type uri description permissions metadata.classification active parentId children'
        : 'id name type uri description metadata.classification active parentId children';

      const resource = await Resource.findOne({ id: resourceId })
        .select(selectFields);

      if (!resource) return null;

      const result: any = resource.toObject();
      
      // Get children recursively
      if (resource.children && resource.children.length > 0) {
        result.childrenDetails = await Promise.all(
          resource.children.map(childId => 
            buildTree(childId, currentDepth - 1)
          )
        );
        result.childrenDetails = result.childrenDetails.filter(child => child !== null);
      }

      return result;
    };

    const tree = await buildTree(rootId || 'root', Number(depth));

    if (!tree && rootId !== 'root') {
      res.status(404).json({
        success: false,
        error: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
      });
      return;
    }

    // If no root specified, get all root-level resources
    if (rootId === 'root' || !rootId) {
      const rootResources = await Resource.find({ parentId: null })
        .select('id name type uri description metadata.classification active');

      res.status(200).json({
        success: true,
        data: {
          roots: rootResources,
          tree: tree || { children: rootResources },
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: tree,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'TREE_FETCH_ERROR',
    });
  }
}
```

#### Update Resource Permissions

```typescript
static async updateResourcePermissions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate resource exists
    const resource = await Resource.findOne({ id });
    if (!resource) {
      res.status(404).json({
        success: false,
        error: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
      });
      return;
    }

    // Check admin permissions
    if (resource.metadata.owner !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to modify resource permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    // Validate permissions structure
    const validPermissions = ['read', 'write', 'delete', 'execute', 'admin'];
    const invalidPermissions = Object.keys(permissions).filter(
      key => !validPermissions.includes(key)
    );

    if (invalidPermissions.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        code: 'INVALID_PERMISSIONS',
      });
      return;
    }

    // Update permissions
    resource.permissions = { ...resource.permissions, ...permissions };
    resource.metadata.lastModifiedBy = req.user.id;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource,
      message: 'Resource permissions updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'PERMISSION_UPDATE_ERROR',
    });
  }
}
```

## Routes Configuration

**Location**: `/src/routes/resourceRoutes.ts`

```typescript
import express from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/validation';
import { 
  createResourceSchema,
  updateResourceSchema,
  resourceQuerySchema 
} from '../schemas/resourceSchemas';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Resource CRUD routes
router.get('/', validateRequest(resourceQuerySchema, 'query'), ResourceController.getResources);
router.get('/:id', ResourceController.getResourceById);
router.post('/', validateRequest(createResourceSchema), ResourceController.createResource);
router.put('/:id', validateRequest(updateResourceSchema), ResourceController.updateResource);
router.delete('/:id', ResourceController.deleteResource);

// Tree and hierarchy routes
router.get('/tree/:rootId?', ResourceController.getResourceTree);
router.get('/:id/path', ResourceController.getResourcePath);
router.get('/:id/ancestors', ResourceController.getResourceAncestors);
router.get('/:id/descendants', ResourceController.getResourceDescendants);

// Permission management routes
router.put('/:id/permissions', ResourceController.updateResourcePermissions);
router.get('/:id/effective-permissions', ResourceController.getEffectivePermissions);

// Attribute management routes
router.get('/:id/attributes', ResourceController.getResourceAttributes);
router.put('/:id/attributes', ResourceController.updateResourceAttributes);

// Classification and security routes
router.put('/:id/classification', ResourceController.updateResourceClassification);
router.get('/by-classification/:classification', ResourceController.getResourcesByClassification);

// Bulk operations (admin only)
router.use('/bulk', adminAuth);
router.post('/bulk/create', ResourceController.bulkCreateResources);
router.put('/bulk/update', ResourceController.bulkUpdateResources);
router.delete('/bulk/delete', ResourceController.bulkDeleteResources);

export default router;
```

## Service Layer

### Resource Service

**Location**: `/src/services/ResourceService.ts`

```typescript
export class ResourceService {
  static async findResourceById(id: string): Promise<IResource | null> {
    return await Resource.findOne({ id }).populate('parentResource childResources');
  }

  static async findResourcesByType(type: string): Promise<IResource[]> {
    return await Resource.find({ type, active: true });
  }

  static async findResourcesByOwner(owner: string): Promise<IResource[]> {
    return await Resource.find({ 'metadata.owner': owner, active: true });
  }

  static async findResourcesByClassification(classification: string): Promise<IResource[]> {
    return await Resource.find({ 
      'metadata.classification': classification, 
      active: true 
    });
  }

  static async getResourcePath(resourceId: string): Promise<string[]> {
    const path: string[] = [];
    let currentResource = await Resource.findOne({ id: resourceId });

    while (currentResource) {
      path.unshift(currentResource.uri);
      
      if (currentResource.parentId) {
        currentResource = await Resource.findOne({ id: currentResource.parentId });
      } else {
        break;
      }
    }

    return path;
  }

  static async getResourceAncestors(resourceId: string): Promise<IResource[]> {
    const ancestors: IResource[] = [];
    let currentResource = await Resource.findOne({ id: resourceId });

    while (currentResource && currentResource.parentId) {
      const parent = await Resource.findOne({ id: currentResource.parentId });
      if (parent) {
        ancestors.unshift(parent);
        currentResource = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  static async getResourceDescendants(resourceId: string): Promise<IResource[]> {
    const descendants: IResource[] = [];
    
    const collectDescendants = async (id: string) => {
      const children = await Resource.find({ parentId: id });
      for (const child of children) {
        descendants.push(child);
        await collectDescendants(child.id);
      }
    };

    await collectDescendants(resourceId);
    return descendants;
  }

  static async getEffectivePermissions(
    resourceId: string, 
    subjectId: string
  ): Promise<any> {
    // This would integrate with the policy evaluation engine
    const resource = await Resource.findOne({ id: resourceId });
    if (!resource) return null;

    // Get inherited permissions from parents
    const ancestors = await this.getResourceAncestors(resourceId);
    const inheritedPermissions = ancestors.reduce((acc, ancestor) => {
      return { ...acc, ...ancestor.permissions };
    }, {});

    // Combine with resource's own permissions
    return { ...inheritedPermissions, ...resource.permissions };
  }

  static async searchResources(
    query: string,
    filters: {
      type?: string;
      classification?: string;
      owner?: string;
      tags?: string[];
    } = {}
  ): Promise<IResource[]> {
    const searchFilter: any = {
      active: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { uri: { $regex: query, $options: 'i' } },
        { 'metadata.tags': { $regex: query, $options: 'i' } },
      ],
    };

    // Apply additional filters
    if (filters.type) searchFilter.type = filters.type;
    if (filters.classification) searchFilter['metadata.classification'] = filters.classification;
    if (filters.owner) searchFilter['metadata.owner'] = filters.owner;
    if (filters.tags && filters.tags.length > 0) {
      searchFilter['metadata.tags'] = { $in: filters.tags };
    }

    return await Resource.find(searchFilter).limit(100);
  }

  static async getResourceStatistics(): Promise<any> {
    const stats = await Resource.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          byType: {
            $push: { type: '$type', classification: '$metadata.classification' }
          },
          totalSize: { $sum: '$metadata.size' }
        }
      }
    ]);

    const typeStats = await Resource.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgSize: { $avg: '$metadata.size' }
        }
      }
    ]);

    const classificationStats = await Resource.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$metadata.classification',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overview: stats[0] || { total: 0, active: 0, totalSize: 0 },
      byType: typeStats,
      byClassification: classificationStats,
    };
  }

  static async moveResource(
    resourceId: string, 
    newParentId: string | null
  ): Promise<IResource | null> {
    const resource = await Resource.findOne({ id: resourceId });
    if (!resource) return null;

    // Validate new parent exists (if provided)
    if (newParentId) {
      const newParent = await Resource.findOne({ id: newParentId });
      if (!newParent) {
        throw new Error('Invalid parent ID');
      }
    }

    // Remove from old parent's children
    if (resource.parentId) {
      await Resource.findOneAndUpdate(
        { id: resource.parentId },
        { $pull: { children: resourceId } }
      );
    }

    // Add to new parent's children
    if (newParentId) {
      await Resource.findOneAndUpdate(
        { id: newParentId },
        { $addToSet: { children: resourceId } }
      );
    }

    // Update resource's parent
    resource.parentId = newParentId;
    return await resource.save();
  }
}
```

## Validation Schemas

### Resource Validation

**Location**: `/src/schemas/resourceSchemas.ts`

```typescript
import Joi from 'joi';

export const createResourceSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().max(200).required(),
  type: Joi.string().valid(
    'file', 'document', 'api', 'database', 'service', 'folder', 'application'
  ).required(),
  uri: Joi.string().required(),
  description: Joi.string().max(1000).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  permissions: Joi.object({
    read: Joi.boolean().optional(),
    write: Joi.boolean().optional(),
    delete: Joi.boolean().optional(),
    execute: Joi.boolean().optional(),
    admin: Joi.boolean().optional(),
  }).optional(),
  classification: Joi.string().valid('public', 'internal', 'confidential', 'restricted').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  owner: Joi.string().optional(),
  externalId: Joi.string().optional(),
  mimeType: Joi.string().optional(),
  size: Joi.number().min(0).optional(),
});

export const updateResourceSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  type: Joi.string().valid(
    'file', 'document', 'api', 'database', 'service', 'folder', 'application'
  ).optional(),
  uri: Joi.string().optional(),
  description: Joi.string().max(1000).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  permissions: Joi.object({
    read: Joi.boolean().optional(),
    write: Joi.boolean().optional(),
    delete: Joi.boolean().optional(),
    execute: Joi.boolean().optional(),
    admin: Joi.boolean().optional(),
  }).optional(),
  active: Joi.boolean().optional(),
  metadata: Joi.object({
    classification: Joi.string().valid('public', 'internal', 'confidential', 'restricted').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    owner: Joi.string().optional(),
    externalId: Joi.string().optional(),
    mimeType: Joi.string().optional(),
    size: Joi.number().min(0).optional(),
  }).optional(),
});

export const resourceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid(
    'file', 'document', 'api', 'database', 'service', 'folder', 'application'
  ).optional(),
  classification: Joi.string().valid('public', 'internal', 'confidential', 'restricted').optional(),
  active: Joi.boolean().optional(),
  search: Joi.string().optional(),
  parentId: Joi.string().optional(),
  owner: Joi.string().optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
});
```

## Database Indexes

```typescript
// Primary identifier
ResourceSchema.index({ id: 1 }, { unique: true });

// Type and classification for filtering
ResourceSchema.index({ type: 1 });
ResourceSchema.index({ 'metadata.classification': 1 });

// Ownership and status
ResourceSchema.index({ 'metadata.owner': 1 });
ResourceSchema.index({ active: 1 });

// URI for quick lookups
ResourceSchema.index({ uri: 1 });

// Hierarchy navigation
ResourceSchema.index({ parentId: 1 });

// Text search
ResourceSchema.index({ name: 'text', description: 'text', uri: 'text' });

// Compound indexes for common queries
ResourceSchema.index({ type: 1, active: 1 });
ResourceSchema.index({ 'metadata.classification': 1, active: 1 });
ResourceSchema.index({ 'metadata.owner': 1, active: 1 });

// Metadata indexes
ResourceSchema.index({ 'metadata.tags': 1 });
ResourceSchema.index({ 'metadata.externalId': 1 }, { sparse: true });

// Performance indexes
ResourceSchema.index({ createdAt: -1 });
ResourceSchema.index({ updatedAt: -1 });
```

## Error Handling

### Resource-specific Errors

```typescript
export class ResourceError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'RESOURCE_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ResourceError';
  }
}

export class ResourceNotFoundError extends ResourceError {
  constructor(id: string) {
    super(`Resource with ID '${id}' not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

export class DuplicateResourceError extends ResourceError {
  constructor(id: string) {
    super(`Resource with ID '${id}' already exists`, 409, 'RESOURCE_ALREADY_EXISTS');
  }
}

export class InsufficientPermissionsError extends ResourceError {
  constructor() {
    super('Insufficient permissions to access resource', 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class InvalidHierarchyError extends ResourceError {
  constructor(message: string) {
    super(message, 400, 'INVALID_HIERARCHY');
  }
}
```

## Best Practices

1. **URI Design**: Use consistent URI patterns for resource identification
2. **Hierarchy Planning**: Design resource hierarchy to match organizational structure
3. **Permission Inheritance**: Implement permission inheritance from parent resources
4. **Classification**: Apply appropriate security classifications
5. **Metadata**: Include comprehensive metadata for audit and management
6. **Performance**: Use indexes for frequently queried fields
7. **Security**: Validate ownership and permissions before allowing operations

## Future Enhancements

- **File System Integration**: Direct integration with file storage systems
- **Version Control**: Track resource versions and changes
- **Content Indexing**: Full-text search within resource content
- **Access Logging**: Detailed access audit trails
- **Backup Integration**: Automatic backup and recovery
- **Quotas and Limits**: Resource usage quotas and limits
- **Workflow Integration**: Approval workflows for sensitive resources