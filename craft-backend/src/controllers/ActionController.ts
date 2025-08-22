import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';

// Action interface
interface IAction {
  _id: string;
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

// Placeholder Action model
const Action = {
  find: (filter: any) => ({
    populate: (path: string, select?: string) => ({
      sort: (sort: any) => ({
        skip: (skip: number) => ({
          limit: (limit: number) => ({
            lean: () => Promise.resolve([] as IAction[])
          })
        })
      })
    })
  }),
  countDocuments: (filter: any) => Promise.resolve(0),
  findOne: (filter: any) => ({
    populate: (path: string, select?: string) => ({
      lean: () => Promise.resolve(null as IAction | null)
    })
  }),
  create: (data: any) => Promise.resolve({} as IAction),
  findOneAndUpdate: (filter: any, updates: any, options: any) => ({
    populate: (path: string, select?: string) => Promise.resolve(null as IAction | null)
  }),
  findOneAndDelete: (filter: any) => Promise.resolve(null as IAction | null),
  updateMany: (filter: any, updates: any) => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
  deleteMany: (filter: any) => Promise.resolve({ deletedCount: 0 }),
  aggregate: (pipeline: any[]) => Promise.resolve([])
};

export class ActionController {
  // Get all actions with pagination and filtering
  static getActions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      category,
      type,
      riskLevel,
      active,
      resourceType,
      httpMethod,
      isCustom,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (active !== undefined) filter.active = active === 'true';
    if (httpMethod) filter.httpMethod = httpMethod;
    if (isCustom !== undefined) filter['metadata.isCustom'] = isCustom === 'true';
    
