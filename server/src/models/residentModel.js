// models/Resident.js
import { prisma } from '../lib/db.js';

/**
 * Find resident by user ID
 */
export const findByUserId = async (userId) => {
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
};

/**
 * Check if resident can afford given points
 */
export const canAfford = async (userId, points) => {
  const resident = await prisma.resident.findUnique({
    where: { userId: parseInt(userId) },
    select: { currentPoints: true }
  });
  
  return resident ? resident.currentPoints >= points : false;
};

/**
 * Add points to resident (for task completion)
 */
export const addPoints = async (userId, points, transaction = null) => {
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
};

/**
 * Deduct points from resident (for redemption)
 */
export const deductPoints = async (userId, points, transaction = null) => {
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
};

/**
 * Get leaderboard (overall or by batch)
 */
export const getLeaderboard = async (options = {}) => {
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
};

/**
 * Get top performers by period
 */
export const getTopPerformers = async (period = 'month', limit = 10) => {
  let dateFilter = {};
  
  if (period !== 'all') {
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
    }
    
    if (startDate) {
      dateFilter = {
        transactions: {
          some: {
            transactionType: 'completion',
            transactionDate: {
              gte: startDate
            }
          }
        }
      };
    }
  }

  const residents = await prisma.resident.findMany({
    where: dateFilter,
    include: {
      user: {
        select: {
          userName: true,
          profilePicture: true
        }
      },
      transactions: {
        where: {
          transactionType: 'completion',
          ...(dateFilter.transactions?.some?.transactionDate && {
            transactionDate: dateFilter.transactions.some.transactionDate
          })
        },
        select: {
          pointsChange: true
        }
      }
    },
    orderBy: {
      currentPoints: 'desc'
    },
    take: parseInt(limit)
  });

  return residents.map((resident, index) => ({
    rank: index + 1,
    userId: resident.userId,
    userName: resident.user.userName,
    profilePicture: resident.user.profilePicture,
    currentPoints: resident.currentPoints,
    totalPoints: resident.totalPoints,
    batchNumber: resident.batchNumber,
    periodPoints: resident.transactions.reduce((sum, t) => sum + t.pointsChange, 0)
  }));
};

/**
 * Get points history for a resident
 */
export const getPointsHistory = async (userId, options = {}) => {
  const { limit = 20, offset = 0, startDate, endDate } = options;

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
      orderBy: {
        transactionDate: 'desc'
      },
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
};

/**
 * Get recent leaderboard changes (residents who gained points recently)
 */
export const getRecentChanges = async (limit = 20) => {
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      transactionType: 'completion',
      pointsChange: {
        gt: 0
      }
    },
    include: {
      user: {
        select: {
          userName: true,
          resident: {
            select: {
              currentPoints: true,
              batchNumber: true
            }
          }
        }
      },
      completions: {
        include: {
          task: {
            select: {
              taskName: true,
              points: true
            }
          }
        }
      }
    },
    orderBy: {
      transactionDate: 'desc'
    },
    take: parseInt(limit)
  });

  // Format the data
  return recentTransactions.map(transaction => ({
    transactionId: transaction.id,
    userId: transaction.userId,
    userName: transaction.user.userName,
    pointsEarned: transaction.pointsChange,
    currentPoints: transaction.user.resident?.currentPoints || 0,
    batchNumber: transaction.user.resident?.batchNumber,
    tasksCompleted: transaction.completions.map(completion => ({
      taskName: completion.task.taskName,
      points: completion.task.points
    })),
    transactionDate: transaction.transactionDate
  }));
};

/**
 * Get resident position in leaderboard
 */
export const getPosition = async (userId, type = 'current') => {
  const resident = await findByUserId(userId);
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
};

/**
 * Get residents by batch
 */
export const getByBatch = async (batchNumber, options = {}) => {
  const { limit = 50, offset = 0 } = options;

  return getLeaderboard({
    batchNumber,
    limit,
    offset
  });
};

/**
 * Get resident statistics
 */
export const getStatistics = async () => {
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
};

/**
 * Update resident profile
 */
export const updateProfile = async (userId, updates) => {
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
};

/**
 * Record abscondence
 */
export const recordAbscondence = async (userId, reason, officerId) => {
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
};
