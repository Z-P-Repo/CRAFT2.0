import mongoose from 'mongoose';
import { Attribute } from '../models/Attribute';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/craft-permission-system';

/**
 * Migration Script: Attribute Category Cleanup
 *
 * Purpose: Handle attributes with multiple categories
 * Strategy: Keep attributes with multiple categories but log them for review
 *
 * Run: npm run migrate:categories or tsx src/scripts/migrate-attribute-categories.ts
 */

async function migrateAttributeCategories() {
  try {
    console.log('🔄 Starting Attribute Category Migration...\n');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find all attributes
    const allAttributes = await Attribute.find({});
    console.log(`📊 Total attributes found: ${allAttributes.length}\n`);

    // Categorize attributes
    const multiCategoryAttributes = allAttributes.filter(attr => attr.categories.length > 1);
    const singleCategoryAttributes = allAttributes.filter(attr => attr.categories.length === 1);
    const noCategoryAttributes = allAttributes.filter(attr => !attr.categories || attr.categories.length === 0);

    console.log(`📈 Statistics:`);
    console.log(`   ✅ Single category attributes: ${singleCategoryAttributes.length}`);
    console.log(`   ⚠️  Multi-category attributes: ${multiCategoryAttributes.length}`);
    console.log(`   ❌ No category attributes: ${noCategoryAttributes.length}\n`);

    // Fix attributes with no categories (set to 'subject' as default)
    if (noCategoryAttributes.length > 0) {
      console.log(`🔧 Fixing ${noCategoryAttributes.length} attributes with no categories...`);
      for (const attr of noCategoryAttributes) {
        attr.categories = ['subject'];
        await attr.save();
        console.log(`   ✅ Fixed: ${attr.displayName} (${attr.name}) - Set to 'subject'`);
      }
      console.log('');
    }

    // Report multi-category attributes
    if (multiCategoryAttributes.length > 0) {
      console.log(`📋 Multi-category attributes (keeping as-is for flexibility):\n`);
      multiCategoryAttributes.forEach(attr => {
        console.log(`   📌 ${attr.displayName} (${attr.name})`);
        console.log(`      Categories: ${attr.categories.join(', ')}`);
        console.log(`      Usage: Can be used in ${attr.categories.map(c => c.toUpperCase()).join(' and ')} contexts`);
        console.log('');
      });
    }

    // Create summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Attributes: ${allAttributes.length}`);
    console.log(`✅ Fixed (no category → subject): ${noCategoryAttributes.length}`);
    console.log(`✅ Single category (no changes): ${singleCategoryAttributes.length}`);
    console.log(`✅ Multi-category (kept for flexibility): ${multiCategoryAttributes.length}`);
    console.log('='.repeat(60) + '\n');

    // Category breakdown
    const categoryBreakdown = {
      subject: 0,
      resource: 0,
      'additional-resource': 0
    };

    allAttributes.forEach(attr => {
      attr.categories.forEach(cat => {
        if (cat in categoryBreakdown) {
          categoryBreakdown[cat as keyof typeof categoryBreakdown]++;
        }
      });
    });

    console.log('📊 Category Distribution:');
    console.log(`   Subject: ${categoryBreakdown.subject} attributes`);
    console.log(`   Resource: ${categoryBreakdown.resource} attributes`);
    console.log(`   Additional Resource: ${categoryBreakdown['additional-resource']} attributes\n`);

    console.log('✅ Migration completed successfully!');
    console.log('ℹ️  Note: Multi-category attributes are kept as-is. They will be available in multiple contexts.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateAttributeCategories();
