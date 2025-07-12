// routes/transactions.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { getAllTransactions, getUserTransactions, getPointsSummary, createRedemption, createCompletion } from '../controllers/transactionsController';
import { authenticateToken, requireOfficerOrAdmin, requireOwnershipOrStaff } from '../middleware/auth';

const transactionRouter = Router();

// Validation middleware
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
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
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

// Routes
transactionRouter.get('/', authenticateToken, requireOfficerOrAdmin, getAllTransactions);
transactionRouter.get('/user/:userId', authenticateToken, requireOwnershipOrStaff, getUserTransactions);
transactionRouter.get('/user/:userId/summary', authenticateToken, requireOwnershipOrStaff, getPointsSummary);
transactionRouter.post('/redemption', authenticateToken, requireOfficerOrAdmin, redemptionValidation, createRedemption);
transactionRouter.post('/completion', authenticateToken, requireOfficerOrAdmin, completionValidation, createCompletion);