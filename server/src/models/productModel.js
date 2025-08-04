// models/Product.js
import { prisma } from '../lib/db.js';

class ProductModel {
  /**
   * Find products with advanced filtering
   */
  static async findWithFilters(filters = {}) {
    const {
      search,
      categories,
      types,
      maxPoints,
      minPoints,
      available = true,
      sortBy = 'productName',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = filters;

    // Build where clause
    const where = {};
    
    if (available !== undefined) {
      where.available = available;
    }

    // Search filter
    if (search) {
      where.productName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Category filter
    if (categories && categories.length > 0) {
      where.categoryId = {
        in: categories.map(id => parseInt(id))
      };
    }

    // Product type filter
    if (types && types.length > 0) {
      where.productType = {
        in: types
      };
    }

    // Points filters
    if (maxPoints !== undefined || minPoints !== undefined) {
      where.points = {};
      if (maxPoints !== undefined) where.points.lte = parseInt(maxPoints);
      if (minPoints !== undefined) where.points.gte = parseInt(minPoints);
    }

    // Build orderBy clause
    let orderBy = {};
    if (sortBy === 'productName') {
      orderBy.productName = sortOrder.toLowerCase();
    } else if (sortBy === 'points') {
      orderBy.points = sortOrder.toLowerCase();
    } else if (sortBy === 'popularity') {
      // Order by redemption count
      orderBy = {
        redemptions: {
          _count: 'desc'
        }
      };
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
          },
          _count: {
            select: {
              redemptions: true
            }
          }
        },
        orderBy,
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      totalCount,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  }

  /**
   * Get popular products (most redeemed)
   */
  static async getPopular(limit = 10, timeframe = 'all') {
    let dateFilter = {};
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        dateFilter = {
          transaction: {
            transactionDate: {
              gte: startDate
            }
          }
        };
      }
    }

    return prisma.product.findMany({
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
            redemptions: dateFilter.transaction ? {
              where: dateFilter
            } : true
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
  }

  /**
   * Get product by ID with detailed information
   */
  static async findById(id, includeAnalytics = false) {
    const include = {
      category: {
        select: {
          id: true,
          categoryName: true
        }
      }
    };

    if (includeAnalytics) {
      include._count = {
        select: {
          redemptions: true
        }
      };
      include.redemptions = {
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
        },
        take: 10 // Last 10 redemptions
      };
    }

    return prisma.product.findUnique({
      where: { id: parseInt(id) },
      include
    });
  }

  /**
   * Create new product
   */
  static async create(productData) {
    const {
      productName,
      imageUrl,
      productDescription,
      points,
      productType = 'physical',
      categoryId,
      available = true
    } = productData;

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });
      
      if (!category) {
        throw new Error('Invalid category ID');
      }
    }

    return prisma.product.create({
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
  }

  /**
   * Update product
   */
  static async update(id, updates) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify category exists if being updated
    if (updates.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(updates.categoryId) }
      });
      
      if (!category) {
        throw new Error('Invalid category ID');
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

    return prisma.product.update({
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
  }

  /**
   * Delete product (soft delete if has redemptions)
   */
  static async delete(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      throw new Error('Product not found');
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
      
      return { 
        message: 'Product marked as unavailable due to existing redemptions',
        softDeleted: true 
      };
    }

    // Safe to hard delete
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    return { 
      message: 'Product deleted successfully',
      softDeleted: false 
    };
  }

  /**
   * Get product analytics
   */
  static async getAnalytics(id, period = 'month') {
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
      this.findById(id),
      
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
      throw new Error('Product not found');
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

    return {
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
    };
  }

  /**
   * Get low stock products (for physical products)
   */
  static async getLowStock(threshold = 10) {
    // This would require a stock field in the schema
    // For now, return products that haven't been redeemed recently
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return prisma.product.findMany({
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
  }

  /**
   * Get product categories with product counts
   */
  static async getCategoriesWithCounts() {
    return prisma.category.findMany({
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
  }

  /**
   * Get product statistics
   */
  static async getStatistics() {
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

    return {
      overall: {
        totalProducts: overallStats._count.id,
        avgPoints: Math.round(overallStats._avg.points || 0),
        maxPoints: overallStats._max.points || 0,
        minPoints: overallStats._min.points || 0
      },
      byCategory: categoryStatsWithNames,
      byType: typeStats
    };
  }

  /**
   * Search products with advanced text matching
   */
  static async search(query, options = {}) {
    const { limit = 20, includeUnavailable = false } = options;
    
    const where = {
      OR: [
        {
          productName: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          productDescription: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          category: {
            categoryName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        }
      ]
    };

    if (!includeUnavailable) {
      where.available = true;
    }

    return prisma.product.findMany({
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
  }
}

export default ProductModel;