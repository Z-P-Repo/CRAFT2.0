import mongoose from 'mongoose';
import { Attribute } from '@/models/Attribute';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

const additionalAttributes = [
  // Subject Attributes
  {
    id: 'attr_user_role',
    name: 'userRole',
    displayName: 'User Role',
    description: 'Role assigned to the user within the organization',
    category: 'subject',
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    defaultValue: 'employee',
    constraints: {
      enumValues: ['admin', 'manager', 'employee', 'contractor', 'guest', 'auditor']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['authorization', 'role', 'subject'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_employee_id',
    name: 'employeeId',
    displayName: 'Employee ID',
    description: 'Unique identifier for employees',
    category: 'subject',
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    constraints: {
      pattern: '^EMP[0-9]{6}$',
      minLength: 9,
      maxLength: 9
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['identity', 'unique', 'subject'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_security_level',
    name: 'securityLevel',
    displayName: 'Security Level',
    description: 'Security clearance level for accessing classified information',
    category: 'subject',
    dataType: 'number',
    isRequired: false,
    isMultiValue: false,
    defaultValue: 0,
    constraints: {
      minValue: 0,
      maxValue: 10,
      enumValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['security', 'clearance', 'subject'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },

  // Resource Attributes
  {
    id: 'attr_file_type',
    name: 'fileType',
    displayName: 'File Type',
    description: 'Type of file or document',
    category: 'resource',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      enumValues: ['document', 'spreadsheet', 'presentation', 'image', 'video', 'audio', 'archive', 'executable', 'database']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['file', 'type', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_sensitivity_level',
    name: 'sensitivityLevel',
    displayName: 'Sensitivity Level',
    description: 'Data sensitivity classification',
    category: 'resource',
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    defaultValue: 'low',
    constraints: {
      enumValues: ['low', 'medium', 'high', 'critical', 'top-secret']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['sensitivity', 'classification', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_data_owner',
    name: 'dataOwner',
    displayName: 'Data Owner',
    description: 'Person or department responsible for the data',
    category: 'resource',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      enumValues: ['IT', 'HR', 'Finance', 'Legal', 'Marketing', 'Operations', 'Executive']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['ownership', 'responsibility', 'resource'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },

  // Environment Attributes
  {
    id: 'attr_network_zone',
    name: 'networkZone',
    displayName: 'Network Zone',
    description: 'Network security zone from which access is requested',
    category: 'environment',
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    defaultValue: 'internal',
    constraints: {
      enumValues: ['dmz', 'internal', 'external', 'guest', 'secure', 'quarantine']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['network', 'security', 'environment'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_device_type',
    name: 'deviceType',
    displayName: 'Device Type',
    description: 'Type of device being used for access',
    category: 'environment',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      enumValues: ['laptop', 'desktop', 'tablet', 'smartphone', 'server', 'iot', 'unknown']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['device', 'hardware', 'environment'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_ip_address',
    name: 'ipAddress',
    displayName: 'IP Address',
    description: 'IP address of the requesting device',
    category: 'environment',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      format: 'ipv4'
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['network', 'identity', 'environment'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },

  // Action Attributes
  {
    id: 'attr_operation_type',
    name: 'operationType',
    displayName: 'Operation Type',
    description: 'Type of operation being performed',
    category: 'action',
    dataType: 'string',
    isRequired: true,
    isMultiValue: false,
    constraints: {
      enumValues: ['create', 'read', 'update', 'delete', 'execute', 'download', 'upload', 'share', 'approve']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['operation', 'crud', 'action'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_requires_approval',
    name: 'requiresApproval',
    displayName: 'Requires Approval',
    description: 'Whether this action requires managerial approval',
    category: 'action',
    dataType: 'boolean',
    isRequired: false,
    isMultiValue: false,
    defaultValue: false,
    constraints: {},
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['approval', 'workflow', 'action'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_urgency_level',
    name: 'urgencyLevel',
    displayName: 'Urgency Level',
    description: 'Priority level of the requested action',
    category: 'action',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    defaultValue: 'normal',
    constraints: {
      enumValues: ['low', 'normal', 'high', 'urgent', 'emergency']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['priority', 'urgency', 'action'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },

  // Custom/Business Specific Attributes
  {
    id: 'attr_project_code',
    name: 'projectCode',
    displayName: 'Project Code',
    description: 'Project identifier for resource access tracking',
    category: 'subject',
    dataType: 'string',
    isRequired: false,
    isMultiValue: true,
    constraints: {
      pattern: '^PROJ-[A-Z0-9]{4}$',
      minLength: 9,
      maxLength: 9
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['project', 'tracking', 'custom'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  },
  {
    id: 'attr_cost_center',
    name: 'costCenter',
    displayName: 'Cost Center',
    description: 'Financial cost center for billing purposes',
    category: 'subject',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    constraints: {
      pattern: '^CC-[0-9]{4}$',
      enumValues: ['CC-1001', 'CC-1002', 'CC-1003', 'CC-2001', 'CC-2002', 'CC-3001']
    },
    validation: {},
    metadata: {
      createdBy: 'system',
      lastModifiedBy: 'system',
      tags: ['finance', 'billing', 'custom'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    mapping: {},
    active: true
  }
];

async function addMoreAttributes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for adding more attributes');

    // Insert additional attributes
    const createdAttributes = await Attribute.insertMany(additionalAttributes);
    logger.info(`Added ${createdAttributes.length} additional attributes`);

    // Log the created attributes by category
    const categories = ['subject', 'resource', 'environment', 'action'];
    categories.forEach(category => {
      const categoryAttrs = createdAttributes.filter(attr => attr.category === category);
      logger.info(`${category.toUpperCase()}: ${categoryAttrs.map(attr => attr.displayName).join(', ')}`);
    });

    // Get total count
    const totalCount = await Attribute.countDocuments();
    logger.info(`Total attributes in database: ${totalCount}`);

    logger.info('Additional attributes added successfully');
  } catch (error) {
    logger.error('Error adding additional attributes:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  addMoreAttributes();
}

export default addMoreAttributes;