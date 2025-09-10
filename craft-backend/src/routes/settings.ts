import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { requireAuth } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

interface SettingsRequest {
  workspace: {
    name: string;
    displayName: string;
    description?: string;
    settings?: any;
    limits?: any;
  };
  applications?: Array<{
    name: string;
    displayName: string;
    description?: string;
    type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
    configuration?: any;
    environments?: Array<{
      name: string;
      displayName: string;
      description?: string;
      type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
      isDefault?: boolean;
      configuration?: any;
    }>;
  }>;
}

// Validation middleware for unified settings
const validateSettings = [
  // Workspace validation
  body('workspace.name')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/)
    .withMessage('Workspace name must be 2+ characters, start/end with alphanumeric, and contain only letters, numbers, spaces, hyphens, underscores, and dots'),
  body('workspace.displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Workspace display name must be 2-100 characters'),
  body('workspace.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Workspace description cannot exceed 500 characters'),

  // Applications validation (optional)
  body('applications')
    .optional()
    .isArray()
    .withMessage('Applications must be an array if provided'),
  body('applications.*.name')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/)
    .withMessage('Application names must be 2+ characters, start/end with alphanumeric, and contain only letters, numbers, spaces, hyphens, underscores, and dots'),
  body('applications.*.displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Application display names must be 2-100 characters'),
  body('applications.*.type')
    .isIn(['web', 'api', 'mobile', 'desktop', 'service', 'microservice'])
    .withMessage('Invalid application type'),

  // Environments validation (optional if applications are provided)
  body('applications.*.environments')
    .optional()
    .isArray()
    .withMessage('Environments must be an array if provided'),
  body('applications.*.environments.*.name')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/)
    .withMessage('Environment names must be 2+ characters, start/end with alphanumeric, and contain only letters, numbers, spaces, hyphens, underscores, and dots'),
  body('applications.*.environments.*.displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Environment display names must be 2-100 characters'),
  body('applications.*.environments.*.type')
    .isIn(['development', 'testing', 'staging', 'production', 'preview', 'hotfix'])
    .withMessage('Invalid environment type')
];

