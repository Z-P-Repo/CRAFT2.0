import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { User } from '../models/User';
import { requireAuth, requireAdminOrSuperAdmin } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

// Helper function to generate a valid application name from display name
function generateValidAppName(displayName: string, originalName?: string): string {
  // First try the original name if it exists and is valid
  if (originalName && originalName.length >= 2 && /^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/.test(originalName)) {
    return originalName;
  }
  
  // Generate from display name
  let appName = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_\.]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''); // Remove leading/trailing non-alphanumeric
  
  // Ensure minimum length
  if (appName.length < 2) {
    appName = 'app-' + Date.now().toString().slice(-4); // Fallback name
  }
  
  // Ensure maximum length  
  if (appName.length > 50) {
    appName = appName.substring(0, 47) + '...';
  }
  
  return appName;
}

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

const router = Router();

// Validation middleware
const validateWorkspace = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 25 })
    .withMessage('Name must be 2-25 characters'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validateWorkspaceId = [
  param('workspaceId')
    .isMongoId()
    .withMessage('Invalid workspace ID format')
];

// GET /api/workspaces - List workspaces user has access to
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, status = 'all' } = req.query;
    const userId = (req as any).user._id.toString();
    const userRole = (req as any).user.role;

    // Build query for workspaces user has access to
    const query: any = {
      active: true
    };

    // Only super admin can see all workspaces, admin and basic users only see assigned ones
    if (userRole !== 'super_admin') {
      // Get user's assigned workspaces
      const user = (req as any).user;
      const assignedWorkspaces = user.assignedWorkspaces || [];

      // If user has no assigned workspaces, they should see nothing
      if (assignedWorkspaces.length === 0) {
        query._id = null; // This will return no results
      } else {
        query.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } } // User's assigned workspaces
        ];
      }
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const workspaces = await Workspace.find(query)
      .populate('applicationsCount')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Fetch applications and environments for each workspace
    const workspacesWithDetails = await Promise.all(
      workspaces.map(async (workspace) => {
        let applicationQuery: any = {
          workspaceId: workspace._id,
          active: true
        };

        // Admin and basic users can only see applications they're assigned to
        if (userRole === 'basic' || userRole === 'admin') {
          const user = (req as any).user;
          const assignedApplications = user.assignedApplications || [];

          if (assignedApplications.length > 0) {
            applicationQuery._id = { $in: assignedApplications };
          } else {
            applicationQuery._id = null; // No results
          }
        }

        const applications = await Application.find(applicationQuery).lean();
        
        const applicationsWithEnvs = await Promise.all(
          applications.map(async (app) => {
            const environments = await Environment.find({
              workspaceId: workspace._id,
              applicationId: app._id
            }).lean();
            
            return {
              ...app,
              environments
            };
          })
        );
        
        return {
          ...workspace.toObject(),
          applications: applicationsWithEnvs
        };
      })
    );

    const total = await Workspace.countDocuments(query);

    const response: PaginatedResponse<any> = {
      success: true,
      data: workspacesWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspaces'
    });
  }
});

