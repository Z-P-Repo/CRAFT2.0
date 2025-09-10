import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for user creation');

    // Create test user
    const userData = {
      _id: new mongoose.Types.ObjectId(),
      globalUserId: 'test-user-global',
      email: 'test@example.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      phoneNumber: '+1234567890',
      phoneVerified: false,
      metadata: {
        createdBy: 'system',
        lastModifiedBy: 'system',
        tags: ['test'],
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          screenReader: false
        }
      },
      loginHistory: [],
      currentWorkspace: 'seed-workspace',
      workspaces: ['seed-workspace'],
      lastLogin: new Date(),
      passwordLastChanged: new Date(),
      mfaEnabled: false,
      active: true
    };

    // Insert the user directly
    await mongoose.connection.collection('users').insertOne(userData);
    logger.info('Created test user: test@example.com');

    logger.info('Test user creation completed successfully');
  } catch (error) {
    logger.error('Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  createTestUser();
}

export default createTestUser;