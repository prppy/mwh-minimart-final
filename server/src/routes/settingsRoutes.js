import express from 'express';
import { body } from 'express-validator';
import * as OrderController from '../controllers/orderController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';
import { MAX_TICKET_EXPIRY_DAYS } from '../models/orderModel.js';

const settingsRouter = express.Router();

const settingsValidation = [
  body('ticketExpiryDays')
    .optional()
    .isInt({ min: 0, max: MAX_TICKET_EXPIRY_DAYS })
    .withMessage(`Ticket expiry must be between 0 and ${MAX_TICKET_EXPIRY_DAYS} days`)
];

settingsRouter.get('/', OrderController.getSettings);
settingsRouter.put(
  '/',
  verifyAccessToken,
  requireRole('officer', 'admin', 'superadmin', 'developer'),
  settingsValidation,
  OrderController.updateSettings
);

export default settingsRouter;
