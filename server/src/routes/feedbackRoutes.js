// routes/feedbackRoutes.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as FeedbackController from '../controllers/feedbackController.js';

const feedbackRouter = Router();

// Validation middleware
const productRequestValidation = [
  body('productName')
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .isIn(['hygiene', 'snacks', 'drinks', 'electronics', 'games', 'books', 'clothing', 'other'])
    .withMessage('Invalid category'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Urgency must be low, medium, or high')
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Feedback must be less than 500 characters'),
  body('category')
    .optional()
    .isIn(['general', 'product', 'service', 'facility', 'suggestion', 'complaint'])
    .withMessage('Invalid feedback category')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  body('comments')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Comments must be less than 300 characters')
];

const requestIdValidation = [
  param('requestId')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

// Public routes (authenticated users)
feedbackRouter.post('/product-request', productRequestValidation, FeedbackController.submitProductRequest);
feedbackRouter.post('/rating', ratingValidation, FeedbackController.submitRating);
feedbackRouter.get('/categories', FeedbackController.getFeedbackCategories);
feedbackRouter.get('/product-categories', FeedbackController.getProductRequestCategories);

// User-specific routes (ownership or staff required)
feedbackRouter.get('/user/:userId/requests', userIdValidation, FeedbackController.getUserProductRequests);

// Officer/Admin only routes
feedbackRouter.get('/requests', FeedbackController.getProductRequests);
feedbackRouter.put('/requests/:requestId/status', requestIdValidation, statusUpdateValidation, FeedbackController.updateRequestStatus);
feedbackRouter.get('/statistics', FeedbackController.getFeedbackStatistics);
feedbackRouter.get('/activity', FeedbackController.getRecentActivity);
feedbackRouter.get('/export', FeedbackController.exportFeedbackData);

export default feedbackRouter;