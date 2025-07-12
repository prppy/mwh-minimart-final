// controllers/tasksController.js
import { validationResult } from 'express-validator';
import { findMany, findById, create, update, delete, getPopular, getAnalytics, getStatistics } from '../models/taskModel';

class TasksController {
  // Get all tasks with filtering
  static async getAllTasks(req, res) {
    try {
      const {
        active,
        categoryId,
        search,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      const result = await findMany({
        active: active !== undefined ? active === 'true' : true,
        categoryId,
        search,
        limit,
        offset,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get task by ID
  static async getTaskById(req, res) {
    try {
      const { id } = req.params;

      const task = await findById(id);

      if (!task) {
        return res.status(404).json({ 
          error: { message: 'Task not found' }
        });
      }

      res.json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Create new task
  static async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const task = await create(req.body);

      res.status(201).json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error('Create task error:', error);
      if (error.message.includes('Invalid task category ID')) {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update task
  static async updateTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { id } = req.params;
      const updates = req.body;

      const task = await update(id, updates);

      res.json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error('Update task error:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      if (error.message.includes('Invalid task category ID')) {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete task
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;

      const result = await delete(id);

      res.json({
        success: true,
        data: { message: 'Task deleted or deactivated successfully' }
      });

    } catch (error) {
      console.error('Delete task error:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get popular tasks
  static async getPopularTasks(req, res) {
    try {
      const { limit = 10, timeframe = 'month' } = req.query;

      const tasks = await getPopular(limit, timeframe);

      res.json({
        success: true,
        data: tasks
      });

    } catch (error) {
      console.error('Get popular tasks error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get task analytics
  static async getTaskAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = 'month' } = req.query;

      const analytics = await getAnalytics(id, period);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Get task analytics error:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get task statistics
  static async getTaskStatistics(req, res) {
    try {
      const statistics = await getStatistics();

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Get task statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get task categories
  static async getTaskCategories(req, res) {
    try {
      const { prisma } = require('../lib/db');
      
      const categories = await prisma.taskCategory.findMany({
        orderBy: { taskCategoryName: 'asc' }
      });

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get task categories error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default TasksController;