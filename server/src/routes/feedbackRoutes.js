import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import * as productRequestController from '../controllers/productRequestController.js';

const router = express.Router();

// ── Feedback ───────────────────────────────────────────────────────────────
router.get("/",             feedbackController.listFeedback);
router.get("/stats",        feedbackController.feedbackStats);
router.get("/export",       feedbackController.exportFeedback);
router.patch("/:id/status", feedbackController.patchFeedbackStatus);

// ── Public submit ──────────────────────────────────────────────────────────
router.post("/rate-us",         feedbackController.submitRating);

// ── Product requests ───────────────────────────────────────────────────────
router.get("/product-requests",             productRequestController.listProductRequests);
router.patch("/product-requests/:id/status", productRequestController.patchRequestStatus);
router.post("/product-request",              feedbackController.submitProductRequest);

export default router;