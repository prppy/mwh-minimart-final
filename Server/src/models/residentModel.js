// models/Resident.js
import { prisma } from '../lib/db';

class ResidentModel {
  /**
   * Find resident by user ID
   */
  static async findByUserId(userId) {
    return prisma.resident.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            profilePicture: true,
            createdAt: true
          }
        }
      }
    });
  }

  /**
   * Check if resident can afford given points
   */
  static async canAfford(userId, points) {
    const resident = await prisma.resident.findUnique({
      where: { userId: parseInt(userId) },
      select: { currentPoints: true }
    });
    
    return resident ? resident.currentPoints >= points : false;
  }

  /**
   * Add points to resident (for task completion)
   */
  static async addPoints(userId, points, transaction = null) {
    const dbTransaction = transaction || prisma;
    
    return dbTransaction.resident.update({
      where: { userId: parseInt(userId) },
      data: {
        currentPoints: {
          increment: points
        },
        totalPoints: {
          increment: points
        }
      }
    });
  }

  /**
   * Deduct points from resident (for redemption)
   */
  static async deductPoints(userId, points, transaction = null) {
    const dbTransaction = transaction || prisma;
    
    // First check if resident has enough points
    const resident = await dbTransaction.resident.findUnique({
      where: { userId: parseInt(userId) },
      select: { currentPoints: true }
    });

    if (!resident || resident.currentPoints < points) {
      throw new Error('Insufficient points');
    }

    return dbTransaction.resident.update({
      where: { userId: parseInt(userId) },
      data: {
        currentPoints: {
          decrement: points
        }
      }
    });
  }

  /**
   * Get leaderboard (overall or by batch)
   */
  static async getLeaderboard(options = {}) {
    const {
      batchNumber,
      type = 'current', // 'current' or 'total'
      limit = 10,
      offset = 0
    } = options;

    const where = {};
    if (batchNumber) {
      where.batchNumber = parseInt(batchNumber);
    }

    const orderField = type === 'total' ? 'totalPoints' : 'currentPoints';

    const [residents, totalCount] = await Promise.all([
      prisma.resident.findMany({
        where,
        include: {
          user: {
            select: {
              userName: true,
              profilePicture: true
            }
          }
        },
        orderBy: {
          [orderField]: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.resident.count({ where })
    ]);

    // Add ranking
    const rankedResidents = residents.map((resident, index) => ({
      rank: parseInt(offset) + index + 1,
      userId: resident.userId,
      userName: resident.user.userName,
      profilePicture: resident.user.profilePicture,
      currentPoints: resident.currentPoints,
      totalPoints: resident.totalPoints,
      batchNumber: resident.batchNumber,
      dateOfAdmission: resident.dateOfAdmission
    }));

    return {
      residents: rankedResidents,
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
   * Get resident position in leaderboard
   */
  static async getPosition(userId, type = 'current') {
    const resident = await this.findByUserId(userId);
    if (!resident) {
      throw new Error('Resident not found');
    }

    const pointsField = type === 'total' ? 'totalPoints' : 'currentPoints';
    const userPoints = resident[pointsField];

    // Count residents with higher points
    const position = await prisma.resident.count({
      where: {
        [pointsField]: {
          gt: userPoints
        }
      }
    }) + 1;

    // Get nearby residents (3 above, 3 below)
    const nearbyResidents = await prisma.resident.findMany({
      include: {
        user: {
          select: {
            userName: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        [pointsField]: 'desc'
      },
      take: 7,
      skip: Math.max(0, position - 4)
    });

    const rankedNearby = nearbyResidents.map((r, index) => ({
      rank: Math.max(1, position - 3) + index,
      userId: r.userId,
      userName: r.user.userName,
      profilePicture: r.user.profilePicture,
      currentPoints: r.currentPoints,
      totalPoints: r.totalPoints,
      isCurrentUser: r.userId === parseInt(userId)
    }));

    return {
      position,
      resident: {
        rank: position,
        userId: resident.userId,
        userName: resident.user.userName,
        profilePicture: resident.user.profilePicture,
        currentPoints: resident.currentPoints,
        totalPoints: resident.totalPoints,
        batchNumber: resident.batchNumber
      },
      nearby: rankedNearby
    };
  }

  /**
   * Get residents by batch
   */
  static async getByBatch(batchNumber, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return this.getLeaderboard({
      batchNumber,
      limit,
      offset
    });
  }

  /**
   * Get resident statistics
   */
  static async getStatistics() {
    const [overallStats, batchStats] = await Promise.all([
      // Overall statistics
      prisma.resident.aggregate({
        _count: {
          userId: true
        },
        _avg: {
          currentPoints: true,
          totalPoints: true
        },
        _max: {
          currentPoints: true,
          totalPoints: true
        },
        _sum: {
          currentPoints: true,
          totalPoints: true
        }
      }),
      // Batch statistics
      prisma.resident.groupBy({
        by: ['batchNumber'],
        where: {
          batchNumber: {
            not: null
          }
        },
        _count: {
          userId: true
        },
        _avg: {
          currentPoints: true
        },
        _max: {
          currentPoints: true
        },
        orderBy: {
          batchNumber: 'asc'
        }
      })
    ]);

    return {
      overall: {
        totalResidents: overallStats._count.userId,
        avgCurrentPoints: Math.round(overallStats._avg.currentPoints || 0),
        maxCurrentPoints: overallStats._max.currentPoints || 0,
        totalCurrentPoints: overallStats._sum.currentPoints || 0,
        avgTotalPoints: Math.round(overallStats._avg.totalPoints || 0),
        maxTotalPoints: overallStats._max.totalPoints || 0,
        totalAllTimePoints: overallStats._sum.totalPoints || 0
      },
      byBatch: batchStats.map(batch => ({
        batchNumber: batch.batchNumber,
        residentCount: batch._count.userId,
        avgPoints: Math.round(batch._avg.currentPoints || 0),
        maxPoints: batch._max.currentPoints || 0
      }))
    };
  }

  /**
   * Update resident profile
   */
  static async updateProfile(userId, updates) {
    const updateData = {};
    
    if (updates.dateOfBirth) {
      updateData.dateOfBirth = new Date(updates.dateOfBirth);
    }
    if (updates.batchNumber) {
      updateData.batchNumber = parseInt(updates.batchNumber);
    }
    if (updates.lastAbscondence) {
      updateData.lastAbscondence = new Date(updates.lastAbscondence);
    }

    return prisma.resident.update({
      where: { userId: parseInt(userId) },
      data: updateData,
      include: {
        user: {
          select: {
            userName: true,
            profilePicture: true
          }
        }
      }
    });
  }

  /**
   * Record abscondence
   */
  static async recordAbscondence(userId, reason, officerId) {
    return prisma.$transaction(async (tx) => {
      // Update last abscondence date
      await tx.resident.update({
        where: { userId: parseInt(userId) },
        data: {
          lastAbscondence: new Date()
        }
      });

      // Create abscondence transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(userId),
          officerId: parseInt(officerId),
          pointsChange: 0, // Abscondence doesn't change points directly
          transactionType: 'abscondence'
        }
      });

      // Create abscondence record
      await tx.abscondence.create({
        data: {
          transactionId: transaction.id,
          reason
        }
      });

      return transaction;
    });
  }

  /**
   * Get resident points history
   */
  static async getPointsHistory(userId, options = {}) {
    const { startDate, endDate, limit = 50, offset = 0 } = options;

    const where = {
      userId: parseInt(userId)
    };

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
                select: { productName: true, points: true }
              }
            }
          },
          completions: {
            include: {
              task: {
                select: { taskName: true, points: true }
              }
            }
          },
          abscondence: true,
          officer: {
            select: { userName: true }
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
   * Get top performers by period
   */
  static async getTopPerformers(period = 'month', limit = 10) {
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

    // Get residents with their points earned in the period
    const residents = await prisma.resident.findMany({
      include: {
        user: {
          select: {
            userName: true,
            profilePicture: true,
            transactions: {
              where: {
                transactionDate: {
                  gte: startDate
                },
                pointsChange: {
                  gt: 0 // Only positive point changes
                }
              },
              select: {
                pointsChange: true
              }
            }
          }
        }
      }
    });

    // Calculate points earned in period and sort
    const performersWithPeriodPoints = residents
      .map(resident => {
        const periodPoints = resident.user.transactions.reduce(
          (sum, transaction) => sum + transaction.pointsChange, 0
        );
        
        return {
          userId: resident.userId,
          userName: resident.user.userName,
          profilePicture: resident.user.profilePicture,
          currentPoints: resident.currentPoints,
          totalPoints: resident.totalPoints,
          batchNumber: resident.batchNumber,
          periodPoints
        };
      })
      .filter(resident => resident.periodPoints > 0)
      .sort((a, b) => b.periodPoints - a.periodPoints)
      .slice(0, limit)
      .map((resident, index) => ({
        ...resident,
        rank: index + 1
      }));

    return performersWithPeriodPoints;
  }
}

export default ResidentModel;