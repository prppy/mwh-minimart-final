// controllers/categoriesController.js (Refactored)
import { validationResult } from 'express-validator';
import CategoryModel from '../models/categoryModel.js';

class CategoriesController {
  // Get all categories
  static async getAllCategories(req, res) {
    try {
      const { includeProductCount = false } = req.query;

      const categories = await CategoryModel.findAll({
        includeProductCount: includeProductCount === 'true'
      });

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get category by ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const { includeProducts = false } = req.query;

      const category = await CategoryModel.findById(id, {
        includeProducts: includeProducts === 'true'
      });

      if (!category) {
        return res.status(404).json({ 
          error: { message: 'Category not found' }
        });
      }

      res.json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Create new category
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const category = await CategoryModel.create(req.body);

      res.status(201).json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Create category error:', error);
      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update category
  static async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { id } = req.params;
      const updatedCategory = await CategoryModel.update(id, req.body);

      res.json({
        success: true,
        data: updatedCategory
      });

    } catch (error) {
      console.error('Update category error:', error);
      if (error.message === 'Category not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete category
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      await CategoryModel.delete(id);

      res.json({
        success: true,
        data: { message: 'Category deleted successfully' }
      });

    } catch (error) {
      console.error('Delete category error:', error);
      if (error.message === 'Category not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      if (error.message === 'Cannot delete category with existing products') {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get category statistics
  static async getCategoryStatistics(req, res) {
    try {
      const statistics = await CategoryModel.getStatistics();

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Get category statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Search categories
  static async searchCategories(req, res) {
    try {
      const { q: search } = req.query;

      if (!search) {
        return res.status(400).json({ 
          error: { message: 'Search query is required' }
        });
      }

      const categories = await CategoryModel.search(search, {
        includeProductCount: true
      });

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Search categories error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default CategoriesController;