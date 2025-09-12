import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { User } from '../models/User';

async function testWorkspaceAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/craft-abac-dev');
    console.log('Connected to MongoDB');

    const query = { active: true };
    
    console.log('\n=== TESTING WORKSPACE API QUERY ===');
    const workspaces = await Workspace.find(query)
      .populate('applicationsCount')
      .sort({ updatedAt: -1 })
      .limit(10);

    console.log('Found workspaces:', workspaces.length);

    // Fetch applications and environments for each workspace
    const workspacesWithDetails = await Promise.all(
      workspaces.map(async (workspace) => {
        console.log(`\n--- Processing workspace: ${workspace.name} ---`);
        console.log('Workspace metadata.createdBy:', workspace.metadata?.createdBy);
        
        const applications = await Application.find({ 
          workspaceId: workspace._id, 
          active: true 
        }).lean();
        
        console.log(`Found ${applications.length} applications`);
        
        const applicationsWithEnvs = await Promise.all(
          applications.map(async (app) => {
            const environments = await Environment.find({
              workspaceId: workspace._id,
              applicationId: app._id,
              active: true
            }).lean();
            
            console.log(`Application ${app.name} has ${environments.length} environments`);
            
            return {
              ...app,
              environments
            };
          })
        );
        
        return {
          ...workspace.toObject(),
          applications: applicationsWithEnvs
        };
      })
    );

    console.log('\n=== FINAL RESULT ===');
    workspacesWithDetails.forEach(workspace => {
      console.log(`Workspace: ${workspace.name}`);
      console.log(`  Created by: ${workspace.metadata?.createdBy?.name || 'null'}`);
      console.log(`  Applications: ${workspace.applications?.length || 0}`);
      workspace.applications?.forEach((app: any) => {
        console.log(`    App: ${app.name} (${app.environments?.length || 0} environments)`);
      });
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkspaceAPI();