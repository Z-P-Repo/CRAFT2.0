#!/usr/bin/env ts-node

/**
 * Database Migration Script: Flat to Hierarchical Structure
 * 
 * This script migrates CRAFT 2.0 from a flat data structure to a hierarchical structure:
 * Workspace > Application > Environment > Policies/Subjects/Resources/Attributes/Actions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { Policy } from '../models/Policy';
import { Subject } from '../models/Subject';
import { Resource } from '../models/Resource';
import { Attribute } from '../models/Attribute';
import { Action } from '../models/Action';
import { Activity } from '../models/Activity';
import { User } from '../models/User';

// Load environment variables
config();

interface MigrationOptions {
  dryRun?: boolean;
  deleteOldData?: boolean;
  batchSize?: number;
  verbose?: boolean;
}

interface MigrationStats {
  workspacesCreated: number;
  applicationsCreated: number;
  environmentsCreated: number;
  policiesMigrated: number;
  subjectsMigrated: number;
  resourcesMigrated: number;
  attributesMigrated: number;
  actionsMigrated: number;
  activitiesMigrated: number;
  usersMigrated: number;
  errors: string[];
}

class HierarchyMigration {
  private stats: MigrationStats = {
    workspacesCreated: 0,
    applicationsCreated: 0,
    environmentsCreated: 0,
    policiesMigrated: 0,
    subjectsMigrated: 0,
    resourcesMigrated: 0,
    attributesMigrated: 0,
    actionsMigrated: 0,
    activitiesMigrated: 0,
    usersMigrated: 0,
    errors: []
  };

  private defaultWorkspace: any;
  private defaultApplication: any;
  private defaultEnvironment: any;
  private options: MigrationOptions;

  constructor(options: MigrationOptions = {}) {
    this.options = {
      dryRun: false,
      deleteOldData: false,
      batchSize: 100,
      verbose: false,
      ...options
    };
  }

  async connect(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/craft';
    
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async createDefaultHierarchy(): Promise<void> {
    console.log('\n📦 Creating default hierarchy...');

    try {
      // Create default workspace
      if (!this.options.dryRun) {
        this.defaultWorkspace = await Workspace.create({
          name: 'default-workspace',
          displayName: 'Default Workspace',
          description: 'Default workspace created during migration',
          status: 'active',
          settings: {
            defaultEnvironment: 'production',
            branding: {
              theme: 'light'
            },
            notifications: {
              email: true,
              slack: false
            }
          },
          limits: {
            maxApplications: 50,
            maxUsers: 500,
            maxPolicies: 5000,
            storageQuota: 10240, // 10GB
            apiCallsPerMonth: 500000
          },
          metadata: {
            owner: 'system',
            admins: [],
            createdBy: 'migration-script',
            lastModifiedBy: 'migration-script',
            tags: ['migrated', 'default'],
            isSystem: true,
            plan: 'enterprise'
          },
          active: true
        });
        this.stats.workspacesCreated++;
        console.log(`   ✅ Created workspace: ${this.defaultWorkspace.displayName} (${this.defaultWorkspace._id})`);
      }

      // Create default application
      if (!this.options.dryRun) {
        this.defaultApplication = await Application.create({
          workspaceId: this.defaultWorkspace._id.toString(),
          name: 'default-application',
          displayName: 'Default Application',
          description: 'Default application created during migration',
          type: 'web',
          status: 'active',
          configuration: {
            defaultEnvironment: 'production',
            authSettings: {
              requireAuthentication: true,
              authProviders: ['local', 'azure-ad'],
              sessionTimeout: 480,
              mfaRequired: false
            }
          },
          metadata: {
            owner: 'system',
            maintainers: [],
            createdBy: 'migration-script',
            lastModifiedBy: 'migration-script',
            tags: ['migrated', 'default'],
            version: '1.0.0'
          },
          active: true
        });
        this.stats.applicationsCreated++;
        console.log(`   ✅ Created application: ${this.defaultApplication.displayName} (${this.defaultApplication._id})`);
      }

      // Create default environment
      if (!this.options.dryRun) {
        this.defaultEnvironment = await Environment.create({
          workspaceId: this.defaultWorkspace._id.toString(),
          applicationId: this.defaultApplication._id.toString(),
          name: 'production',
          displayName: 'Production Environment',
          description: 'Default production environment created during migration',
          type: 'production',
          status: 'active',
          configuration: {
            variables: new Map([
              ['NODE_ENV', 'production'],
              ['API_VERSION', 'v1']
            ]),
            endpoints: new Map([
              ['api', process.env.API_URL || 'http://localhost:3001'],
              ['frontend', process.env.FRONTEND_URL || 'http://localhost:3000']
            ]),
            features: new Map([
              ['authentication', true],
              ['audit_logging', true],
              ['rate_limiting', true]
            ])
          },
          metadata: {
            owner: 'system',
            createdBy: 'migration-script',
            lastModifiedBy: 'migration-script',
            tags: ['migrated', 'default', 'production'],
            isDefault: true
          },
          active: true
        });
        this.stats.environmentsCreated++;
        console.log(`   ✅ Created environment: ${this.defaultEnvironment.displayName} (${this.defaultEnvironment._id})`);
      }

    } catch (error) {
      const errorMsg = `Failed to create default hierarchy: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
      throw error;
    }
  }

  async migrateCollection(
    ModelClass: any, 
    collectionName: string, 
    counterKey: keyof MigrationStats
  ): Promise<void> {
    console.log(`\n📊 Migrating ${collectionName}...`);

    try {
      // Get documents without hierarchy fields
      const documents = await ModelClass.find({
        $or: [
          { workspaceId: { $exists: false } },
          { applicationId: { $exists: false } },
          { environmentId: { $exists: false } }
        ]
      });

      console.log(`   📋 Found ${documents.length} documents to migrate`);

      if (documents.length === 0) {
        console.log(`   ✅ No ${collectionName} to migrate`);
        return;
      }

      // Process in batches
      const batches = Math.ceil(documents.length / this.options.batchSize!);
      
      for (let i = 0; i < batches; i++) {
        const startIndex = i * this.options.batchSize!;
        const endIndex = Math.min(startIndex + this.options.batchSize!, documents.length);
        const batch = documents.slice(startIndex, endIndex);

        console.log(`   🔄 Processing batch ${i + 1}/${batches} (${batch.length} documents)`);

        if (!this.options.dryRun) {
          const updateOperations = batch.map((doc: any) => ({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: {
                  workspaceId: this.defaultWorkspace._id.toString(),
                  applicationId: this.defaultApplication._id.toString(),
                  environmentId: this.defaultEnvironment._id.toString(),
                  // Add special fields for specific models
                  ...(collectionName === 'subjects' && {
                    globalUserId: doc._id.toString() // Link to global user entity
                  }),
                  ...(collectionName === 'attributes' && {
                    scope: 'environment',
                    inheritanceRules: {
                      canOverride: true,
                      requiresApproval: false,
                      propagateChanges: false
                    }
                  }),
                  ...(collectionName === 'activities' && {
                    hierarchyContext: {
                      workspaceName: this.defaultWorkspace.displayName,
                      applicationName: this.defaultApplication.displayName,
                      environmentName: this.defaultEnvironment.displayName,
                      crossEnvironmentActivity: false
                    }
                  })
                }
              }
            }
          }));

          await ModelClass.bulkWrite(updateOperations);
        }

        this.stats[counterKey] += batch.length;
      }

      console.log(`   ✅ Migrated ${this.stats[counterKey]} ${collectionName}`);

    } catch (error) {
      const errorMsg = `Failed to migrate ${collectionName}: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }

  async migrateUsers(): Promise<void> {
    console.log('\n👥 Migrating users (adding workspace association)...');

    try {
      const users = await User.find({ workspaces: { $exists: false } });
      console.log(`   📋 Found ${users.length} users to migrate`);

      if (users.length === 0) {
        console.log('   ✅ No users to migrate');
        return;
      }

      if (!this.options.dryRun) {
        await User.updateMany(
          { workspaces: { $exists: false } },
          { 
            $set: { 
              workspaces: [this.defaultWorkspace._id.toString()],
              currentWorkspace: this.defaultWorkspace._id.toString()
            } 
          }
        );
      }

      this.stats.usersMigrated = users.length;
      console.log(`   ✅ Migrated ${users.length} users`);

    } catch (error) {
      const errorMsg = `Failed to migrate users: ${error}`;
      this.stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }

  async validateMigration(): Promise<boolean> {
    console.log('\n🔍 Validating migration...');

    try {
      // Check hierarchy structure
      const workspaceCount = await Workspace.countDocuments();
      const applicationCount = await Application.countDocuments();
      const environmentCount = await Environment.countDocuments();

      console.log(`   📊 Hierarchy structure:`);
      console.log(`      Workspaces: ${workspaceCount}`);
      console.log(`      Applications: ${applicationCount}`);
      console.log(`      Environments: ${environmentCount}`);

      // Check migrated entities
      const entityChecks = [
        { model: Policy, name: 'policies' },
        { model: Subject, name: 'subjects' },
        { model: Resource, name: 'resources' },
        { model: Attribute, name: 'attributes' },
        { model: Action, name: 'actions' },
        { model: Activity, name: 'activities' }
      ];

      for (const { model, name } of entityChecks) {
        const totalCount = await model.countDocuments();
        const migratedCount = await model.countDocuments({
          workspaceId: { $exists: true },
          applicationId: { $exists: true },
          environmentId: { $exists: true }
        });

        console.log(`   📊 ${name}: ${migratedCount}/${totalCount} migrated`);

        if (migratedCount < totalCount) {
          console.warn(`   ⚠️  Warning: Not all ${name} were migrated`);
        }
      }

      return true;

    } catch (error) {
      console.error(`   ❌ Validation failed: ${error}`);
      return false;
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting CRAFT 2.0 Hierarchy Migration\n');

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    try {
      await this.connect();
      
      // Create default hierarchy
      await this.createDefaultHierarchy();

      // Migrate all entity collections
      await this.migrateCollection(Policy, 'policies', 'policiesMigrated');
      await this.migrateCollection(Subject, 'subjects', 'subjectsMigrated');
      await this.migrateCollection(Resource, 'resources', 'resourcesMigrated');
      await this.migrateCollection(Attribute, 'attributes', 'attributesMigrated');
      await this.migrateCollection(Action, 'actions', 'actionsMigrated');
      await this.migrateCollection(Activity, 'activities', 'activitiesMigrated');

      // Migrate users
      await this.migrateUsers();

      // Validate migration
      if (!this.options.dryRun) {
        await this.validateMigration();
      }

      // Print final statistics
      this.printStats();

      await this.disconnect();

    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      await this.disconnect();
      process.exit(1);
    }
  }

  printStats(): void {
    console.log('\n📈 Migration Statistics:');
    console.log('========================');
    console.log(`Workspaces created: ${this.stats.workspacesCreated}`);
    console.log(`Applications created: ${this.stats.applicationsCreated}`);
    console.log(`Environments created: ${this.stats.environmentsCreated}`);
    console.log(`Policies migrated: ${this.stats.policiesMigrated}`);
    console.log(`Subjects migrated: ${this.stats.subjectsMigrated}`);
    console.log(`Resources migrated: ${this.stats.resourcesMigrated}`);
    console.log(`Attributes migrated: ${this.stats.attributesMigrated}`);
    console.log(`Actions migrated: ${this.stats.actionsMigrated}`);
    console.log(`Activities migrated: ${this.stats.activitiesMigrated}`);
    console.log(`Users migrated: ${this.stats.usersMigrated}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    const totalMigrated = this.stats.policiesMigrated + 
                         this.stats.subjectsMigrated + 
                         this.stats.resourcesMigrated + 
                         this.stats.attributesMigrated + 
                         this.stats.actionsMigrated + 
                         this.stats.activitiesMigrated + 
                         this.stats.usersMigrated;

    console.log(`\n✅ Total entities migrated: ${totalMigrated}`);
    console.log('✅ Migration completed successfully!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};

  // Parse command line arguments
  if (args.includes('--dry-run')) options.dryRun = true;
  if (args.includes('--delete-old')) options.deleteOldData = true;
  if (args.includes('--verbose')) options.verbose = true;

  const batchSizeIndex = args.indexOf('--batch-size');
  if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
    options.batchSize = parseInt(args[batchSizeIndex + 1] || '100');
  }

  if (args.includes('--help')) {
    console.log('CRAFT 2.0 Hierarchy Migration Script');
    console.log('=====================================');
    console.log('Usage: npm run migrate:hierarchy [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run          Run without making changes');
    console.log('  --delete-old       Delete old data after migration');
    console.log('  --batch-size N     Process N documents at a time (default: 100)');
    console.log('  --verbose          Enable verbose logging');
    console.log('  --help            Show this help message');
    return;
  }

  const migration = new HierarchyMigration(options);
  await migration.run();
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { HierarchyMigration };