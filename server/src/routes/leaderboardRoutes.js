// routes/leaderboardRoutes.js
import { Router } from 'express';
import { param, query } from 'express-validator';
import * as leaderboardController from '../controllers/leaderboardController.js';

const leaderboardRouter = Router();

// Validation middleware
const batchNumberValidation = [
  param('batchNumber')
    .isInt({ min: 1 })
    .withMessage('Batch number must be a positive integer')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const leaderboardQueryValidation = [
  query('batchNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch number must be a positive integer'),
  query('type')
    .optional()
    .isIn(['current', 'total'])
    .withMessage('Type must be either "current" or "total"'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const topPerformersValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be day, week, month, or year'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const compareResidentsValidation = [
  query('userIds')
    .notEmpty()
    .withMessage('User IDs are required')
    .custom((value) => {
      const ids = value.split(',').map(id => parseInt(id));
      if (ids.length < 2 || ids.length > 5) {
        throw new Error('Please provide between 2 and 5 user IDs for comparison');
      }
      if (ids.some(id => isNaN(id) || id < 1)) {
        throw new Error('All user IDs must be positive integers');
      }
      return true;
    })
];

const recentChangesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Routes
leaderboardRouter.get('/', leaderboardQueryValidation, leaderboardController.getLeaderboard);
leaderboardRouter.get('/stats', leaderboardController.getLeaderboardStats);
leaderboardRouter.get('/batch/:batchNumber', batchNumberValidation, leaderboardController.getLeaderboardByBatch);
leaderboardRouter.get('/top-performers', topPerformersValidation, leaderboardController.getTopPerformers);

// Protected routes (require authentication)
leaderboardRouter.get('/user/:userId/position', userIdValidation, leaderboardController.getUserPosition);
leaderboardRouter.get('/user/:userId/profile', userIdValidation, leaderboardController.getResidentProfile);

// Additional routes
leaderboardRouter.get('/batch-stats', leaderboardController.getBatchStatistics);
leaderboardRouter.get('/compare', compareResidentsValidation, leaderboardController.compareResidents);
leaderboardRouter.get('/recent-changes', recentChangesValidation, leaderboardController.getRecentChanges);

export default leaderboardRouter;