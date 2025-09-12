import mongoose from 'mongoose';
import { config } from '../config/environment';

async function debugApplications() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check all workspaces
    const workspaces = await db?.collection('workspaces').find({}).toArray();
    console.log('\n📁 Workspaces:');
    workspaces?.forEach(ws => {
      console.log(`  - ${ws.displayName} (${ws.name}): ${ws._id}`);
    });

    // Check all applications
    const applications = await db?.collection('applications').find({}).toArray();
    console.log('\n🚀 Applications:');
    if (applications && applications.length > 0) {
      applications.forEach(app => {
        console.log(`  - ${app.displayName} (${app.name}): ${app._id}`);
        console.log(`    workspaceId: ${app.workspaceId}`);
        console.log(`    active: ${app.active}`);
        console.log('');
      });
    } else {
      console.log('  No applications found');
    }

    // Check all environments
    const environments = await db?.collection('environments').find({}).toArray();
    console.log('\n🌱 Environments:');
    if (environments && environments.length > 0) {
      environments.forEach(env => {
        console.log(`  - ${env.displayName} (${env.name}): ${env._id}`);
        console.log(`    workspaceId: ${env.workspaceId}`);
        console.log(`    applicationId: ${env.applicationId}`);
        console.log(`    active: ${env.active}`);
        console.log('');
      });
    } else {
      console.log('  No environments found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugApplications();