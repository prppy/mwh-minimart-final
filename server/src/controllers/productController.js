// controllers/productController.js (Refactored)
import { validationResult } from 'express-validator';
import * as ProductModel from '../models/productModel.js';
import * as CategoryModel from '../models/categoryModel.js';

// Get all products with filtering
export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      categories,
      types,
      maxPoints,
      minPoints,
      available,
      sortBy,
      sortOrder,
      limit,
      offset
    } = req.query;

    const filters = {
      search,
      categories: categories ? categories.split(',') : undefined,
      types: types ? types.split(',') : undefined,
      maxPoints,
      minPoints,
      available: available !== undefined ? available === 'true' : true,
      sortBy,
      sortOrder,
      limit,
      offset
    };

    const result = await ProductModel.findWithFilters(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeAnalytics = false } = req.query;

    const product = await ProductModel.findById(id, includeAnalytics === 'true');

    if (!product) {
      return res.status(404).json({ 
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get popular products
export const getPopularProducts = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'month' } = req.query;

    const products = await ProductModel.getPopular(limit, timeframe);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const product = await ProductModel.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
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

// Update product
export const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const updatedProduct = await ProductModel.update(id, req.body);

    res.json({
      success: true,
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error.message === 'Product not found' || error.message === 'Category not found') {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ProductModel.remove(id);

    res.json({
      success: true,
      data: { message: result.available === false ? 'Product deactivated successfully' : 'Product deleted successfully' }
    });

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ 
        error: { message: error.message }
      });
    }
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.findAll({
      includeProductCount: true
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
};

// Get product statistics
export const getProductStatistics = async (req, res) => {
  try {
    const statistics = await ProductModel.getStatistics();

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get product statistics error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q: search, limit, includeUnavailable } = req.query;

    if (!search) {
      return res.status(400).json({ 
        error: { message: 'Search query is required' }
      });
    }

    const products = await ProductModel.search(search, {
      limit,
      includeUnavailable: includeUnavailable === 'true'
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};
