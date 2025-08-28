import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Action, IAction } from '@/models/Action';
import { Policy } from '@/models/Policy';

export class ActionController {
  // Get all actions with pagination and filtering
  static getActions = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    logger.info('GET /actions called with query:', req.query);
    
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      category,
      riskLevel,
      active,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (category) filter.category = category;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (active !== undefined) filter.active = active === 'true';

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'displayName', 'description', 'category']
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
  static getActionById = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    // Try to find by custom id first, then by MongoDB _id
    let action = await Action.findOne({ id }).lean();
    if (!action) {
      action = await Action.findById(id).lean();
    }

    if (!action) {
      throw new NotFoundError('Action not found');
    }

    res.status(200).json({
      success: true,
      data: action,
    });
  });

  // Create new action
  static createAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const {
      name,
      displayName,
      description,
      category,
      httpMethod,
      endpoint,
      riskLevel,
      active,
    } = req.body;

    // Validate required fields
    if (!displayName || !name || !category || !riskLevel) {
      throw new ValidationError('Display name, name, category, and risk level are required');
    }

    // Check if action already exists by name
    const existingAction = await Action.findOne({ name });
    if (existingAction) {
      throw new ValidationError('Action with this name already exists');
    }

    // Generate ID for the action
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create action
    const actionData = {
      id: actionId,
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim(),
      category,
      httpMethod: httpMethod?.trim(),
      endpoint: endpoint?.trim(),
      riskLevel,
      active: active !== undefined ? active : true,
      metadata: {
        owner: req.user?.name || 'system',
        createdBy: req.user?.name || null,
        lastModifiedBy: req.user?.name || null,
        tags: [],
        isSystem: false,
        isCustom: true,
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
  static updateAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const updates = req.body;

    // Validate action exists - try custom id first, then MongoDB _id
    let existingAction = await Action.findOne({ id });
    if (!existingAction) {
      existingAction = await Action.findById(id);
    }
    
    if (!existingAction) {
      throw new NotFoundError('Action not found');
    }

    // Check permissions (only owner or admin can update) - skip for demo with optional auth
    if (req.user && existingAction.metadata.owner !== req.user.name && req.user.role !== 'admin') {
      throw new ValidationError('Insufficient permissions to update action');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Update metadata
    if (updates.metadata) {
      updates.metadata = { ...existingAction.metadata, ...updates.metadata };
    } else {
      updates.metadata = existingAction.metadata;
    }
    updates.metadata.lastModifiedBy = req.user?.name || null;

    const action = await Action.findByIdAndUpdate(
      existingAction._id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Action updated: ${action!.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: action,
      message: 'Action updated successfully',
    });
  });

  // Delete action
  static deleteAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    // Try to find by custom id first, then by MongoDB _id
    let action = await Action.findOne({ id });
    if (!action) {
      action = await Action.findById(id);
    }
    
    if (!action) {
      throw new NotFoundError('Action not found');
    }

    // Check permissions (only owner or admin can delete) - skip for demo with optional auth
    if (req.user && action.metadata.owner !== req.user.name && req.user.role !== 'admin') {
      throw new ValidationError('Insufficient permissions to delete action');
    }

    // Prevent deletion of system actions
    if (action.metadata.isSystem) {
      throw new ValidationError('Cannot delete system actions');
    }

    // Check if action is used in any policies
    const policiesUsingAction = await ActionController.checkActionUsageInPolicies(action.name);
    if (policiesUsingAction.length > 0) {
      const policyCount = policiesUsingAction.length;
      
      throw new ValidationError(
        `Unable to delete "${action.displayName}" - This action is currently being used in ${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}`
      );
    }

    // Delete by MongoDB _id to ensure we delete the correct action
    await Action.findByIdAndDelete(action._id);

    logger.info(`Action deleted: ${action.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'Action deleted successfully',
    });
  });

  // Get actions by resource type
  static getActionsByResourceType = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
  static getActionsByCategory = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { category } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!category) {
      throw new ValidationError('Category parameter is required');
    }

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
  static getActionsByRiskLevel = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { riskLevel } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!riskLevel) {
      throw new ValidationError('Risk level parameter is required');
    }

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
  static getActionHierarchy = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    if (!id) {
      throw new ValidationError('Action ID parameter is required');
    }

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
  static getActionStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
  static bulkUpdateActions = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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

  static bulkDeleteActions = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { actionIds } = req.body;

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      throw new ValidationError('Action IDs array is required');
    }

    // Get actions to be deleted
    const actionsToDelete = await Action.find({ id: { $in: actionIds } });

    // Prevent deletion of system actions
    const systemActions = actionsToDelete.filter(action => action.metadata.isSystem);
    if (systemActions.length > 0) {
      const systemActionNames = systemActions.map(action => action.displayName).join(', ');
      throw new ValidationError(`Cannot delete system actions: ${systemActionNames}`);
    }

    // Check if any actions are used in policies
    const actionsInUse: { action: string; policies: string[] }[] = [];
    for (const action of actionsToDelete) {
      const policiesUsingAction = await ActionController.checkActionUsageInPolicies(action.name);
      if (policiesUsingAction.length > 0) {
        actionsInUse.push({
          action: action.displayName,
          policies: policiesUsingAction.map(p => p.name)
        });
      }
    }

    if (actionsInUse.length > 0) {
      const actionCount = actionsInUse.length;
      const totalPolicies = [...new Set(actionsInUse.flatMap(usage => usage.policies))].length;
      
      throw new ValidationError(
        `Unable to delete ${actionCount} ${actionCount === 1 ? 'action' : 'actions'} - ${actionCount === 1 ? 'It is' : 'They are'} currently being used in ${totalPolicies} ${totalPolicies === 1 ? 'policy' : 'policies'}`
      );
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

  private static async checkActionUsageInPolicies(actionName: string): Promise<any[]> {
    // Search for policies that use this action
    // We need to check both actions array and rules.action.name
    const policies = await Policy.find({
      $or: [
        { 'actions': actionName },
        { 'rules.action.name': actionName }
      ]
    }, 'id name displayName').lean();

    return policies;
  }
}