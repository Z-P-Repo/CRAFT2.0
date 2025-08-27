import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Policy, IPolicy } from '@/models/Policy';

export class PolicyController {
  // Get all policies with pagination and filtering
  static getPolicies = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      effect,
      status,
      createdBy,
      tags,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (effect) filter.effect = effect;
    if (status) filter.status = status;
    if (createdBy) filter['metadata.createdBy'] = createdBy;
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter['metadata.tags'] = { $in: tagArray };
    }

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'description', 'id']
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
    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Policy.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(policies, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get policy by ID
  static getPolicyById = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    const policy = await Policy.findOne({ id }).lean();

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  });

  // Create new policy
  static createPolicy = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const {
      id,
      name,
      description,
      effect,
      status,
      rules,
      subjects,
      resources,
      actions,
      conditions,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !effect) {
      throw new ValidationError('Name and effect are required');
    }

    logger.info(`Creating policy: ${name} with status: ${status || 'Draft'} by ${req.user?.email || 'system'}`);

    // Check if policy already exists (if id provided)
    if (id) {
      const existingPolicy = await Policy.findOne({ id });
      if (existingPolicy) {
        throw new ValidationError('Policy with this ID already exists');
      }
    }

    // Create policy
    const policyData = {
      ...(id && { id }),
      name: name.trim(),
      description: description?.trim(),
      effect,
      status: status || 'Draft',
      rules: rules || [],
      subjects: subjects || [],
      resources: resources || [],
      actions: actions || [],
      conditions: conditions || [],
      metadata: {
        createdBy: req.user?.email || 'system',
        lastModifiedBy: req.user?.email || 'system',
        tags: tags || [],
        version: '1.0.0',
        isSystem: false,
        isCustom: true,
      },
    };

    const policy = await Policy.create(policyData);

    logger.info(`Policy created: ${policy.id} by ${req.user?.email || 'system'}`);

    res.status(201).json({
      success: true,
      data: policy,
      message: 'Policy created successfully',
    });
  });

  // Update policy
  static updatePolicy = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    const existingPolicy = await Policy.findOne({ id });
    if (!existingPolicy) {
      throw new NotFoundError('Policy not found');
    }

    // Update metadata
    if (updates.metadata) {
      updates.metadata = { ...existingPolicy.metadata, ...updates.metadata };
    } else {
      updates.metadata = existingPolicy.metadata;
    }
    updates.metadata.lastModifiedBy = req.user?.email || 'system';

    const policy = await Policy.findByIdAndUpdate(
      existingPolicy._id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Policy updated: ${policy?.id} by ${req.user?.email || 'system'}`);

    res.status(200).json({
      success: true,
      data: policy,
      message: 'Policy updated successfully',
    });
  });

  // Delete policy
  static deletePolicy = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    const policy = await Policy.findOne({ id });
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    await Policy.findByIdAndDelete(policy._id);

    logger.info(`Policy deleted: ${policy.id} by ${req.user?.email || 'system'}`);

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully',
    });
  });

  // Evaluate policy
  static evaluatePolicy = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { policyId, subject, resource, action, environment } = req.body;

    if (!policyId || !subject || !resource || !action) {
      throw new ValidationError('Policy ID, subject, resource, and action are required');
    }

    const policy = await Policy.findOne({ id: policyId });
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    // Policy evaluation logic would go here
    // For now, return a mock result
    const evaluationResult = {
      decision: 'Allow', // This would be calculated based on policy rules
      policy: policy.id,
      subject,
      resource,
      action,
      environment,
      timestamp: new Date(),
      reason: 'Policy conditions satisfied',
    };

    res.status(200).json({
      success: true,
      data: evaluationResult,
    });
  });

  // Get policy statistics
  static getPolicyStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const stats = await Policy.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] }
          },
          allow: {
            $sum: { $cond: [{ $eq: ['$effect', 'Allow'] }, 1, 0] }
          },
          deny: {
            $sum: { $cond: [{ $eq: ['$effect', 'Deny'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          draft: 0,
          inactive: 0,
          allow: 0,
          deny: 0
        },
      },
    });
  });

  // Bulk operations
  static bulkUpdatePolicies = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { policyIds, updates } = req.body;

    if (!Array.isArray(policyIds) || policyIds.length === 0) {
      throw new ValidationError('Policy IDs array is required');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    const result = await Policy.updateMany(
      { id: { $in: policyIds } },
      { 
        ...updates,
        'metadata.lastModifiedBy': req.user?._id || 'system'
      },
      { runValidators: true }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} policies by ${req.user?.email || 'system'}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} policies updated successfully`,
    });
  });

  static bulkDeletePolicies = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { policyIds } = req.body;

    if (!Array.isArray(policyIds) || policyIds.length === 0) {
      throw new ValidationError('Policy IDs array is required');
    }

    const result = await Policy.deleteMany({ id: { $in: policyIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} policies by ${req.user?.email || 'system'}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} policies deleted successfully`,
    });
  });

  // Get policies by effect
  static getPoliciesByEffect = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { effect } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!effect) {
      throw new ValidationError('Effect parameter is required');
    }

    if (!['Allow', 'Deny'].includes(effect)) {
      throw new ValidationError('Effect must be either Allow or Deny');
    }

    const filter = { effect, status: 'Active' };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Policy.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(policies, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get policies by status
  static getPoliciesByStatus = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { status } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!status) {
      throw new ValidationError('Status parameter is required');
    }

    if (!['Active', 'Inactive', 'Draft'].includes(status)) {
      throw new ValidationError('Status must be Active, Inactive, or Draft');
    }

    const filter = { status };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Policy.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(policies, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });
}