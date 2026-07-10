// routes/exportRoutes.js
import express from 'express';
import * as ExportController from '../controllers/exportController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';

const exportRouter = express.Router();

// Exports contain resident records — staff only
exportRouter.use(verifyAccessToken, requireRole('admin', 'superadmin'));

// Export individual resident records
exportRouter.get('/resident/:userId', ExportController.exportResidentRecords);

// Export category records
exportRouter.get('/category/:categoryId', ExportController.exportCategoryRecords);

// Export all voucher records
exportRouter.get('/all', ExportController.exportAllRecords);

export default exportRouter;
