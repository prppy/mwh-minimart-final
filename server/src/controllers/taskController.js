// controllers/taskController.js (Refactored)
import { validationResult } from 'express-validator';
import * as TaskModel from '../models/taskModel.js';

// Get all tasks
export const getAllTasks = async (req, res) => {
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

    const result = await TaskModel.findMany({
      active: active === 'false' ? false : true,
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
    console.error('Get all tasks error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await TaskModel.findById(id);

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
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const task = await TaskModel.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Create task error:', error);
    if (error.message.includes('not found') || error.message.includes('Missing required fields')) {
      return res.status(400).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const task = await TaskModel.update(id, req.body);

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Update task error:', error);
    if (error.message === 'Task not found' || error.message === 'Task category not found') {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TaskModel.remove(id);

    res.json({
      success: true,
      data: { message: result.active === false ? 'Task deactivated successfully' : 'Task deleted successfully' }
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
};

// Get popular tasks
export const getPopularTasks = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'month' } = req.query;

    const tasks = await TaskModel.getPopular(limit, timeframe);

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
};

// Get task analytics
export const getTaskAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;

    const analytics = await TaskModel.getAnalytics(id, period);

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
};

// Get task statistics
export const getTaskStatistics = async (req, res) => {
  try {
    const statistics = await TaskModel.getStatistics();

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
};

// Get task categories
export const getTaskCategories = async (req, res) => {
  try {
    const categories = await TaskModel.getCategories();

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
};
