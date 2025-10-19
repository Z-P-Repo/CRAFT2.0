import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError, ConflictError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import AdditionalResource, { IAdditionalResource, AdditionalResourceType } from '@/models/AdditionalResource';

export class AdditionalResourceController {
  // Get all additional resources with pagination, search, sort, and filtering
  static getAdditionalResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    logger.info('GET /additional-resources called with query:', req.query);

    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      type,
      active,
      priority,
      category,
      tags,
      owner,
      isSystem,
      workspaceId,
      applicationId,
      environmentId,
      sortBy = 'displayName',
      sortOrder = 'asc'
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
        filter.workspaceId = null;
      }
    }

    // Apply hierarchy filters if provided (but NOT for super_admin - they see all)
    if (userRole !== 'super_admin') {
      if (workspaceId) filter.workspaceId = workspaceId;
      if (applicationId) filter.applicationId = applicationId;
    }
    if (environmentId) filter.environmentId = environmentId;

    // Apply type and status filters
    if (type && type !== 'all') filter.type = type;
    if (active !== undefined && active !== 'all') {
      filter.active = active === 'true' || active === 'active';
    }

    // Apply metadata filters
    if (priority) filter['metadata.priority'] = priority;
    if (category) filter['metadata.category'] = category;
    if (owner) filter['metadata.owner'] = owner;
    if (isSystem !== undefined) filter['metadata.isSystem'] = isSystem === 'true';

    // Handle tags filter
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter['metadata.tags'] = { $in: tagsArray };
    }

    // Handle search functionality
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { displayName: searchRegex },
        { description: searchRegex },
        { 'metadata.tags': searchRegex }
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    const sortField = sortBy as string;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Map sort fields to actual schema fields
    switch (sortField) {
      case 'displayName':
      case 'name':
      case 'type':
      case 'active':
        sortOptions[sortField] = sortDirection;
        break;
      case 'created':
      case 'createdAt':
        sortOptions.createdAt = sortDirection;
        break;
      case 'updated':
      case 'updatedAt':
        sortOptions.updatedAt = sortDirection;
        break;
      case 'priority':
        sortOptions['metadata.priority'] = sortDirection;
        break;
      case 'owner':
        sortOptions['metadata.owner'] = sortDirection;
        break;
      default:
        sortOptions.displayName = 1; // Default sort
    }

    try {
      // Debug: Log the filter being applied and collection info
      logger.info('Filter being applied to AdditionalResource query:', JSON.stringify(filter, null, 2));
      logger.info('User details:', {
        userId: user?._id,
        role: userRole,
        assignedWorkspaces: user?.assignedWorkspaces
      });
      logger.info('Collection name being used:', AdditionalResource.collection.name);

      // Get total count for pagination
      const totalCount = await AdditionalResource.countDocuments(filter);
      logger.info(`AdditionalResource.countDocuments result: ${totalCount}`);

      // Debug: Test query without filters
      const totalCountNoFilter = await AdditionalResource.countDocuments({});
      logger.info(`Total additional resources in database (no filter): ${totalCountNoFilter}`);

      // Calculate skip for pagination
      const skip = (paginationOptions.page - 1) * paginationOptions.limit;

      // Get paginated results
      const additionalResources = await AdditionalResource.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean();

      // Calculate pagination metadata
      const paginationResult = PaginationHelper.buildPaginationResult(
        additionalResources,
        totalCount,
        paginationOptions
      );

      logger.info(`Found ${totalCount} additional resources, returning ${additionalResources.length} for page ${paginationOptions.page}`);

      res.json({
        success: true,
        data: paginationResult.data,
        pagination: paginationResult.pagination,
        filters: {
          search,
          type,
          active,
          priority,
          category,
          tags,
          owner,
          isSystem
        },
        sort: {
          sortBy: sortField,
          sortOrder
        }
      });
    } catch (error) {
      logger.error('Error fetching additional resources:', error);
      throw error;
    }
  });

  // Get additional resource by ID
  static getAdditionalResourceById = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`GET /additional-resources/${id} called by user:`, user?._id);

    // Build filter for workspace access control
    // Try both _id (MongoDB ObjectId) and id (custom string field)
    const filter: any = (id && Types.ObjectId.isValid(id))
      ? { _id: id }
      : { id: id };

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const additionalResource = await AdditionalResource.findOne(filter);

    if (!additionalResource) {
      throw new NotFoundError('Additional resource not found');
    }

    res.json({
      success: true,
      data: additionalResource
    });
  });

  // Create new additional resource
  static createAdditionalResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const user = req.user;
    logger.info('POST /additional-resources called by user:', user?._id);

    const {
      name,
      displayName,
      type,
      description,
      attributes = {},
      evaluationRules = [],
      dependencies,
      workspaceId,
      applicationId,
      environmentId,
      config = {},
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !type || !workspaceId || !applicationId || !environmentId) {
      throw new ValidationError('Name, display name, type, workspace ID, application ID, and environment ID are required');
    }

    // Validate type
    const validTypes: AdditionalResourceType[] = ['condition', 'state', 'approval', 'status', 'ticket'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Check for existing resource with same name in the same environment
    const existingResource = await AdditionalResource.findOne({
      $or: [
        { name: name.toLowerCase() },
        { id: name.toLowerCase() }
      ],
      environmentId
    });

    if (existingResource) {
      throw new ConflictError('Additional resource with this name already exists in this environment');
    }

    // Prepare resource data
    const resourceData = {
      id: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, ''),
      name: name.trim(),
      displayName: displayName.trim(),
      type,
      description: description?.trim(),
      attributes: new Map(Object.entries(attributes)),
      evaluationRules,
      dependencies,
      workspaceId,
      applicationId,
      environmentId,
      config: new Map(Object.entries(config)),
      metadata: {
        owner: user?.name || user?.email || 'system',
        createdBy: user?.name || user?.email || 'system',
        lastModifiedBy: user?.name || user?.email || 'system',
        tags: metadata.tags || [],
        category: metadata.category,
        priority: metadata.priority || 'medium',
        isSystem: metadata.isSystem || false,
        isTemplate: metadata.isTemplate || false,
        version: metadata.version || '1.0.0',
        externalId: metadata.externalId
      },
      active: true,
      evaluationCount: 0
    };

    try {
      const additionalResource = new AdditionalResource(resourceData);
      const savedResource = await additionalResource.save();

      logger.info(`Additional resource created: ${savedResource.id} by user: ${user?._id}`);

      res.status(201).json({
        success: true,
        data: savedResource,
        message: 'Additional resource created successfully'
      });
    } catch (error: any) {
      logger.error('Error creating additional resource:', error);

      if (error.code === 11000) {
        throw new ConflictError('Additional resource with this name already exists');
      }

      throw new ValidationError(error.message || 'Failed to create additional resource');
    }
  });

  // Update additional resource
  static updateAdditionalResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`PUT /additional-resources/${id} called by user:`, user?._id);

    // Build filter for workspace access control
    // Try both _id (MongoDB ObjectId) and id (custom string field)
    const filter: any = (id && Types.ObjectId.isValid(id))
      ? { _id: id }
      : { id: id };

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const existingResource = await AdditionalResource.findOne(filter);

    if (!existingResource) {
      throw new NotFoundError('Additional resource not found');
    }

    const {
      displayName,
      description,
      attributes,
      evaluationRules,
      dependencies,
      config,
      metadata = {},
      active
    } = req.body;

    // Prepare update data
    const updateData: any = {
      'metadata.lastModifiedBy': user?.name || user?.email || 'system'
    };

    if (displayName) updateData.displayName = displayName.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (attributes) updateData.attributes = new Map(Object.entries(attributes));
    if (evaluationRules) updateData.evaluationRules = evaluationRules;
    if (dependencies) updateData.dependencies = dependencies;
    if (config) updateData.config = new Map(Object.entries(config));
    if (active !== undefined) updateData.active = active;

    // Update metadata fields if provided
    if (metadata.tags) updateData['metadata.tags'] = metadata.tags;
    if (metadata.category) updateData['metadata.category'] = metadata.category;
    if (metadata.priority) updateData['metadata.priority'] = metadata.priority;
    if (metadata.version) updateData['metadata.version'] = metadata.version;
    if (metadata.externalId) updateData['metadata.externalId'] = metadata.externalId;

    try {
      const updatedResource = await AdditionalResource.findOneAndUpdate(
        filter,
        updateData,
        { new: true, runValidators: true }
      );

      logger.info(`Additional resource updated: ${id} by user: ${user?._id}`);

      res.json({
        success: true,
        data: updatedResource,
        message: 'Additional resource updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating additional resource:', error);
      throw new ValidationError(error.message || 'Failed to update additional resource');
    }
  });

  // Update additional resource attributes (PATCH endpoint for attribute management)
  static updateAdditionalResourceAttributes = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`PATCH /additional-resources/${id}/attributes called by user:`, user?._id);

    // Build filter for workspace access control
    // Try both _id (MongoDB ObjectId) and id (custom string field)
    const filter: any = (id && Types.ObjectId.isValid(id))
      ? { _id: id }
      : { id: id };

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const existingResource = await AdditionalResource.findOne(filter);

    if (!existingResource) {
      throw new NotFoundError('Additional resource not found');
    }

    const { attributes, operation = 'merge' } = req.body;

    if (!attributes || typeof attributes !== 'object') {
      throw new ValidationError('Attributes object is required');
    }

    try {
      let updatedAttributes: Map<string, any>;

      // Handle different operations
      switch (operation) {
        case 'replace':
          // Replace all attributes
          updatedAttributes = new Map(Object.entries(attributes));
          break;

        case 'merge':
        default:
          // Merge new attributes with existing ones
          updatedAttributes = new Map(existingResource.attributes || new Map());
          Object.entries(attributes).forEach(([key, value]) => {
            if (value === null || value === undefined) {
              // Remove attribute if value is null/undefined
              updatedAttributes.delete(key);
            } else {
              // Add or update attribute
              updatedAttributes.set(key, value);
            }
          });
          break;
      }

      // Update the resource with new attributes
      const updatedResource = await AdditionalResource.findOneAndUpdate(
        filter,
        {
          attributes: updatedAttributes,
          'metadata.lastModifiedBy': user?.name || user?.email || 'system'
        },
        { new: true, runValidators: true }
      );

      logger.info(`Additional resource attributes updated: ${id} by user: ${user?._id}`);

      res.json({
        success: true,
        data: updatedResource,
        message: 'Additional resource attributes updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating additional resource attributes:', error);
      throw new ValidationError(error.message || 'Failed to update additional resource attributes');
    }
  });

  // Delete additional resource
  static deleteAdditionalResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`DELETE /additional-resources/${id} called by user:`, user?._id);

    // Build filter for workspace access control
    // Try both _id (MongoDB ObjectId) and id (custom string field)
    const filter: any = (id && Types.ObjectId.isValid(id))
      ? { _id: id }
      : { id: id };

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const additionalResource = await AdditionalResource.findOne(filter);

    if (!additionalResource) {
      throw new NotFoundError('Additional resource not found');
    }

    // Check if resource is being used in policies (future enhancement)
    // const policiesUsingResource = await Policy.find({
    //   'rules.additionalResources': id
    // });

    // if (policiesUsingResource.length > 0) {
    //   throw new ConflictError('Cannot delete additional resource that is being used in active policies');
    // }

    await AdditionalResource.findOneAndDelete(filter);

    logger.info(`Additional resource deleted: ${id} by user: ${user?._id}`);

    res.json({
      success: true,
      message: 'Additional resource deleted successfully'
    });
  });

  // Bulk delete additional resources
  static bulkDeleteAdditionalResources = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { ids } = req.body;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`POST /additional-resources/bulk-delete called by user: ${user?._id} with ids:`, ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('IDs array is required and must not be empty');
    }

    // Separate ObjectIds and custom IDs
    const objectIds = ids.filter(id => Types.ObjectId.isValid(id));
    const customIds = ids.filter(id => !Types.ObjectId.isValid(id));

    // Build filter for workspace access control
    const filter: any = {
      $or: []
    };

    if (objectIds.length > 0) {
      filter.$or.push({ _id: { $in: objectIds } });
    }
    if (customIds.length > 0) {
      filter.$or.push({ id: { $in: customIds } });
    }

    // If no valid IDs, return error
    if (filter.$or.length === 0) {
      throw new ValidationError('No valid IDs provided');
    }

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    // Check which resources exist and user has access to
    const existingResources = await AdditionalResource.find(filter);

    if (existingResources.length === 0) {
      throw new NotFoundError('No accessible additional resources found with provided IDs');
    }

    // Get the IDs to delete (using _id for actual deletion)
    const idsToDelete = existingResources.map(resource => resource._id);

    // Delete the resources
    const deleteResult = await AdditionalResource.deleteMany({
      _id: { $in: idsToDelete }
    });

    logger.info(`Bulk deleted ${deleteResult.deletedCount} additional resources by user: ${user?._id}`);

    res.json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        requestedIds: ids.length,
        deletedIds: idsToDelete.map(id => id.toString())
      },
      message: `Successfully deleted ${deleteResult.deletedCount} additional resource(s)`
    });
  });

  // Get additional resources by type
  static getAdditionalResourcesByType = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { type } = req.params;
    const { environmentId } = req.query;
    const user = req.user;
    const userRole = user?.role;

    logger.info(`GET /additional-resources/type/${type} called by user:`, user?._id);

    // Validate type
    const validTypes: AdditionalResourceType[] = ['condition', 'state', 'approval', 'status', 'ticket'];
    if (!validTypes.includes(type as AdditionalResourceType)) {
      throw new ValidationError(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Build filter
    const filter: any = {
      type,
      active: true
    };

    if (environmentId) {
      filter.environmentId = environmentId;
    }

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const resources = await AdditionalResource.find(filter)
      .sort({ displayName: 1 })
      .lean();

    res.json({
      success: true,
      data: resources,
      count: resources.length
    });
  });

  // Evaluate additional resource
  static evaluateAdditionalResource = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const { context = {} } = req.body;
    const user = req.user;

    logger.info(`POST /additional-resources/${id}/evaluate called by user:`, user?._id);

    const additionalResource = await AdditionalResource.findById(id);

    if (!additionalResource) {
      throw new NotFoundError('Additional resource not found');
    }

    try {
      const result = (additionalResource as any).evaluate(context);

      // Save the updated evaluation count
      await additionalResource.save();

      res.json({
        success: true,
        data: {
          resourceId: id,
          resourceName: additionalResource.displayName,
          evaluationResult: result,
          evaluationContext: context,
          evaluationCount: additionalResource.evaluationCount,
          lastEvaluatedAt: additionalResource.lastEvaluatedAt
        }
      });
    } catch (error: any) {
      logger.error('Error evaluating additional resource:', error);
      throw new ValidationError(error.message || 'Failed to evaluate additional resource');
    }
  });

  // Get additional resource statistics
  static getAdditionalResourceStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { workspaceId, applicationId, environmentId } = req.query;
    const user = req.user;
    const userRole = user?.role;

    logger.info('GET /additional-resources/stats called by user:', user?._id);

    // Build filter
    const filter: any = {};

    if (workspaceId) filter.workspaceId = workspaceId;
    if (applicationId) filter.applicationId = applicationId;
    if (environmentId) filter.environmentId = environmentId;

    // Apply workspace-based filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        filter.workspaceId = { $in: assignedWorkspaces };
      } else {
        filter.workspaceId = null;
      }
    }

    const [
      totalCount,
      activeCount,
      inactiveCount,
      typeStats,
      priorityStats
    ] = await Promise.all([
      AdditionalResource.countDocuments(filter),
      AdditionalResource.countDocuments({ ...filter, active: true }),
      AdditionalResource.countDocuments({ ...filter, active: false }),
      AdditionalResource.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      AdditionalResource.aggregate([
        { $match: filter },
        { $group: { _id: '$metadata.priority', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        byType: typeStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  });
}

export default AdditionalResourceController;