// POST /api/workspaces - Create new workspace with applications and environments
router.post('/', requireAuth, requireAdminOrSuperAdmin, validateWorkspace, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user._id;
    const { name, displayName, description, settings, limits, applications = [], status = 'draft' } = req.body;

    // Check if workspace name already exists
    const existingWorkspace = await Workspace.findOne({ name });
    if (existingWorkspace) {
      return void res.status(409).json({
        success: false,
        error: 'Workspace name already exists'
      });
    }

    // Create workspace
    const workspace = new Workspace({
      name,
      displayName,
      description,
      status,
      settings: settings || {},
      limits: limits || {},
      metadata: {
        owner: userId,
        admins: [],
        createdBy: userId,
        lastModifiedBy: userId,
        tags: [],
        isSystem: false,
        plan: 'free'
      }
    });

    await workspace.save();
    const workspaceId = workspace._id.toString();

    // Create applications and their environments
    const createdApplications = [];
    const failedApplications = [];
    for (const appData of applications) {
      try {
        // Generate a valid application name first
        const validAppName = generateValidAppName(appData.displayName, appData.name);
        
        // Validate application name uniqueness within workspace
        const existingApp = await Application.findOne({
          workspaceId,
          name: validAppName,
          active: true
        });

        if (existingApp) {
          const error = `Application name '${validAppName}' already exists in this workspace`;
          console.warn(`Skipping duplicate application name: ${validAppName}`);
          failedApplications.push({
            name: appData.name || validAppName,
            displayName: appData.displayName,
            error: error,
            reason: 'duplicate_name'
          });
          continue;
        }
        
        // Create application
        const application = new Application({
          workspaceId,
          name: validAppName,
          displayName: appData.displayName,
          description: appData.description,
          type: appData.type,
          status: 'development',
          configuration: {
            authSettings: {
              requireAuthentication: true,
              authProviders: ['local'],
              sessionTimeout: 480,
              mfaRequired: false
            }
          },
          metadata: {
            owner: userId,
            maintainers: [],
            createdBy: userId,
            lastModifiedBy: userId,
            tags: [],
            version: '1.0.0'
          }
        });

        await application.save();
        const applicationId = application._id.toString();

        // Create environments for this application
        const createdEnvironments = [];
        const failedEnvironments = [];
        for (const envData of appData.environments || []) {
          try {
            // Generate a valid environment name from display name
            const validEnvName = generateValidEnvName(envData.displayName, envData.name);
            
            // Validate environment name uniqueness within application
            const existingEnv = await Environment.findOne({
              workspaceId,
              applicationId,
              name: validEnvName,
              active: true
            });

            if (existingEnv) {
              console.warn(`Skipping duplicate environment name: ${validEnvName} in app ${appData.name}`);
              failedEnvironments.push({
                name: validEnvName,
                displayName: envData.displayName,
                error: `Environment name '${validEnvName}' already exists in this application`,
                reason: 'duplicate_name'
              });
              continue;
            }

            const environment = new Environment({
              workspaceId,
              applicationId,
              name: validEnvName,
              displayName: envData.displayName,
              description: envData.description,
              type: envData.type,
              status: 'provisioning',
              configuration: {
                variables: new Map(),
                endpoints: new Map(),
                features: new Map()
              },
              metadata: {
                owner: userId,
                createdBy: userId,
                lastModifiedBy: userId,
                tags: [],
                isDefault: envData.isDefault || false
              }
            });

            await environment.save();
            createdEnvironments.push({
              id: environment._id,
              name: environment.name,
              displayName: environment.displayName,
              type: environment.type,
              isDefault: environment.metadata.isDefault
            });
          } catch (envError) {
            console.error(`Error creating environment ${envData.name}:`, envError);
            const errorMessage = (envError as any).message || 'Unknown error during environment creation';
            let reason = 'creation_error';
            
            // Determine specific error reason
            if (errorMessage.includes('validation failed')) {
              reason = 'validation_error';
            } else if (errorMessage.includes('duplicate')) {
              reason = 'duplicate_name';
            }
            
            failedEnvironments.push({
              name: envData.name,
              displayName: envData.displayName,
              error: errorMessage,
              reason: reason
            });
          }
        }

        createdApplications.push({
          id: application._id,
          name: application.name,
          displayName: application.displayName,
          type: application.type,
          environments: createdEnvironments,
          ...(failedEnvironments.length > 0 && { failedEnvironments })
        });
      } catch (appError) {
        console.error(`Error creating application ${appData.name}:`, appError);
        const errorMessage = (appError as any).message || 'Unknown error during application creation';
        let reason = 'creation_error';
        
        // Determine specific error reason
        if (errorMessage.includes('validation failed')) {
          reason = 'validation_error';
        } else if (errorMessage.includes('duplicate')) {
          reason = 'duplicate_name';
        }
        
        failedApplications.push({
          name: appData.name,
          displayName: appData.displayName,
          error: errorMessage,
          reason: reason
        });
      }
    }

    // Return complete workspace with created applications
    const totalRequestedApps = applications.length;
    const hasApplicationFailures = failedApplications.length > 0;
    const environmentsCreated = createdApplications.reduce((total, app) => total + app.environments.length, 0);
    const totalFailedEnvironments = createdApplications.reduce((total, app) => total + (app.failedEnvironments ? app.failedEnvironments.length : 0), 0);
    const totalRequestedEnvironments = applications.reduce((total: number, app: any) => total + (app.environments ? app.environments.length : 0), 0);
    const hasEnvironmentFailures = totalFailedEnvironments > 0;
    const hasAnyFailures = hasApplicationFailures || hasEnvironmentFailures;
    
    let message = `Workspace created successfully`;
    if (hasAnyFailures) {
      message += ` with ${createdApplications.length} of ${totalRequestedApps} applications created`;
      if (environmentsCreated > 0 || totalFailedEnvironments > 0) {
        message += ` and ${environmentsCreated} of ${totalRequestedEnvironments} environments`;
      }
    } else {
      message += ` with ${createdApplications.length} applications and ${environmentsCreated} environments`;
    }
    
    const response: ApiResponse<any> = {
      success: !hasAnyFailures, // Set success to false if there are failures
      data: {
        workspace: {
          _id: workspace._id,
          name: workspace.name,
          displayName: workspace.displayName,
          description: workspace.description,
          status: workspace.status,
          settings: workspace.settings,
          limits: workspace.limits,
          metadata: workspace.metadata,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt
        },
        applications: createdApplications,
        summary: {
          applicationsRequested: totalRequestedApps,
          applicationsCreated: createdApplications.length,
          applicationsFailed: failedApplications.length,
          environmentsRequested: totalRequestedEnvironments,
          environmentsCreated: environmentsCreated,
          environmentsFailed: totalFailedEnvironments
        },
        ...(hasApplicationFailures && { failedApplications }),
        ...(hasEnvironmentFailures && { 
          failedEnvironments: createdApplications
            .filter(app => app.failedEnvironments && app.failedEnvironments.length > 0)
            .map(app => ({
              applicationName: app.name,
              environments: app.failedEnvironments
            }))
        })
      },
      message: message,
      ...(hasAnyFailures && { 
        warning: [
          ...(hasApplicationFailures ? [`${failedApplications.length} application(s) could not be created`] : []),
          ...(hasEnvironmentFailures ? [`${totalFailedEnvironments} environment(s) could not be created`] : [])
        ].join(' and ') + ' due to validation errors'
      })
    };

    // Return appropriate status code
    const statusCode = hasAnyFailures ? 422 : 201; // 422 Unprocessable Entity for validation failures
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace'
    });
  }
});

