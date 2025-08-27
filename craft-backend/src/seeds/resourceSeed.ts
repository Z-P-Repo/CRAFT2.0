import mongoose from 'mongoose';
import { Resource } from '@/models/Resource';
import { databaseConnection } from '@/config/database';
import { logger } from '@/utils/logger';

const sampleResources = [
  {
    id: 'resource-customer-database-001',
    name: 'customer-database',
    displayName: 'Customer Database',
    type: 'database',
    uri: '/databases/customers',
    description: 'Main customer database containing user information and orders',
    metadata: {
      owner: 'System Administrator',
      createdBy: 'System Administrator',
      lastModifiedBy: 'Database Admin',
      classification: 'confidential',
      tags: ['database', 'customer-data', 'production'],
      isSystem: false,
      isCustom: true,
      version: '2.1.0',
    },
    active: true,
  },
  {
    id: 'resource-user-documents-002',
    name: 'user-documents',
    displayName: 'User Documents Folder',
    type: 'folder',
    uri: '/files/users/documents',
    description: 'Folder containing all user-uploaded documents and files',
    metadata: {
      owner: 'System Administrator',
      createdBy: 'System Administrator',
      lastModifiedBy: 'File Admin',
      classification: 'internal',
      tags: ['folder', 'documents', 'user-data'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0',
    },
    active: true,
  },
  {
    id: 'resource-payment-api-003',
    name: 'payment-api',
    displayName: 'Payment Processing API',
    type: 'api',
    uri: '/api/payments',
    description: 'REST API for processing customer payments and transactions',
    metadata: {
      owner: 'API Team Lead',
      createdBy: 'System Administrator',
      lastModifiedBy: 'API Team Lead',
      classification: 'restricted',
      tags: ['api', 'payments', 'financial', 'critical'],
      isSystem: false,
      isCustom: true,
      version: '3.2.1',
    },
    active: true,
  },
  {
    id: 'resource-log-files-004',
    name: 'log-files',
    displayName: 'Application Log Files',
    type: 'file',
    uri: '/logs/application.log',
    description: 'System log files containing application events and errors',
    metadata: {
      owner: 'DevOps Team',
      createdBy: 'System Administrator',
      lastModifiedBy: 'DevOps Engineer',
      classification: 'internal',
      tags: ['logs', 'monitoring', 'debugging'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0',
      size: 2048576,
      mimeType: 'text/plain',
    },
    active: true,
  },
  {
    id: 'resource-user-service-005',
    name: 'user-service',
    displayName: 'User Management Service',
    type: 'service',
    uri: '/services/user-management',
    description: 'Microservice handling user authentication and profile management',
    metadata: {
      owner: 'Backend Team',
      createdBy: 'System Administrator',
      lastModifiedBy: 'Backend Developer',
      classification: 'internal',
      tags: ['service', 'authentication', 'user-management'],
      isSystem: false,
      isCustom: true,
      version: '1.5.2',
    },
    active: true,
  },
  {
    id: 'resource-admin-portal-006',
    name: 'admin-portal',
    displayName: 'Admin Portal Application',
    type: 'application',
    uri: '/apps/admin-portal',
    description: 'Web application for system administrators to manage the platform',
    metadata: {
      owner: 'Frontend Team',
      createdBy: 'System Administrator',
      lastModifiedBy: 'Frontend Developer',
      classification: 'restricted',
      tags: ['application', 'admin', 'management'],
      isSystem: false,
      isCustom: true,
      version: '2.0.0',
    },
    active: true,
  }
];

async function seedResources() {
  try {
    // Initialize database connection
    await databaseConnection.connect();
    
    // Clear existing resources
    await Resource.deleteMany({});

    // Insert sample resources using create to trigger pre-save middleware
    const createdResources = [];
    for (const resourceData of sampleResources) {
      const resource = await Resource.create(resourceData);
      createdResources.push(resource);
    }
    logger.info(`✅ Seeded ${createdResources.length} resources successfully`);
    
    // Display created resources
    createdResources.forEach(resource => {
      logger.info(`   📁 ${resource.displayName} (${resource.type}) - ${resource.id}`);
    });

  } catch (error) {
    console.error('❌ Error seeding resources:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seeder
seedResources();