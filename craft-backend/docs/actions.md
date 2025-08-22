# Action Management Documentation

The Action Management module defines and manages the operations that can be performed on resources within the ABAC system. Actions represent specific activities like read, write, delete, execute, or custom business operations.

## Overview

The action management system provides a comprehensive framework for defining, categorizing, and managing all possible operations that subjects can perform on resources, with support for custom actions and hierarchical relationships.

## Data Model

### Action Schema

**Location**: `/src/models/Action.ts`

```typescript
interface IAction extends Document {
  id: string;
  name: string;
  verb: string;
  description?: string;
  category: 'system' | 'crud' | 'business' | 'administrative' | 'security';
  type: 'atomic' | 'composite';
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  resourceTypes: string[];
  attributes: Map<string, any>;
  parentId?: string;
  children: string[];
  compositeActions?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isCustom: boolean;
    externalId?: string;
    version: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema Definition

```typescript
const ActionSchema = new Schema<IAction>({
  id: {
    type: String,
    required: [true, 'Action ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Action name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    index: true,
  },
  verb: {
    type: String,
    required: [true, 'Action verb is required'],
    trim: true,
    lowercase: true,
    maxlength: [50, 'Verb cannot exceed 50 characters'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    required: [true, 'Action category is required'],
    enum: ['system', 'crud', 'business', 'administrative', 'security'],
    index: true,
  },
  type: {
    type: String,
    required: [true, 'Action type is required'],
    enum: ['atomic', 'composite'],
    default: 'atomic',
    index: true,
  },
  httpMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    index: true,
  },
  resourceTypes: [{
    type: String,
    required: true,
    trim: true,
  }],
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
  parentId: {
    type: String,
    ref: 'Action',
    index: true,
  },
  children: [{
    type: String,
    ref: 'Action',
  }],
  compositeActions: [{
    type: String,
    ref: 'Action',
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
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
    isCustom: {
      type: Boolean,
      default: true,
      index: true,
    },
    externalId: {
      type: String,
      trim: true,
      sparse: true,
    },
    version: {
      type: String,
      default: '1.0.0',
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
// Get all sub-actions
ActionSchema.virtual('subActions', {
  ref: 'Action',
  localField: 'id',
  foreignField: 'parentId',
  justOne: false,
});

// Get parent action
ActionSchema.virtual('parentAction', {
  ref: 'Action',
  localField: 'parentId',
  foreignField: 'id',
  justOne: true,
});

// Get composite action details
ActionSchema.virtual('compositeActionDetails', {
  ref: 'Action',
  localField: 'compositeActions',
  foreignField: 'id',
  justOne: false,
});
```

### Pre-save Middleware

```typescript
ActionSchema.pre<IAction>('save', async function (next) {
  // Update parent's children array if parentId changes
  if (this.isModified('parentId')) {
    const originalParentId = this.get('_original_parentId');
    if (originalParentId) {
      await Action.findOneAndUpdate(
        { id: originalParentId },
        { $pull: { children: this.id } }
      );
    }
    
    // Add to new parent's children
    if (this.parentId) {
      await Action.findOneAndUpdate(
        { id: this.parentId },
        { $addToSet: { children: this.id } }
      );
    }
  }
  
  // Validate composite actions exist
  if (this.compositeActions && this.compositeActions.length > 0) {
    const existingActions = await Action.find({
      id: { $in: this.compositeActions },
      active: true
    }).select('id');
    
    const existingIds = existingActions.map(action => action.id);
    const invalidActions = this.compositeActions.filter(id => !existingIds.includes(id));
    
    if (invalidActions.length > 0) {
      throw new Error(`Invalid composite action IDs: ${invalidActions.join(', ')}`);
    }
  }
  
  // Set lastModifiedBy if modified
  if (this.isModified()) {
    this.metadata.lastModifiedBy = this.metadata.lastModifiedBy || this.metadata.createdBy;
  }
  
  next();
});
```

## Built-in System Actions

```typescript
// Default system actions that are created during system initialization
export const SYSTEM_ACTIONS = [
  {
    id: 'read',
    name: 'Read',
    verb: 'read',
    description: 'View or retrieve resource content',
    category: 'crud',
    type: 'atomic',
    httpMethod: 'GET',
    resourceTypes: ['*'],
    riskLevel: 'low',
    metadata: { isCustom: false, version: '1.0.0' }
  },
  {
    id: 'write',
    name: 'Write',
    verb: 'write',
    description: 'Modify or update resource content',
    category: 'crud',
    type: 'atomic',
    httpMethod: 'PUT',
    resourceTypes: ['*'],
    riskLevel: 'medium',
    metadata: { isCustom: false, version: '1.0.0' }
  },
  {
    id: 'create',
    name: 'Create',
    verb: 'create',
    description: 'Create new resources',
    category: 'crud',
    type: 'atomic',
    httpMethod: 'POST',
    resourceTypes: ['*'],
    riskLevel: 'medium',
    metadata: { isCustom: false, version: '1.0.0' }
  },
  {
    id: 'delete',
    name: 'Delete',
    verb: 'delete',
    description: 'Remove or destroy resources',
    category: 'crud',
    type: 'atomic',
    httpMethod: 'DELETE',
    resourceTypes: ['*'],
    riskLevel: 'high',
    metadata: { isCustom: false, version: '1.0.0' }
  },
  {
    id: 'execute',
    name: 'Execute',
    verb: 'execute',
    description: 'Run or execute resource operations',
    category: 'system',
    type: 'atomic',
    resourceTypes: ['application', 'service', 'api'],
    riskLevel: 'high',
    metadata: { isCustom: false, version: '1.0.0' }
  },
  {
    id: 'admin',
    name: 'Administer',
    verb: 'admin',
    description: 'Administrative access and control',
    category: 'administrative',
    type: 'composite',
    resourceTypes: ['*'],
    compositeActions: ['read', 'write', 'create', 'delete', 'execute'],
    riskLevel: 'critical',
    metadata: { isCustom: false, version: '1.0.0' }
  }
];
```

## Controller Implementation

### Action Controller

**Location**: `/src/controllers/ActionController.ts`

```typescript
export class ActionController {
  // Get all actions with filtering and pagination
  static async getActions(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        type,
        riskLevel,
        active,
        search,
        resourceType,
        httpMethod,
        isCustom,
      } = req.query;

      const filter: any = {};
      
      // Apply filters
      if (category) filter.category = category;
      if (type) filter.type = type;
      if (riskLevel) filter.riskLevel = riskLevel;
      if (active !== undefined) filter.active = active === 'true';
      if (httpMethod) filter.httpMethod = httpMethod;
      if (isCustom !== undefined) filter['metadata.isCustom'] = isCustom === 'true';
      
      if (resourceType) {
        filter.resourceTypes = { $in: [resourceType, '*'] };
      }
      
      // Search in name, verb, and description
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { verb: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [actions, total] = await Promise.all([
        Action.find(filter)
          .populate('parentAction', 'id name verb category')
          .populate('subActions', 'id name verb category')
          .populate('compositeActionDetails', 'id name verb')
          .sort({ category: 1, riskLevel: 1, name: 1 })
          .skip(skip)
          .limit(Number(limit)),
        Action.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          actions,
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
        code: 'ACTION_FETCH_ERROR',
      });
    }
  }
}
```

#### Create Action

```typescript
static async createAction(req: Request, res: Response): Promise<void> {
  try {
    const {
      id,
      name,
      verb,
      description,
      category,
      type,
      httpMethod,
      resourceTypes,
      attributes,
      parentId,
      compositeActions,
      riskLevel,
      tags,
      externalId,
    } = req.body;

    // Validate required fields
    if (!id || !name || !verb || !category) {
      res.status(400).json({
        success: false,
        error: 'ID, name, verb, and category are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Check if action already exists
    const existingAction = await Action.findOne({ id });
    if (existingAction) {
      res.status(409).json({
        success: false,
        error: 'Action with this ID already exists',
        code: 'ACTION_ALREADY_EXISTS',
      });
      return;
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Action.findOne({ id: parentId });
      if (!parent) {
        res.status(400).json({
          success: false,
          error: 'Invalid parent ID',
          code: 'INVALID_PARENT_ID',
        });
        return;
      }
    }

    // Validate composite actions if provided
    if (compositeActions && compositeActions.length > 0) {
      const existingCompositeActions = await Action.find({
        id: { $in: compositeActions },
        active: true
      });
      
      if (existingCompositeActions.length !== compositeActions.length) {
        res.status(400).json({
          success: false,
          error: 'One or more composite action IDs are invalid',
          code: 'INVALID_COMPOSITE_ACTIONS',
        });
        return;
      }
    }

    // Create new action
    const actionData = {
      id,
      name: name.trim(),
      verb: verb.trim().toLowerCase(),
      description: description?.trim(),
      category,
      type: type || 'atomic',
      httpMethod,
      resourceTypes: resourceTypes || ['*'],
      attributes: new Map(Object.entries(attributes || {})),
      parentId,
      compositeActions: compositeActions || [],
      riskLevel: riskLevel || 'low',
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        tags: tags || [],
        isCustom: true,
        externalId,
        version: '1.0.0',
      },
    };

    const action = new Action(actionData);
    await action.save();

    res.status(201).json({
      success: true,
      data: action,
      message: 'Action created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Action with this ID already exists',
        code: 'DUPLICATE_ACTION_ID',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ACTION_CREATION_ERROR',
      });
    }
  }
}
```

#### Get Actions by Resource Type

```typescript
static async getActionsByResourceType(req: Request, res: Response): Promise<void> {
  try {
    const { resourceType } = req.params;
    const { includeGeneric = true } = req.query;

    let filter: any = {
      active: true,
      resourceTypes: { $in: [resourceType] }
    };

    // Include generic actions that work with all resource types
    if (includeGeneric === 'true') {
      filter = {
        active: true,
        $or: [
          { resourceTypes: { $in: [resourceType] } },
          { resourceTypes: { $in: ['*'] } }
        ]
      };
    }

    const actions = await Action.find(filter)
      .populate('compositeActionDetails', 'id name verb riskLevel')
      .sort({ riskLevel: 1, category: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: actions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ACTION_FETCH_BY_RESOURCE_ERROR',
    });
  }
}
```

#### Get Action Hierarchy

```typescript
static async getActionHierarchy(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    const buildHierarchy = async (actionId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const action = await Action.findOne({ id: actionId })
        .select('id name verb category type riskLevel parentId children compositeActions')
        .populate('compositeActionDetails', 'id name verb riskLevel');

      if (!action) return null;

      const result: any = action.toObject();
      
      // Get children recursively
      if (action.children && action.children.length > 0) {
        result.childrenDetails = await Promise.all(
          action.children.map(childId => 
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
        error: 'Action not found',
        code: 'ACTION_NOT_FOUND',
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

**Location**: `/src/routes/actionRoutes.ts`

```typescript
import express from 'express';
import { ActionController } from '../controllers/ActionController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/validation';
import { 
  createActionSchema,
  updateActionSchema,
  actionQuerySchema 
} from '../schemas/actionSchemas';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Action CRUD routes
router.get('/', validateRequest(actionQuerySchema, 'query'), ActionController.getActions);
router.get('/:id', ActionController.getActionById);
router.post('/', validateRequest(createActionSchema), ActionController.createAction);
router.put('/:id', validateRequest(updateActionSchema), ActionController.updateAction);
router.delete('/:id', ActionController.deleteAction);

// Hierarchy and relationship routes
router.get('/:id/hierarchy', ActionController.getActionHierarchy);
router.get('/:id/composite', ActionController.getCompositeActionDetails);

// Resource type specific routes
router.get('/by-resource/:resourceType', ActionController.getActionsByResourceType);
router.get('/categories/:category', ActionController.getActionsByCategory);
router.get('/risk-level/:riskLevel', ActionController.getActionsByRiskLevel);

// Attribute management routes
router.get('/:id/attributes', ActionController.getActionAttributes);
router.put('/:id/attributes', ActionController.updateActionAttributes);

// System action routes (admin only)
router.use('/system', adminAuth);
router.post('/system/initialize', ActionController.initializeSystemActions);
router.get('/system/defaults', ActionController.getSystemDefaults);

// Bulk operations (admin only)
router.post('/bulk/create', ActionController.bulkCreateActions);
router.put('/bulk/update', ActionController.bulkUpdateActions);
router.delete('/bulk/delete', ActionController.bulkDeleteActions);

export default router;
```

## Service Layer

### Action Service

**Location**: `/src/services/ActionService.ts`

```typescript
export class ActionService {
  static async findActionById(id: string): Promise<IAction | null> {
    return await Action.findOne({ id }).populate('parentAction subActions compositeActionDetails');
  }

  static async findActionsByCategory(category: string): Promise<IAction[]> {
    return await Action.find({ category, active: true }).sort({ riskLevel: 1, name: 1 });
  }

  static async findActionsByResourceType(resourceType: string): Promise<IAction[]> {
    return await Action.find({
      active: true,
      $or: [
        { resourceTypes: { $in: [resourceType] } },
        { resourceTypes: { $in: ['*'] } }
      ]
    }).sort({ riskLevel: 1, name: 1 });
  }

  static async getCompositeActionTree(actionId: string): Promise<any> {
    const action = await Action.findOne({ id: actionId });
    if (!action || action.type !== 'composite') return null;

    const compositeDetails = await Action.find({
      id: { $in: action.compositeActions }
    }).select('id name verb riskLevel type compositeActions');

    // Recursively expand nested composite actions
    const expandedActions = await Promise.all(
      compositeDetails.map(async (subAction) => {
        if (subAction.type === 'composite') {
          const subTree = await this.getCompositeActionTree(subAction.id);
          return { ...subAction.toObject(), children: subTree?.children || [] };
        }
        return subAction.toObject();
      })
    );

    return {
      action: action.toObject(),
      children: expandedActions
    };
  }

  static async validateActionChain(actionIds: string[]): Promise<{
    valid: boolean;
    invalidActions: string[];
    riskAssessment: string;
  }> {
    const actions = await Action.find({
      id: { $in: actionIds },
      active: true
    }).select('id riskLevel');

    const foundIds = actions.map(action => action.id);
    const invalidActions = actionIds.filter(id => !foundIds.includes(id));

    // Assess combined risk level
    const riskLevels = actions.map(action => action.riskLevel);
    const riskPriority = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxRisk = Math.max(...riskLevels.map(risk => riskPriority[risk]));
    const riskAssessment = Object.keys(riskPriority).find(
      key => riskPriority[key] === maxRisk
    ) || 'low';

    return {
      valid: invalidActions.length === 0,
      invalidActions,
      riskAssessment
    };
  }

  static async getActionStatistics(): Promise<any> {
    const stats = await Action.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          custom: {
            $sum: { $cond: [{ $eq: ['$metadata.isCustom', true] }, 1, 0] }
          },
          system: {
            $sum: { $cond: [{ $eq: ['$metadata.isCustom', false] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Action.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRiskLevel: { $avg: { 
            $switch: {
              branches: [
                { case: { $eq: ['$riskLevel', 'low'] }, then: 1 },
                { case: { $eq: ['$riskLevel', 'medium'] }, then: 2 },
                { case: { $eq: ['$riskLevel', 'high'] }, then: 3 },
                { case: { $eq: ['$riskLevel', 'critical'] }, then: 4 }
              ],
              default: 1
            }
          }}
        }
      }
    ]);

    const riskStats = await Action.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overview: stats[0] || { total: 0, active: 0, custom: 0, system: 0 },
      byCategory: categoryStats,
      byRiskLevel: riskStats,
    };
  }

  static async initializeSystemActions(): Promise<IAction[]> {
    const systemActions: Partial<IAction>[] = SYSTEM_ACTIONS.map(action => ({
      ...action,
      attributes: new Map(),
      children: [],
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        tags: ['system'],
        isCustom: false,
        version: '1.0.0',
      }
    }));

    // Use upsert to avoid duplicates
    const createdActions: IAction[] = [];
    
    for (const actionData of systemActions) {
      const existingAction = await Action.findOne({ id: actionData.id });
      if (!existingAction) {
        const action = new Action(actionData);
        await action.save();
        createdActions.push(action);
      }
    }

    return createdActions;
  }

  static async searchActions(
    query: string,
    filters: {
      category?: string;
      type?: string;
      riskLevel?: string;
      resourceType?: string;
    } = {}
  ): Promise<IAction[]> {
    const searchFilter: any = {
      active: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { verb: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    // Apply additional filters
    if (filters.category) searchFilter.category = filters.category;
    if (filters.type) searchFilter.type = filters.type;
    if (filters.riskLevel) searchFilter.riskLevel = filters.riskLevel;
    if (filters.resourceType) {
      searchFilter.resourceTypes = { $in: [filters.resourceType, '*'] };
    }

    return await Action.find(searchFilter)
      .populate('compositeActionDetails', 'id name verb')
      .limit(50)
      .sort({ riskLevel: 1, name: 1 });
  }
}
```

## Validation Schemas

### Action Validation

**Location**: `/src/schemas/actionSchemas.ts`

```typescript
import Joi from 'joi';

export const createActionSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().max(100).required(),
  verb: Joi.string().max(50).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid(
    'system', 'crud', 'business', 'administrative', 'security'
  ).required(),
  type: Joi.string().valid('atomic', 'composite').default('atomic'),
  httpMethod: Joi.string().valid(
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
  ).optional(),
  resourceTypes: Joi.array().items(Joi.string()).default(['*']),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  compositeActions: Joi.array().items(Joi.string()).optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').default('low'),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const updateActionSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  verb: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid(
    'system', 'crud', 'business', 'administrative', 'security'
  ).optional(),
  type: Joi.string().valid('atomic', 'composite').optional(),
  httpMethod: Joi.string().valid(
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
  ).optional(),
  resourceTypes: Joi.array().items(Joi.string()).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  parentId: Joi.string().optional(),
  compositeActions: Joi.array().items(Joi.string()).optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  active: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  externalId: Joi.string().optional(),
});

export const actionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().valid(
    'system', 'crud', 'business', 'administrative', 'security'
  ).optional(),
  type: Joi.string().valid('atomic', 'composite').optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  active: Joi.boolean().optional(),
  search: Joi.string().optional(),
  resourceType: Joi.string().optional(),
  httpMethod: Joi.string().valid(
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
  ).optional(),
  isCustom: Joi.boolean().optional(),
});
```

## Database Indexes

```typescript
// Primary identifier
ActionSchema.index({ id: 1 }, { unique: true });

// Core fields for filtering
ActionSchema.index({ verb: 1 });
ActionSchema.index({ category: 1 });
ActionSchema.index({ type: 1 });
ActionSchema.index({ riskLevel: 1 });
ActionSchema.index({ active: 1 });

// HTTP method for API integration
ActionSchema.index({ httpMethod: 1 });

// Resource type compatibility
ActionSchema.index({ resourceTypes: 1 });

// Hierarchy navigation
ActionSchema.index({ parentId: 1 });

// System vs custom actions
ActionSchema.index({ 'metadata.isCustom': 1 });

// Text search
ActionSchema.index({ name: 'text', verb: 'text', description: 'text' });

// Compound indexes for common queries
ActionSchema.index({ category: 1, riskLevel: 1 });
ActionSchema.index({ type: 1, active: 1 });
ActionSchema.index({ resourceTypes: 1, active: 1 });

// Metadata indexes
ActionSchema.index({ 'metadata.tags': 1 });
ActionSchema.index({ 'metadata.externalId': 1 }, { sparse: true });

// Performance indexes
ActionSchema.index({ createdAt: -1 });
ActionSchema.index({ updatedAt: -1 });
```

## Testing

### Unit Tests

```typescript
describe('Action Model', () => {
  test('should create action with valid data', async () => {
    const actionData = {
      id: 'custom_action_001',
      name: 'Custom Read',
      verb: 'read',
      category: 'business',
      type: 'atomic',
      resourceTypes: ['document'],
      riskLevel: 'low',
      metadata: {
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        tags: ['custom'],
        isCustom: true,
        version: '1.0.0',
      },
    };

    const action = new Action(actionData);
    await action.save();

    expect(action.id).toBe('custom_action_001');
    expect(action.name).toBe('Custom Read');
    expect(action.verb).toBe('read');
    expect(action.active).toBe(true);
  });

  test('should create composite action', async () => {
    const compositeAction = new Action({
      id: 'full_access',
      name: 'Full Access',
      verb: 'admin',
      category: 'administrative',
      type: 'composite',
      resourceTypes: ['*'],
      compositeActions: ['read', 'write', 'delete'],
      riskLevel: 'critical',
      metadata: {
        createdBy: 'admin',
        lastModifiedBy: 'admin',
        tags: ['admin'],
        isCustom: true,
        version: '1.0.0',
      },
    });

    await compositeAction.save();

    expect(compositeAction.type).toBe('composite');
    expect(compositeAction.compositeActions).toContain('read');
    expect(compositeAction.riskLevel).toBe('critical');
  });
});
```

### Integration Tests

```typescript
describe('Action Controller', () => {
  test('GET /api/v1/actions should return paginated actions', async () => {
    const response = await request(app)
      .get('/api/v1/actions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.actions).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('POST /api/v1/actions should create new action', async () => {
    const actionData = {
      id: 'test_action_001',
      name: 'Test Action',
      verb: 'test',
      category: 'business',
      resourceTypes: ['document'],
    };

    const response = await request(app)
      .post('/api/v1/actions')
      .set('Authorization', `Bearer ${token}`)
      .send(actionData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('test_action_001');
  });

  test('GET /api/v1/actions/by-resource/document should return relevant actions', async () => {
    const response = await request(app)
      .get('/api/v1/actions/by-resource/document')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

## Best Practices

1. **Naming Conventions**: Use consistent verb naming for actions
2. **Risk Assessment**: Properly categorize actions by risk level
3. **Resource Compatibility**: Define appropriate resource types for each action
4. **Composite Actions**: Use composite actions for complex permission sets
5. **HTTP Integration**: Map actions to HTTP methods where applicable
6. **Versioning**: Track action versions for backward compatibility
7. **Documentation**: Provide clear descriptions for all actions

## Future Enhancements

- **Dynamic Actions**: Runtime action creation based on API discovery
- **Action Templates**: Pre-defined action templates for common patterns
- **Workflow Integration**: Actions that trigger business workflows
- **Audit Integration**: Detailed logging of action executions
- **Machine Learning**: Risk level prediction based on usage patterns
- **API Gateway Integration**: Direct integration with API management systems
- **Conditional Actions**: Actions with preconditions and dependencies