// POST /api/settings - Create complete workspace with applications and environments
router.post('/', requireAuth, validateSettings, async (req: Request, res: Response): Promise<void> => {
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
    const settingsData: SettingsRequest = req.body;

    // Check if workspace name already exists
    const existingWorkspace = await Workspace.findOne({ name: settingsData.workspace.name });
    if (existingWorkspace) {
      return void res.status(409).json({
        success: false,
        error: 'Workspace name already exists'
      });
    }

    // Create workspace
    const workspace = new Workspace({
      name: settingsData.workspace.name,
      displayName: settingsData.workspace.displayName,
      description: settingsData.workspace.description,
      settings: settingsData.workspace.settings || {
        branding: { theme: 'light' },
        notifications: { email: true, slack: false }
      },
      limits: settingsData.workspace.limits || {
        maxApplications: 10,
        maxUsers: 100,
        maxPolicies: 1000,
        storageQuota: 5120, // 5GB
        apiCallsPerMonth: 100000
      },
      metadata: {
        owner: userId,
        admins: [],
        createdBy: userId,
        lastModifiedBy: userId,
        tags: ['settings-wizard'],
        isSystem: false,
        plan: 'free'
      }
    });

    await workspace.save();

    const createdApplications = [];
    const createdEnvironments = [];

    // Create applications and environments (if any provided)
    if (settingsData.applications && settingsData.applications.length > 0) {
      for (const appData of settingsData.applications) {
        // Check for duplicate application names within workspace
        const duplicateAppNames = settingsData.applications.filter(app => app.name === appData.name);
        if (duplicateAppNames.length > 1) {
          return void res.status(400).json({
            success: false,
            error: `Duplicate application name: ${appData.name}`
          });
        }

        // Create application
        const application = new Application({
          workspaceId: workspace._id.toString(),
          name: appData.name,
          displayName: appData.displayName,
          description: appData.description,
          type: appData.type,
          configuration: appData.configuration || {
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
            tags: ['settings-wizard'],
            version: '1.0.0'
          }
        });

        await application.save();
        createdApplications.push(application);

        // Create environments for this application (if provided)
        if (appData.environments && appData.environments.length > 0) {
          // Track default environments per application
          const defaultEnvironments = appData.environments.filter(env => env.isDefault);
          if (defaultEnvironments.length > 1) {
            return void res.status(400).json({
              success: false,
              error: `Application ${appData.name} cannot have multiple default environments`
            });
          }

          // Create environments for this application
          const appEnvironments = [];
          for (const envData of appData.environments) {
            // Check for duplicate environment names within application
            const duplicateEnvNames = appData.environments.filter(env => env.name === envData.name);
            if (duplicateEnvNames.length > 1) {
              return void res.status(400).json({
                success: false,
                error: `Duplicate environment name in ${appData.name}: ${envData.name}`
              });
            }

            const environment = new Environment({
              workspaceId: workspace._id.toString(),
              applicationId: application._id.toString(),
              name: envData.name,
              displayName: envData.displayName,
              description: envData.description,
              type: envData.type,
              configuration: envData.configuration || {
                variables: new Map([
                  ['NODE_ENV', envData.type === 'production' ? 'production' : 'development'],
                  ['APP_NAME', appData.displayName]
                ]),
                endpoints: new Map(),
                features: new Map([
                  ['authentication', true],
                  ['audit_logging', envData.type === 'production'],
                  ['rate_limiting', envData.type === 'production']
                ]),
                databases: {
                  primary: {
                    host: 'localhost',
                    port: 27017,
                    database: `${settingsData.workspace.name}_${appData.name}_${envData.type}`,
                    ssl: envData.type === 'production'
                  }
                },
                cache: {
                  enabled: envData.type === 'production',
                  type: 'memory',
                  ttl: 3600
                },
                monitoring: {
                  enabled: envData.type === 'production'
                }
              },
              metadata: {
                owner: userId,
                createdBy: userId,
                lastModifiedBy: userId,
                tags: ['settings-wizard'],
                isDefault: envData.isDefault || (appData.environments.length === 1) // First env is default if only one
              }
            });

            await environment.save();
            appEnvironments.push(environment);
          }

          createdEnvironments.push(...appEnvironments);
        }
      }
    }

    // Prepare response
    const response: ApiResponse<{
      workspace: any;
      applications: any[];
      environments: any[];
      summary: {
        workspacesCreated: number;
        applicationsCreated: number;
        environmentsCreated: number;
      };
    }> = {
      success: true,
      data: {
        workspace,
        applications: createdApplications,
        environments: createdEnvironments,
        summary: {
          workspacesCreated: 1,
          applicationsCreated: createdApplications.length,
          environmentsCreated: createdEnvironments.length
        }
      },
      message: 'Workspace settings completed successfully'
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating workspace settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/settings/templates - Get settings templates for common use cases
router.get('/templates', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = [
      {
        id: 'web-app-starter',
        name: 'Web Application Starter',
        description: 'Perfect for web applications with standard environments',
        workspace: {
          name: '',
          displayName: '',
          description: 'Web application workspace'
        },
        applications: [
          {
            name: '',
            displayName: '',
            description: 'Main web application',
            type: 'web',
            environments: [
              {
                name: 'development',
                displayName: 'Development',
                type: 'development',
                isDefault: false
              },
              {
                name: 'staging',
                displayName: 'Staging',
                type: 'staging',
                isDefault: false
              },
              {
                name: 'production',
                displayName: 'Production',
                type: 'production',
                isDefault: true
              }
            ]
          }
        ]
      },
      {
        id: 'microservices',
        name: 'Microservices Architecture',
        description: 'For complex applications with multiple services',
        workspace: {
          name: '',
          displayName: '',
          description: 'Microservices workspace'
        },
        applications: [
          {
            name: 'user-service',
            displayName: 'User Service',
            description: 'User management microservice',
            type: 'microservice',
            environments: [
              {
                name: 'development',
                displayName: 'Development',
                type: 'development',
                isDefault: true
              },
              {
                name: 'production',
                displayName: 'Production',
                type: 'production',
                isDefault: false
              }
            ]
          },
          {
            name: 'api-gateway',
            displayName: 'API Gateway',
            description: 'Main API gateway service',
            type: 'api',
            environments: [
              {
                name: 'development',
                displayName: 'Development',
                type: 'development',
                isDefault: true
              },
              {
                name: 'production',
                displayName: 'Production',
                type: 'production',
                isDefault: false
              }
            ]
          }
        ]
      },
      {
        id: 'simple-api',
        name: 'Simple API',
        description: 'For simple API projects with basic environments',
        workspace: {
          name: '',
          displayName: '',
          description: 'API workspace'
        },
        applications: [
          {
            name: '',
            displayName: '',
            description: 'Main API application',
            type: 'api',
            environments: [
              {
                name: 'development',
                displayName: 'Development',
                type: 'development',
                isDefault: true
              },
              {
                name: 'production',
                displayName: 'Production',
                type: 'production',
                isDefault: false
              }
            ]
          }
        ]
      }
    ];

    const response: ApiResponse<typeof templates> = {
      success: true,
      data: templates
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching settings templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings templates'
    });
  }
});

export default router;