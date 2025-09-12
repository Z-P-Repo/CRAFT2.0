import mongoose from 'mongoose';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { Workspace } from '../models/Workspace';

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/craft-abac-dev');
    console.log('Connected to MongoDB');

    console.log('=== WORKSPACES ===');
    const workspaces = await Workspace.find({}).select('name displayName _id').lean();
    console.log(JSON.stringify(workspaces, null, 2));

    console.log('\n=== APPLICATIONS ===');
    const applications = await Application.find({}).select('name displayName workspaceId _id').lean();
    console.log(JSON.stringify(applications, null, 2));

    console.log('\n=== ENVIRONMENTS ===');
    const environments = await Environment.find({}).select('name displayName workspaceId applicationId _id').lean();
    console.log(JSON.stringify(environments, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();