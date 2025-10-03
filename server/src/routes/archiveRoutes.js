// routes/archiveRoutes.js
import { Router } from 'express';
import { param, query, body } from 'express-validator';
import * as archiveController from '../controllers/archiveController.js';

const archiveRouter = Router();

// Validation middleware
const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const archiveQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('batchNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Batch number must be a positive integer'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

const archiveInactiveValidation = [
  body('monthsThreshold')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months threshold must be between 1 and 24')
];

// Routes
archiveRouter.post(
  '/archive-inactive',
  archiveInactiveValidation,
  archiveController.archiveInactiveResidents
);

archiveRouter.get(
  '/archived',
  archiveQueryValidation,
  archiveController.getArchivedResidents
);

archiveRouter.post(
  '/unarchive/:userId',
  userIdValidation,
  archiveController.unarchiveResident
);

archiveRouter.get(
  '/stats',
  archiveController.getArchiveStats
);

archiveRouter.post(
  '/update-activity/:userId',
  userIdValidation,
  archiveController.updateResidentActivity
);

export default archiveRouter;
