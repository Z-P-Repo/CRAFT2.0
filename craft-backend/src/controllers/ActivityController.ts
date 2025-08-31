import { Request, Response, NextFunction } from 'express';
import { Activity } from '../models/Activity';
import logger from '../utils/logger';

export class ActivityController {
  /**
   * Get all activities with filtering, pagination, and sorting
   */
  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 25,
        search,
        category,
        severity,
        type,
        actor,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter: any = {};

      // Search across multiple fields
      if (search) {
        filter.$or = [
          { description: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } },
          { 'actor.name': { $regex: search, $options: 'i' } },
          { 'resource.name': { $regex: search, $options: 'i' } }
        ];
      }

      // Category filter
      if (category) {
        if (Array.isArray(category)) {
          filter.category = { $in: category };
        } else {
          filter.category = category;
        }
      }

      // Severity filter
      if (severity) {
        if (Array.isArray(severity)) {
          filter.severity = { $in: severity };
        } else {
          filter.severity = severity;
        }
      }

      // Type filter
      if (type) {
        if (Array.isArray(type)) {
          filter.type = { $in: type };
        } else {
          filter.type = type;
        }
      }

      // Actor filter
      if (actor) {
        filter['actor.name'] = { $regex: actor, $options: 'i' };
      }

      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate as string);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate as string);
        }
      }

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Sort
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [activities, total] = await Promise.all([
        Activity.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Activity.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNum);
      const hasNext = pageNum < totalPages;
      const hasPrev = pageNum > 1;

      res.json({
        success: true,
        data: activities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
          hasNext,
          hasPrev
        }
      });

      logger.info(`Retrieved ${activities.length} activities for user ${req.user?.email}`);
    } catch (error) {
      logger.error('Error getting activities:', error);
      next(error);
    }
  }

  /**
   * Get a specific activity by ID
   */
  async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id).lean();

      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
        return;
      }

      res.json({
        success: true,
        data: activity
      });

      logger.info(`Retrieved activity ${id} for user ${req.user?.email}`);
    } catch (error) {
      logger.error('Error getting activity:', error);
      next(error);
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activityData = {
        ...req.body,
        timestamp: new Date()
      };

      const activity = new Activity(activityData);
      const savedActivity = await activity.save();

      res.status(201).json({
        success: true,
        data: savedActivity,
        message: 'Activity created successfully'
      });

      logger.info(`Created activity ${savedActivity._id} by user ${req.user?.email}`);
    } catch (error) {
      logger.error('Error creating activity:', error);
      next(error);
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        total,
        recentCount,
        categoryStats,
        severityStats
      ] = await Promise.all([
        Activity.countDocuments(),
        Activity.countDocuments({ timestamp: { $gte: last24Hours } }),
        Activity.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Activity.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ])
      ]);

      // Format aggregation results
      const byCategory: Record<string, number> = {};
      categoryStats.forEach(stat => {
        byCategory[stat._id] = stat.count;
      });

      const bySeverity: Record<string, number> = {};
      severityStats.forEach(stat => {
        bySeverity[stat._id] = stat.count;
      });

      res.json({
        success: true,
        data: {
          total,
          recentCount,
          byCategory,
          bySeverity
        }
      });

      logger.info(`Retrieved activity stats for user ${req.user?.email}`);
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      next(error);
    }
  }

  /**
   * Export activities to CSV or JSON
   */
  async exportActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format = 'csv', filters = {} } = req.body;

      // Build filter from request
      const filter: any = {};
      
      if (filters.category) {
        filter.category = Array.isArray(filters.category) 
          ? { $in: filters.category }
          : filters.category;
      }

      if (filters.severity) {
        filter.severity = Array.isArray(filters.severity)
          ? { $in: filters.severity }
          : filters.severity;
      }

      if (filters.dateRange) {
        filter.timestamp = {};
        if (filters.dateRange.start) {
          filter.timestamp.$gte = new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          filter.timestamp.$lte = new Date(filters.dateRange.end);
        }
      }

      // Get activities
      const activities = await Activity.find(filter)
        .sort({ timestamp: -1 })
        .limit(10000) // Limit to prevent memory issues
        .lean();

      if (format === 'csv') {
        // Convert to CSV
        const csvHeader = 'Timestamp,Type,Category,Action,Actor,Resource,Severity,Description\\n';
        const csvRows = activities.map(activity => {
          return [
            activity.timestamp,
            activity.type,
            activity.category,
            activity.action,
            activity.actor.name,
            activity.resource.name,
            activity.severity,
            `"${activity.description.replace(/"/g, '""')}"`
          ].join(',');
        }).join('\\n');

        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="activities_${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="activities_${Date.now()}.json"`);
        res.json({
          success: true,
          data: activities,
          exportedAt: new Date(),
          count: activities.length
        });
      }

      logger.info(`Exported ${activities.length} activities as ${format} for user ${req.user?.email}`);
    } catch (error) {
      logger.error('Error exporting activities:', error);
      next(error);
    }
  }
}