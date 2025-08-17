// routes/tasks.js
import express from 'express';
const taskRouter = express.Router();
import * as TasksController from '../controllers/taskController.js';

taskRouter.get('/', TasksController.getAllTasks);
taskRouter.get('/category/:categoryId', TasksController.getTasksByCategory);
taskRouter.post('/', TasksController.createTask);
taskRouter.put('/:id', TasksController.updateTask);
taskRouter.delete('/:id', TasksController.deleteTask);

export default taskRouter;