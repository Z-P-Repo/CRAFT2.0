import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Resource, IResource } from '@/models/Resource';

export class ResourceController {
  // Get all resources with pagination and filtering
  static getResources = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('GET /resources called with query:', req.query);
    
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      type,
      classification,
      active,
      parentId,
      owner,
      tags,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (classification) filter['metadata.classification'] = classification;
    if (active !== undefined) filter.active = active === 'true';
    if (parentId) filter.parentId = parentId;
    if (owner) filter['metadata.owner'] = owner;
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter['metadata.tags'] = { $in: tagArray };
    }

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'description', 'uri', 'id']
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
    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(resources, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get resource by ID
  static getResourceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Try to find by custom id first, then by MongoDB _id
    let resource = await Resource.findOne({ id }).lean();
    if (!resource) {
      resource = await Resource.findById(id).lean();
    }

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    res.status(200).json({
      success: true,
      data: resource,
    });
  });

  // Create new resource
  static createResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      name,
      displayName,
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
    if (!name || !type || !uri) {
      throw new ValidationError('Name, type, and URI are required');
    }

    // Check if resource already exists by name
    const existingResource = await Resource.findOne({ name });
    if (existingResource) {
      throw new ValidationError('Resource with this name already exists');
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Resource.findOne({ id: parentId });
      if (!parent) {
        throw new ValidationError('Parent resource not found');
      }
    }

    // Generate ID for the resource
    const resourceId = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create resource
    const resourceData = {
      id: resourceId,
      name: name.trim(),
      displayName: displayName?.trim() || name.trim(),
      type,
      uri: uri.trim(),
      description: description?.trim(),
      attributes: new Map(Object.entries(attributes || {})),
      parentId,
      children: [],
      permissions: {
        read: permissions?.read ?? true,
        write: permissions?.write ?? false,
        delete: permissions?.delete ?? false,
        execute: permissions?.execute ?? false,
        admin: permissions?.admin ?? false,
      },
      metadata: {
        owner: owner || req.user?.name || 'system',
        createdBy: req.user?.name || null,
        lastModifiedBy: req.user?.name || null,
        classification: classification || 'internal',
        tags: tags || [],
        externalId,
        mimeType,
        size,
      },
    };

    const resource = await Resource.create(resourceData);

    logger.info(`Resource created: ${resource.id} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully',
    });
  });

  // Update resource
  static updateResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    // Validate resource exists - try custom id first, then MongoDB _id
    let existingResource = await Resource.findOne({ id });
    if (!existingResource) {
      existingResource = await Resource.findById(id);
    }
    
    if (!existingResource) {
      throw new NotFoundError('Resource not found');
    }

    // Check permissions (only owner or admin can update) - skip for demo with optional auth
    if (req.user && existingResource.metadata.owner !== req.user.name && req.user.role !== 'admin') {
      throw new ValidationError('Insufficient permissions to update resource');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Validate parent if being updated
    if (updates.parentId) {
      if (updates.parentId === id) {
        throw new ValidationError('Resource cannot be its own parent');
      }

      const parent = await Resource.findOne({ id: updates.parentId });
      if (!parent) {
        throw new ValidationError('Parent resource not found');
      }
    }

    // Convert attributes to Map if provided
    if (updates.attributes) {
      updates.attributes = new Map(Object.entries(updates.attributes));
    }

    // Update metadata
    if (updates.metadata) {
      updates.metadata = { ...existingResource.metadata, ...updates.metadata };
    } else {
      updates.metadata = existingResource.metadata;
    }
    updates.metadata.lastModifiedBy = req.user?.name || null;

    const resource = await Resource.findByIdAndUpdate(
      existingResource._id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Resource updated: ${resource.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: resource,
      message: 'Resource updated successfully',
    });
  });

  // Delete resource
  static deleteResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Try to find by custom id first, then by MongoDB _id
    let resource = await Resource.findOne({ id });
    if (!resource) {
      resource = await Resource.findById(id);
    }
    
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Check permissions (only owner or admin can delete) - skip for demo with optional auth
    if (req.user && resource.metadata.owner !== req.user.name && req.user.role !== 'admin') {
      throw new ValidationError('Insufficient permissions to delete resource');
    }

    // Check if resource has children
    if (resource.children && resource.children.length > 0) {
      throw new ValidationError('Cannot delete resource with children. Delete or reassign children first.');
    }

    // Delete by MongoDB _id to ensure we delete the correct resource
    await Resource.findByIdAndDelete(resource._id);

    logger.info(`Resource deleted: ${resource.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  });

  // Get resource tree
  static getResourceTree = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rootId } = req.params;
    const { depth = 5, includePermissions = false } = req.query;

    const buildTree = async (resourceId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const selectFields = includePermissions === 'true' 
        ? 'id name type uri description permissions metadata.classification active parentId children'
        : 'id name type uri description metadata.classification active parentId children';

      const resource = await Resource.findOne({ id: resourceId })
        .populate('children', selectFields);

      if (!resource) return null;

      const result: any = {
        ...resource,
        childrenDetails: []
      };
      
      // Get children recursively
      if (resource.children && resource.children.length > 0) {
        const childrenPromises = resource.children.map(childId => 
          buildTree(childId, currentDepth - 1)
        );
        result.childrenDetails = (await Promise.all(childrenPromises))
          .filter(child => child !== null);
      }

      return result;
    };

    let tree;
    if (rootId === 'root' || !rootId) {
      // Get all root-level resources
      const rootResources = await Resource.find({ parentId: null })
        .populate('children', 'id name type uri description metadata.classification active')
        .lean();

      tree = {
        roots: rootResources,
        children: rootResources
      };
    } else {
      tree = await buildTree(rootId, Number(depth));
      if (!tree) {
        throw new NotFoundError('Resource not found');
      }
    }

    res.status(200).json({
      success: true,
      data: tree,
    });
  });

  // Get resources by type
  static getResourcesByType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    const validTypes = ['file', 'document', 'api', 'database', 'service', 'folder', 'application'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid resource type. Valid types: ${validTypes.join(', ')}`);
    }

    const filter = { type, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(resources, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get resources by classification
  static getResourcesByClassification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { classification } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    const validClassifications = ['public', 'internal', 'confidential', 'restricted'];
    if (!validClassifications.includes(classification)) {
      throw new ValidationError(`Invalid classification. Valid values: ${validClassifications.join(', ')}`);
    }

    const filter = { 'metadata.classification': classification, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(resources, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get resource statistics
  static getResourceStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await Resource.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
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

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, totalSize: 0 },
        byType: typeStats,
        byClassification: classificationStats,
      },
    });
  });

  // Bulk operations
  static bulkUpdateResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceIds, updates } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      throw new ValidationError('Resource IDs array is required');
    }

    const result = await Resource.updateMany(
      { id: { $in: resourceIds } },
      {
        ...updates,
        'metadata.lastModifiedBy': req.user?.name || null
      }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} resources by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} resources updated successfully`,
    });
  });

  static bulkDeleteResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      throw new ValidationError('Resource IDs array is required');
    }

    const result = await Resource.deleteMany({ id: { $in: resourceIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} resources by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} resources deleted successfully`,
    });
  });
}