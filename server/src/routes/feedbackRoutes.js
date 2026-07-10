import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import * as productRequestController from '../controllers/productRequestController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';

const router = express.Router();

const staffOnly = [verifyAccessToken, requireRole('admin', 'superadmin')];
// Changing feedback is restricted to Super Admins; admins can still read.
const superAdminOnly = [verifyAccessToken, requireRole('superadmin')];

// ── Feedback (staff read, superadmin change) ───────────────────────────────
router.get("/",             staffOnly, feedbackController.listFeedback);
router.get("/stats",        staffOnly, feedbackController.feedbackStats);
router.get("/export",       staffOnly, feedbackController.exportFeedback);
router.patch("/:id/status", superAdminOnly, feedbackController.patchFeedbackStatus);

// ── Public submit ──────────────────────────────────────────────────────────
router.post("/rate-us",         feedbackController.submitRating);

// ── Product requests ───────────────────────────────────────────────────────
router.get("/product-requests",              staffOnly, productRequestController.listProductRequests);
router.patch("/product-requests/:id/status", staffOnly, productRequestController.patchRequestStatus);
router.post("/product-request",              feedbackController.submitProductRequest);

export default router;