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
    .isIn(['current', 'total', 'month', 'year'])
    .withMessage('Type must be current, total, month, or year'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const batchQueryValidation = [
  query('type')
    .optional()
    .isIn(['current', 'total', 'month', 'year'])
    .withMessage('Type must be current, total, month, or year'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const periodValidation = [
  query('period')
    .optional()
    .isIn(['month', 'year', 'all'])
    .withMessage('Period must be month, year, or all'),
  query('batchNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch number must be a positive integer')
];

const recentChangesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('hours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Hours must be between 1 and 168 (1 week)'),
  query('batchNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch number must be a positive integer')
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

// Routes
leaderboardRouter.get('/', leaderboardQueryValidation, leaderboardController.getLeaderboard);
leaderboardRouter.get('/stats', leaderboardController.getLeaderboardStats);

// Dedicated period-based leaderboards for current month/year points
leaderboardRouter.get('/current-month-points', leaderboardQueryValidation, leaderboardController.getLeaderboardByMonth);
leaderboardRouter.get('/current-year-points', leaderboardQueryValidation, leaderboardController.getLeaderboardByYear);

leaderboardRouter.get('/month', leaderboardQueryValidation, leaderboardController.getLeaderboardByMonth);
leaderboardRouter.get('/year', leaderboardQueryValidation, leaderboardController.getLeaderboardByYear);

// Batch-specific routes
leaderboardRouter.get('/batch/:batchNumber', batchNumberValidation.concat(batchQueryValidation), leaderboardController.getLeaderboardByBatch);
leaderboardRouter.get('/batch/:batchNumber/stats', batchNumberValidation.concat(periodValidation), leaderboardController.getBatchStatistics);

// Dedicated batch + period combinations
leaderboardRouter.get('/batch/:batchNumber/current-month-points', batchNumberValidation.concat(leaderboardQueryValidation), leaderboardController.getLeaderboardByMonth);
leaderboardRouter.get('/batch/:batchNumber/current-year-points', batchNumberValidation.concat(leaderboardQueryValidation), leaderboardController.getLeaderboardByYear);

// Protected routes (require authentication)
leaderboardRouter.get('/user/:userId/position', userIdValidation, leaderboardController.getUserPosition);
leaderboardRouter.get('/user/:userId/profile', userIdValidation, leaderboardController.getResidentProfile);

// Additional enhanced routes
leaderboardRouter.get('/compare', compareResidentsValidation, leaderboardController.compareResidents);
leaderboardRouter.get('/recent-changes', recentChangesValidation, leaderboardController.getRecentChanges);

leaderboardRouter.get('/top-performers', leaderboardController.getTopPerformers);

export default leaderboardRouter;