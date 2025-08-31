import { Activity } from '../models/Activity';

const sampleActivities = [
  {
    type: 'authentication',
    category: 'security',
    action: 'login',
    resource: {
      type: 'system',
      id: 'auth-system',
      name: 'Authentication System'
    },
    actor: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      type: 'user'
    },
    description: 'User successfully logged in',
    severity: 'low',
    metadata: {
      status: 'success',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Chrome/91.0)',
      sessionId: 'session-123'
    },
    tags: ['authentication', 'success']
  },
  {
    type: 'authorization',
    category: 'security',
    action: 'access_denied',
    resource: {
      type: 'document',
      id: 'doc-456',
      name: 'Confidential Report'
    },
    actor: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      type: 'user'
    },
    description: 'Access denied for read operation on confidential document',
    severity: 'medium',
    metadata: {
      status: 'failure',
      reason: 'Insufficient permissions',
      ipAddress: '192.168.1.101'
    },
    tags: ['authorization', 'denied', 'security']
  },
  {
    type: 'policy_management',
    category: 'administration',
    action: 'policy_created',
    resource: {
      type: 'policy',
      id: 'policy-789',
      name: 'New Security Policy'
    },
    actor: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@company.com',
      type: 'user'
    },
    description: 'New security policy created for document access',
    severity: 'medium',
    metadata: {
      status: 'success',
      changes: {
        'effect': { from: null, to: 'allow' },
        'conditions': { from: [], to: ['department=security'] }
      }
    },
    tags: ['policy', 'created', 'administration']
  },
  {
    type: 'security_event',
    category: 'security',
    action: 'suspicious_activity',
    resource: {
      type: 'system',
      id: 'security-system',
      name: 'Security Monitor'
    },
    actor: {
      id: 'system-1',
      name: 'Security System',
      email: 'security@system.local',
      type: 'system'
    },
    description: 'Multiple failed login attempts detected from same IP',
    severity: 'high',
    metadata: {
      status: 'pending',
      ipAddress: '192.168.1.200',
      attempts: 5,
      timeWindow: '5 minutes'
    },
    tags: ['security', 'alert', 'brute-force']
  },
  {
    type: 'user_management',
    category: 'administration',
    action: 'user_updated',
    resource: {
      type: 'user',
      id: 'user-3',
      name: 'Bob Wilson'
    },
    actor: {
      id: 'admin-2',
      name: 'HR Admin',
      email: 'hr@company.com',
      type: 'user'
    },
    target: {
      type: 'user',
      id: 'user-3',
      name: 'Bob Wilson'
    },
    description: 'User role updated from basic to manager',
    severity: 'low',
    metadata: {
      status: 'success',
      changes: {
        'role': { from: 'basic', to: 'manager' },
        'permissions': { from: ['read'], to: ['read', 'write', 'approve'] }
      }
    },
    tags: ['user', 'role-change', 'administration']
  },
  {
    type: 'system_configuration',
    category: 'configuration',
    action: 'config_changed',
    resource: {
      type: 'system',
      id: 'app-config',
      name: 'Application Configuration'
    },
    actor: {
      id: 'admin-1',
      name: 'System Admin',
      email: 'sysadmin@company.com',
      type: 'user'
    },
    description: 'Security settings updated: password policy strengthened',
    severity: 'medium',
    metadata: {
      status: 'success',
      changes: {
        'passwordMinLength': { from: 6, to: 8 },
        'requireSpecialChars': { from: false, to: true }
      }
    },
    tags: ['configuration', 'security', 'password-policy']
  },
  {
    type: 'integration',
    category: 'integration',
    action: 'api_call',
    resource: {
      type: 'api',
      id: 'external-api',
      name: 'External Service API'
    },
    actor: {
      id: 'service-1',
      name: 'Integration Service',
      email: 'integration@service.local',
      type: 'service'
    },
    description: 'Successful data sync with external HR system',
    severity: 'low',
    metadata: {
      status: 'success',
      duration: 1250,
      recordsProcessed: 45
    },
    tags: ['integration', 'sync', 'hr-system']
  },
  {
    type: 'audit',
    category: 'compliance',
    action: 'compliance_check',
    resource: {
      type: 'audit',
      id: 'audit-2024-01',
      name: 'Monthly Compliance Audit'
    },
    actor: {
      id: 'system-audit',
      name: 'Audit System',
      email: 'audit@system.local',
      type: 'system'
    },
    description: 'Monthly compliance audit completed successfully',
    severity: 'low',
    metadata: {
      status: 'success',
      policiesChecked: 127,
      violations: 0,
      auditScore: 100
    },
    tags: ['audit', 'compliance', 'monthly']
  }
];

export async function seedActivities(): Promise<void> {
  try {
    // Clear existing activities
    await Activity.deleteMany({});
    
    // Add timestamps to activities (spread over last 7 days)
    const activitiesWithTimestamps = sampleActivities.map((activity, index) => ({
      ...activity,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));
    
    // Insert activities
    const inserted = await Activity.insertMany(activitiesWithTimestamps);
    
    console.log(`✅ Successfully seeded ${inserted.length} activities`);
  } catch (error) {
    console.error('❌ Error seeding activities:', error);
    throw error;
  }
}