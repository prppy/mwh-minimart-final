// Import routes
import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js';
import authenticationRoute from './authenticationRoute.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import taskCategoryRoutes from './taskCategoryRoutes.js';
import taskRoutes from './taskRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import archiveRoutes from './archiveRoutes.js';

router.use('/users', userRoutes);
router.use('/authentication', authenticationRoute);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/taskCategories', taskCategoryRoutes);
router.use('/tasks', taskRoutes);
router.use('/transactions', transactionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/archive', archiveRoutes);

export default router;
