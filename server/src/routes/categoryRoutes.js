// routes/categories.js
import express from 'express';
const categoryRouter = express.Router();
import * as categoryController from '../controllers/categoryController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';

const staffOnly = [verifyAccessToken, requireRole('admin', 'superadmin')];

categoryRouter.get('/', categoryController.getAllCategories);
categoryRouter.post('/', staffOnly, categoryController.createCategory);
categoryRouter.put('/:id', staffOnly, categoryController.updateCategory);
categoryRouter.delete('/:id', staffOnly, categoryController.deleteCategory);

export default categoryRouter;