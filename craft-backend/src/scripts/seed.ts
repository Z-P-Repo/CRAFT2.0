import 'reflect-metadata';
import { databaseConnection } from '@/config/database';
import { UserRepository } from '@/repositories/UserRepository';
import { logger } from '@/utils/logger';
import bcrypt from 'bcryptjs';
import { config } from '@/config/environment';
import { seedPolicies } from '@/seeds/policySeed';
import { seedUsers } from '@/seeds/userSeed';

class DatabaseSeeder {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async run(): Promise<any> {
    try {
      logger.info('🌱 Starting database seeding...');
      
      await databaseConnection.connect();
      
      // Clear existing data (optional - be careful in production)
      if (config.isDevelopment) {
        await this.clearData();
      }
      
      // Seed data
      await seedUsers();
      await seedPolicies();
      
      logger.info('✅ Database seeding completed successfully!');
      
      // Log sample credentials
      logger.info('\n📋 Sample credentials:');
      logger.info('🔑 Super Admin: superadmin@example.com / password123');
      logger.info('👨‍💼 Admin: admin@example.com / password123');
      logger.info('👤 Basic User: john.doe@example.com / password123');
      
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await databaseConnection.disconnect();
      process.exit(0);
    }
  }

  private async clearData(): Promise<any> {
    try {
      // Clear users and policies (add other collections as needed)
      const User = (await import('@/models/User')).User;
      const Policy = (await import('@/models/Policy')).Policy;
      await User.deleteMany({});
      await Policy.deleteMany({});
      
      logger.info('🧹 Cleared existing data');
    } catch (error) {
      logger.error('Error clearing data:', error);
      throw error;
    }
  }

}

// Run seeder
const seeder = new DatabaseSeeder();
seeder.run().catch((error) => {
  logger.error('Seeding process failed:', error);
  process.exit(1);
});