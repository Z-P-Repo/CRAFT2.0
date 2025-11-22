import mongoose from 'mongoose';
import { Attribute } from '@/models/Attribute';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

const sampleAttributes = [
  {
    id: 'attr_department',
    name: 'department',
    displayName: 'Department',
    description: 'User department within organization',
    categories: ['subject'],
    dataType: 'string',
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    isRequired: true,
    isMultiValue: false,
    defaultValue: 'IT',
    constraints: {
      enumValues: ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Legal', 'Engineering']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['core', 'subject'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_clearance_level',
    name: 'clearanceLevel',
    displayName: 'Clearance Level',
    description: 'Security clearance level (1-5)',
    categories: ['subject'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'number',
    isRequired: true,
    isMultiValue: false,
    defaultValue: 1,
    constraints: {
      minValue: 1,
      maxValue: 5,
      enumValues: [1, 2, 3, 4, 5]
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['security', 'subject'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_classification',
    name: 'classification',
    displayName: 'Classification',
    description: 'Data classification level',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    defaultValue: 'public',
    constraints: {
      enumValues: ['public', 'internal', 'confidential', 'restricted', 'top-secret']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['security', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_current_time',
    name: 'currentTime',
    displayName: 'Current Time',
    description: 'Timestamp of access request',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'date',
    isRequired: false,
    isMultiValue: false,
    constraints: {},
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['temporal', 'environment'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_risk_level',
    name: 'riskLevel',
    displayName: 'Risk Level',
    description: 'Risk level of the action',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    defaultValue: 'low',
    constraints: {
      enumValues: ['low', 'medium', 'high', 'critical']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['risk', 'action'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_location',
    name: 'location',
    displayName: 'Location',
    description: 'Physical or logical location',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      enumValues: ['office', 'home', 'branch', 'datacenter', 'cloud']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['location', 'environment'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_file_size',
    name: 'fileSize',
    displayName: 'File Size',
    description: 'Size of the file in bytes',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'number',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      minValue: 0
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['file', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_is_encrypted',
    name: 'isEncrypted',
    displayName: 'Is Encrypted',
    description: 'Whether the resource is encrypted',
    categories: ['resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'boolean',
    isRequired: false,
    isMultiValue: false,
    defaultValue: false,
    constraints: {},
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['security', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_user_roles',
    name: 'userRoles',
    displayName: 'User Roles',
    description: 'Array of roles assigned to the user',
    categories: ['subject'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'array',
    isRequired: false,
    isMultiValue: true,
    defaultValue: [],
    constraints: {
      enumValues: ['admin', 'manager', 'developer', 'analyst', 'viewer', 'auditor', 'guest']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['roles', 'subject', 'array'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_allowed_regions',
    name: 'allowedRegions',
    displayName: 'Allowed Regions',
    description: 'Array of regions where access is permitted',
    categories: ['subject', 'resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'array',
    isRequired: false,
    isMultiValue: true,
    defaultValue: [],
    constraints: {
      enumValues: ['us-east', 'us-west', 'eu-central', 'eu-west', 'ap-south', 'ap-east', 'global']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['location', 'region', 'array'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_tags',
    name: 'tags',
    displayName: 'Resource Tags',
    description: 'Array of tags associated with the resource',
    categories: ['resource', 'additional-resource'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'array',
    isRequired: false,
    isMultiValue: true,
    defaultValue: [],
    constraints: {
      enumValues: ['production', 'staging', 'development', 'testing', 'archived', 'deprecated', 'critical', 'public', 'internal']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['metadata', 'resource', 'array'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_permissions',
    name: 'permissions',
    displayName: 'Permissions',
    description: 'Array of permissions granted',
    categories: ['subject'],
    workspaceId: 'seed-workspace',
    applicationId: 'seed-app',
    environmentId: 'seed-env',
    dataType: 'array',
    isRequired: false,
    isMultiValue: true,
    defaultValue: [],
    constraints: {
      enumValues: ['read', 'write', 'delete', 'execute', 'admin', 'share', 'export', 'import']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['permissions', 'subject', 'array'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  }
];

async function seedAttributes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing attributes (optional)
    await Attribute.deleteMany({});
    logger.info('Cleared existing attributes');

    // Insert sample attributes
    const createdAttributes = await Attribute.insertMany(sampleAttributes);
    logger.info(`Created ${createdAttributes.length} sample attributes`);

    // Log the created attributes
    createdAttributes.forEach(attr => {
      logger.info(`Created attribute: ${attr.displayName} (${attr.id})`);
    });

    logger.info('Attribute seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding attributes:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAttributes();
}

export default seedAttributes;