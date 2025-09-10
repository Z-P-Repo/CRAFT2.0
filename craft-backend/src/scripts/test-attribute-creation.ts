import mongoose from 'mongoose';
import { Attribute } from '../models/Attribute';
import { config } from '../config/environment';

async function testAttributeCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Test creating an attribute with enumValues
    const testAttribute = {
      id: 'test_roles',
      name: 'test_roles',
      displayName: 'Test Roles',
      description: 'Test attribute with permitted values',
      categories: ['subject'],
      dataType: 'string',
      workspaceId: 'test-workspace',
      applicationId: 'test-app',
      environmentId: 'test-env',
      constraints: {
        enumValues: ['admin', 'user', 'guest']
      },
      metadata: {
        createdBy: 'test',
        lastModifiedBy: 'test',
        tags: [],
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      }
    };

    console.log('\n📝 Creating attribute with data:');
    console.log(JSON.stringify(testAttribute, null, 2));

    // Create the attribute
    const createdAttribute = await Attribute.create(testAttribute);
    console.log('\n✅ Attribute created successfully!');
    console.log('Created ID:', createdAttribute._id);

    // Fetch it back to see how it's stored
    const fetchedAttribute = await Attribute.findById(createdAttribute._id).lean();
    console.log('\n📦 Fetched attribute from DB:');
    console.log(JSON.stringify(fetchedAttribute, null, 2));

    // Check the constraints specifically
    console.log('\n🔍 Constraints analysis:');
    console.log('Type of enumValues:', typeof fetchedAttribute?.constraints?.enumValues);
    console.log('Is Array:', Array.isArray(fetchedAttribute?.constraints?.enumValues));
    console.log('Length:', fetchedAttribute?.constraints?.enumValues?.length);
    console.log('Content:', fetchedAttribute?.constraints?.enumValues);

    // Clean up
    await Attribute.findByIdAndDelete(createdAttribute._id);
    console.log('\n🧹 Test attribute deleted');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAttributeCreation();