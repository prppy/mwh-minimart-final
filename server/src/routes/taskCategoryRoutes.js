// routes/taskCategories.js
import express from 'express';
import * as taskCategoryController from '../controllers/taskCategoryController.js';
import { verifyAccessToken, requireRole } from '../middlewares/jwtMiddleware.js';

const taskCategoryRouter = express.Router();

const staffOnly = [verifyAccessToken, requireRole('admin', 'superadmin')];

taskCategoryRouter.get('/', taskCategoryController.getAllTaskCategories);
taskCategoryRouter.get('/:id', taskCategoryController.getTaskCategoryById);
taskCategoryRouter.post('/', staffOnly, taskCategoryController.createTaskCategory);
taskCategoryRouter.put('/:id', staffOnly, taskCategoryController.updateTaskCategory);
taskCategoryRouter.delete('/:id', staffOnly, taskCategoryController.deleteTaskCategory);

export default taskCategoryRouter;