// GET /api/workspaces/:workspaceId - Get workspace details
router.get('/:workspaceId', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid workspace ID',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const query: any = {
      _id: workspaceId
    };

    // Only super admin can access any workspace, admin and basic users only assigned ones
    if (userRole !== 'super_admin') {
      const user = (req as any).user;
      const assignedWorkspaces = user.assignedWorkspaces || [];

      // If user has no assigned workspaces, they cannot access any workspace
      if (assignedWorkspaces.length === 0) {
        query._id = null; // This will return no results
      } else {
        query.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } } // User's assigned workspaces
        ];
      }
    }

    const workspace = await Workspace.findOne(query).populate('applicationsCount');

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Fetch applications and environments for this workspace
    let applicationQuery: any = {
      workspaceId: workspace._id,
      active: true
    };

    // Basic users can only see applications they're assigned to
    if (userRole === 'basic') {
      const user = await User.findById(userId);
      if (user && user.assignedApplications && user.assignedApplications.length > 0) {
        applicationQuery._id = { $in: user.assignedApplications };
      } else {
        applicationQuery._id = null; // No results
      }
    }

    const applications = await Application.find(applicationQuery).lean();
    
    const applicationsWithEnvs = await Promise.all(
      applications.map(async (app) => {
        const environments = await Environment.find({
          workspaceId: workspace._id,
          applicationId: app._id
        }).lean();
        
        return {
          ...app,
          environments
        };
      })
    );
    
    const workspaceWithDetails = {
      ...workspace.toObject(),
      applications: applicationsWithEnvs
    };

    const response: ApiResponse<any> = {
      success: true,
      data: workspaceWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace'
    });
  }
});

