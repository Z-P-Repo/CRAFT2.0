import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Subject, ISubject } from '@/models/Subject';
import { Policy } from '@/models/Policy';

export class SubjectController {
  // Get all subjects with pagination and filtering
  static getSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      type,
      status,
      department,
      role,
      active,
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
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'displayName', 'email', 'description', 'id', 'department', 'role']
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
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Subject.countDocuments(filter)
    ]);

    // Add policy count to each subject
    const subjectsWithPolicyCount = await Promise.all(
      subjects.map(async (subject) => {
        const policiesUsingSubject = await SubjectController.checkSubjectUsageInPolicies(subject.id);
        return {
          ...subject,
          policyCount: policiesUsingSubject.length,
          usedInPolicies: policiesUsingSubject.map(p => ({ 
            id: p._id || p.id, 
            name: p.name, 
            displayName: p.displayName 
          }))
        };
      })
    );

    const result = PaginationHelper.buildPaginationResult(subjectsWithPolicyCount, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get subject by ID
  static getSubjectById = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role;

    let subject;

    // Apply workspace filtering for basic and admin users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedWorkspaces = user?.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        const workspaceFilter = { workspaceId: { $in: assignedWorkspaces } };

        // Try to find by MongoDB _id first, then by custom id field (with workspace filtering)
        subject = await Subject.findOne({ _id: id, ...workspaceFilter }).lean();
        if (!subject) {
          subject = await Subject.findOne({ id, ...workspaceFilter }).lean();
        }
      } else {
        // User with no workspace assignments - no access
        subject = null;
      }
    } else {
      // Super admin users - no workspace filtering
      subject = await Subject.findById(id).lean();
      if (!subject) {
        subject = await Subject.findOne({ id }).lean();
      }
    }

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    // Add policy count to the subject
    const policiesUsingSubject = await SubjectController.checkSubjectUsageInPolicies(subject.name || subject.id);
    const subjectWithPolicyCount = {
      ...subject,
      policyCount: policiesUsingSubject.length,
      usedInPolicies: policiesUsingSubject.map(p => ({ 
        id: p._id || p.id, 
        name: p.name, 
        displayName: p.displayName 
      }))
    };

    res.status(200).json({
      success: true,
      data: subjectWithPolicyCount,
    });
  });

  // Create new subject
  static createSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const {
      id,
      name,
      displayName,
      email,
      type,
      role,
      department,
      description,
      status,
      permissions,
      createdBy,
      workspaceId,
      applicationId,
      environmentId,
    } = req.body;

    // Validate required fields
    if (!displayName) {
      throw new ValidationError('Display name is required');
    }
    
    if (!workspaceId) {
      throw new ValidationError('Workspace ID is required');
    }
    
    if (!applicationId) {
      throw new ValidationError('Application ID is required');
    }
    
    if (!environmentId) {
      throw new ValidationError('Environment ID is required');
    }

    // Check if subject already exists (by displayName or email if provided)
    const existingSubject = await Subject.findOne({
      $or: [
        { displayName },
        ...(email ? [{ email }] : [])
      ]
    });
    if (existingSubject) {
      throw new ValidationError('Subject with this display name or email already exists');
    }

    // Create subject
    const subjectData = {
      id: id || `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || displayName.toLowerCase().replace(/\s+/g, ''),
      displayName: displayName.trim(),
      email: email?.trim().toLowerCase(),
      type,
      role: role?.trim(),
      department: department?.trim(),
      description: description?.trim(),
      status: status || 'active',
      permissions: permissions || [],
      // Required hierarchy IDs
      workspaceId,
      applicationId,
      environmentId,
      metadata: {
        createdBy: createdBy || req.user?.name || null,
        lastModifiedBy: req.user?.name || null,
        tags: [],
        isSystem: false,
        isCustom: true,
        version: '1.0.0',
      },
    };

    const subject = await Subject.create(subjectData);

    logger.info(`Subject created: ${subject.id} by ${req.user?.email || 'anonymous'}`);

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  });

  // Update subject
  static updateSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
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
    updates.metadata.lastModifiedBy = req.user?.name || null;

    const subject = await Subject.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    logger.info(`Subject updated: ${subject.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  });

  // Delete subject
  static deleteSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    // Try to find by MongoDB _id first, then by custom id field
    let subject = await Subject.findById(id);
    if (!subject) {
      subject = await Subject.findOne({ id });
    }
    
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    // Prevent deletion of system subjects
    if (subject.metadata.isSystem) {
      throw new ValidationError('Cannot delete system subjects');
    }

    // Check if subject is used in any policies
    console.log(`Attempting to delete subject: ${subject.displayName} (name: ${subject.name}, id: ${subject.id})`);
    const policiesUsingSubject = await SubjectController.checkSubjectUsageInPolicies(subject.id);
    if (policiesUsingSubject.length > 0) {
      const policyCount = policiesUsingSubject.length;
      
      throw new ValidationError(
        `Unable to delete "${subject.displayName}" - This subject is currently being used in ${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}`
      );
    }

    await Subject.findByIdAndDelete(subject._id);

    logger.info(`Subject deleted: ${subject.id} (MongoDB ID: ${subject._id}) by ${req.user?.email || 'anonymous'}`);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  });

  // Get subject hierarchy
  static getSubjectHierarchy = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { depth = 3 } = req.query;

    if (!id) {
      throw new ValidationError('Subject ID parameter is required');
    }

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

    const hierarchy = await buildHierarchy(id, Number(depth || '3'));

    if (!hierarchy) {
      throw new NotFoundError('Subject not found');
    }

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  });

  // Get subjects by type
  static getSubjectsByType = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { type } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!type) {
      throw new ValidationError('Type parameter is required');
    }

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
  static getSubjectStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
  static bulkUpdateSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { subjectIds, updates } = req.body;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new ValidationError('Subject IDs array is required');
    }

    const result = await Subject.updateMany(
      { id: { $in: subjectIds } },
      {
        ...updates,
        'metadata.lastModifiedBy': req.user?.name || null
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

  static bulkDeleteSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { subjectIds } = req.body;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new ValidationError('Subject IDs array is required');
    }

    // Get subjects to be deleted
    const subjectsToDelete = await Subject.find({ id: { $in: subjectIds } });

    // Prevent deletion of system subjects
    const systemSubjects = subjectsToDelete.filter(subject => subject.metadata.isSystem);
    if (systemSubjects.length > 0) {
      const systemSubjectNames = systemSubjects.map(subject => subject.displayName).join(', ');
      throw new ValidationError(`Cannot delete system subjects: ${systemSubjectNames}`);
    }

    // Check if any subjects are used in policies
    const subjectsInUse: { subject: string; policies: string[] }[] = [];
    for (const subject of subjectsToDelete) {
      const policiesUsingSubject = await SubjectController.checkSubjectUsageInPolicies(subject.id);
      if (policiesUsingSubject.length > 0) {
        subjectsInUse.push({
          subject: subject.displayName,
          policies: policiesUsingSubject.map(p => p.name)
        });
      }
    }

    if (subjectsInUse.length > 0) {
      const subjectCount = subjectsInUse.length;
      const totalPolicies = [...new Set(subjectsInUse.flatMap(usage => usage.policies))].length;
      
      throw new ValidationError(
        `Unable to delete ${subjectCount} ${subjectCount === 1 ? 'subject' : 'subjects'} - ${subjectCount === 1 ? 'It is' : 'They are'} currently being used in ${totalPolicies} ${totalPolicies === 1 ? 'policy' : 'policies'}`
      );
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

  private static async checkSubjectUsageInPolicies(subjectId: string): Promise<any[]> {
    // Search for policies that use this subject
    // We need to check both subjects array and rules.subject.type
    const policies = await Policy.find({
      $or: [
        { 'subjects': subjectId },
        { 'rules.subject.type': subjectId }
      ]
    }, 'id name displayName').lean();

    return policies;
  }
}