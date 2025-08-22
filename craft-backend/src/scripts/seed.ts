import 'reflect-metadata';
import { databaseConnection } from '@/config/database';
import { UserRepository } from '@/repositories/UserRepository';
import { logger } from '@/utils/logger';
import bcrypt from 'bcryptjs';
import { config } from '@/config/environment';

class DatabaseSeeder {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async run(): Promise<void> {
    try {
      logger.info('🌱 Starting database seeding...');
      
      await databaseConnection.connect();
      
      // Clear existing data (optional - be careful in production)
      if (config.isDevelopment) {
        await this.clearData();
      }
      
      // Seed data
      await this.seedUsers();
      
      logger.info('✅ Database seeding completed successfully!');
      
      // Log sample credentials
      logger.info('\n📋 Sample credentials:');
      logger.info('👨‍💼 Admin: admin@example.com / Admin123!');
      logger.info('👤 User: user@example.com / User123!');
      logger.info('👨‍💼 Manager: manager@example.com / Manager123!');
      
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await databaseConnection.disconnect();
      process.exit(0);
    }
  }

  private async clearData(): Promise<void> {
    try {
      // Clear users (add other collections as needed)
      const User = (await import('@/models/User')).User;
      await User.deleteMany({});
      
      logger.info('🧹 Cleared existing data');
    } catch (error) {
      logger.error('Error clearing data:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    try {
      const users = [
        {
          email: 'admin@example.com',
          password: await bcrypt.hash('Admin123!', config.security.bcryptRounds),
          name: 'Administrator',
          role: 'admin' as const,
          active: true,
          department: 'IT',
          attributes: {
            clearance: 'high',
            department: 'it',
            level: 'senior'
          }
        },
        {
          email: 'user@example.com',
          password: await bcrypt.hash('User123!', config.security.bcryptRounds),
          name: 'Regular User',
          role: 'user' as const,
          active: true,
          department: 'General',
          attributes: {
            clearance: 'low',
            department: 'general',
            level: 'junior'
          }
        },
        {
          email: 'manager@example.com',
          password: await bcrypt.hash('Manager123!', config.security.bcryptRounds),
          name: 'Department Manager',
          role: 'manager' as const,
          active: true,
          department: 'Sales',
          attributes: {
            clearance: 'medium',
            department: 'sales',
            level: 'senior'
          }
        },
        {
          email: 'hr@example.com',
          password: await bcrypt.hash('Hr123!', config.security.bcryptRounds),
          name: 'HR Representative',
          role: 'manager' as const,
          active: true,
          department: 'HR',
          attributes: {
            clearance: 'medium',
            department: 'hr',
            level: 'senior'
          }
        }
      ];

      for (const userData of users) {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        
        if (!existingUser) {
          await this.userRepository.create(userData);
          logger.info(`✅ Created user: ${userData.email}`);
        } else {
          logger.info(`⏭️ User already exists: ${userData.email}`);
        }
      }
      
      logger.info(`📊 Users seeding completed`);
      
    } catch (error) {
      logger.error('Error seeding users:', error);
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