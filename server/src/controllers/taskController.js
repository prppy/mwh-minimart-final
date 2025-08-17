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

// Add this method to your existing taskController.js

/**
 * Get tasks by category
 */
export const getTasksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 50, offset = 0, sortBy = 'taskName', sortOrder = 'asc' } = req.query;

    // Validate categoryId
    if (!categoryId || isNaN(parseInt(categoryId))) {
      return res.status(400).json({
        error: { message: 'Invalid category ID' }
      });
    }

    const options = {
      categoryId: parseInt(categoryId),
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    };

    const result = await TaskModel.findByCategory(options);

    res.json({
      success: true,
      data: {
        tasks: result.tasks,
        categoryId: parseInt(categoryId),
        total: result.totalCount,
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Get tasks by category error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }

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

