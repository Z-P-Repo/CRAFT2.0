import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

async function createSuperAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for superadmin user creation');

    // Superadmin credentials
    const email = 'superadmin@craft.com';
    const password = 'SuperAdmin123!';
    const name = 'Super Administrator';

    // Check if superadmin already exists
    const existingUser = await mongoose.connection.collection('users').findOne({ 
      email: email 
    });

    if (existingUser) {
      logger.info('Superadmin user already exists, updating credentials...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
      
      // Update existing user
      await mongoose.connection.collection('users').updateOne(
        { email: email },
        {
          $set: {
            password: hashedPassword,
            role: 'super_admin',
            active: true,
            name: name,
            lastLogin: new Date(),
            passwordLastChanged: new Date(),
          }
        }
      );
      
      logger.info('Superadmin user credentials updated successfully');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

      // Create superadmin user
      const userData = {
        _id: new mongoose.Types.ObjectId(),
        email: email,
        password: hashedPassword,
        name: name,
        role: 'super_admin',
        active: true,
        authProvider: 'local',
        lastLoginAt: new Date(),
        workspaces: ['seed-workspace'],
        currentWorkspace: 'seed-workspace',
        workspaceRoles: new Map([
          ['seed-workspace', {
            role: 'owner',
            permissions: ['*'],
            joinedAt: new Date()
          }]
        ])
      };

      // Insert the superadmin user
      await mongoose.connection.collection('users').insertOne(userData);
      logger.info('Superadmin user created successfully');
    }

    // Display credentials
    logger.info('='.repeat(60));
    logger.info('SUPERADMIN USER CREDENTIALS:');
    logger.info('='.repeat(60));
    logger.info(`Email: ${email}`);
    logger.info(`Password: ${password}`);
    logger.info(`Role: super_admin`);
    logger.info('='.repeat(60));
    logger.info('IMPORTANT: Save these credentials securely!');
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Error creating superadmin user:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  createSuperAdminUser();
}

export default createSuperAdminUser;