import { Policy } from '@/models/Policy';
import { logger } from '@/utils/logger';

export const seedPolicies = async () => {
  try {
    // Check if policies already exist
    const existingCount = await Policy.countDocuments();
    if (existingCount > 0) {
      logger.info(`Skipping policy seeding - ${existingCount} policies already exist`);
      return;
    }

    const policies = [
      {
        id: 'basic-user-read-access',
        name: 'Basic User Read Access',
        description: 'Allows basic users to read public applications and resources',
        effect: 'Allow',
        status: 'Active',
        priority: 10,
        rules: [
          {
            id: 'rule-1',
            subject: {
              type: 'User',
              attributes: [
                { name: 'role', operator: 'equals', value: 'basic' }
              ]
            },
            action: {
              name: 'read',
              displayName: 'Read'
            },
            object: {
              type: 'Application',
              attributes: [
                { name: 'type', operator: 'equals', value: 'public' }
              ]
            },
            conditions: []
          }
        ],
        subjects: ['user'],
        resources: ['application'],
        actions: ['read'],
        conditions: [],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: ['basic', 'read-only', 'public'],
          version: '1.0.0',
          isSystem: true,
          isCustom: false,
        },
      },
      {
        id: 'admin-full-access',
        name: 'Admin Full Access',
        description: 'Allows administrators full access to all resources and actions',
        effect: 'Allow',
        status: 'Active',
        priority: 1,
        rules: [
          {
            id: 'rule-1',
            subject: {
              type: 'User',
              attributes: [
                { name: 'role', operator: 'equals', value: 'admin' }
              ]
            },
            action: {
              name: '*',
              displayName: 'All Actions'
            },
            object: {
              type: '*',
              attributes: []
            },
            conditions: []
          }
        ],
        subjects: ['user'],
        resources: ['*'],
        actions: ['*'],
        conditions: [],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: ['admin', 'full-access', 'system'],
          version: '1.0.0',
          isSystem: true,
          isCustom: false,
        },
      },
      {
        id: 'guest-deny-sensitive',
        name: 'Guest Deny Sensitive Access',
        description: 'Explicitly denies guest users access to sensitive resources',
        effect: 'Deny',
        status: 'Active',
        priority: 5,
        rules: [
          {
            id: 'rule-1',
            subject: {
              type: 'Guest',
              attributes: [
                { name: 'authenticated', operator: 'equals', value: 'false' }
              ]
            },
            action: {
              name: '*',
              displayName: 'All Actions'
            },
            object: {
              type: 'Database',
              attributes: [
                { name: 'classification', operator: 'in', value: ['sensitive', 'confidential'] }
              ]
            },
            conditions: []
          }
        ],
        subjects: ['guest'],
        resources: ['database'],
        actions: ['*'],
        conditions: [],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: ['guest', 'security', 'deny'],
          version: '1.0.0',
          isSystem: true,
          isCustom: false,
        },
      },
      {
        id: 'manager-write-access',
        name: 'Manager Write Access',
        description: 'Allows managers to write to team resources during business hours',
        effect: 'Allow',
        status: 'Active',
        priority: 8,
        rules: [
          {
            id: 'rule-1',
            subject: {
              type: 'User',
              attributes: [
                { name: 'role', operator: 'equals', value: 'manager' },
                { name: 'department', operator: 'in', value: ['sales', 'marketing', 'support'] }
              ]
            },
            action: {
              name: 'write',
              displayName: 'Write'
            },
            object: {
              type: 'Project',
              attributes: [
                { name: 'team', operator: 'equals', value: 'assigned' }
              ]
            },
            conditions: [
              { field: 'time', operator: 'greater_than', value: '09:00' },
              { field: 'time', operator: 'less_than', value: '18:00' }
            ]
          }
        ],
        subjects: ['user'],
        resources: ['project'],
        actions: ['write'],
        conditions: [
          { field: 'time', operator: 'greater_than', value: '09:00' },
          { field: 'time', operator: 'less_than', value: '18:00' }
        ],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: ['manager', 'business-hours', 'team-resources'],
          version: '1.0.0',
          isSystem: true,
          isCustom: false,
        },
      },
      {
        id: 'developer-api-access',
        name: 'Developer API Access',
        description: 'Allows developers to access development and staging APIs',
        effect: 'Allow',
        status: 'Active',
        priority: 15,
        rules: [
          {
            id: 'rule-1',
            subject: {
              type: 'User',
              attributes: [
                { name: 'role', operator: 'equals', value: 'developer' },
                { name: 'clearance', operator: 'equals', value: 'active' }
              ]
            },
            action: {
              name: 'execute',
              displayName: 'Execute API'
            },
            object: {
              type: 'API',
              attributes: [
                { name: 'environment', operator: 'in', value: ['development', 'staging'] }
              ]
            },
            conditions: []
          }
        ],
        subjects: ['user'],
        resources: ['api'],
        actions: ['execute'],
        conditions: [],
        metadata: {
          createdBy: 'system',
          lastModifiedBy: 'system',
          tags: ['developer', 'api-access', 'non-production'],
          version: '1.0.0',
          isSystem: true,
          isCustom: false,
        },
      }
    ];

    const createdPolicies = await Policy.insertMany(policies);
    logger.info(`✅ Created ${createdPolicies.length} policies`);
    
    return createdPolicies;

  } catch (error) {
    logger.error('❌ Error seeding policies:', error);
    throw error;
  }
};