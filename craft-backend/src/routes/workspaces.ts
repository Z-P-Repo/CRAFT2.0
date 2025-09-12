import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { requireAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

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

    // Super admin and admin can see all workspaces, basic users only see their own
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
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
        const applications = await Application.find({ 
          workspaceId: workspace._id
        }).lean();
        
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
router.post('/', requireAuth, validateWorkspace, async (req: Request, res: Response): Promise<void> => {
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
    for (const appData of applications) {
      try {
        // Validate application name uniqueness within workspace
        const existingApp = await Application.findOne({
          workspaceId,
          name: appData.name,
          active: true
        });

        if (existingApp) {
          console.warn(`Skipping duplicate application name: ${appData.name}`);
          continue;
        }

        // Create application
        const application = new Application({
          workspaceId,
          name: appData.name,
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
        for (const envData of appData.environments || []) {
          try {
            // Validate environment name uniqueness within application
            const existingEnv = await Environment.findOne({
              workspaceId,
              applicationId,
              name: envData.name,
              active: true
            });

            if (existingEnv) {
              console.warn(`Skipping duplicate environment name: ${envData.name} in app ${appData.name}`);
              continue;
            }

            const environment = new Environment({
              workspaceId,
              applicationId,
              name: envData.name,
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
          }
        }

        createdApplications.push({
          id: application._id,
          name: application.name,
          displayName: application.displayName,
          type: application.type,
          environments: createdEnvironments
        });
      } catch (appError) {
        console.error(`Error creating application ${appData.name}:`, appError);
      }
    }

    // Return complete workspace with created applications
    const response: ApiResponse<any> = {
      success: true,
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
          applicationsCreated: createdApplications.length,
          environmentsCreated: createdApplications.reduce((total, app) => total + app.environments.length, 0)
        }
      },
      message: `Workspace created successfully with ${createdApplications.length} applications and ${createdApplications.reduce((total, app) => total + app.environments.length, 0)} environments`
    };

    res.status(201).json(response);
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

    // Super admin and admin can access any workspace, basic users only their own
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
    }

    const workspace = await Workspace.findOne(query).populate('applicationsCount');

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Fetch applications and environments for this workspace
    const applications = await Application.find({ 
      workspaceId: workspace._id
    }).lean();
    
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

    // Super admin and admin can update any workspace, basic users only their own
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
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

    // Super admin and admin can delete any workspace, basic users only their own
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query['metadata.owner'] = userId;
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

    // Super admin and admin can view stats for any workspace, basic users only their own
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
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
    const currentUserId = (req as any).user.id;

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

export default router;