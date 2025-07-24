// routes/tasks.js
import express from 'express';
const taskRouter = express.Router();
import TasksController from '../controllers/taskController.js';

taskRouter.get('/', TasksController.getAllTasks);
taskRouter.get('/categories', TasksController.getTaskCategories);
taskRouter.post('/', TasksController.createTask);
taskRouter.put('/:id', TasksController.updateTask);
taskRouter.delete('/:id', TasksController.deleteTask);

export default taskRouter;