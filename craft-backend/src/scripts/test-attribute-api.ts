import mongoose from 'mongoose';
import { Attribute } from '../models/Attribute';
import { config } from '../config/environment';

async function testAttributeAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Fetch attributes the same way the controller does
    const attributes = await Attribute.find({}).lean();
    
    console.log('\n📊 Total attributes found:', attributes.length);
    
    // Check each attribute's constraints
    attributes.forEach((attr, index) => {
      console.log(`\n--- Attribute ${index + 1}: ${attr.displayName} ---`);
      console.log('ID:', attr.id || attr._id);
      console.log('Categories:', attr.categories);
      console.log('Data Type:', attr.dataType);
      console.log('Constraints:', JSON.stringify(attr.constraints, null, 2));
      
      if (attr.constraints?.enumValues) {
        console.log('EnumValues type:', typeof attr.constraints.enumValues);
        console.log('EnumValues isArray:', Array.isArray(attr.constraints.enumValues));
        console.log('EnumValues length:', attr.constraints.enumValues.length);
        console.log('EnumValues content:', attr.constraints.enumValues);
      } else {
        console.log('❌ No enumValues found');
      }
    });

    // Test specific attributes with enumValues
    const attributesWithValues = attributes.filter(attr => 
      attr.constraints?.enumValues && 
      Array.isArray(attr.constraints.enumValues) && 
      attr.constraints.enumValues.length > 0
    );
    
    console.log('\n🎯 Attributes with permitted values:', attributesWithValues.length);
    
    attributesWithValues.forEach(attr => {
      console.log(`- ${attr.displayName}: [${attr.constraints?.enumValues?.join(', ') || 'No values'}]`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAttributeAPI();