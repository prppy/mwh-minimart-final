// models/Product.js
import { prisma } from '../lib/db.js';

/**
 * Get all products
 */
export const findAll = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        productName: 'asc'
      }
    });

    return products;

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findAll due to schema mismatch...');
      
      const query = `
        SELECT 
          p."Product_ID" as id,
          p."Product_Name" as "productName",
          p."Image_URL" as "imageUrl",
          p."Product_Description" as "productDescription",
          p."Points" as points,
          p."Available" as available,
          p."Category_ID" as "categoryId",
          c."Category_Name" as "category_name"
        FROM "public"."MWH_Product" p
        LEFT JOIN "public"."MWH_Category" c ON p."Category_ID" = c."Category_ID"
        ORDER BY p."Product_Name" ASC
      `;

      const rawProducts = await prisma.$queryRawUnsafe(query);

      // Transform raw results to match expected format
      const products = rawProducts.map(product => ({
        id: product.id,
        productName: product.productName,
        imageUrl: product.imageUrl,
        productDescription: product.productDescription,
        points: product.points,
        available: product.available,
        categoryId: product.categoryId,
        category: product.category_name ? {
          id: product.categoryId,
          categoryName: product.category_name
        } : null
      }));

      return products;
    }

    throw error;
  }
};

/**
 * Get popular products (most redeemed)
 */
export const getPopular = async (limit = 10, timeframe = 'all') => {
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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    dateFilter = {
      transaction: {
        transactionDate: {
          gte: startDate
        }
      }
    };
  }

  const products = await prisma.product.findMany({
    where: {
      available: true
    },
    include: {
      category: {
        select: {
          categoryName: true
        }
      },
      redemptions: {
        where: dateFilter,
        select: {
          id: true
        }
      }
    }
  });

  // Sort by redemption count and return top products
  const productsWithCounts = products.map(product => ({
    id: product.id,
    productName: product.productName,
    productDescription: product.productDescription,
    points: product.points,
    imageUrl: product.imageUrl,
    categoryName: product.category?.categoryName,
    redemptionCount: product.redemptions.length
  }))
  .sort((a, b) => b.redemptionCount - a.redemptionCount)
  .slice(0, parseInt(limit));

  return productsWithCounts;
};

/**
 * Get products by category
 */
export const findByCategory = async (categoryId) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId: parseInt(categoryId)
      },
      include: {
        category: true
      },
      orderBy: {
        productName: 'asc'
      }
    });

    return products;

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findByCategory due to schema mismatch...');
      
      const query = `
        SELECT 
          p."Product_ID" as id,
          p."Product_Name" as "productName",
          p."Image_URL" as "imageUrl",
          p."Product_Description" as "productDescription",
          p."Points" as points,
          p."Available" as available,
          p."Category_ID" as "categoryId",
          c."Category_Name" as "category_name"
        FROM "public"."MWH_Product" p
        LEFT JOIN "public"."MWH_Category" c ON p."Category_ID" = c."Category_ID"
        WHERE p."Category_ID" = $1
        ORDER BY p."Product_Name" ASC
      `;

      const rawProducts = await prisma.$queryRawUnsafe(query, parseInt(categoryId));

      // Transform raw results to match expected format
      const products = rawProducts.map(product => ({
        id: product.id,
        productName: product.productName,
        imageUrl: product.imageUrl,
        productDescription: product.productDescription,
        points: product.points,
        available: product.available,
        categoryId: product.categoryId,
        category: product.category_name ? {
          id: product.categoryId,
          categoryName: product.category_name
        } : null
      }));

      return products;
    }

    throw error;
  }
};

/**
 * Find product by ID
 */
export const findById = async (id, includeAnalytics = false) => {
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
      take: 10 // Recent redemptions
    };
  }

  return prisma.product.findUnique({
    where: { id: parseInt(id) },
    include
  });
};

/**
 * Create new product
 */
export const create = async (productData) => {
  const {
    productName,
    productDescription,
    points,
    categoryId,
    imageUrl,
    available = true
  } = productData;

  // Validate required fields
  if (!productName || !productDescription || !points || !categoryId) {
    throw new Error('Missing required fields: productName, productDescription, points, categoryId');
  }

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: parseInt(categoryId) }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  return prisma.product.create({
    data: {
      productName,
      productDescription,
      points: parseInt(points),
      categoryId: parseInt(categoryId),
      imageUrl,
      available
    },
    include: {
      category: true
    }
  });
};

