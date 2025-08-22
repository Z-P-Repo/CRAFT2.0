import { User, UserDocument } from '@/models/User';
import { IUser, IRepository } from '@/types';
import { logger } from '@/utils/logger';

export class UserRepository implements IRepository<IUser> {
  async findAll(options?: {
    filter?: any;
    sort?: any;
    limit?: number;
    skip?: number;
    select?: string;
  }): Promise<IUser[]> {
    try {
      const {
        filter = {},
        sort = { createdAt: -1 },
        limit,
        skip,
        select = '-password'
      } = options || {};

      let query = User.find(filter).select(select).sort(sort);

      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(limit);

      const users = await query.exec();
      logger.debug(`Found ${users.length} users`);
      
      return users.map(user => user.toObject());
    } catch (error) {
      logger.error('Error finding users:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id).select('-password').exec();
      
      if (user) {
        logger.debug(`Found user: ${user.email}`);
        return user.toObject();
      }
      
      return null;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw error;
    }
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    try {
      const selectFields = includePassword ? '' : '-password';
      const user = await User.findOne({ email }).select(selectFields).exec();
      
      if (user) {
        logger.debug(`Found user by email: ${email}`);
        return user.toObject();
      }
      
      return null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      
      logger.info(`Created new user: ${savedUser.email}`);
      
      // Return user without password
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        userData,
        { new: true, runValidators: true }
      ).select('-password').exec();

      if (user) {
        logger.info(`Updated user: ${user.email}`);
        return user.toObject();
      }
      
      return null;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id).exec();
      
      if (result) {
        logger.info(`Deleted user: ${result.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  async findByRole(role: string): Promise<IUser[]> {
    try {
      const users = await User.find({ role, active: true })
        .select('-password')
        .sort({ name: 1 })
        .exec();
      
      logger.debug(`Found ${users.length} users with role: ${role}`);
      return users.map(user => user.toObject());
    } catch (error) {
      logger.error(`Error finding users by role ${role}:`, error);
      throw error;
    }
  }

  async findByDepartment(department: string): Promise<IUser[]> {
    try {
      const users = await User.find({ department, active: true })
        .select('-password')
        .sort({ name: 1 })
        .exec();
      
      logger.debug(`Found ${users.length} users in department: ${department}`);
      return users.map(user => user.toObject());
    } catch (error) {
      logger.error(`Error finding users by department ${department}:`, error);
      throw error;
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      ).exec();
      
      if (result) {
        logger.info(`Updated password for user: ${result.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error updating password for user ${id}:`, error);
      throw error;
    }
  }

  async toggleActive(id: string, active: boolean): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { active },
        { new: true }
      ).select('-password').exec();

      if (user) {
        logger.info(`${active ? 'Activated' : 'Deactivated'} user: ${user.email}`);
        return user.toObject();
      }
      
      return null;
    } catch (error) {
      logger.error(`Error toggling active status for user ${id}:`, error);
      throw error;
    }
  }

  async count(filter: any = {}): Promise<number> {
    try {
      const count = await User.countDocuments(filter);
      logger.debug(`User count with filter: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting users:', error);
      throw error;
    }
  }
}