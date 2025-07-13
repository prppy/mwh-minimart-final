// Import routes
import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import taskRoutes from './taskRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/tasks', taskRoutes);
router.use('/transactions', transactionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
