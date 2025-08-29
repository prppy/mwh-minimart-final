// controllers/leaderboardController.js (Fixed)
import { validationResult } from 'express-validator';
import * as ResidentModel from '../models/residentModel.js';

// Get main leaderboard with enhanced filtering
export const getLeaderboard = async (req, res) => {
  try {
    const {
      batchNumber,
      type = 'current', // 'current', 'total', 'month', 'year'
      limit = 10,
      offset = 0
    } = req.query;

    const result = await ResidentModel.getLeaderboard({
      batchNumber: batchNumber ? parseInt(batchNumber) : undefined,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get leaderboard by batch with enhanced features
export const getLeaderboardByBatch = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { 
      type = 'current', // 'current', 'total', 'month', 'year'
      limit = 50, 
      offset = 0 
    } = req.query;

    if (!batchNumber || isNaN(parseInt(batchNumber))) {
      return res.status(400).json({
        error: { message: 'Invalid batch number' }
      });
    }

    const result = await ResidentModel.getLeaderboardByBatch(parseInt(batchNumber), {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get batch leaderboard error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get leaderboard by points gained this month
export const getLeaderboardByMonth = async (req, res) => {
  try {
    const {
      batchNumber,
      limit = 10,
      offset = 0
    } = req.query;

    // Check if batchNumber is provided in route params (for dedicated batch routes)
    const routeBatchNumber = req.params.batchNumber;
    const finalBatchNumber = routeBatchNumber || batchNumber;

    if (routeBatchNumber && isNaN(parseInt(routeBatchNumber))) {
      return res.status(400).json({
        error: { message: 'Invalid batch number in route' }
      });
    }

    const result = await ResidentModel.getLeaderboard({
      batchNumber: finalBatchNumber ? parseInt(finalBatchNumber) : undefined,
      type: 'month',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get monthly leaderboard error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get leaderboard by points gained this year
export const getLeaderboardByYear = async (req, res) => {
  try {
    const {
      batchNumber,
      limit = 10,
      offset = 0
    } = req.query;

    // Check if batchNumber is provided in route params (for dedicated batch routes)
    const routeBatchNumber = req.params.batchNumber;
    const finalBatchNumber = routeBatchNumber || batchNumber;

    if (routeBatchNumber && isNaN(parseInt(routeBatchNumber))) {
      return res.status(400).json({
        error: { message: 'Invalid batch number in route' }
      });
    }

    const result = await ResidentModel.getLeaderboard({
      batchNumber: finalBatchNumber ? parseInt(finalBatchNumber) : undefined,
      type: 'year',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get yearly leaderboard error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get user position in leaderboard
export const getUserPosition = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'current' } = req.query;

    // Check access permissions
    const requestedUserId = parseInt(userId);
    const currentUserId = req.user.userId;
    const userRole = req.user.role;

    if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: { message: 'Access denied' }
      });
    }

    const result = await ResidentModel.getPosition(requestedUserId, type);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get user position error:', error);
    if (error.message === 'Resident not found') {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get top performers by period
export const getTopPerformers = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    const performers = await ResidentModel.getTopPerformers(period, parseInt(limit));

    res.json({
      success: true,
      data: {
        period,
        performers
      }
    });

  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get resident profile with leaderboard context
export const getResidentProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const [resident, position, recentHistory] = await Promise.all([
      ResidentModel.findByUserId(parseInt(userId)),
      ResidentModel.getPosition(parseInt(userId)),
      ResidentModel.getPointsHistory(parseInt(userId), { limit: 10 })
    ]);

    if (!resident) {
      return res.status(404).json({ 
        error: { message: 'Resident not found' }
      });
    }

    res.json({
      success: true,
      data: {
        resident,
        leaderboardPosition: position,
        recentHistory: recentHistory.transactions
      }
    });

  } catch (error) {
    console.error('Get resident profile error:', error);
    if (error.message === 'Resident not found') {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get leaderboard statistics
export const getLeaderboardStats = async (req, res) => {
  try {
    const statistics = await ResidentModel.getStatistics();

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get batch statistics with period comparison
export const getBatchStatistics = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { period = 'month' } = req.query;

    if (!batchNumber || isNaN(parseInt(batchNumber))) {
      return res.status(400).json({
        error: { message: 'Invalid batch number' }
      });
    }

    const statistics = await ResidentModel.getBatchStatistics(parseInt(batchNumber), period);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get batch statistics error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get recent point changes
export const getRecentChanges = async (req, res) => {
  try {
    const { 
      batchNumber,
      limit = 20,
      hours = 24
    } = req.query;

    const changes = await ResidentModel.getRecentPointChanges({
      batchNumber: batchNumber ? parseInt(batchNumber) : undefined,
      limit: parseInt(limit),
      hours: parseInt(hours)
    });

    res.json({
      success: true,
      data: changes
    });

  } catch (error) {
    console.error('Get recent changes error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Enhanced compare residents with performance metrics
export const compareResidents = async (req, res) => {
  try {
    const { userIds } = req.query;

    if (!userIds) {
      return res.status(400).json({
        error: { message: 'User IDs are required' }
      });
    }

    const userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (userIdArray.length < 2 || userIdArray.length > 5) {
      return res.status(400).json({
        error: { message: 'Please provide between 2 and 5 user IDs for comparison' }
      });
    }

    const comparison = await ResidentModel.compareResidents(userIdArray);

    if (comparison.length === 0) {
      return res.status(404).json({ 
        error: { message: 'No valid residents found' }
      });
    }

    res.json({
      success: true,
      data: {
        comparison,
        totalCompared: comparison.length
      }
    });

  } catch (error) {
    console.error('Compare residents error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};