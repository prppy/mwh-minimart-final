import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { verifyAccessToken } from "../middlewares/jwtMiddleware.js";

const adminRouter = Router();

// Retrieve dashboard statistics (Officer/Admin only, protected)
adminRouter.get("/metrics", verifyAccessToken, adminController.getAdminDashboardMetrics);

export default adminRouter;
