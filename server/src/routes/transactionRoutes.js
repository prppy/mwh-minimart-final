import express from 'express';
import { body, param, query } from 'express-validator';
import * as TransactionController from '../controllers/transactionController.js';

const transactionRouter = express.Router();

// Validation middleware
const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const transactionIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer')
];

const redemptionValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('Products must be a non-empty array'),
  body('products.*.id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('products.*.quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Product quantity must be between 1 and 10')
];

const completionValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('Tasks must be a non-empty array'),
  body('tasks.*.id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer')
];

const abscondenceValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('pointsPenalty')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Points penalty must be between 0 and 100')
];

const transactionQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('type')
    .optional()
    .isIn(['redemption', 'completion', 'abscondence'])
    .withMessage('Type must be redemption, completion, or abscondence'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// User transaction routes
transactionRouter.get('/user/:userId', userIdValidation, TransactionController.getUserTransactions);
transactionRouter.get('/user/:userId/summary', userIdValidation, TransactionController.getPointsSummary);

// Officer/Admin routes
transactionRouter.get('/', transactionQueryValidation, TransactionController.getAllTransactions);
transactionRouter.get('/analytics', TransactionController.getTransactionAnalytics);
transactionRouter.get('/:id', transactionIdValidation, TransactionController.getTransactionById);

// Transaction creation routes
transactionRouter.post('/redemption', redemptionValidation, TransactionController.createRedemption);
transactionRouter.post('/completion', completionValidation, TransactionController.createCompletion);
transactionRouter.post('/abscondence', abscondenceValidation, TransactionController.createAbscondence);

export default transactionRouter;