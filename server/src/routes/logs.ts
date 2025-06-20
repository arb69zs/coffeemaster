import express, { Request, Response, NextFunction } from 'express';
import { SystemLog, LogCategory, LogLevel } from '../models/mongo/SystemLog';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models/mysql/User';

const router = express.Router();

/**
 * @route GET /api/logs
 * @desc Get system logs with filtering options
 * @access Admin only
 */
router.get('/', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      level, 
      category, 
      startDate, 
      endDate, 
      limit = 100, 
      page = 1 
    } = req.query;

    // Build query
    const query: any = {};
    
    // Filter by log level if provided
    if (level) {
      query.level = level;
    }
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query with pagination
    const logs = await SystemLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count for pagination
    const total = await SystemLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ message: 'Error fetching system logs.' });
  }
});

/**
 * @route GET /api/logs/categories
 * @desc Get available log categories
 * @access Admin only
 */
router.get('/categories', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ categories: Object.values(LogCategory) });
  } catch (error) {
    console.error('Error fetching log categories:', error);
    res.status(500).json({ message: 'Error fetching log categories.' });
  }
});

/**
 * @route GET /api/logs/levels
 * @desc Get available log levels
 * @access Admin only
 */
router.get('/levels', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ levels: Object.values(LogLevel) });
  } catch (error) {
    console.error('Error fetching log levels:', error);
    res.status(500).json({ message: 'Error fetching log levels.' });
  }
});

/**
 * @route GET /api/logs/summary
 * @desc Get summary of logs (counts by category and level)
 * @access Admin only
 */
router.get('/summary', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response): Promise<void> => {
  try {
    // Get counts by category
    const categoryCounts = await SystemLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by level
    const levelCounts = await SystemLog.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyCounts = await SystemLog.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      summary: {
        byCategory: categoryCounts,
        byLevel: levelCounts,
        byDay: dailyCounts
      }
    });
  } catch (error) {
    console.error('Error fetching logs summary:', error);
    res.status(500).json({ message: 'Error fetching logs summary.' });
  }
});

export default router; 