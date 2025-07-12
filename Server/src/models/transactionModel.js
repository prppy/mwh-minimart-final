// models/Transaction.js
import { prisma } from '../lib/db';
import ResidentModel from './Resident';

class TransactionModel {
  /**
   * Get transactions for a specific user
   */
  static async getByUser(userId, options = {}) {
    const { limit = 20, offset = 0, type, startDate, endDate } = options;

    const where = {
      userId: parseInt(userId)
    };

    if (type) {
      where.transactionType = type;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          redemptions: {
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  points: true,
                  imageUrl: true
                }
              }
            }
          },
          completions: {
            include: {
              task: {
                select: {
                  id: true,
                  taskName: true,
                  points: true
                }
              }
            }
          },
          abscondence: true,
          officer: {
            select: {
              userName: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
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
   * Create a redemption transaction
   */
  static async createRedemption(userId, officerId, products) {
    return prisma.$transaction(async (tx) => {
      // Verify resident exists
      const resident = await tx.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        throw new Error('Resident not found');
      }

      // Verify all products exist and are available
      const productIds = products.map(p => parseInt(p.id));
      const foundProducts = await tx.product.findMany({
        where: { 
          id: { in: productIds },
          available: true 
        }
      });

      if (foundProducts.length !== productIds.length) {
        throw new Error('One or more products not found or unavailable');
      }

      // Calculate total points needed
      const productMap = foundProducts.reduce((map, product) => {
        map[product.id] = product;
        return map;
      }, {});

      const totalPoints = products.reduce((sum, p) => {
        const product = productMap[parseInt(p.id)];
        return sum + (product.points * parseInt(p.quantity));
      }, 0);

      // Check if resident has enough points
      if (resident.currentPoints < totalPoints) {
        throw new Error(`Insufficient points. Required: ${totalPoints}, Available: ${resident.currentPoints}`);
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(userId),
          officerId: parseInt(officerId),
          pointsChange: -totalPoints,
          transactionType: 'redemption'
        }
      });

      // Create redemption records
      const redemptions = await Promise.all(
        products.map(p => 
          tx.redemption.create({
            data: {
              transactionId: transaction.id,
              productId: parseInt(p.id),
              productQuantity: parseInt(p.quantity)
            }
          })
        )
      );

      // Update resident points
      const updatedResident = await tx.resident.update({
        where: { userId: parseInt(userId) },
        data: {
          currentPoints: {
            decrement: totalPoints
          }
        }
      });

      return { 
        transaction, 
        redemptions, 
        totalPoints,
        remainingPoints: updatedResident.currentPoints 
      };
    });
  }

  /**
   * Create a task completion transaction
   */
  static async createCompletion(userId, officerId, tasks) {
    return prisma.$transaction(async (tx) => {
      // Verify resident exists
      const resident = await tx.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        throw new Error('Resident not found');
      }

      // Verify all tasks exist and are active
      const taskIds = tasks.map(t => parseInt(t.id));
      const foundTasks = await tx.task.findMany({
        where: { 
          id: { in: taskIds },
          active: true 
        }
      });

      if (foundTasks.length !== taskIds.length) {
        throw new Error('One or more tasks not found or inactive');
      }

      // Calculate total points earned
      const totalPoints = foundTasks.reduce((sum, task) => sum + task.points, 0);

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(userId),
          officerId: parseInt(officerId),
          pointsChange: totalPoints,
          transactionType: 'completion'
        }
      });

      // Create completion records
      const completions = await Promise.all(
        foundTasks.map(task => 
          tx.completion.create({
            data: {
              transactionId: transaction.id,
              taskId: task.id
            }
          })
        )
      );

      // Update resident points
      const updatedResident = await tx.resident.update({
        where: { userId: parseInt(userId) },
        data: {
          currentPoints: {
            increment: totalPoints
          },
          totalPoints: {
            increment: totalPoints
          }
        }
      });

      return { 
        transaction, 
        completions, 
        totalPoints,
        newBalance: updatedResident.currentPoints 
      };
    });
  }

  /**
   * Create an abscondence transaction
   */
  static async createAbscondence(userId, officerId, reason, pointsPenalty = 0) {
    return prisma.$transaction(async (tx) => {
      // Verify resident exists
      const resident = await tx.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        throw new Error('Resident not found');
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(userId),
          officerId: parseInt(officerId),
          pointsChange: -pointsPenalty,
          transactionType: 'abscondence'
        }
      });

      // Create abscondence record
      const abscondence = await tx.abscondence.create({
        data: {
          transactionId: transaction.id,
          reason
        }
      });

      // Update resident points and last abscondence date
      const updatedResident = await tx.resident.update({
        where: { userId: parseInt(userId) },
        data: {
          currentPoints: {
            decrement: pointsPenalty
          },
          lastAbscondence: new Date()
        }
      });

      return { 
        transaction, 
        abscondence, 
        pointsPenalty,
        remainingPoints: updatedResident.currentPoints 
      };
    });
  }

  /**
   * Get points summary for a user
   */
  static async getPointsSummary(userId, startDate, endDate) {
    const where = { userId: parseInt(userId) };
    
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get transaction summary grouped by type
    const summary = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where,
      _sum: {
        pointsChange: true
      },
      _count: {
        id: true
      }
    });

    // Get current resident data
    const resident = await prisma.resident.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          select: {
            userName: true
          }
        }
      }
    });

    return {
      summary: summary.map(item => ({
        transactionType: item.transactionType,
        totalPoints: item._sum.pointsChange || 0,
        transactionCount: item._count.id
      })),
      current: resident ? {
        currentPoints: resident.currentPoints,
        totalPoints: resident.totalPoints,
        userName: resident.user.userName
      } : null
    };
  }

  /**
   * Get all transactions with filtering
   */
  static async getAll(options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      startDate, 
      endDate,
      userId,
      officerId
    } = options;

    const where = {};
    
    if (type) where.transactionType = type;
    if (userId) where.userId = parseInt(userId);
    if (officerId) where.officerId = parseInt(officerId);
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              userName: true
            }
          },
          officer: {
            select: {
              userName: true
            }
          },
          redemptions: {
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  points: true
                }
              }
            }
          },
          completions: {
            include: {
              task: {
                select: {
                  id: true,
                  taskName: true,
                  points: true
                }
              }
            }
          },
          abscondence: true
        },
        orderBy: { transactionDate: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
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
   * Get transaction analytics
   */
  static async getAnalytics(period = 'month') {
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

    const [overallStats, typeStats, dailyStats] = await Promise.all([
      // Overall statistics
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        _sum: {
          pointsChange: true
        }
      }),

      // Statistics by transaction type
      prisma.transaction.groupBy({
        by: ['transactionType'],
        where: {
          transactionDate: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        _sum: {
          pointsChange: true
        }
      }),

      // Daily breakdown
      prisma.$queryRaw`
        SELECT 
          DATE(transaction_date) as date,
          transaction_type,
          COUNT(*) as count,
          SUM(points_change) as total_points
        FROM "MWH_Transaction"
        WHERE transaction_date >= ${startDate}
        GROUP BY DATE(transaction_date), transaction_type
        ORDER BY date DESC
      `
    ]);

    return {
      period,
      overall: {
        totalTransactions: overallStats._count.id,
        totalPointsFlow: overallStats._sum.pointsChange || 0
      },
      byType: typeStats,
      daily: dailyStats
    };
  }

  /**
   * Get transaction by ID with full details
   */
  static async findById(id) {
    return prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            userName: true,
            userRole: true
          }
        },
        officer: {
          select: {
            userName: true
          }
        },
        redemptions: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                points: true,
                imageUrl: true
              }
            }
          }
        },
        completions: {
          include: {
            task: {
              select: {
                id: true,
                taskName: true,
                points: true,
                taskCategory: {
                  select: {
                    taskCategoryName: true
                  }
                }
              }
            }
          }
        },
        abscondence: true
      }
    });
  }

  /**
   * Reverse/cancel a transaction (if applicable)
   */
  static async reverseTransaction(transactionId, officerId, reason) {
    return prisma.$transaction(async (tx) => {
      const originalTransaction = await tx.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
          redemptions: true,
          completions: true,
          abscondence: true
        }
      });

      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      // Check if transaction is recent enough to reverse (e.g., within 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (originalTransaction.transactionDate < twentyFourHoursAgo) {
        throw new Error('Transaction is too old to reverse');
      }

      // Create reverse transaction
      const reverseTransaction = await tx.transaction.create({
        data: {
          userId: originalTransaction.userId,
          officerId: parseInt(officerId),
          pointsChange: -originalTransaction.pointsChange,
          transactionType: originalTransaction.transactionType
        }
      });

      // Update resident points (reverse the original change)
      await tx.resident.update({
        where: { userId: originalTransaction.userId },
        data: {
          currentPoints: {
            increment: -originalTransaction.pointsChange
          },
          ...(originalTransaction.pointsChange > 0 && {
            totalPoints: {
              decrement: originalTransaction.pointsChange
            }
          })
        }
      });

      // Create reverse records for redemptions
      if (originalTransaction.redemptions.length > 0) {
        await Promise.all(
          originalTransaction.redemptions.map(redemption =>
            tx.redemption.create({
              data: {
                transactionId: reverseTransaction.id,
                productId: redemption.productId,
                productQuantity: -redemption.productQuantity // Negative quantity for reversal
              }
            })
          )
        );
      }

      // Create reverse records for completions
      if (originalTransaction.completions.length > 0) {
        await Promise.all(
          originalTransaction.completions.map(completion =>
            tx.completion.create({
              data: {
                transactionId: reverseTransaction.id,
                taskId: completion.taskId
              }
            })
          )
        );
      }

      // Create reverse record for abscondence
      if (originalTransaction.abscondence) {
        await tx.abscondence.create({
          data: {
            transactionId: reverseTransaction.id,
            reason: `REVERSAL: ${reason}`
          }
        });
      }

      return {
        originalTransaction,
        reverseTransaction,
        reason
      };
    });
  }

  /**
   * Get recent activity across all users
   */
  static async getRecentActivity(limit = 20) {
    return prisma.transaction.findMany({
      include: {
        user: {
          select: {
            userName: true
          }
        },
        officer: {
          select: {
            userName: true
          }
        },
        redemptions: {
          include: {
            product: {
              select: {
                productName: true
              }
            }
          }
        },
        completions: {
          include: {
            task: {
              select: {
                taskName: true
              }
            }
          }
        }
      },
      orderBy: { transactionDate: 'desc' },
      take: parseInt(limit)
    });
  }
}

export default TransactionModel;