// routes/tasks.js
import express from 'express';
import { body, param, query } from 'express-validator';
const taskRouter = express.Router();
import * as TasksController from '../controllers/taskController.js';

// Validation middleware for getting a task
const taskIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer')
];

// Validation middleware for creating tasks
const createTaskValidation = [
  body('taskName')
    .notEmpty()
    .withMessage('Task name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Task name must be between 1 and 100 characters'),

  body('taskDescription')
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Task description must be between 1 and 500 characters'),

  body('points')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Points must be a positive integer between 1 and 10000'),

  body('taskCategoryId')
    .isInt({ min: 1 })
    .withMessage('Task category ID must be a positive integer'),

  body('imageUrl')
    .optional()
    .isString()
    .withMessage('Image URL must be a string')
];

// Validation middleware for updating tasks
const updateTaskValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer'),

  body('taskName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Task name must be between 1 and 100 characters'),

  body('taskDescription')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Task description must be between 1 and 500 characters'),

  body('points')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Points must be a positive integer between 1 and 10000'),

  body('taskCategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Task category ID must be a positive integer'),

  body('imageUrl')
    .optional()
    .isString()
    .withMessage('Image URL must be a string')
];

taskRouter.get('/', TasksController.getAllTasks);
taskRouter.get('/category/:categoryId', TasksController.getTasksByCategory);
taskRouter.get('/:id', taskIdValidation, TasksController.getTaskById);

taskRouter.post('/', createTaskValidation, TasksController.createTask);
taskRouter.put('/:id', updateTaskValidation, TasksController.updateTask);
taskRouter.delete('/:id', TasksController.deleteTask);

export default taskRouter;