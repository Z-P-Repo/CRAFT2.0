import mongoose from 'mongoose';
import { Attribute } from '@/models/Attribute';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

const testAttribute = {
  id: 'attr_test_deletable_' + Date.now(),
  name: 'testDeletable' + Date.now(),
  displayName: 'Test Deletable Attribute',
  description: 'A test attribute that can be safely deleted',
  category: 'subject',
  dataType: 'string',
  isRequired: false,
  isMultiValue: false,
  constraints: {
    enumValues: ['test1', 'test2', 'test3']
  },
  validation: {},
  metadata: {
    createdBy: 'system',
    lastModifiedBy: 'system',
    tags: ['test', 'deletable'],
    isSystem: false,  // This makes it deletable
    isCustom: true,
    version: '1.0.0'
  },
  mapping: {},
  active: true
};

async function addTestAttribute() {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB for adding test attribute');

    const createdAttribute = await Attribute.create(testAttribute);
    logger.info(`Test attribute created: ${createdAttribute.displayName} (ID: ${createdAttribute._id})`);

    console.log(`Created deletable attribute with ID: ${createdAttribute._id}`);
  } catch (error) {
    logger.error('Error adding test attribute:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

addTestAttribute();