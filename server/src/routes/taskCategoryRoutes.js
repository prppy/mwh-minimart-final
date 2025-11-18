// routes/taskCategories.js
import express from 'express';
import * as taskCategoryController from '../controllers/taskCategoryController.js';

const taskCategoryRouter = express.Router();

taskCategoryRouter.get('/', taskCategoryController.getAllTaskCategories);
taskCategoryRouter.get('/:id', taskCategoryController.getTaskCategoryById);
taskCategoryRouter.post('/', taskCategoryController.createTaskCategory);
taskCategoryRouter.put('/:id', taskCategoryController.updateTaskCategory);
taskCategoryRouter.delete('/:id', taskCategoryController.deleteTaskCategory);

export default taskCategoryRouter;
