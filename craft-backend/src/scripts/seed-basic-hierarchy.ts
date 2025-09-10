import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

async function seedBasicHierarchy() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for hierarchy seeding');

    // Create basic workspace
    const workspaceId = new mongoose.Types.ObjectId();
    const workspaceData = {
      _id: workspaceId,
      name: 'seed-workspace',
      displayName: 'Test Workspace',
      description: 'Test workspace for development',
      settings: {
        allowSubdomains: false,
        enforceSSO: false,
        requireMFA: false,
        sessionTimeout: 3600,
        maxConcurrentSessions: 5,
        dataRetentionPeriod: 365,
        allowGuestUsers: false,
        enableAuditLogging: true,
        inheritancePolicies: {
          allowApplicationOverrides: true,
          allowEnvironmentOverrides: true,
          requireApprovalForChanges: false
        }
      },
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        tags: ['test'],
        isSystem: true,
        isCustom: false,
        version: '1.0.0'
      },
      active: true
    };

    // Create basic application  
    const applicationId = new mongoose.Types.ObjectId();
    const applicationData = {
      _id: applicationId,
      id: 'seed-app',
      name: 'seed-app', 
      displayName: 'Test Application',
      description: 'Test application for development',
      workspaceId: workspaceId,
      type: 'web',
      status: 'active',
      settings: {
        enableDetailedLogging: true,
        defaultAccessLevel: 'read',
        sessionTimeout: 1800,
        requireAuthentication: true,
        allowAnonymousAccess: false,
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100,
          burstLimit: 200
        },
        securityHeaders: {
          enforceHttps: true,
          enableCSP: true,
          enableHSTS: true
        }
      },
      integrations: {},
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system', 
        tags: ['test'],
        isSystem: true,
        isCustom: false,
        version: '1.0.0'
      },
      active: true
    };

    // Create basic environment
    const environmentId = new mongoose.Types.ObjectId();
    const environmentData = {
      _id: environmentId,
      id: 'seed-env',
      name: 'seed-env',
      displayName: 'Test Environment', 
      description: 'Test environment for development',
      workspaceId: workspaceId,
      applicationId: applicationId,
      type: 'development',
      status: 'active',
      settings: {
        debugMode: true,
        logLevel: 'debug',
        enablePerformanceMonitoring: true,
        cacheSettings: {
          enabled: true,
          ttl: 300,
          maxSize: 1000
        },
        backupSettings: {
          enabled: false,
          frequency: 'daily',
          retention: 7
        }
      },
      deploymentConfig: {},
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        tags: ['test'],
        isSystem: true, 
        isCustom: false,
        version: '1.0.0'
      },
      active: true
    };

    // Insert the data directly using MongoDB insertOne to avoid model validation issues
    await mongoose.connection.collection('workspaces').insertOne(workspaceData);
    logger.info('Created workspace: Test Workspace');
    
    await mongoose.connection.collection('applications').insertOne(applicationData);
    logger.info('Created application: Test Application');
    
    await mongoose.connection.collection('environments').insertOne(environmentData);
    logger.info('Created environment: Test Environment');

    logger.info('Basic hierarchy seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding basic hierarchy:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedBasicHierarchy();
}

export default seedBasicHierarchy;