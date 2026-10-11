import express from 'express';
import { body, param, query } from 'express-validator';
import * as OrderController from '../controllers/orderController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';
import { ACTIVE_STATUSES, HISTORY_STATUSES } from '../models/orderModel.js';

const orderRouter = express.Router();

const staffOnly = [verifyAccessToken, requireRole('officer', 'admin', 'superadmin', 'developer')];

const limitValidation = query('limit')
  .optional()
  .isInt({ min: 1, max: 500 })
  .withMessage('Limit must be between 1 and 500');

const listValidation = [
  query('scope')
    .optional()
    .isIn(['active', 'history', ...ACTIVE_STATUSES, ...HISTORY_STATUSES])
    .withMessage('Invalid scope'),
  query('type')
    .optional()
    .isIn(['normal', 'preorder'])
    .withMessage('Type must be normal or preorder'),
  limitValidation
];

const statusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('status')
    .isIn(['ready', 'collected', 'cancelled'])
    .withMessage('Status must be ready, collected or cancelled')
];

// Resident: own orders
orderRouter.get('/my', verifyAccessToken, limitValidation, OrderController.getMyOrders);

// Staff: all orders + status changes
orderRouter.get('/', staffOnly, listValidation, OrderController.getOrders);
orderRouter.patch('/:id/status', staffOnly, statusValidation, OrderController.updateOrderStatus);

export default orderRouter;
