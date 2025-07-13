// controllers/productController.js (Refactored)
import { validationResult } from 'express-validator';
import ProductModel from '../models/productModel.js';
import CategoryModel from '../models/categoryModel.js';

class ProductsController {
  // Get all products with filtering
  static async getAllProducts(req, res) {
    try {
      const {
        search,
        categories,
        types,
        maxPoints,
        minPoints,
        sortBy = 'productName',
        sortOrder = 'asc',
        limit = 50,
        offset = 0
      } = req.query;

      // Parse categories if provided
      const categoryFilter = categories ? categories.split(',').map(id => parseInt(id)) : undefined;
      const typeFilter = types ? types.split(',') : undefined;

      const result = await ProductModel.findWithFilters({
        search,
        categories: categoryFilter,
        types: typeFilter,
        maxPoints,
        minPoints,
        sortBy,
        sortOrder,
        limit,
        offset
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get single product by ID
  static async getProductById(req, res) {
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
  }

  // Get popular products (most redeemed)
  static async getPopularProducts(req, res) {
    try {
      const { limit = 10, timeframe = 'all' } = req.query;

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
  }

  // Create new product (admin/officer only)
  static async createProduct(req, res) {
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
      if (error.message === 'Invalid category ID') {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update product (admin/officer only)
  static async updateProduct(req, res) {
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
      if (error.message === 'Product not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      if (error.message === 'Invalid category ID') {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete product (admin only)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const result = await ProductModel.delete(id);

      res.json({
        success: true,
        data: result
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
  }

  // Get product categories
  static async getCategories(req, res) {
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
  }

  // Get product statistics
  static async getProductStatistics(req, res) {
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
  }

  // Search products
  static async searchProducts(req, res) {
    try {
      const { q: search, limit = 20, includeUnavailable = false } = req.query;

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
  }
}

export default ProductsController;