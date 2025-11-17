// routes/leaderboard.js// routes/productRoutes.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as ProductController from '../controllers/productController.js';

const productRouter = Router();

// Validation middleware
const productValidation = [
  body('productName')
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('productDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Product description must be less than 500 characters'),
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

const productUpdateValidation = [
  body('productName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('productDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Product description must be less than 500 characters'),
  body('points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean'),
  body('stock')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

const productIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

const productQueryValidation = [
  query('category')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category must be a positive integer'),
  query('minPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum points must be non-negative'),
  query('maxPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum points must be non-negative'),
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['productName', 'points', 'createdAt', 'popularity'])
    .withMessage('Sort by must be productName, points, createdAt, or popularity'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const popularProductsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Public routes (authenticated users)
productRouter.get('/', productQueryValidation, ProductController.getAllProducts); 
productRouter.get('/category/:categoryId', productIdValidation, ProductController.getProductsByCategory);
productRouter.get('/:id', productIdValidation, ProductController.getProductById);

// Officer/Admin only routes
productRouter.post('/', productValidation, ProductController.createProduct);
productRouter.put('/:id', productIdValidation, productUpdateValidation, ProductController.updateProduct);
productRouter.delete('/:id', productIdValidation, ProductController.deleteProduct);

export default productRouter;