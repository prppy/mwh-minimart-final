  // controllers/productController.js
import { validationResult } from 'express-validator';
import { prisma } from '../lib/db';

class ProductsController {
  // Get all products with filtering (matches your frontend filtering)
  static async getAllProducts(req, res) {
    try {
      const {
        search,
        categories,
        types,
        maxPoints,
        sortBy = 'productName',
        sortOrder = 'asc',
        limit = 50,
        offset = 0
      } = req.query;

      // Build where clause
      const where = {
        available: true
      };

      // Search filter
      if (search) {
        where.productName = {
          contains: search,
          mode: 'insensitive'
        };
      }

      // Category filter
      if (categories) {
        const categoryIds = categories.split(',').map(id => parseInt(id));
        where.categoryId = {
          in: categoryIds
        };
      }

      // Product type filter
      if (types) {
        const typeFilter = types.split(',');
        where.productType = {
          in: typeFilter
        };
      }

      // Points filter
      if (maxPoints) {
        where.points = {
          lte: parseInt(maxPoints)
        };
      }

      // Build orderBy clause
      const orderBy = {};
      if (sortBy === 'productName') {
        orderBy.productName = sortOrder.toLowerCase();
      } else if (sortBy === 'points') {
        orderBy.points = sortOrder.toLowerCase();
      } else {
        orderBy[sortBy] = sortOrder.toLowerCase();
      }

      // Execute query with pagination
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                categoryName: true
              }
            }
          },
          orderBy,
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
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

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: {
            select: {
              id: true,
              categoryName: true
            }
          }
        }
      });

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
      const { limit = 10 } = req.query;

      const products = await prisma.product.findMany({
        where: { available: true },
        include: {
          category: {
            select: {
              id: true,
              categoryName: true
            }
          },
          _count: {
            select: {
              redemptions: true
            }
          }
        },
        orderBy: {
          redemptions: {
            _count: 'desc'
          }
        },
        take: parseInt(limit)
      });

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

      const {
        productName,
        imageUrl,
        productDescription,
        points,
        productType = 'physical',
        categoryId,
        available = true
      } = req.body;

      // Verify category exists if provided
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: parseInt(categoryId) }
        });
        
        if (!category) {
          return res.status(400).json({ 
            error: { message: 'Invalid category ID' }
          });
        }
      }

      const product = await prisma.product.create({
        data: {
          productName,
          imageUrl,
          productDescription,
          points: parseInt(points),
          productType,
          categoryId: categoryId ? parseInt(categoryId) : null,
          available
        },
        include: {
          category: {
            select: {
              id: true,
              categoryName: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Create product error:', error);
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
      const updates = req.body;

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        return res.status(404).json({ 
          error: { message: 'Product not found' }
        });
      }

      // Verify category exists if being updated
      if (updates.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: parseInt(updates.categoryId) }
        });
        
        if (!category) {
          return res.status(400).json({ 
            error: { message: 'Invalid category ID' }
          });
        }
      }

      // Build update data
      const updateData = {};
      if (updates.productName !== undefined) updateData.productName = updates.productName;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
      if (updates.productDescription !== undefined) updateData.productDescription = updates.productDescription;
      if (updates.points !== undefined) updateData.points = parseInt(updates.points);
      if (updates.productType !== undefined) updateData.productType = updates.productType;
      if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId ? parseInt(updates.categoryId) : null;
      if (updates.available !== undefined) updateData.available = updates.available;

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              categoryName: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete product (admin only)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        return res.status(404).json({ 
          error: { message: 'Product not found' }
        });
      }

      // Check if product has been redeemed
      const redemptionCount = await prisma.redemption.count({
        where: { productId: parseInt(id) }
      });

      if (redemptionCount > 0) {
        // Don't delete, just mark as unavailable
        await prisma.product.update({
          where: { id: parseInt(id) },
          data: { available: false }
        });
        
        return res.json({
          success: true,
          data: { message: 'Product marked as unavailable due to existing redemptions' }
        });
      }

      await prisma.product.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        data: { message: 'Product deleted successfully' }
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get product categories
  static async getCategories(req, res) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { categoryName: 'asc' }
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

  // Search products
  static async searchProducts(req, res) {
    try {
      const { q: search, limit = 20, includeUnavailable = false } = req.query;

      if (!search) {
        return res.status(400).json({ 
          error: { message: 'Search query is required' }
        });
      }

      const where = {
        OR: [
          {
            productName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            productDescription: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            category: {
              categoryName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ]
      };

      if (includeUnavailable !== 'true') {
        where.available = true;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              categoryName: true
            }
          },
          _count: {
            select: {
              redemptions: true
            }
          }
        },
        orderBy: [
          { productName: 'asc' }
        ],
        take: parseInt(limit)
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

  // Get product analytics
  static async getProductAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = 'month' } = req.query;

      const now = new Date();
      let startDate;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [product, redemptions, periodRedemptions] = await Promise.all([
        // Basic product info
        prisma.product.findUnique({
          where: { id: parseInt(id) },
          include: {
            category: {
              select: {
                id: true,
                categoryName: true
              }
            }
          }
        }),
        
        // All-time redemptions
        prisma.redemption.findMany({
          where: { productId: parseInt(id) },
          include: {
            transaction: {
              include: {
                user: {
                  select: {
                    userName: true
                  }
                }
              }
            }
          },
          orderBy: {
            transaction: {
              transactionDate: 'desc'
            }
          }
        }),

        // Period redemptions
        prisma.redemption.findMany({
          where: {
            productId: parseInt(id),
            transaction: {
              transactionDate: {
                gte: startDate
              }
            }
          },
          include: {
            transaction: true
          }
        })
      ]);

      if (!product) {
        return res.status(404).json({ 
          error: { message: 'Product not found' }
        });
      }

      // Calculate analytics
      const totalRedemptions = redemptions.length;
      const totalQuantityRedeemed = redemptions.reduce((sum, r) => sum + r.productQuantity, 0);
      const periodRedemptionsCount = periodRedemptions.length;
      const periodQuantityRedeemed = periodRedemptions.reduce((sum, r) => sum + r.productQuantity, 0);
      
      // Revenue in points
      const totalPointsEarned = totalQuantityRedeemed * product.points;
      const periodPointsEarned = periodQuantityRedeemed * product.points;

      // Daily breakdown for the period
      const dailyBreakdown = {};
      periodRedemptions.forEach(redemption => {
        const date = redemption.transaction.transactionDate.toISOString().split('T')[0];
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { redemptions: 0, quantity: 0 };
        }
        dailyBreakdown[date].redemptions += 1;
        dailyBreakdown[date].quantity += redemption.productQuantity;
      });

      res.json({
        success: true,
        data: {
          product,
          analytics: {
            allTime: {
              redemptions: totalRedemptions,
              quantityRedeemed: totalQuantityRedeemed,
              pointsEarned: totalPointsEarned
            },
            period: {
              redemptions: periodRedemptionsCount,
              quantityRedeemed: periodQuantityRedeemed,
              pointsEarned: periodPointsEarned,
              dailyBreakdown
            },
            recentRedemptions: redemptions.slice(0, 10)
          }
        }
      });

    } catch (error) {
      console.error('Get product analytics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get product statistics
  static async getProductStatistics(req, res) {
    try {
      const [overallStats, categoryStats, typeStats] = await Promise.all([
        // Overall product statistics
        prisma.product.aggregate({
          _count: {
            id: true
          },
          _avg: {
            points: true
          },
          _max: {
            points: true
          },
          _min: {
            points: true
          },
          where: {
            available: true
          }
        }),

        // Statistics by category
        prisma.product.groupBy({
          by: ['categoryId'],
          where: {
            available: true,
            categoryId: {
              not: null
            }
          },
          _count: {
            id: true
          },
          _avg: {
            points: true
          }
        }),

        // Statistics by type
        prisma.product.groupBy({
          by: ['productType'],
          where: {
            available: true
          },
          _count: {
            id: true
          },
          _avg: {
            points: true
          }
        })
      ]);

      // Get category names for category stats
      const categoryStatsWithNames = await Promise.all(
        categoryStats.map(async (stat) => {
          const category = await prisma.category.findUnique({
            where: { id: stat.categoryId },
            select: { categoryName: true }
          });
          return {
            ...stat,
            categoryName: category?.categoryName || 'Unknown'
          };
        })
      );

      res.json({
        success: true,
        data: {
          overall: {
            totalProducts: overallStats._count.id,
            avgPoints: Math.round(overallStats._avg.points || 0),
            maxPoints: overallStats._max.points || 0,
            minPoints: overallStats._min.points || 0
          },
          byCategory: categoryStatsWithNames,
          byType: typeStats
        }
      });

    } catch (error) {
      console.error('Get product statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get low stock products (for physical products)
  static async getLowStock(req, res) {
    try {
      const { threshold = 10 } = req.query;
      
      // This would require a stock field in the schema
      // For now, return products that haven't been redeemed recently
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const products = await prisma.product.findMany({
        where: {
          available: true,
          productType: 'physical',
          redemptions: {
            none: {
              transaction: {
                transactionDate: {
                  gte: oneWeekAgo
                }
              }
            }
          }
        },
        include: {
          category: true,
          _count: {
            select: {
              redemptions: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      console.error('Get low stock products error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default ProductsController;