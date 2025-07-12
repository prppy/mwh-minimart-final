// controllers/leaderboardController.js
import { getLeaderboard as _getLeaderboard, getStatistics, getByBatch, getPosition, getTopPerformers as _getTopPerformers, findByUserId, getPointsHistory } from '../models/residentModel';

class LeaderboardController {
  // Get main leaderboard
  static async getLeaderboard(req, res) {
    try {
      const {
        batchNumber,
        type = 'current', // 'current' or 'total'
        limit = 10,
        offset = 0
      } = req.query;

      const result = await _getLeaderboard({
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
  }

  // Get leaderboard statistics
  static async getLeaderboardStats(req, res) {
    try {
      const statistics = await getStatistics();

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
  }

  // Get leaderboard by batch
  static async getLeaderboardByBatch(req, res) {
    try {
      const { batchNumber } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await getByBatch(parseInt(batchNumber), {
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
  }

  // Get user position in leaderboard
  static async getUserPosition(req, res) {
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

      const result = await getPosition(requestedUserId, type);

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
  }

  // Get top performers by period
  static async getTopPerformers(req, res) {
    try {
      const { period = 'month', limit = 10 } = req.query;

      const performers = await _getTopPerformers(period, parseInt(limit));

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
  }

  // Get resident profile with leaderboard context
  static async getResidentProfile(req, res) {
    try {
      const { userId } = req.params;

      const [resident, position, recentHistory] = await Promise.all([
        findByUserId(parseInt(userId)),
        getPosition(parseInt(userId)),
        getPointsHistory(parseInt(userId), { limit: 10 })
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
  }

  // Get batch statistics
  static async getBatchStatistics(req, res) {
    try {
      const statistics = await getStatistics();

      // Extract batch-specific data
      const batchStats = statistics.byBatch;
      const overallStats = statistics.overall;

      // Calculate additional batch metrics
      const batchSummary = batchStats.map(batch => {
        const avgPointsPercentage = overallStats.maxCurrentPoints > 0 
          ? Math.round((batch.avgPoints / overallStats.maxCurrentPoints) * 100)
          : 0;

        return {
          ...batch,
          avgPointsPercentage,
          totalResidents: batch.residentCount
        };
      });

      res.json({
        success: true,
        data: {
          overall: overallStats,
          batches: batchSummary,
          totalBatches: batchStats.length
        }
      });

    } catch (error) {
      console.error('Get batch statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Compare residents
  static async compareResidents(req, res) {
    try {
      const { userIds } = req.query; // Comma-separated user IDs

      if (!userIds) {
        return res.status(400).json({ 
          error: { message: 'User IDs are required' }
        });
      }

      const userIdArray = userIds.split(',').map(id => parseInt(id));

      if (userIdArray.length < 2 || userIdArray.length > 5) {
        return res.status(400).json({ 
          error: { message: 'Please provide between 2 and 5 user IDs for comparison' }
        });
      }

      // Get residents data
      const residents = await Promise.all(
        userIdArray.map(async (userId) => {
          const [resident, position] = await Promise.all([
            findByUserId(userId),
            getPosition(userId)
          ]);
          return { resident, position };
        })
      );

      // Filter out not found residents
      const validResidents = residents.filter(r => r.resident !== null);

      if (validResidents.length === 0) {
        return res.status(404).json({ 
          error: { message: 'No valid residents found' }
        });
      }

      // Create comparison data
      const comparison = validResidents.map(({ resident, position }) => ({
        userId: resident.userId,
        userName: resident.user.userName,
        currentPoints: resident.currentPoints,
        totalPoints: resident.totalPoints,
        batchNumber: resident.batchNumber,
        leaderboardPosition: position.position,
        profilePicture: resident.user.profilePicture
      }));

      // Add ranking within this comparison
      const sortedComparison = comparison
        .sort((a, b) => b.currentPoints - a.currentPoints)
        .map((resident, index) => ({
          ...resident,
          comparisonRank: index + 1
        }));

      res.json({
        success: true,
        data: {
          comparison: sortedComparison,
          totalCompared: sortedComparison.length
        }
      });

    } catch (error) {
      console.error('Compare residents error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get recent leaderboard changes
  static async getRecentChanges(req, res) {
    try {
      const { limit = 20 } = req.query;

      // Get recent positive point transactions (completions)
      const { prisma } = require('../lib/db');
      
      const recentChanges = await prisma.transaction.findMany({
        where: {
          transactionType: 'completion',
          pointsChange: {
            gt: 0
          }
        },
        include: {
          user: {
            select: {
              userName: true,
              resident: {
                select: {
                  currentPoints: true,
                  batchNumber: true
                }
              }
            }
          },
          completions: {
            include: {
              task: {
                select: {
                  taskName: true,
                  points: true
                }
              }
            }
          }
        },
        orderBy: {
          transactionDate: 'desc'
        },
        take: parseInt(limit)
      });

      // Format the data
      const formattedChanges = recentChanges.map(transaction => ({
        transactionId: transaction.id,
        userId: transaction.userId,
        userName: transaction.user.userName,
        pointsEarned: transaction.pointsChange,
        currentPoints: transaction.user.resident?.currentPoints || 0,
        batchNumber: transaction.user.resident?.batchNumber,
        tasksCompleted: transaction.completions.map(completion => ({
          taskName: completion.task.taskName,
          points: completion.task.points
        })),
        transactionDate: transaction.transactionDate
      }));

      res.json({
        success: true,
        data: formattedChanges
      });

    } catch (error) {
      console.error('Get recent changes error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default LeaderboardController;