// controllers/categoriesController.js
import { validationResult } from 'express-validator';
import { prisma } from '../lib/db';

class CategoriesController {
  // Get all categories
  static async getAllCategories(req, res) {
    try {
      const { includeProductCount = false } = req.query;

      let categories;
      
      if (includeProductCount === 'true') {
        categories = await prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    available: true
                  }
                }
              }
            }
          },
          orderBy: { categoryName: 'asc' }
        });
      } else {
        categories = await prisma.category.findMany({
          orderBy: { categoryName: 'asc' }
        });
      }

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

      const include = {};
      if (includeProducts === 'true') {
        include.products = {
          where: {
            available: true
          },
          orderBy: { productName: 'asc' }
        };
      }

      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include
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

      const { categoryName } = req.body;

      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { categoryName }
      });

      if (existingCategory) {
        return res.status(409).json({ 
          error: { message: 'Category with this name already exists' }
        });
      }

      const category = await prisma.category.create({
        data: { categoryName }
      });

      res.status(201).json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Create category error:', error);
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
      const { categoryName } = req.body;

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCategory) {
        return res.status(404).json({ 
          error: { message: 'Category not found' }
        });
      }

      // Check if new name conflicts with existing category
      if (categoryName !== existingCategory.categoryName) {
        const nameConflict = await prisma.category.findUnique({
          where: { categoryName }
        });

        if (nameConflict) {
          return res.status(409).json({ 
            error: { message: 'Category with this name already exists' }
          });
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id: parseInt(id) },
        data: { categoryName }
      });

      res.json({
        success: true,
        data: updatedCategory
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete category
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!category) {
        return res.status(404).json({ 
          error: { message: 'Category not found' }
        });
      }

      // Check if category has products
      const productCount = await prisma.product.count({
        where: { categoryId: parseInt(id) }
      });

      if (productCount > 0) {
        return res.status(400).json({ 
          error: { 
            message: 'Cannot delete category with existing products',
            productCount 
          }
        });
      }

      await prisma.category.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        data: { message: 'Category deleted successfully' }
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get category statistics
  static async getCategoryStatistics(req, res) {
    try {
      const [totalCategories, categoriesWithProducts, topCategories] = await Promise.all([
        // Total categories count
        prisma.category.count(),

        // Categories with product counts
        prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    available: true
                  }
                }
              }
            }
          },
          orderBy: { categoryName: 'asc' }
        }),

        // Top categories by product count
        prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    available: true
                  }
                }
              }
            }
          },
          orderBy: {
            products: {
              _count: 'desc'
            }
          },
          take: 5
        })
      ]);

      const statistics = {
        totalCategories,
        categoriesWithProducts: categoriesWithProducts.filter(cat => cat._count.products > 0).length,
        emptyCategories: categoriesWithProducts.filter(cat => cat._count.products === 0).length,
        topCategories: topCategories.map(cat => ({
          id: cat.id,
          categoryName: cat.categoryName,
          productCount: cat._count.products
        })),
        allCategories: categoriesWithProducts.map(cat => ({
          id: cat.id,
          categoryName: cat.categoryName,
          productCount: cat._count.products
        }))
      };

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

      const categories = await prisma.category.findMany({
        where: {
          categoryName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  available: true
                }
              }
            }
          }
        },
        orderBy: { categoryName: 'asc' }
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