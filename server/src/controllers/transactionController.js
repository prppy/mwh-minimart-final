import { validationResult } from 'express-validator';
import * as TransactionModel from '../models/transactionModel.js';
import { updateResidentActivity } from '../models/archiveModel.js';

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // // Check if user is authenticated
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    // // Check access permissions
    // const requestedUserId = parseInt(userId);
    // const currentUserId = req.user.userId;
    // const userRole = req.user.role || req.user.userRole; // Handle different property names

    // // Allow access if:
    // // 1. User is requesting their own data
    // // 2. User is an officer or admin
    // if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
    //   return res.status(403).json({ 
    //     error: { message: 'Access denied' }
    //   });
    // }

    const requestedUserId = parseInt(userId);
    const result = await TransactionModel.findByUserId(requestedUserId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Create redemption transaction
 */
export const createRedemption = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    const { userId, products, officerId = 1 } = req.body; // Default officerId for testing
    // const officerId = req.user.userId;

    const result = await TransactionModel.createRedemption({
      userId: parseInt(userId),
      officerId,
      products
    });

    // Update resident activity
    await updateResidentActivity(parseInt(userId));

    res.status(201).json({
      success: true,
      data: result,
      message: 'Redemption transaction created successfully'
    });

  } catch (error) {
    console.error('Create redemption error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('unavailable') ||
        error.message.includes('Insufficient')) {
      return res.status(400).json({ 
        error: { message: error.message }
      });
    }

    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Create task completion transaction
 */
export const createCompletion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    const { userId, tasks, officerId = 1 } = req.body; // Default officerId for testing
    // const officerId = req.user.userId;

    const result = await TransactionModel.createCompletion({
      userId: parseInt(userId),
      officerId,
      tasks
    });

    // Update resident activity
    await updateResidentActivity(parseInt(userId));

    res.status(201).json({
      success: true,
      data: result,
      message: 'Task completion transaction created successfully'
    });

  } catch (error) {
    console.error('Create completion error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('inactive')) {
      return res.status(400).json({ 
        error: { message: error.message }
      });
    }

    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Create abscondence transaction
 */
export const createAbscondence = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    const { userId, reason, pointsPenalty = 0, officerId = 1 } = req.body; // Default officerId for testing
    // const officerId = req.user.userId;

    const result = await TransactionModel.createAbscondence({
      userId: parseInt(userId),
      officerId,
      reason,
      pointsPenalty: parseInt(pointsPenalty)
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Abscondence transaction created successfully'
    });

  } catch (error) {
    console.error('Create abscondence error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }

    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Get points summary for a user
 */
export const getPointsSummary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // // Check access permissions
    // const requestedUserId = parseInt(userId);
    // const currentUserId = req.user.userId;
    // const userRole = req.user.role || req.user.userRole;

    // if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
    //   return res.status(403).json({ 
    //     error: { message: 'Access denied' }
    //   });
    // }

    const requestedUserId = parseInt(userId);
    const summary = await TransactionModel.getPointsSummary(requestedUserId, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get points summary error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Get all transactions (officer/admin only)
 */
export const getAllTransactions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    // // Check role permissions
    // const userRole = req.user.role || req.user.userRole;
    // if (!['officer', 'admin'].includes(userRole)) {
    //   return res.status(403).json({ 
    //     error: { message: 'Access denied - Officer or Admin role required' }
    //   });
    // }

    const { 
      limit = 50, 
      offset = 0, 
      type, 
      startDate, 
      endDate,
      userId 
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      startDate,
      endDate,
      userId: userId ? parseInt(userId) : undefined
    };

    const result = await TransactionModel.findMany(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Get transaction analytics
 */
export const getTransactionAnalytics = async (req, res) => {
  try {
    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    // // Check role permissions
    // const userRole = req.user.role || req.user.userRole;
    // if (!['officer', 'admin'].includes(userRole)) {
    //   return res.status(403).json({ 
    //     error: { message: 'Access denied - Officer or Admin role required' }
    //   });
    // }

    const { period = 'month' } = req.query;

    const validPeriods = ['week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: { message: 'Period must be one of: week, month, year' }
      });
    }

    const analytics = await TransactionModel.getAnalytics(period);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get transaction analytics error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    // // Check authentication
    // if (!req.user) {
    //   return res.status(401).json({ 
    //     error: { message: 'Authentication required' }
    //   });
    // }

    // // Check role permissions
    // const userRole = req.user.role || req.user.userRole;
    // if (!['officer', 'admin'].includes(userRole)) {
    //   return res.status(403).json({ 
    //     error: { message: 'Access denied - Officer or Admin role required' }
    //   });
    // }

    const { id } = req.params;

    const transaction = await TransactionModel.findById(parseInt(id));

    if (!transaction) {
      return res.status(404).json({ 
        error: { message: 'Transaction not found' }
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};