import mongoose, { Types } from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { config } from '../config/environment';

async function seedHierarchy() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Use the same ObjectId as in auth middleware for consistency
    const testUserId = new Types.ObjectId('507f1f77bcf86cd799439011');

    // Create sample user
    const user = new User({
      _id: testUserId,
      email: 'admin@example.com',
      password: '$2a$12$wJXqJVMZzP5vP5Q8yYo5M.Zj1Y8X7QfN5d7H8kSg2vAw9C1bGdF8e', // password: admin123
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      active: true
    });

    let savedUser = await User.findOne({ email: 'admin@example.com' });
    if (!savedUser) {
      savedUser = await user.save();
      console.log('✅ Created sample user:', savedUser.email);
    } else {
      console.log('✅ Using existing user:', savedUser.email);
    }

    // Create sample workspace
    const workspace = new Workspace({
      name: 'demo-company',
      displayName: 'Demo Company',
      description: 'Demo workspace for testing the application',
      status: 'active',
      settings: {
        defaultEnvironment: 'development',
        allowedDomains: ['demo-company.com'],
        notifications: {
          email: true,
          slack: false
        }
      },
      limits: {
        maxApplications: 10,
        maxUsers: 100,
        maxPolicies: 1000,
        storageQuota: 1024,
        apiCallsPerMonth: 100000
      },
      metadata: {
        owner: savedUser._id?.toString() || testUserId.toString(),
        admins: [],
        createdBy: savedUser._id?.toString() || testUserId.toString(),
        lastModifiedBy: savedUser._id?.toString() || testUserId.toString(),
        tags: ['demo', 'testing'],
        isSystem: false,
        plan: 'professional'
      },
      active: true
    });

    let savedWorkspace = await Workspace.findOne({ name: 'demo-company' });
    if (!savedWorkspace) {
      savedWorkspace = await workspace.save();
      console.log('✅ Created sample workspace:', savedWorkspace.displayName);
    } else {
      console.log('✅ Using existing workspace:', savedWorkspace.displayName);
    }

    // Create sample applications
    const applications = [
      {
        workspaceId: savedWorkspace._id.toString(),
        name: 'web-portal',
        displayName: 'Web Portal',
        description: 'Customer facing web portal application',
        type: 'web',
        status: 'active',
        configuration: {
          authSettings: {
            requireAuthentication: true,
            authProviders: ['local', 'azure-ad'],
            sessionTimeout: 480,
            mfaRequired: false
          }
        },
        metadata: {
          owner: savedUser._id?.toString() || testUserId.toString(),
          maintainers: [],
          createdBy: savedUser._id?.toString() || testUserId.toString(),
          lastModifiedBy: savedUser._id?.toString() || testUserId.toString(),
          tags: ['web', 'customer'],
          version: '1.0.0'
        }
      },
      {
        workspaceId: savedWorkspace._id.toString(),
        name: 'api-service',
        displayName: 'API Service',
        description: 'Backend API service for all applications',
        type: 'api',
        status: 'active',
        configuration: {
          authSettings: {
            requireAuthentication: true,
            authProviders: ['local', 'azure-ad'],
            sessionTimeout: 480,
            mfaRequired: false
          }
        },
        metadata: {
          owner: savedUser._id?.toString() || testUserId.toString(),
          maintainers: [],
          createdBy: savedUser._id?.toString() || testUserId.toString(),
          lastModifiedBy: savedUser._id?.toString() || testUserId.toString(),
          tags: ['api', 'backend'],
          version: '1.0.0'
        }
      }
    ];

    const savedApplications = [];
    for (const appData of applications) {
      let existingApp = await Application.findOne({ 
        workspaceId: appData.workspaceId, 
        name: appData.name 
      });
      
      if (!existingApp) {
        const app = new Application(appData);
        existingApp = await app.save();
        console.log('✅ Created application:', existingApp.displayName);
      } else {
        console.log('✅ Using existing application:', existingApp.displayName);
      }
      
      savedApplications.push(existingApp);
    }

    // Create sample environments for each application
    const environmentTypes = [
      {
        name: 'development',
        displayName: 'Development',
        description: 'Development environment for active development',
        type: 'development',
        isDefault: true
      },
      {
        name: 'staging',
        displayName: 'Staging',
        description: 'Staging environment for testing',
        type: 'staging',
        isDefault: false
      },
      {
        name: 'production',
        displayName: 'Production',
        description: 'Production environment for live deployment',
        type: 'production',
        isDefault: false
      }
    ];

    for (const app of savedApplications) {
      for (const envData of environmentTypes) {
        let existingEnv = await Environment.findOne({
          workspaceId: savedWorkspace._id.toString(),
          applicationId: app._id.toString(),
          name: envData.name
        });

        if (!existingEnv) {
          const environment = new Environment({
            workspaceId: savedWorkspace._id.toString(),
            applicationId: app._id.toString(),
            name: envData.name,
            displayName: envData.displayName,
            description: envData.description,
            type: envData.type,
            status: 'active',
            configuration: {
              variables: new Map([
                ['NODE_ENV', envData.type === 'production' ? 'production' : 'development'],
                ['PORT', envData.type === 'production' ? '8080' : '3000']
              ]),
              endpoints: new Map([
                ['api', `https://${envData.name}-api.demo-company.com`],
                ['web', `https://${envData.name}.demo-company.com`]
              ]),
              features: new Map([
                ['debugging', envData.type !== 'production'],
                ['analytics', true],
                ['caching', envData.type === 'production']
              ]),
              databases: {
                primary: {
                  host: envData.type === 'production' ? 'prod-db.demo-company.com' : 'localhost',
                  port: 27017,
                  database: `craft_${envData.type}`,
                  ssl: envData.type === 'production'
                }
              }
            },
            metadata: {
              owner: savedUser._id?.toString() || testUserId.toString(),
              createdBy: savedUser._id?.toString() || testUserId.toString(),
              lastModifiedBy: savedUser._id?.toString() || testUserId.toString(),
              tags: [envData.type],
              isDefault: envData.isDefault
            },
            active: true
          });

          await environment.save();
          console.log(`✅ Created environment: ${app.displayName} - ${environment.displayName}`);
        } else {
          console.log(`✅ Using existing environment: ${app.displayName} - ${existingEnv.displayName}`);
        }
      }
    }

    console.log('\n🎉 Hierarchy seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding hierarchy:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

seedHierarchy();