// PUT /api/workspaces/:workspaceId - Update workspace
router.put('/:workspaceId', requireAuth, validateWorkspaceId, validateWorkspace, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const { displayName, description, settings, limits, status } = req.body;

    const query: any = {
      _id: workspaceId,
      active: true
    };

    // Only super admin can update any workspace, admin and basic users only assigned ones
    if (userRole !== 'super_admin') {
      const user = (req as any).user;
      const assignedWorkspaces = user.assignedWorkspaces || [];

      // If user has no assigned workspaces, they cannot update any workspace
      if (assignedWorkspaces.length === 0) {
        query._id = null; // This will return no results
      } else {
        query.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } } // User's assigned workspaces
        ];
      }
    }

    const workspace = await Workspace.findOne(query);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Check if user has permission to update
    const hasPermission = userRole === 'super_admin' || 
                         userRole === 'admin' || 
                         workspace.isOwner(userId) || 
                         workspace.isAdmin(userId);
    
    if (!hasPermission) {
      return void res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update workspace'
      });
    }

    // Update fields
    if (displayName) workspace.displayName = displayName;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    if (limits) workspace.limits = { ...workspace.limits, ...limits };
    if (status) workspace.status = status;
    
    workspace.metadata.lastModifiedBy = userId;

    await workspace.save();

    const response: ApiResponse<IWorkspace> = {
      success: true,
      data: workspace,
      message: 'Workspace updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace'
    });
  }
});

