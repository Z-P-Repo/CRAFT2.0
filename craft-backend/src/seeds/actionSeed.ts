import mongoose from 'mongoose';
import { Action } from '@/models/Action';
import { databaseConnection } from '@/config/database';
import { logger } from '@/utils/logger';

const sampleActions = [
  {
    id: 'action-read-user-profile-001',
    name: 'read-user-profile',
    displayName: 'Read User Profile',
    description: 'View user profile information including name, email, and preferences',
    category: 'read',
    httpMethod: 'GET',
    endpoint: '/api/users/:id',
    riskLevel: 'low',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['user', 'profile', 'read'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-create-user-002',
    name: 'create-user',
    displayName: 'Create New User',
    description: 'Create a new user account with email verification',
    category: 'write',
    httpMethod: 'POST',
    endpoint: '/api/users',
    riskLevel: 'medium',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['user', 'create', 'registration'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-update-user-profile-003',
    name: 'update-user-profile',
    displayName: 'Update User Profile',
    description: 'Modify user profile information such as name, email, or preferences',
    category: 'write',
    httpMethod: 'PUT',
    endpoint: '/api/users/:id',
    riskLevel: 'medium',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['user', 'profile', 'update'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-delete-user-account-004',
    name: 'delete-user-account',
    displayName: 'Delete User Account',
    description: 'Permanently delete a user account and all associated data',
    category: 'delete',
    httpMethod: 'DELETE',
    endpoint: '/api/users/:id',
    riskLevel: 'critical',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['user', 'delete', 'account'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-view-dashboard-005',
    name: 'view-dashboard',
    displayName: 'View Dashboard',
    description: 'Access the main dashboard with analytics and overview',
    category: 'read',
    httpMethod: 'GET',
    endpoint: '/dashboard',
    riskLevel: 'low',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['dashboard', 'analytics', 'overview'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-execute-backup-006',
    name: 'execute-backup',
    displayName: 'Execute System Backup',
    description: 'Run a full system backup operation',
    category: 'execute',
    httpMethod: 'POST',
    endpoint: '/api/system/backup',
    riskLevel: 'high',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'DevOps Engineer',
      tags: ['backup', 'system', 'maintenance'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-admin-reset-password-007',
    name: 'admin-reset-password',
    displayName: 'Admin Reset Password',
    description: 'Administrator action to reset any user password',
    category: 'admin',
    httpMethod: 'POST',
    endpoint: '/api/admin/reset-password',
    riskLevel: 'critical',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['admin', 'password', 'reset'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-read-audit-logs-008',
    name: 'read-audit-logs',
    displayName: 'Read Audit Logs',
    description: 'View system audit logs and security events',
    category: 'read',
    httpMethod: 'GET',
    endpoint: '/api/logs/audit',
    riskLevel: 'medium',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'Security Officer',
      tags: ['audit', 'logs', 'security'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-create-api-key-009',
    name: 'create-api-key',
    displayName: 'Create API Key',
    description: 'Generate new API key for system integration',
    category: 'write',
    httpMethod: 'POST',
    endpoint: '/api/keys',
    riskLevel: 'high',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'API Administrator',
      tags: ['api', 'key', 'integration'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'action-view-reports-010',
    name: 'view-reports',
    displayName: 'View System Reports',
    description: 'Access system performance and usage reports',
    category: 'read',
    httpMethod: 'GET',
    endpoint: '/api/reports',
    riskLevel: 'low',
    metadata: {
      owner: 'system',
      createdBy: 'System Administrator',
      lastModifiedBy: 'Analytics Team',
      tags: ['reports', 'analytics', 'performance'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  }
];

async function seedActions() {
  try {
    // Initialize database connection
    await databaseConnection.connect();
    
    // Clear existing actions
    await Action.deleteMany({});

    // Insert sample actions using create to trigger pre-save middleware
    const createdActions = [];
    for (const actionData of sampleActions) {
      const action = await Action.create(actionData);
      createdActions.push(action);
    }
    logger.info(`✅ Seeded ${createdActions.length} actions successfully`);
    
    // Display created actions
    createdActions.forEach(action => {
      logger.info(`   ⚡ ${action.displayName} (${action.category}) - ${action.riskLevel} risk - ${action.id}`);
    });

  } catch (error) {
    console.error('❌ Error seeding actions:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seeder
seedActions();