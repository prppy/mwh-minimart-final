// routes/exportRoutes.js
import express from 'express';
import * as ExportController from '../controllers/exportController.js';

const exportRouter = express.Router();

// Export individual resident records
exportRouter.get('/resident/:userId', ExportController.exportResidentRecords);

// Export category records
exportRouter.get('/category/:categoryId', ExportController.exportCategoryRecords);

// Export all voucher records
exportRouter.get('/all', ExportController.exportAllRecords);

export default exportRouter;
