import { Request, Response } from 'express';
import { User } from '@/models/User';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper, FilterOptions } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import mongoose from 'mongoose';

export class UserController {
  // Get all users with pagination and filtering
  static getUsers = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      role,
      department,
      active,
      managerId,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (active !== undefined) filter.active = active === 'true';
    if (managerId) filter.managerId = managerId;

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'email', 'department']
      );
      Object.assign(filter, searchFilter);
    }

    // Calculate pagination
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    // Execute queries
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('managerId', 'name email department')
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(users, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get user by ID
  static getUserById = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('managerId', 'name email department')
      .lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  // Create new user
  static createUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { email, password, name, role, department, managerId, attributes } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Validate manager if provided
    if (managerId && !mongoose.Types.ObjectId.isValid(managerId)) {
      throw new ValidationError('Invalid manager ID');
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        throw new ValidationError('Manager not found');
      }
    }

    // Create user
    const userData = {
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      role: role || 'basic',
      department,
      managerId,
      attributes: new Map(Object.entries(attributes || {})),
    };

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    logger.info(`User created: ${user.email} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    });
  });

  // Update user
  static updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    // Validate manager if being updated
    if (updates.managerId && !mongoose.Types.ObjectId.isValid(updates.managerId)) {
      throw new ValidationError('Invalid manager ID');
    }

    if (updates.managerId) {
      const manager = await User.findById(updates.managerId);
      if (!manager) {
        throw new ValidationError('Manager not found');
      }
    }

    // Convert attributes to Map if provided
    if (updates.attributes) {
      updates.attributes = new Map(Object.entries(updates.attributes));
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('managerId', 'name email department');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User updated: ${user.email} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  });

  // Delete user
  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User deleted: ${user.email} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  // Change user password
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  // Toggle user status
  static toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.active = !user.active;
    await user.save();

    logger.info(`User status toggled: ${user.email} (${user.active ? 'activated' : 'deactivated'}) by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${user.active ? 'activated' : 'deactivated'} successfully`,
    });
  });

  // Get user statistics
  static getUserStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] }
          },
          super_admins: {
            $sum: { $cond: [{ $eq: ['$role', 'super_admin'] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          basic_users: {
            $sum: { $cond: [{ $eq: ['$role', 'basic'] }, 1, 0] }
          }
        }
      }
    ]);

    const departmentStats = await User.aggregate([
      { $match: { active: true, department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          super_admins: 0,
          admins: 0,
          basic_users: 0
        },
        departmentStats,
      },
    });
  });

  // Bulk operations
  static bulkUpdateUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('User IDs array is required');
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updates,
      { runValidators: true }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} users by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} users updated successfully`,
    });
  });

  static bulkDeleteUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('User IDs array is required');
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} users by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} users deleted successfully`,
    });
  });

  // Change user role - only admins and super admins can change roles
  static changeUserRole = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    if (!id) {
      throw new ValidationError('ID parameter is required');
    }
    if (!role) {
      throw new ValidationError('Role is required');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid user ID');
    }

    // Check if current user has permission to change roles
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      throw new ValidationError('Access denied: Only Admin and Super Admin users can change user roles. Your current role does not have sufficient permissions.');
    }

    // Validate the new role
    const validRoles = ['super_admin', 'admin', 'basic'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Invalid role. Must be one of: super_admin, admin, basic');
    }

    // Additional permission checks
    if (currentUser.role === 'admin') {
      // Admins can only assign 'admin' and 'basic' roles, not 'super_admin'
      if (role === 'super_admin') {
        throw new ValidationError('Access denied: Only Super Admins can assign the Super Admin role. You are currently logged in as an Admin, which allows you to assign Admin and Basic roles only.');
      }
      
      // Admins cannot change the role of super admins
      const targetUser = await User.findById(id).select('role email');
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }
      
      if (targetUser.role === 'super_admin') {
        throw new ValidationError('Access denied: Only Super Admins can modify other Super Admin accounts. You are currently logged in as an Admin.');
      }
    }

    // Prevent users from changing their own role to avoid privilege escalation
    if (currentUser && currentUser._id && currentUser._id.toString() === id) {
      throw new ValidationError('Security restriction: You cannot change your own role. Please ask another Admin or Super Admin to change your role if needed.');
    }

    // Update the user role
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('managerId', 'name email department');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User role changed: ${user.email} -> ${role} by ${currentUser.email}`);

    res.status(200).json({
      success: true,
      data: user,
      message: `User role updated to ${role} successfully`,
    });
  });
}