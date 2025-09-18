import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Environment, IEnvironment } from '../models/Environment';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { requireAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router({ mergeParams: true });

// Helper function to generate valid environment name from display name
function generateValidEnvName(displayName: string, originalName?: string): string {
  // If original name exists and is valid, use it
  if (originalName && originalName.length >= 2 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(originalName)) {
    return originalName;
  }
  
  // Generate environment name from display name
  let envName = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''); // Remove leading/trailing invalid chars
  
  // Ensure minimum length
  if (envName.length < 2) {
    envName = 'env-' + Date.now().toString().slice(-4);
  }
  
  // Ensure it starts and ends with alphanumeric
  if (!/^[a-z0-9]/.test(envName)) {
    envName = 'env-' + envName;
  }
  if (!/[a-z0-9]$/.test(envName)) {
    envName = envName + '-env';
  }
  
  return envName;
}

// Validation middleware
const validateEnvironment = [
  body('displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('type')
    .isIn(['development', 'testing', 'staging', 'production', 'preview', 'hotfix'])
    .withMessage('Invalid environment type'),
  // We don't validate 'name' directly anymore since it's auto-generated from displayName
];

const validateIds = [
  param('workspaceId').isMongoId().withMessage('Invalid workspace ID'),
  param('applicationId').isMongoId().withMessage('Invalid application ID'),
  param('environmentId').optional().isMongoId().withMessage('Invalid environment ID')
];

// GET /api/workspaces/:workspaceId/applications/:applicationId/environments
router.get('/', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId } = req.params;

    if (!applicationId) {
      return void res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }
    const { page = 1, limit = 10, search, type, status = 'all' } = req.query;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const user = (req as any).user;

    // Verify workspace access - include basic users with assigned workspaces
    let workspaceQuery: any = {
      _id: workspaceId,
      active: true
    };

    if (userRole === 'basic' || userRole === 'admin') {
      // Admin and basic users can only access workspaces they're assigned to
      const assignedWorkspaces = user.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        // Check if the requested workspace is in their assigned workspaces
        if (!assignedWorkspaces.some((assignedId: string) => assignedId.toString() === workspaceId?.toString())) {
          return void res.status(404).json({
            success: false,
            error: 'Workspace not found'
          });
        }
        // Keep the original workspace query since we've already validated access
      } else {
        // User with no assigned workspaces - no access
        return void res.status(404).json({
          success: false,
          error: 'Workspace not found'
        });
      }
    } else {
      // Super admin users - only owner/admin access
      workspaceQuery.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
    }

    const workspace = await Workspace.findOne(workspaceQuery);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Verify application access - include basic users with assigned applications
    let applicationQuery: any = {
      _id: applicationId,
      workspaceId,
      active: true
    };

    if (userRole === 'basic') {
      // Basic users can only access applications they're assigned to
      const assignedApplications = user.assignedApplications || [];
      if (assignedApplications.length > 0) {
        // Check if this specific applicationId is in their assignments
        if (!assignedApplications.some((appId: string) => appId.toString() === applicationId.toString())) {
          return void res.status(404).json({
            success: false,
            error: 'Application not found'
          });
        }
        // Update query to only include assigned applications
        applicationQuery._id = { $in: assignedApplications };
      } else {
        // Basic user with no assigned applications - no access
        return void res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }
    }

    const application = await Application.findOne(applicationQuery);

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const query: any = { workspaceId, applicationId };

    if (status !== 'all') {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const environments = await Environment.find(query)
      .populate(['policiesCount', 'subjectsCount', 'resourcesCount'])
      .populate('metadata.createdBy', 'firstName lastName email')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('metadata.owner', 'firstName lastName email')
      .sort({ 'metadata.isDefault': -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Environment.countDocuments(query);

    const response: PaginatedResponse<IEnvironment> = {
      success: true,
      data: environments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environments'
    });
  }
});

// POST /api/workspaces/:workspaceId/applications/:applicationId/environments
router.post('/', requireAuth, validateIds, validateEnvironment, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId, applicationId } = req.params;
    const userId = (req as any).user._id;
    const { name, displayName, description, type, configuration, isDefault = false } = req.body;
    
    // Generate a valid environment name from display name
    const validEnvName = generateValidEnvName(displayName, name);

    // Verify access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment name exists in application
    const existingEnv = await Environment.findOne({ workspaceId, applicationId, name: validEnvName, active: true });
    if (existingEnv) {
      return void res.status(409).json({
        success: false,
        error: 'Environment name already exists in this application'
      });
    }

    const environment = new Environment({
      workspaceId,
      applicationId,
      name: validEnvName,
      displayName,
      description,
      type,
      configuration: configuration || {
        variables: new Map(),
        endpoints: new Map(),
        features: new Map()
      },
      metadata: {
        owner: userId,
        createdBy: userId,
        lastModifiedBy: userId,
        tags: [],
        isDefault: isDefault || false
      }
    });

    await environment.save();

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment,
      message: 'Environment created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create environment'
    });
  }
});

