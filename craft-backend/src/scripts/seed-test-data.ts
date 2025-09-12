import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { User } from '../models/User';

async function seedTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/craft-abac-dev');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Application.deleteMany({});
    await Environment.deleteMany({});
    console.log('Cleared existing data');

    // Create test user
    const testUser = await User.create({
      email: 'admin@craftabac.com',
      password: 'password123',
      name: 'System Administrator',
      role: 'super_admin',
      attributes: {},
      active: true,
      authProvider: 'local'
    });
    
    console.log('Created test user:', { testUserId: testUser._id });
    const testUserId = testUser._id;

    // Create test workspaces
    const dxpWorkspace = await Workspace.create({
      name: 'DXP',
      displayName: 'Digital Experience Platform',
      description: 'Digital Experience Platform workspace',
      metadata: {
        owner: testUserId,
        admins: [],
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['platform', 'digital'],
        isSystem: false,
        plan: 'professional'
      }
    });

    const analyticsWorkspace = await Workspace.create({
      name: 'Analytics',
      displayName: 'Analytics Platform',
      description: 'Analytics and reporting workspace',
      metadata: {
        owner: testUserId,
        admins: [],
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['analytics', 'reporting'],
        isSystem: false,
        plan: 'free'
      }
    });

    console.log('Created workspaces:', { dxpWorkspace: dxpWorkspace._id, analyticsWorkspace: analyticsWorkspace._id });

    // Create applications under DXP workspace
    const nreApp = await Application.create({
      name: 'NRE',
      displayName: 'Network Resource Engine',
      description: 'Network Resource Engine application',
      type: 'web',
      workspaceId: dxpWorkspace._id,
      metadata: {
        owner: testUserId,
        maintainers: [],
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['network', 'engine'],
        version: '1.0.0'
      }
    });

    const portalApp = await Application.create({
      name: 'Portal',
      displayName: 'Customer Portal',
      description: 'Customer portal application',
      type: 'web',
      workspaceId: dxpWorkspace._id,
      metadata: {
        owner: testUserId,
        maintainers: [],
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['customer', 'portal'],
        version: '1.0.0'
      }
    });

    // Create application under Analytics workspace
    const dashboardApp = await Application.create({
      name: 'Dashboard',
      displayName: 'Analytics Dashboard',
      description: 'Analytics dashboard application',
      type: 'web',
      workspaceId: analyticsWorkspace._id,
      metadata: {
        owner: testUserId,
        maintainers: [],
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['analytics', 'dashboard'],
        version: '1.0.0'
      }
    });

    console.log('Created applications:', { 
      nreApp: nreApp._id, 
      portalApp: portalApp._id, 
      dashboardApp: dashboardApp._id 
    });

    // Create environments for NRE application
    const nreDevEnv = await Environment.create({
      name: 'development',
      displayName: 'Development',
      description: 'Development environment for NRE',
      type: 'development',
      workspaceId: dxpWorkspace._id,
      applicationId: nreApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['dev', 'nre'],
        isDefault: true
      }
    });

    const nreStagingEnv = await Environment.create({
      name: 'staging',
      displayName: 'Staging',
      description: 'Staging environment for NRE',
      type: 'staging',
      workspaceId: dxpWorkspace._id,
      applicationId: nreApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['staging', 'nre'],
        isDefault: false
      }
    });

    const nreProdEnv = await Environment.create({
      name: 'production',
      displayName: 'Production',
      description: 'Production environment for NRE',
      type: 'production',
      workspaceId: dxpWorkspace._id,
      applicationId: nreApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['prod', 'nre'],
        isDefault: false
      }
    });

    // Create environments for Portal application
    const portalDevEnv = await Environment.create({
      name: 'development',
      displayName: 'Development',
      description: 'Development environment for Portal',
      type: 'development',
      workspaceId: dxpWorkspace._id,
      applicationId: portalApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['dev', 'portal'],
        isDefault: true
      }
    });

    const portalProdEnv = await Environment.create({
      name: 'production',
      displayName: 'Production',
      description: 'Production environment for Portal',
      type: 'production',
      workspaceId: dxpWorkspace._id,
      applicationId: portalApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['prod', 'portal'],
        isDefault: false
      }
    });

    // Create environments for Dashboard application
    const dashboardDevEnv = await Environment.create({
      name: 'development',
      displayName: 'Development',
      description: 'Development environment for Dashboard',
      type: 'development',
      workspaceId: analyticsWorkspace._id,
      applicationId: dashboardApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['dev', 'dashboard'],
        isDefault: true
      }
    });

    const dashboardProdEnv = await Environment.create({
      name: 'production',
      displayName: 'Production',
      description: 'Production environment for Dashboard',
      type: 'production',
      workspaceId: analyticsWorkspace._id,
      applicationId: dashboardApp._id,
      metadata: {
        owner: testUserId,
        createdBy: testUserId,
        lastModifiedBy: testUserId,
        tags: ['prod', 'dashboard'],
        isDefault: false
      }
    });

    console.log('Created environments:', {
      nreEnvironments: [nreDevEnv._id, nreStagingEnv._id, nreProdEnv._id],
      portalEnvironments: [portalDevEnv._id, portalProdEnv._id],
      dashboardEnvironments: [dashboardDevEnv._id, dashboardProdEnv._id]
    });

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Test data created successfully!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedTestData();