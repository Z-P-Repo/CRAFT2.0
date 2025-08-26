import bcrypt from 'bcryptjs';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';

export const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test users with different roles
    const users = [
      {
        name: 'Super Administrator',
        email: 'superadmin@example.com',
        password: hashedPassword,
        role: 'super_admin',
        department: 'IT Administration',
        active: true,
        attributes: {
          employeeId: 'SA001',
          location: 'HQ',
          clearanceLevel: 'top_secret'
        }
      },
      {
        name: 'System Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        department: 'IT Operations',
        active: true,
        attributes: {
          employeeId: 'AD001',
          location: 'HQ',
          clearanceLevel: 'secret'
        }
      },
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: 'basic',
        department: 'Engineering',
        active: true,
        attributes: {
          employeeId: 'ENG001',
          location: 'Office A',
          clearanceLevel: 'confidential'
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        role: 'basic',
        department: 'Marketing',
        active: true,
        attributes: {
          employeeId: 'MKT001',
          location: 'Office B',
          clearanceLevel: 'public'
        }
      },
      {
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        password: hashedPassword,
        role: 'basic',
        department: 'Finance',
        active: false, // Inactive user for testing
        attributes: {
          employeeId: 'FIN001',
          location: 'Office C',
          clearanceLevel: 'confidential'
        }
      }
    ];

    // Create users
    const createdUsers = await User.insertMany(users);
    
    logger.info(`Created ${createdUsers.length} test users`);
    
    // Log the created users (without passwords)
    createdUsers.forEach(user => {
      logger.info(`Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};