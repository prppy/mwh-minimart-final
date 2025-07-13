// controllers/transactionController.js
import { validationResult } from 'express-validator';
import { prisma } from '../lib/db.js';

class TransactionsController {
  // Get user's transaction history
  static async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if user can access this data
      const requestedUserId = parseInt(userId);
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
        return res.status(403).json({ 
          error: { message: 'Access denied' }
        });
      }

      const transactions = await prisma.transaction.findMany({
        where: { userId: requestedUserId },
        include: {
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
      });

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Create redemption transaction
  static async createRedemption(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { userId, products } = req.body;
      const officerId = req.user.userId;

      // Verify resident exists
      const resident = await prisma.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        return res.status(404).json({ 
          error: { message: 'Resident not found' }
        });
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
        return res.status(400).json({ 
          error: { message: 'One or more products not found or unavailable' }
        });
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
        return res.status(400).json({ 
          error: { 
            message: 'Insufficient points',
            required: totalPoints,
            available: resident.currentPoints
          }
        });
      }

      // Create redemption transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: parseInt(userId),
            officerId: officerId,
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

        return { transaction, redemptions, updatedResident };
      });

      res.status(201).json({
        success: true,
        data: {
          transaction: result.transaction,
          redemptions: result.redemptions,
          remainingPoints: result.updatedResident.currentPoints
        }
      });

    } catch (error) {
      console.error('Create redemption error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Create task completion transaction
  static async createCompletion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { userId, tasks } = req.body;
      const officerId = req.user.userId;

      // Verify resident exists
      const resident = await prisma.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        return res.status(404).json({ 
          error: { message: 'Resident not found' }
        });
      }

      // Verify all tasks exist and are active
      const taskIds = tasks.map(t => parseInt(t.id));
      const foundTasks = await prisma.task.findMany({
        where: { 
          id: { in: taskIds },
          active: true 
        }
      });

      if (foundTasks.length !== taskIds.length) {
        return res.status(400).json({ 
          error: { message: 'One or more tasks not found or inactive' }
        });
      }

      // Calculate total points earned
      const totalPoints = foundTasks.reduce((sum, task) => sum + task.points, 0);

      // Create completion transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: parseInt(userId),
            officerId: officerId,
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

        return { transaction, completions, updatedResident };
      });

      res.status(201).json({
        success: true,
        data: {
          transaction: result.transaction,
          completions: result.completions,
          pointsEarned: totalPoints,
          newBalance: result.updatedResident.currentPoints
        }
      });

    } catch (error) {
      console.error('Create completion error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get points summary for a user
  static async getPointsSummary(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      // Check access permissions
      const requestedUserId = parseInt(userId);
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
        return res.status(403).json({ 
          error: { message: 'Access denied' }
        });
      }

      // Build where clause for date filtering
      const where = { userId: requestedUserId };
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
        where: { userId: requestedUserId },
        include: {
          user: {
            select: {
              userName: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
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
        }
      });

    } catch (error) {
      console.error('Get points summary error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get all transactions (officer/admin only)
  static async getAllTransactions(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        type, 
        startDate, 
        endDate,
        userId 
      } = req.query;

      const where = {};
      
      if (type) where.transactionType = type;
      if (userId) where.userId = parseInt(userId);
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
            }
          },
          orderBy: { transactionDate: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        prisma.transaction.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Create abscondence transaction
  static async createAbscondence(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { userId, reason, pointsPenalty = 0 } = req.body;
      const officerId = req.user.userId;

      // Verify resident exists
      const resident = await prisma.resident.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!resident) {
        return res.status(404).json({ 
          error: { message: 'Resident not found' }
        });
      }

      // Create abscondence transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: parseInt(userId),
            officerId: officerId,
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

        return { transaction, abscondence, updatedResident };
      });

      res.status(201).json({
        success: true,
        data: {
          transaction: result.transaction,
          abscondence: result.abscondence,
          pointsPenalty,
          remainingPoints: result.updatedResident.currentPoints
        }
      });

    } catch (error) {
      console.error('Create abscondence error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get transaction analytics
  static async getTransactionAnalytics(req, res) {
    try {
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

      const [overallStats, typeStats] = await Promise.all([
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
        })
      ]);

      res.json({
        success: true,
        data: {
          period,
          overall: {
            totalTransactions: overallStats._count.id,
            totalPointsFlow: overallStats._sum.pointsChange || 0
          },
          byType: typeStats
        }
      });

    } catch (error) {
      console.error('Get transaction analytics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get transaction by ID
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      const transaction = await prisma.transaction.findUnique({
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

      if (!transaction) {
        return res.status(404).json({ 
          error: { message: 'Transaction not found' }
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default TransactionsController;