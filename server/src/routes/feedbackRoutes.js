import express from 'express';
const router = express.Router();
import * as categoryController from '../controllers/feedbackController.js';

// GET /api/feedback?search=&category=&rating=&sortBy=&page=&pageSize=
router.get("/", categoryController.listFeedback);

// GET /api/feedback/stats
router.get("/stats", categoryController.feedbackStats);

// GET /api/feedback/export
router.get("/export", categoryController.exportFeedback);

export default router;