import mongoose from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { config } from '../config/environment';

// Map old invalid string IDs to proper ObjectIds
const invalidIdMapping: Record<string, string> = {
  'test-user-id': '507f1f77bcf86cd799439011',
  'test-user-global': '507f1f77bcf86cd799439011'
};

async function migrateUserReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Just verify the target ObjectId exists for mapping
    const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    console.log('✅ Using target ObjectId for migration:', testUserId.toString());

    // Get all users for reference
    const users = await User.find({}).select('_id email');
    console.log(`Found ${users.length} users`);

    // Create a map for easier lookup (if needed)
    const userMap = new Map();
    users.forEach(user => {
      if (user._id) {
        userMap.set(user._id.toString(), user._id);
      }
    });

    // Update Workspaces - convert string refs to ObjectIds and handle invalid IDs
    if (!mongoose.connection.db) {
      throw new Error('Database connection not available');
    }
    const db = mongoose.connection.db;
    const workspaces = await db.collection('workspaces').find({}).toArray();
    console.log(`Processing ${workspaces.length} workspaces...`);
    
    for (const workspace of workspaces) {
      const updates: any = {};
      
      // Helper function to convert ID (handles invalid IDs)
      const convertId = (id: string): mongoose.Types.ObjectId => {
        if (invalidIdMapping[id]) {
          return new mongoose.Types.ObjectId(invalidIdMapping[id]);
        }
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          console.warn(`Invalid ObjectId: ${id}, using default test user ID`);
          return new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        }
      };
      
      if (workspace.metadata?.owner && typeof workspace.metadata.owner === 'string') {
        updates['metadata.owner'] = convertId(workspace.metadata.owner);
      }
      if (workspace.metadata?.createdBy && typeof workspace.metadata.createdBy === 'string') {
        updates['metadata.createdBy'] = convertId(workspace.metadata.createdBy);
      }
      if (workspace.metadata?.lastModifiedBy && typeof workspace.metadata.lastModifiedBy === 'string') {
        updates['metadata.lastModifiedBy'] = convertId(workspace.metadata.lastModifiedBy);
      }
      if (workspace.metadata?.admins && Array.isArray(workspace.metadata.admins)) {
        updates['metadata.admins'] = workspace.metadata.admins
          .filter((admin: any) => typeof admin === 'string')
          .map((admin: string) => convertId(admin));
      }

      if (Object.keys(updates).length > 0) {
        await db.collection('workspaces').updateOne(
          { _id: workspace._id },
          { $set: updates }
        );
      }
    }

    // Update Applications
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`Processing ${applications.length} applications...`);
    
    for (const app of applications) {
      const updates: any = {};
      
      // Helper function to convert ID (handles invalid IDs)
      const convertId = (id: string): mongoose.Types.ObjectId => {
        if (invalidIdMapping[id]) {
          return new mongoose.Types.ObjectId(invalidIdMapping[id]);
        }
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          console.warn(`Invalid ObjectId: ${id}, using default test user ID`);
          return new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        }
      };
      
      if (app.metadata?.owner && typeof app.metadata.owner === 'string') {
        updates['metadata.owner'] = convertId(app.metadata.owner);
      }
      if (app.metadata?.createdBy && typeof app.metadata.createdBy === 'string') {
        updates['metadata.createdBy'] = convertId(app.metadata.createdBy);
      }
      if (app.metadata?.lastModifiedBy && typeof app.metadata.lastModifiedBy === 'string') {
        updates['metadata.lastModifiedBy'] = convertId(app.metadata.lastModifiedBy);
      }
      if (app.metadata?.maintainers && Array.isArray(app.metadata.maintainers)) {
        updates['metadata.maintainers'] = app.metadata.maintainers
          .filter((maintainer: any) => typeof maintainer === 'string')
          .map((maintainer: string) => convertId(maintainer));
      }

      if (Object.keys(updates).length > 0) {
        await db.collection('applications').updateOne(
          { _id: app._id },
          { $set: updates }
        );
      }
    }

    // Update Environments
    const environments = await db.collection('environments').find({}).toArray();
    console.log(`Processing ${environments.length} environments...`);
    
    for (const env of environments) {
      const updates: any = {};
      
      // Helper function to convert ID (handles invalid IDs)
      const convertId = (id: string): mongoose.Types.ObjectId => {
        if (invalidIdMapping[id]) {
          return new mongoose.Types.ObjectId(invalidIdMapping[id]);
        }
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          console.warn(`Invalid ObjectId: ${id}, using default test user ID`);
          return new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        }
      };
      
      if (env.metadata?.owner && typeof env.metadata.owner === 'string') {
        updates['metadata.owner'] = convertId(env.metadata.owner);
      }
      if (env.metadata?.createdBy && typeof env.metadata.createdBy === 'string') {
        updates['metadata.createdBy'] = convertId(env.metadata.createdBy);
      }
      if (env.metadata?.lastModifiedBy && typeof env.metadata.lastModifiedBy === 'string') {
        updates['metadata.lastModifiedBy'] = convertId(env.metadata.lastModifiedBy);
      }
      if (env.metadata?.promotionRules?.approvers && Array.isArray(env.metadata.promotionRules.approvers)) {
        updates['metadata.promotionRules.approvers'] = env.metadata.promotionRules.approvers
          .filter((approver: any) => typeof approver === 'string')
          .map((approver: string) => convertId(approver));
      }

      if (Object.keys(updates).length > 0) {
        await db.collection('environments').updateOne(
          { _id: env._id },
          { $set: updates }
        );
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

migrateUserReferences();