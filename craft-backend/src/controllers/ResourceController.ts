import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Resource, IResource } from '@/models/Resource';
import { Policy } from '@/models/Policy';

export class ResourceController {
  // Get all resources with pagination and filtering
  static getResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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

    const user = req.user;
    const userRole = user?.role;

    // Build filter object
    const filter: any = {};

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        // User with no workspace assignments - no access
        filter.workspaceId = null; // This will return no results
      }
    }

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

    // Add policy count to each resource
    const resourcesWithPolicyCount = await Promise.all(
      resources.map(async (resource) => {
        const policiesUsingResource = await ResourceController.checkResourceUsageInPolicies(resource.id);
        return {
          ...resource,
          policyCount: policiesUsingResource.length,
          usedInPolicies: policiesUsingResource.map(p => ({ 
            id: p._id || p.id, 
            name: p.name, 
            displayName: p.displayName 
          }))
        };
      })
    );

    const result = PaginationHelper.buildPaginationResult(resourcesWithPolicyCount, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get resource by ID
  static getResourceById = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    let resource;

    // Apply workspace filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        const workspaceFilter = { workspaceId: { $in: assignedWorkspaces } };

        // Try to find by MongoDB _id first, then by custom id field (with workspace filtering)
        resource = await Resource.findOne({ _id: id, ...workspaceFilter }).lean();
        if (!resource) {
          resource = await Resource.findOne({ id, ...workspaceFilter }).lean();
        }
      } else {
        // User with no workspace assignments - no access
        resource = null;
      }
    } else {
      // Super admin users - no workspace filtering
      resource = await Resource.findById(id).lean();
      if (!resource) {
        resource = await Resource.findOne({ id }).lean();
      }
    }

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Add policy count to the resource
    const policiesUsingResource = await ResourceController.checkResourceUsageInPolicies(resource.id);
    const resourceWithPolicyCount = {
      ...resource,
      policyCount: policiesUsingResource.length,
      usedInPolicies: policiesUsingResource.map(p => ({ 
        id: p._id || p.id, 
        name: p.name, 
        displayName: p.displayName 
      }))
    };

    res.status(200).json({
      success: true,
      data: resourceWithPolicyCount,
    });
  });

  // Create new resource
  static createResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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
      workspaceId,
      applicationId,
      environmentId,
      metadata
    } = req.body;

    // Validate required fields
    if (!name || !type || !uri) {
      throw new ValidationError('Name, type, and URI are required');
    }

    // Validate workspace hierarchy fields (required by Resource model)
    if (!workspaceId) {
      throw new ValidationError('Workspace ID is required');
    }
    if (!applicationId) {
      throw new ValidationError('Application ID is required');
    }
    if (!environmentId) {
      throw new ValidationError('Environment ID is required');
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
      // Required workspace hierarchy fields
      workspaceId,
      applicationId,
      environmentId,
      permissions: {
        read: permissions?.read ?? true,
        write: permissions?.write ?? false,
        delete: permissions?.delete ?? false,
        execute: permissions?.execute ?? false,
        admin: permissions?.admin ?? false,
      },
      metadata: metadata || {
        owner: owner || req.user?.name || 'system',
        createdBy: req.user?.name || null,
        lastModifiedBy: req.user?.name || null,
        classification: classification || 'internal',
        tags: tags || [],
        externalId,
        mimeType,
        size,
        isSystem: false,
        isCustom: true,
        version: '1.0.0',
      },
      active: true,
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
  static updateResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    logger.info(`Resource updated: ${resource.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: resource,
      message: 'Resource updated successfully',
    });
  });

  // Delete resource
  static deleteResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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

    // Prevent deletion of system resources
    if (resource.metadata.isSystem) {
      throw new ValidationError('Cannot delete system resources');
    }

    // Check if resource has children
    if (resource.children && resource.children.length > 0) {
      throw new ValidationError('Cannot delete resource with children. Delete or reassign children first.');
    }

    // Check if resource is used in any policies
    console.log(`Attempting to delete resource: ${resource.displayName} (name: ${resource.name}, id: ${resource.id})`);
    const policiesUsingResource = await ResourceController.checkResourceUsageInPolicies(resource.id);
    console.log(`Checking resource usage for: ${resource.name} (id: ${resource.id}), found ${policiesUsingResource.length} policies`);
    if (policiesUsingResource.length > 0) {
      const policyCount = policiesUsingResource.length;
      
      throw new ValidationError(
        `Unable to delete "${resource.displayName}" - This resource is currently being used in ${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}`
      );
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
  static getResourceTree = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
  static getResourcesByType = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { type } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!type) {
      throw new ValidationError('Type parameter is required');
    }

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
  static getResourcesByClassification = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { classification } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!classification) {
      throw new ValidationError('Classification parameter is required');
    }

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
  static getResourceStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
  static bulkUpdateResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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

  static bulkDeleteResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      throw new ValidationError('Resource IDs array is required');
    }

    // Get resources to be deleted
    const resourcesToDelete = await Resource.find({ id: { $in: resourceIds } });

    // Prevent deletion of system resources
    const systemResources = resourcesToDelete.filter(resource => resource.metadata.isSystem);
    if (systemResources.length > 0) {
      const systemResourceNames = systemResources.map(resource => resource.displayName).join(', ');
      throw new ValidationError(`Cannot delete system resources: ${systemResourceNames}`);
    }

    // Check if any resources are used in policies
    const resourcesInUse: { resource: string; policies: string[] }[] = [];
    for (const resource of resourcesToDelete) {
      console.log(`Checking bulk delete for resource: ${resource.displayName} (name: ${resource.name}, id: ${resource.id})`);
      const policiesUsingResource = await ResourceController.checkResourceUsageInPolicies(resource.id);
      console.log(`Found ${policiesUsingResource.length} policies using resource: ${resource.name}`);
      if (policiesUsingResource.length > 0) {
        resourcesInUse.push({
          resource: resource.displayName,
          policies: policiesUsingResource.map(p => p.name)
        });
      }
    }

    if (resourcesInUse.length > 0) {
      const resourceCount = resourcesInUse.length;
      const totalPolicies = [...new Set(resourcesInUse.flatMap(usage => usage.policies))].length;
      
      throw new ValidationError(
        `Unable to delete ${resourceCount} ${resourceCount === 1 ? 'resource' : 'resources'} - ${resourceCount === 1 ? 'It is' : 'They are'} currently being used in ${totalPolicies} ${totalPolicies === 1 ? 'policy' : 'policies'}`
      );
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

  private static async checkResourceUsageInPolicies(resourceId: string): Promise<any[]> {
    // Search for policies that use this resource
    // We need to check both resources array and rules.object.type
    const policies = await Policy.find({
      $or: [
        { 'resources': resourceId },
        { 'rules.object.type': resourceId }
      ]
    }, 'id name displayName').lean();

    return policies;
  }
}