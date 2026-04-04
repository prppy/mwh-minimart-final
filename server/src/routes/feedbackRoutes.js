import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';

const router = express.Router();

// GET  /api/feedback?search=&category=&rating=&sortBy=&status=&page=&pageSize=
router.get("/",             feedbackController.listFeedback);

// GET  /api/feedback/stats
router.get("/stats",        feedbackController.feedbackStats);

// GET  /api/feedback/export
router.get("/export",       feedbackController.exportFeedback);

// PATCH /api/feedback/:id/status
router.patch("/:id/status", feedbackController.patchFeedbackStatus);

export default router;