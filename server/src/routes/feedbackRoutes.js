import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';

const router = express.Router();

// Admin routes
router.get("/",               feedbackController.listFeedback);
router.get("/stats",          feedbackController.feedbackStats);
router.get("/export",         feedbackController.exportFeedback);
router.patch("/:id/status",   feedbackController.patchFeedbackStatus);

// Public resident routes
router.post("/rate-us",         feedbackController.submitRating);
router.post("/product-request", feedbackController.submitProductRequest);

export default router;