    if (resourceType) {
      filter.resourceTypes = { $in: [resourceType, '*'] };
    }

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'verb', 'description', 'id']
      );
      Object.assign(filter, searchFilter);
    }

    // Calculate pagination
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    // Execute queries
    const [actions, total] = await Promise.all([
      Action.find(filter)
        .populate('parentId', 'id name verb category')
        .populate('children', 'id name verb category')
        .populate('compositeActions', 'id name verb riskLevel')
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Action.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(actions, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get action by ID
  static getActionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const action = await Action.findOne({ id })
      .populate('parentId', 'id name verb category')
      .populate('children', 'id name verb category')
      .populate('compositeActions', 'id name verb riskLevel')
      .lean();

    if (!action) {
      throw new NotFoundError('Action not found');
    }

    res.status(200).json({
      success: true,
      data: action,
    });
  });

  // Create new action
  static createAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
      throw new ValidationError('ID, name, verb, and category are required');
    }

    // Check if action already exists
    const existingAction = await Action.findOne({ id });
    if (existingAction) {
      throw new ValidationError('Action with this ID already exists');
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Action.findOne({ id: parentId });
      if (!parent) {
        throw new ValidationError('Parent action not found');
      }
    }

    // Validate composite actions if provided
    if (compositeActions && compositeActions.length > 0) {
      const existingCompositeActions = await Action.find({
        id: { $in: compositeActions },
        active: true
      });
      
      if (existingCompositeActions.length !== compositeActions.length) {
        throw new ValidationError('One or more composite action IDs are invalid');
      }
    }

    // Create action
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
      children: [],
      compositeActions: compositeActions || [],
      riskLevel: riskLevel || 'low',
      metadata: {
        createdBy: req.user!._id,
        lastModifiedBy: req.user!._id,
        tags: tags || [],
        isCustom: true,
        externalId,
        version: '1.0.0',
      },
    };

    const action = await Action.create(actionData);

    logger.info(`Action created: ${action.id} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: action,
      message: 'Action created successfully',
    });
  });

  // Update action
  static updateAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    // Validate action exists
    const existingAction = await Action.findOne({ id });
    if (!existingAction) {
      throw new NotFoundError('Action not found');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Validate parent if being updated
    if (updates.parentId) {
      if (updates.parentId === id) {
        throw new ValidationError('Action cannot be its own parent');
      }

      const parent = await Action.findOne({ id: updates.parentId });
      if (!parent) {
        throw new ValidationError('Parent action not found');
      }
    }

    // Validate composite actions if being updated
    if (updates.compositeActions) {
      const existingCompositeActions = await Action.find({
        id: { $in: updates.compositeActions },
        active: true
      });
      
      if (existingCompositeActions.length !== updates.compositeActions.length) {
        throw new ValidationError('One or more composite action IDs are invalid');
      }
    }

    // Convert attributes to Map if provided
    if (updates.attributes) {
      updates.attributes = new Map(Object.entries(updates.attributes));
    }

    // Update metadata
    if (!updates.metadata) {
      updates.metadata = existingAction.metadata;
    }
    updates.metadata.lastModifiedBy = req.user!._id;

    const action = await Action.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    )
      .populate('parentId', 'id name verb category')
      .populate('children', 'id name verb category')
      .populate('compositeActions', 'id name verb riskLevel');

    logger.info(`Action updated: ${action.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: action,
      message: 'Action updated successfully',
    });
  });

  // Delete action
  static deleteAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const action = await Action.findOne({ id });
    if (!action) {
      throw new NotFoundError('Action not found');
    }

    // Check if action has children
    if (action.children && action.children.length > 0) {
      throw new ValidationError('Cannot delete action with children. Delete or reassign children first.');
    }

    await Action.findOneAndDelete({ id });

    logger.info(`Action deleted: ${action.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'Action deleted successfully',
    });
  });

  // Get actions by resource type
  static getActionsByResourceType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { resourceType } = req.params;
    const { includeGeneric = true } = req.query;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

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

    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [actions, total] = await Promise.all([
      Action.find(filter)
        .populate('compositeActions', 'id name verb riskLevel')
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Action.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(actions, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get actions by category
  static getActionsByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    const validCategories = ['system', 'crud', 'business', 'administrative', 'security'];
    if (!validCategories.includes(category)) {
      throw new ValidationError(`Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }

    const filter = { category, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [actions, total] = await Promise.all([
      Action.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Action.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(actions, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get actions by risk level
  static getActionsByRiskLevel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { riskLevel } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (!validRiskLevels.includes(riskLevel)) {
      throw new ValidationError(`Invalid risk level. Valid levels: ${validRiskLevels.join(', ')}`);
    }

    const filter = { riskLevel, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [actions, total] = await Promise.all([
      Action.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Action.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(actions, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get action hierarchy
  static getActionHierarchy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    const buildHierarchy = async (actionId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const action = await Action.findOne({ id: actionId })
        .populate('children', 'id name verb category type riskLevel')
        .populate('compositeActions', 'id name verb riskLevel');

      if (!action) return null;

      const result: any = {
        ...action,
        childrenDetails: []
      };
      
      // Get children recursively
      if (action.children && action.children.length > 0) {
        const childrenPromises = action.children.map(childId => 
          buildHierarchy(childId, currentDepth - 1)
        );
        result.childrenDetails = (await Promise.all(childrenPromises))
          .filter(child => child !== null);
      }

      return result;
    };

    const hierarchy = await buildHierarchy(id, Number(depth));

    if (!hierarchy) {
      throw new NotFoundError('Action not found');
    }

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  });

  // Get action statistics
  static getActionStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
          count: { $sum: 1 }
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

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, custom: 0, system: 0 },
        byCategory: categoryStats,
        byRiskLevel: riskStats,
      },
    });
  });

  // Bulk operations
  static bulkUpdateActions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { actionIds, updates } = req.body;

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      throw new ValidationError('Action IDs array is required');
    }

    const result = await Action.updateMany(
      { id: { $in: actionIds } },
      {
        ...updates,
        'metadata.lastModifiedBy': req.user!._id
      }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} actions by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} actions updated successfully`,
    });
  });

  static bulkDeleteActions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { actionIds } = req.body;

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      throw new ValidationError('Action IDs array is required');
    }

    const result = await Action.deleteMany({ id: { $in: actionIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} actions by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} actions deleted successfully`,
    });
  });
}