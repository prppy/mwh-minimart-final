import { prisma } from '../lib/db.js';

/**
 * Find transactions by user ID
 */
export const findByUserId = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
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
          abscondence: true,
          user: {
            select: {
              userName: true
            }
          },
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
      prisma.transaction.count({ where: { userId } })
    ]);

    return {
      transactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

  } catch (error) {
    console.error('Transaction findByUserId error:', error);
    throw error;
  }
};

/**
 * Create redemption transaction
 */
export const createRedemption = async ({ userId, officerId, products }) => {
  try {
    // Verify resident exists
    const resident = await prisma.resident.findUnique({
      where: { userId }
    });

    if (!resident) {
      throw new Error('Resident not found');
    }

    // Verify all products exist and are available
    const productIds = products.map(p => parseInt(p.id));
    const foundProducts = await prisma.product.findMany({
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

    // Create redemption transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          officerId,
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
        where: { userId },
        data: {
          currentPoints: {
            decrement: totalPoints
          }
        }
      });

      return { transaction, redemptions, updatedResident };
    });

    return {
      transaction: result.transaction,
      redemptions: result.redemptions,
      pointsDeducted: totalPoints,
      remainingPoints: result.updatedResident.currentPoints
    };

  } catch (error) {
    console.error('Transaction createRedemption error:', error);
    throw error;
  }
};

/**
 * Create task completion transaction
 */
export const createCompletion = async ({ userId, officerId, tasks }) => {
  try {
    // Verify resident exists
    const resident = await prisma.resident.findUnique({
      where: { userId }
    });

    if (!resident) {
      throw new Error('Resident not found');
    }

    // Verify all tasks exist (removed active check since it doesn't exist in schema)
    const taskIds = tasks.map(t => parseInt(t.id));
    const foundTasks = await prisma.task.findMany({
      where: { 
        id: { in: taskIds }
      }
    });

    if (foundTasks.length !== taskIds.length) {
      throw new Error('One or more tasks not found');
    }

    // Calculate total points earned
    const totalPoints = foundTasks.reduce((sum, task) => sum + task.points, 0);

    // Create completion transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          officerId,
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
        where: { userId },
        data: {
          currentPoints: {
            increment: totalPoints
          },
          totalPoints: {
            increment: totalPoints
          }
        }
      });

      return { transaction, completions, updatedResident };
    });

    return {
      transaction: result.transaction,
      completions: result.completions,
      pointsEarned: totalPoints,
      newBalance: result.updatedResident.currentPoints
    };

  } catch (error) {
    console.error('Transaction createCompletion error:', error);
    throw error;
  }
};

/**
 * Create abscondence transaction
 */
export const createAbscondence = async ({ userId, officerId, reason, pointsPenalty }) => {
  try {
    // Verify resident exists
    const resident = await prisma.resident.findUnique({
      where: { userId }
    });

    if (!resident) {
      throw new Error('Resident not found');
    }

    // Create abscondence transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          officerId,
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
        where: { userId },
        data: {
          currentPoints: Math.max(0, resident.currentPoints - pointsPenalty),
          lastAbscondence: new Date()
        }
      });

      return { transaction, abscondence, updatedResident };
    });

    return {
      transaction: result.transaction,
      abscondence: result.abscondence,
      pointsPenalty,
      remainingPoints: result.updatedResident.currentPoints
    };

  } catch (error) {
    console.error('Transaction createAbscondence error:', error);
    throw error;
  }
};

/**
 * Get points summary for a user
 */
export const getPointsSummary = async (userId, options = {}) => {
  try {
    const { startDate, endDate } = options;

    // Build where clause for date filtering
    const where = { userId };
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
      where: { userId },
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
        userName: resident.user.userName,
        lastAbscondence: resident.lastAbscondence
      } : null
    };

  } catch (error) {
    console.error('Transaction getPointsSummary error:', error);
    throw error;
  }
};

/**
 * Find many transactions with filters
 */
export const findMany = async (filters = {}) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      startDate, 
      endDate,
      userId 
    } = filters;

    const where = {};
    
    if (type) where.transactionType = type;
    if (userId) where.userId = userId;
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
        },
        orderBy: { transactionDate: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

  } catch (error) {
    console.error('Transaction findMany error:', error);
    throw error;
  }
};

/**
 * Get transaction analytics
 */
