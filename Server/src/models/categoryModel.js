// models/categoryModel.js
import { prisma } from '../lib/db.js';

class CategoryModel {
  /**
   * Get all categories with optional product count
   */
  static async findAll(options = {}) {
    const { includeProductCount = false, includeProducts = false } = options;

    const include = {};
    
    if (includeProductCount) {
      include._count = {
        select: {
          products: {
            where: {
              available: true
            }
          }
        }
      };
    }

    if (includeProducts) {
      include.products = {
        where: {
          available: true
        },
        orderBy: { productName: 'asc' }
      };
    }

    return prisma.category.findMany({
      include,
      orderBy: { categoryName: 'asc' }
    });
  }

  /**
   * Get category by ID
   */
  static async findById(id, options = {}) {
    const { includeProducts = false } = options;

    const include = {};
    if (includeProducts) {
      include.products = {
        where: {
          available: true
        },
        orderBy: { productName: 'asc' }
      };
    }

    return prisma.category.findUnique({
      where: { id: parseInt(id) },
      include
    });
  }

  /**
   * Create new category
   */
  static async create(categoryData) {
    const { categoryName } = categoryData;

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { categoryName }
    });

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return prisma.category.create({
      data: { categoryName }
    });
  }

  /**
   * Update category
   */
  static async update(id, updates) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if new name conflicts with existing category
    if (updates.categoryName && updates.categoryName !== category.categoryName) {
      const existing = await prisma.category.findUnique({
        where: { categoryName: updates.categoryName }
      });

      if (existing) {
        throw new Error('Category with this name already exists');
      }
    }

    return prisma.category.update({
      where: { id: parseInt(id) },
      data: updates
    });
  }

  /**
   * Delete category
   */
  static async delete(id) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: parseInt(id) }
    });

    if (productCount > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    return prisma.category.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Get category statistics
   */
  static async getStatistics() {
    const [totalCategories, categoriesWithProducts, topCategories] = await Promise.all([
      prisma.category.count(),
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

    return {
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
  }

  /**
   * Search categories
   */
  static async search(query, options = {}) {
    const { includeProductCount = false } = options;

    const include = {};
    if (includeProductCount) {
      include._count = {
        select: {
          products: {
            where: {
              available: true
            }
          }
        }
      };
    }

    return prisma.category.findMany({
      where: {
        categoryName: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include,
      orderBy: { categoryName: 'asc' }
    });
  }
}

export default CategoryModel;