// GET /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.get('/:environmentId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId, environmentId } = req.params;

    if (!applicationId) {
      return void res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const user = (req as any).user;

    // Verify workspace access - include basic users with assigned workspaces
    let workspaceQuery: any = {
      _id: workspaceId,
      active: true
    };

    if (userRole === 'basic' || userRole === 'admin') {
      // Admin and basic users can only access workspaces they're assigned to
      const assignedWorkspaces = user.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        // Check if the requested workspace is in their assigned workspaces
        if (!assignedWorkspaces.some((assignedId: string) => assignedId.toString() === workspaceId?.toString())) {
          return void res.status(404).json({
            success: false,
            error: 'Workspace not found'
          });
        }
        // Keep the original workspace query since we've already validated access
      } else {
        // User with no assigned workspaces - no access
        return void res.status(404).json({
          success: false,
          error: 'Workspace not found'
        });
      }
    } else {
      // Super admin users - only owner/admin access
      workspaceQuery.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
    }

    const workspace = await Workspace.findOne(workspaceQuery);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Verify application access for basic users
    if (userRole === 'basic') {
      const assignedApplications = user.assignedApplications || [];
      if (assignedApplications.length === 0 ||
          !assignedApplications.some((appId: string) => appId.toString() === applicationId.toString())) {
        return void res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }
    }

    const environment = await Environment.findOne({
      _id: environmentId,
      workspaceId,
      applicationId,
      active: true
    }).populate(['policiesCount', 'subjectsCount', 'resourcesCount']);

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environment'
    });
  }
});

// PUT /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.put('/:environmentId', requireAuth, validateIds, validateEnvironment, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId, applicationId, environmentId } = req.params;
    const userId = (req as any).user._id;
    const { name, displayName, description, type, configuration, isDefault = false } = req.body;

    // Verify access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment name exists in application (exclude current env)
    const existingEnv = await Environment.findOne({ 
      workspaceId, 
      applicationId, 
      name, 
      _id: { $ne: environmentId },
      active: true
    });
    
    if (existingEnv) {
      return void res.status(409).json({
        success: false,
        error: 'Environment name already exists in this application'
      });
    }

    const environment = await Environment.findOneAndUpdate(
      { _id: environmentId, workspaceId, applicationId, active: true },
      {
        name,
        displayName,
        description,
        type,
        configuration,
        'metadata.lastModifiedBy': userId,
        'metadata.isDefault': isDefault,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment,
      message: 'Environment updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update environment'
    });
  }
});

// DELETE /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.delete('/:environmentId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId, environmentId } = req.params;
    const userId = (req as any).user._id;

    // Verify access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment has policies, subjects, or resources
    const [policyCount, subjectCount, resourceCount] = await Promise.all([
      mongoose.model('Policy').countDocuments({ environmentId, active: true }),
      mongoose.model('Subject').countDocuments({ environmentId, active: true }),
      mongoose.model('Resource').countDocuments({ environmentId, active: true })
    ]);

    const totalDependencies = policyCount + subjectCount + resourceCount;
    
    if (totalDependencies > 0) {
      const dependencies = [];
      if (policyCount > 0) dependencies.push(`${policyCount} policy(ies)`);
      if (subjectCount > 0) dependencies.push(`${subjectCount} subject(s)`);
      if (resourceCount > 0) dependencies.push(`${resourceCount} resource(s)`);
      
      return void res.status(409).json({
        success: false,
        error: `Cannot delete environment. ${dependencies.join(', ')} must be deleted first.`,
        details: {
          dependentCount: totalDependencies,
          dependentTypes: ['policies', 'subjects', 'resources'].filter((type, index) => {
            const counts = [policyCount, subjectCount, resourceCount];
            return counts[index] && counts[index] > 0;
          })
        }
      });
    }

    // Soft delete the environment
    const environment = await Environment.findOneAndUpdate(
      { _id: environmentId, workspaceId, applicationId, active: true },
      {
        active: false,
        'metadata.lastModifiedBy': userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Environment deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete environment'
    });
  }
});

export default router;