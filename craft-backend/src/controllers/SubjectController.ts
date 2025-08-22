import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';

// Subject interface (would be replaced with actual Mongoose model)
interface ISubject {
  _id: string;
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

// Placeholder Subject model
const Subject = {
  find: (filter: any) => ({
    populate: (path: string, select?: string) => ({
      sort: (sort: any) => ({
        skip: (skip: number) => ({
          limit: (limit: number) => ({
            lean: () => Promise.resolve([] as ISubject[])
          })
        })
      })
    })
  }),
  countDocuments: (filter: any) => Promise.resolve(0),
  findOne: (filter: any) => ({
    populate: (path: string, select?: string) => ({
      lean: () => Promise.resolve(null as ISubject | null)
    })
  }),
  create: (data: any) => Promise.resolve({} as ISubject),
  findOneAndUpdate: (filter: any, updates: any, options: any) => ({
    populate: (path: string, select?: string) => Promise.resolve(null as ISubject | null)
  }),
  findOneAndDelete: (filter: any) => Promise.resolve(null as ISubject | null),
  updateMany: (filter: any, updates: any) => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
  deleteMany: (filter: any) => Promise.resolve({ deletedCount: 0 }),
  aggregate: (pipeline: any[]) => Promise.resolve([])
};

export class SubjectController {
  // Get all subjects with pagination and filtering
  static getSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      type,
      active,
      parentId,
      tags,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (active !== undefined) filter.active = active === 'true';
    if (parentId) filter.parentId = parentId;
    
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
    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .populate('parentId', 'id name type')
        .populate('children', 'id name type')
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Subject.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(subjects, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get subject by ID
  static getSubjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const subject = await Subject.findOne({ id })
      .populate('parentId', 'id name type')
      .populate('children', 'id name type')
      .lean();

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  });

  // Create new subject
  static createSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
      throw new ValidationError('ID, name, and type are required');
    }

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ id });
    if (existingSubject) {
      throw new ValidationError('Subject with this ID already exists');
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await Subject.findOne({ id: parentId });
      if (!parent) {
        throw new ValidationError('Parent subject not found');
      }
    }

    // Create subject
    const subjectData = {
      id,
      name: name.trim(),
      type,
      description: description?.trim(),
      attributes: new Map(Object.entries(attributes || {})),
      parentId,
      children: [],
      metadata: {
        createdBy: req.user!._id,
        lastModifiedBy: req.user!._id,
        tags: tags || [],
        externalId,
      },
    };

    const subject = await Subject.create(subjectData);

    logger.info(`Subject created: ${subject.id} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  });

  // Update subject
  static updateSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    // Validate subject exists
    const existingSubject = await Subject.findOne({ id });
    if (!existingSubject) {
      throw new NotFoundError('Subject not found');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Validate parent if being updated
    if (updates.parentId) {
      if (updates.parentId === id) {
        throw new ValidationError('Subject cannot be its own parent');
      }

      const parent = await Subject.findOne({ id: updates.parentId });
      if (!parent) {
        throw new ValidationError('Parent subject not found');
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
    updates.metadata.lastModifiedBy = req.user!._id;

    const subject = await Subject.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    )
      .populate('parentId', 'id name type')
      .populate('children', 'id name type');

    logger.info(`Subject updated: ${subject.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  });

  // Delete subject
  static deleteSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const subject = await Subject.findOne({ id });
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    // Check if subject has children
    if (subject.children && subject.children.length > 0) {
      throw new ValidationError('Cannot delete subject with children. Delete or reassign children first.');
    }

    await Subject.findOneAndDelete({ id });

    logger.info(`Subject deleted: ${subject.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  });

  // Get subject hierarchy
  static getSubjectHierarchy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    const buildHierarchy = async (subjectId: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;

      const subject = await Subject.findOne({ id: subjectId })
        .populate('children', 'id name type active');

      if (!subject) return null;

      const result: any = {
        ...subject,
        childrenDetails: []
      };
      
      // Get children recursively
      if (subject.children && subject.children.length > 0) {
        const childrenPromises = subject.children.map(childId => 
          buildHierarchy(childId, currentDepth - 1)
        );
        result.childrenDetails = (await Promise.all(childrenPromises))
          .filter(child => child !== null);
      }

      return result;
    };

    const hierarchy = await buildHierarchy(id, Number(depth));

    if (!hierarchy) {
      throw new NotFoundError('Subject not found');
    }

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  });

  // Get subjects by type
  static getSubjectsByType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!['user', 'group', 'role', 'service', 'device'].includes(type)) {
      throw new ValidationError('Invalid subject type');
    }

    const filter = { type, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Subject.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(subjects, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get subject statistics
  static getSubjectStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await Subject.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          users: {
            $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] }
          },
          groups: {
            $sum: { $cond: [{ $eq: ['$type', 'group'] }, 1, 0] }
          },
          roles: {
            $sum: { $cond: [{ $eq: ['$type', 'role'] }, 1, 0] }
          },
          services: {
            $sum: { $cond: [{ $eq: ['$type', 'service'] }, 1, 0] }
          },
          devices: {
            $sum: { $cond: [{ $eq: ['$type', 'device'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        total: 0,
        active: 0,
        users: 0,
        groups: 0,
        roles: 0,
        services: 0,
        devices: 0
      },
    });
  });

  // Bulk operations
  static bulkUpdateSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { subjectIds, updates } = req.body;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new ValidationError('Subject IDs array is required');
    }

    const result = await Subject.updateMany(
      { id: { $in: subjectIds } },
      {
        ...updates,
        'metadata.lastModifiedBy': req.user!._id
      }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} subjects by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} subjects updated successfully`,
    });
  });

  static bulkDeleteSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { subjectIds } = req.body;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new ValidationError('Subject IDs array is required');
    }

    const result = await Subject.deleteMany({ id: { $in: subjectIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} subjects by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} subjects deleted successfully`,
    });
  });
}