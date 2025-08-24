import mongoose from 'mongoose';
import { Subject } from '@/models/Subject';
import { logger } from '@/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const sampleSubjects = [
  {
    id: 'subject-john-doe',
    name: 'johnDoe',
    displayName: 'John Doe',
    email: 'john.doe@company.com',
    type: 'user',
    role: 'Admin',
    department: 'IT',
    description: 'System Administrator with full access',
    status: 'active',
    permissions: ['read', 'write', 'delete', 'admin'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['admin', 'it', 'critical'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true,
    lastLogin: new Date('2024-01-21T10:30:00Z')
  },
  {
    id: 'subject-jane-smith',
    name: 'janeSmith',
    displayName: 'Jane Smith',
    email: 'jane.smith@company.com',
    type: 'user',
    role: 'Manager',
    department: 'HR',
    description: 'HR Manager responsible for employee relations',
    status: 'active',
    permissions: ['read', 'write'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['manager', 'hr'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true,
    lastLogin: new Date('2024-01-21T09:15:00Z')
  },
  {
    id: 'subject-developers-group',
    name: 'developers',
    displayName: 'Developers',
    email: 'developers@company.com',
    type: 'group',
    role: 'Developer',
    department: 'Engineering',
    description: 'Development team group with code access',
    status: 'active',
    permissions: ['read', 'write', 'code_review'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['group', 'dev', 'engineering'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true
  },
  {
    id: 'subject-bob-johnson',
    name: 'bobJohnson',
    displayName: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    type: 'user',
    role: 'User',
    department: 'Sales',
    description: 'Sales Representative',
    status: 'inactive',
    permissions: ['read'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['user', 'sales'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: false,
    lastLogin: new Date('2024-01-19T14:22:00Z')
  },
  {
    id: 'subject-alice-wong',
    name: 'aliceWong',
    displayName: 'Alice Wong',
    email: 'alice.wong@company.com',
    type: 'user',
    role: 'Senior Developer',
    department: 'Engineering',
    description: 'Senior Software Engineer working on core systems',
    status: 'active',
    permissions: ['read', 'write', 'deploy'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['senior', 'dev', 'core'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true,
    lastLogin: new Date('2024-01-22T08:45:00Z')
  },
  {
    id: 'subject-system-admin',
    name: 'systemAdmin',
    displayName: 'System Administrator',
    email: 'admin@system.local',
    type: 'role',
    role: 'System Admin',
    department: 'System',
    description: 'System level administrator role',
    status: 'active',
    permissions: ['*'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['system', 'admin', 'critical'],
      isSystem: true,
      isCustom: false,
      version: '1.0.0'
    },
    active: true
  },
  {
    id: 'subject-marketing-team',
    name: 'marketingTeam',
    displayName: 'Marketing Team',
    email: 'marketing@company.com',
    type: 'group',
    role: 'Marketing Specialist',
    department: 'Marketing',
    description: 'Marketing team with content creation access',
    status: 'active',
    permissions: ['read', 'write', 'content_create'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['group', 'marketing', 'content'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true
  },
  {
    id: 'subject-david-chen',
    name: 'davidChen',
    displayName: 'David Chen',
    email: 'david.chen@company.com',
    type: 'user',
    role: 'QA Engineer',
    department: 'Quality Assurance',
    description: 'Quality Assurance Engineer focusing on automated testing',
    status: 'active',
    permissions: ['read', 'test_create', 'test_execute'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['qa', 'testing', 'automation'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true,
    lastLogin: new Date('2024-01-20T16:30:00Z')
  },
  {
    id: 'subject-security-team',
    name: 'securityTeam',
    displayName: 'Security Team',
    email: 'security@company.com',
    type: 'group',
    role: 'Security Analyst',
    department: 'Security',
    description: 'Information security team with audit access',
    status: 'active',
    permissions: ['read', 'audit', 'security_scan'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['group', 'security', 'audit'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: true
  },
  {
    id: 'subject-guest-user',
    name: 'guestUser',
    displayName: 'Guest User',
    type: 'user',
    role: 'Guest',
    department: 'External',
    description: 'Temporary guest user account',
    status: 'inactive',
    permissions: ['read'],
    metadata: {
      createdBy: 'System Administrator',
      lastModifiedBy: 'System Administrator',
      tags: ['guest', 'temporary'],
      isSystem: false,
      isCustom: true,
      version: '1.0.0'
    },
    active: false
  }
];

async function seedSubjects() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/craft_permissions';
    await mongoose.connect(mongoUri);
    
    logger.info('Connected to MongoDB');

    // Clear existing subjects
    await Subject.deleteMany({});
    logger.info('Cleared existing subjects');

    // Insert sample subjects
    const createdSubjects = await Subject.insertMany(sampleSubjects);
    logger.info(`Successfully seeded ${createdSubjects.length} subjects`);

    // Log the created subjects
    createdSubjects.forEach(subject => {
      logger.info(`Created subject: ${subject.displayName} (${subject.type}) - ${subject.department}`);
    });

  } catch (error) {
    logger.error('Error seeding subjects:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the seed function if called directly
if (require.main === module) {
  seedSubjects();
}

export { seedSubjects, sampleSubjects };