// DELETE /api/workspaces/:workspaceId - Delete workspace (hard delete)
router.delete('/:workspaceId', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid workspace ID',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    const query: any = {
      _id: workspaceId,
      active: true
    };

    // Only super admin can delete any workspace, admin and basic users only assigned ones
    if (userRole !== 'super_admin') {
      const user = (req as any).user;
      const assignedWorkspaces = user.assignedWorkspaces || [];

      // If user has no assigned workspaces, they cannot delete any workspace
      if (assignedWorkspaces.length === 0) {
        query._id = null; // This will return no results
      } else {
        query.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } } // User's assigned workspaces
        ];
      }
    }

    const workspace = await Workspace.findOne(query);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found or insufficient permissions'
      });
    }

    // Cascading delete - delete all associated data first
    console.log(`Starting cascading delete for workspace: ${workspaceId}`);
    
    // Get all applications in this workspace
    const applications = await Application.find({ workspaceId, active: true });
    console.log(`Found ${applications.length} applications to delete`);
    
    // Delete all environments for each application
    for (const application of applications) {
      const environmentsDeleted = await Environment.deleteMany({ 
        workspaceId, 
        applicationId: application._id 
      });
      console.log(`Deleted ${environmentsDeleted.deletedCount} environments for application ${application.name}`);
    }
    
    // Delete all applications in this workspace
    const applicationsDeleted = await Application.deleteMany({ workspaceId });
    console.log(`Deleted ${applicationsDeleted.deletedCount} applications`);
    
    // Finally, delete the workspace itself
    await Workspace.findByIdAndDelete(workspaceId);
    console.log(`Deleted workspace: ${workspaceId}`);

    const response: ApiResponse = {
      success: true,
      message: `Workspace and all associated applications and environments deleted successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workspace'
    });
  }
});

// GET /api/workspaces/:workspaceId/stats - Get workspace statistics
router.get('/:workspaceId/stats', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    // Verify access
    const query: any = {
      _id: workspaceId
    };

    // Only super admin can view stats for any workspace, admin and basic users only assigned ones
    if (userRole !== 'super_admin') {
      const user = (req as any).user;
      const assignedWorkspaces = user.assignedWorkspaces || [];

      // If user has no assigned workspaces, they cannot view stats for any workspace
      if (assignedWorkspaces.length === 0) {
        query._id = null; // This will return no results
      } else {
        query.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } } // User's assigned workspaces
        ];
      }
    }

    const workspace = await Workspace.findOne(query);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Get statistics
    const [applications, environments] = await Promise.all([
      Application.countDocuments({ workspaceId }),
      Environment.countDocuments({ workspaceId })
    ]);

    const stats = {
      applications,
      environments,
      limits: workspace.limits,
      usage: {
        applications: applications,
        environments: environments,
        storageUsed: 0, // TODO: Calculate actual storage usage
        apiCallsThisMonth: 0 // TODO: Get from activity logs
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace statistics'
    });
  }
});

// POST /api/workspaces/:workspaceId/publish - Publish a draft workspace
router.post('/:workspaceId/publish', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = (req as any).user._id;

    // Find the workspace and verify access
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

    // Check if workspace is already published
    if (workspace.status === 'active') {
      return void res.status(400).json({
        success: false,
        error: 'Workspace is already published'
      });
    }

    // Validate that workspace has at least one application with one environment
    const applications = await Application.find({ workspaceId, active: true });
    if (applications.length === 0) {
      return void res.status(400).json({
        success: false,
        error: 'Cannot publish workspace without at least one application'
      });
    }

    let hasEnvironments = false;
    for (const app of applications) {
      const environments = await Environment.find({ applicationId: app._id, active: true });
      if (environments.length > 0) {
        hasEnvironments = true;
        break;
      }
    }

    if (!hasEnvironments) {
      return void res.status(400).json({
        success: false,
        error: 'Cannot publish workspace without at least one environment'
      });
    }

    // Publish the workspace
    workspace.status = 'active';
    workspace.metadata.lastModifiedBy = userId;
    workspace.updatedAt = new Date();
    
    await workspace.save();

    const response: ApiResponse<IWorkspace> = {
      success: true,
      data: workspace,
      message: 'Workspace published successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error publishing workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish workspace'
    });
  }
});

// POST /api/workspaces/:workspaceId/admins - Add admin to workspace
router.post('/:workspaceId/admins', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { userId: newAdminId } = req.body;
    const currentUserId = (req as any).user._id?.toString() || (req as any).user.id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'metadata.owner': currentUserId,
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found or insufficient permissions'
      });
    }

    workspace.addAdmin(newAdminId);
    workspace.metadata.lastModifiedBy = currentUserId;
    await workspace.save();

    const response: ApiResponse = {
      success: true,
      message: 'Admin added successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add admin'
    });
  }
});

// GET /api/workspaces/:workspaceId/applications - Get applications for a workspace
router.get('/:workspaceId/applications', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return void res.status(400).json({
        success: false,
        error: 'Workspace ID is required'
      });
    }

    const userId = (req as any).user._id?.toString() || (req as any).user.id;
    const userRole = (req as any).user.role;

    // Check workspace access
    let workspace;
    if (userRole === 'super_admin') {
      workspace = await Workspace.findOne({ _id: workspaceId, active: true });
    } else {
      // For non-super-admin users, check if they have access to this workspace
      const query: any = { _id: workspaceId, active: true };

      // Basic users can only access workspaces they're assigned to
      if (userRole === 'basic') {
        const user = await User.findById(userId);
        if (user && user.assignedWorkspaces && user.assignedWorkspaces.includes(workspaceId)) {
          // User has access to this workspace - query remains as is
        } else {
          // Basic user doesn't have access to this workspace
          return void res.status(404).json({
            success: false,
            error: 'Workspace not found'
          });
        }
      }

      workspace = await Workspace.findOne(query);
    }

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Fetch applications for this workspace
    let applicationQuery: any = {
      workspaceId,
      active: true
    };

    // Basic users can only see applications they're assigned to
    if (userRole === 'basic') {
      const user = await User.findById(userId);
      if (user && user.assignedApplications && user.assignedApplications.length > 0) {
        applicationQuery._id = { $in: user.assignedApplications };
      } else {
        // Basic user with no application assignments - no access
        applicationQuery._id = null; // This will return no results
      }
    }

    const applications = await Application.find(applicationQuery).populate('environments');

    const response = {
      success: true,
      data: applications,
      message: `Found ${applications.length} applications`
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspace applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace applications'
    });
  }
});

export default router;