/**
 * Update product
 */
export const update = async (id, updates) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // If updating category, verify it exists
  if (updates.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(updates.categoryId) }
    });

    if (!category) {
      throw new Error('Category not found');
    }
  }

  // Prepare update data
  const updateData = { ...updates };
  if (updateData.points) updateData.points = parseInt(updateData.points);
  if (updateData.categoryId) updateData.categoryId = parseInt(updateData.categoryId);
  if (updateData.stock) updateData.stock = parseInt(updateData.stock);

  return prisma.product.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      category: true
    }
  });
};

/**
 * Delete product
 */
export const remove = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if product has redemptions
  const redemptionCount = await prisma.redemption.count({
    where: { productId: parseInt(id) }
  });

  if (redemptionCount > 0) {
    // Soft delete by setting available to false
    return prisma.product.update({
      where: { id: parseInt(id) },
      data: { available: false }
    });
  } else {
    // Hard delete if no redemptions
    return prisma.product.delete({
      where: { id: parseInt(id) }
    });
  }
};

/**
 * Get product analytics
 */
export const getAnalytics = async (id, period = 'month') => {
  const product = await findById(id, false);
  if (!product) {
    throw new Error('Product not found');
  }

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

  const redemptions = await prisma.redemption.findMany({
    where: {
      productId: parseInt(id),
      transaction: {
        transactionDate: {
          gte: startDate
        }
      }
    },
    include: {
      transaction: {
        include: {
          user: {
            select: {
              userName: true,
              resident: {
                select: {
                  batchNumber: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Group redemptions by day
  const dailyRedemptions = {};
  redemptions.forEach(redemption => {
    const date = redemption.transaction.transactionDate.toISOString().split('T')[0];
    if (!dailyRedemptions[date]) {
      dailyRedemptions[date] = 0;
    }
    dailyRedemptions[date]++;
  });

  return {
    productId: parseInt(id),
    productName: product.productName,
    period,
    totalRedemptions: redemptions.length,
    uniqueUsers: new Set(redemptions.map(r => r.transaction.userId)).size,
    dailyBreakdown: dailyRedemptions,
    redemptions: redemptions.map(r => ({
      userId: r.transaction.userId,
      userName: r.transaction.user.userName,
      batchNumber: r.transaction.user.resident?.batchNumber,
      redemptionDate: r.transaction.transactionDate
    }))
  };
};

/**
 * Get low stock products
 */
export const getLowStock = async (threshold = 10) => {
  return prisma.product.findMany({
    where: {
      available: true,
      stock: {
        not: null,
        lte: threshold
      }
    },
    include: {
      category: {
        select: {
          categoryName: true
        }
      }
    },
    orderBy: {
      stock: 'asc'
    }
  });
};

/**
 * Get categories with product counts
 */
export const getCategoriesWithCounts = async () => {
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
    orderBy: {
      categoryName: 'asc'
    }
  });
};

/**
 * Get product statistics
 */
export const getStatistics = async () => {
  const [totalProducts, availableProducts, categoryStats, typeStats] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { available: true } }),
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
      }
    }),
    prisma.product.groupBy({
      by: ['productType'],
      where: { available: true },
      _count: {
        productType: true
      }
    })
  ]);

  const totalRedemptions = await prisma.redemption.count();
  const avgPointsResult = await prisma.product.aggregate({
    where: { available: true },
    _avg: { points: true },
    _max: { points: true },
    _min: { points: true }
  });

  return {
    totalProducts,
    availableProducts,
    unavailableProducts: totalProducts - availableProducts,
    totalRedemptions,
    averagePoints: Math.round(avgPointsResult._avg.points || 0),
    maxPoints: avgPointsResult._max.points || 0,
    minPoints: avgPointsResult._min.points || 0,
    byCategory: categoryStats.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.categoryName,
      productCount: cat._count.products
    })),
    byType: typeStats.reduce((acc, stat) => {
      acc[stat.productType] = stat._count.productType;
      return acc;
    }, {})
  };
};

/**
 * Search products
 */
export const search = async (query, options = {}) => {
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
      productName: 'asc'
    },
    take: parseInt(limit)
  });
};
