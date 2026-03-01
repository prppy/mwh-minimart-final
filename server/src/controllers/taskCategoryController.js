// controllers/taskCategoryController.js
import { validationResult } from 'express-validator';
import * as TaskCategoryModel from '../models/taskCategoryModel.js';

export const getAllTaskCategories = async (req, res) => {
  try {
    const { includeTaskCount = false } = req.query;

    const categories = await TaskCategoryModel.findAll({
      includeTaskCount: includeTaskCount === 'true'
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get task categories error:', error);
    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};

export const getTaskCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeTasks = false } = req.query;

    const category = await TaskCategoryModel.findById(id, {
      includeTasks: includeTasks === 'true'
    });

    if (!category) {
      return res.status(404).json({ error: { message: 'Task category not found' }});
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get task category error:', error);
    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};

export const createTaskCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const category = await TaskCategoryModel.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create task category error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: { message: error.message }});
    }

    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};

export const updateTaskCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updated = await TaskCategoryModel.update(id, req.body);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update task category error:', error);

    if (error.message === 'Task category not found') {
      return res.status(404).json({ error: { message: error.message }});
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: { message: error.message }});
    }

    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};

export const deleteTaskCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await TaskCategoryModel.remove(id);

    res.json({ success: true, data: { message: 'Task category deleted successfully' }});
  } catch (error) {
    console.error('Delete task category error:', error);

    if (error.message === 'Task category not found') {
      return res.status(404).json({ error: { message: error.message }});
    }

    if (error.message.includes('existing tasks')) {
      return res.status(400).json({ error: { message: error.message }});
    }

    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};

export const searchTaskCategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: { message: 'Search query is required' }
      });
    }

    const categories = await TaskCategoryModel.search(q, {
      includeTaskCount: true
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Search task categories error:', error);
    res.status(500).json({ error: { message: 'Internal server error' }});
  }
};