export const getAnalytics = async (period = 'month') => {
  try {
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

      // Daily breakdown for the period
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "Transaction_Date") as date,
          "Transaction_Type" as type,
          COUNT(*) as count,
          SUM("Points_Change") as points
        FROM "public"."MWH_Transaction"
        WHERE "Transaction_Date" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "Transaction_Date"), "Transaction_Type"
        ORDER BY date DESC
      `
    ]);

    return {
      period,
      overall: {
        totalTransactions: overallStats._count.id,
        totalPointsFlow: overallStats._sum.pointsChange || 0
      },
      byType: typeStats.map(stat => ({
        type: stat.transactionType,
        count: stat._count.id,
        totalPoints: stat._sum.pointsChange || 0
      })),
      dailyBreakdown: dailyStats
    };

  } catch (error) {
    console.error('Transaction getAnalytics error:', error);
    throw error;
  }
};

/**
 * Find transaction by ID
 */
export const findById = async (id) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
                imageUrl: true,
                productDescription: true
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
                taskDescription: true,
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

    return transaction;

  } catch (error) {
    console.error('Transaction findById error:', error);
    throw error;
  }
};

/**
 * Get transaction analytics for leaderboards
 */
export const getTransactionAnalytics = async (options = {}) => {
  try {
    const {
      period = 'month', // 'month', 'year', 'all'
      batchNumber,
      type // 'completion', 'redemption', 'abscondence'
    } = options;

    const now = new Date();
    let startDate, endDate;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    // Build the query
    let query = `
      SELECT 
        r."User_ID" as "userId",
        u."User_Name" as "userName",
        r."Batch_Number" as "batchNumber",
        COUNT(t."Transaction_ID") as "transactionCount",
        COALESCE(SUM(t."Points_Change"), 0) as "totalPoints",
        AVG(t."Points_Change") as "avgPoints",
        MIN(t."Transaction_Date") as "firstTransaction",
        MAX(t."Transaction_Date") as "lastTransaction"
      FROM "public"."MWH_Transaction" t
      INNER JOIN "public"."MWH_Resident" r ON t."User_ID" = r."User_ID"
      INNER JOIN "public"."MWH_User" u ON r."User_ID" = u."User_ID"
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      query += ` AND t."Transaction_Date" >= $${paramIndex} AND t."Transaction_Date" <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    if (type) {
      query += ` AND t."Transaction_Type" = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (batchNumber) {
      query += ` AND r."Batch_Number" = $${paramIndex}`;
      params.push(parseInt(batchNumber));
      paramIndex++;
    }

    query += `
      GROUP BY r."User_ID", u."User_Name", r."Batch_Number"
      ORDER BY "totalPoints" DESC
    `;

    const analytics = await prisma.$queryRawUnsafe(query, ...params);

    return analytics.map(item => ({
      userId: item.userId,
      userName: item.userName,
      batchNumber: item.batchNumber,
      transactionCount: parseInt(item.transactionCount),
      totalPoints: parseInt(item.totalPoints),
      avgPoints: parseFloat(item.avgPoints || 0),
      firstTransaction: item.firstTransaction,
      lastTransaction: item.lastTransaction
    }));

  } catch (error) {
    console.error('Transaction getTransactionAnalytics error:', error);
    throw error;
  }
};

/**
 * Get points gained by period for specific users
 */
export const getPointsByPeriod = async (userIds, period = 'month') => {
  try {
    const now = new Date();
    let startDate, endDate;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    const query = `
      SELECT 
        t."User_ID" as "userId",
        u."User_Name" as "userName",
        COALESCE(SUM(CASE 
          WHEN t."Transaction_Type" = 'completion' 
          THEN t."Points_Change" 
          ELSE 0 
        END), 0) as "pointsGained",
        COALESCE(SUM(CASE 
          WHEN t."Transaction_Type" = 'redemption' 
          THEN ABS(t."Points_Change") 
          ELSE 0 
        END), 0) as "pointsSpent",
        COUNT(CASE 
          WHEN t."Transaction_Type" = 'completion' 
          THEN 1 
        END) as "completionCount",
        COUNT(CASE 
          WHEN t."Transaction_Type" = 'redemption' 
          THEN 1 
        END) as "redemptionCount"
      FROM "public"."MWH_Transaction" t
      INNER JOIN "public"."MWH_User" u ON t."User_ID" = u."User_ID"
      WHERE t."User_ID" = ANY($1)
        AND t."Transaction_Date" >= $2 
        AND t."Transaction_Date" <= $3
      GROUP BY t."User_ID", u."User_Name"
      ORDER BY "pointsGained" DESC
    `;

    const results = await prisma.$queryRawUnsafe(query, userIds, startDate, endDate);

    return results.map(result => ({
      userId: result.userId,
      userName: result.userName,
      pointsGained: parseInt(result.pointsGained),
      pointsSpent: parseInt(result.pointsSpent),
      netPoints: parseInt(result.pointsGained) - parseInt(result.pointsSpent),
      completionCount: parseInt(result.completionCount),
      redemptionCount: parseInt(result.redemptionCount)
    }));

  } catch (error) {
    console.error('Transaction getPointsByPeriod error:', error);
    throw error;
  }
};

/**
 * Get transaction trends for dashboard
 */
export const getTransactionTrends = async (options = {}) => {
  try {
    const {
      period = 'month',
      batchNumber
    } = options;

    const now = new Date();
    let startDate;
    let groupBy;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'DATE(t."Transaction_Date")';
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = 'DATE_TRUNC(\'month\', t."Transaction_Date")';
    }

    let query = `
      SELECT 
        ${groupBy} as "period",
        t."Transaction_Type" as "transactionType",
        COUNT(*) as "count",
        COALESCE(SUM(t."Points_Change"), 0) as "totalPoints"
      FROM "public"."MWH_Transaction" t
    `;

    const params = [startDate];
    let paramIndex = 2;

    if (batchNumber) {
      query += `
        INNER JOIN "public"."MWH_Resident" r ON t."User_ID" = r."User_ID"
        WHERE t."Transaction_Date" >= $1 AND r."Batch_Number" = $${paramIndex}
      `;
      params.push(parseInt(batchNumber));
    } else {
      query += ` WHERE t."Transaction_Date" >= $1`;
    }

    query += `
      GROUP BY ${groupBy}, t."Transaction_Type"
      ORDER BY "period", t."Transaction_Type"
    `;

    const trends = await prisma.$queryRawUnsafe(query, ...params);

    return trends.map(trend => ({
      period: trend.period,
      transactionType: trend.transactionType,
      count: parseInt(trend.count),
      totalPoints: parseInt(trend.totalPoints)
    }));

  } catch (error) {
    console.error('Transaction getTransactionTrends error:', error);
    throw error;
  }
};