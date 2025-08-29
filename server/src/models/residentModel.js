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
 * Get leaderboard (overall or by batch) with enhanced filtering
 */
export const getLeaderboard = async (options = {}) => {
  const {
    batchNumber,
    type = 'current', // 'current', 'total', 'month', 'year'
    limit = 10,
    offset = 0
  } = options;

  const where = {};
  if (batchNumber) {
    where.batchNumber = parseInt(batchNumber);
  }

  // Handle different leaderboard types
  if (type === 'month' || type === 'year') {
    return getLeaderboardByPeriod(options);
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
 * Get leaderboard by points gained in specific period (month/year)
 */
export const getLeaderboardByPeriod = async (options = {}) => {
  const {
    batchNumber,
    type = 'month', // 'month' or 'year'
    limit = 10,
    offset = 0
  } = options;

  const now = new Date();
  let startDate, endDate;

  if (type === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (type === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  }

  // Raw SQL query to get points gained in period
  let query = `
    SELECT 
      r."User_ID" as "userId",
      u."User_Name" as "userName",
      u."Profile_Picture" as "profilePicture",
      r."Current_Points" as "currentPoints",
      r."Total_Points" as "totalPoints",
      r."Batch_Number" as "batchNumber",
      r."Date_Of_Admission" as "dateOfAdmission",
      COALESCE(SUM(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $1 AND t."Transaction_Date" <= $2 
        THEN t."Points_Change" 
        ELSE 0 
      END), 0) as "periodPoints"
    FROM "public"."MWH_Resident" r
    INNER JOIN "public"."MWH_User" u ON r."User_ID" = u."User_ID"
    LEFT JOIN "public"."MWH_Transaction" t ON r."User_ID" = t."User_ID"
    WHERE 1=1
  `;

  const params = [startDate, endDate];
  let paramIndex = 3;

  if (batchNumber) {
    query += ` AND r."Batch_Number" = $${paramIndex}`;
    params.push(parseInt(batchNumber));
    paramIndex++;
  }

  query += `
    GROUP BY r."User_ID", u."User_Name", u."Profile_Picture", r."Current_Points", 
             r."Total_Points", r."Batch_Number", r."Date_Of_Admission"
    ORDER BY "periodPoints" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(parseInt(limit), parseInt(offset));

  // Count query
  let countQuery = `
    SELECT COUNT(DISTINCT r."User_ID") as total
    FROM "public"."MWH_Resident" r
    WHERE 1=1
  `;

  const countParams = [];
  let countParamIndex = 1;

  if (batchNumber) {
    countQuery += ` AND r."Batch_Number" = $${countParamIndex}`;
    countParams.push(parseInt(batchNumber));
  }

  const [rawResidents, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(query, ...params),
    prisma.$queryRawUnsafe(countQuery, ...countParams)
  ]);

  const totalCount = parseInt(countResult[0].total);

  // Transform and add ranking
  const rankedResidents = rawResidents.map((resident, index) => ({
    rank: parseInt(offset) + index + 1,
    userId: resident.userId,
    userName: resident.userName,
    profilePicture: resident.profilePicture,
    currentPoints: resident.currentPoints,
    totalPoints: resident.totalPoints,
    batchNumber: resident.batchNumber,
    dateOfAdmission: resident.dateOfAdmission,
    periodPoints: parseInt(resident.periodPoints)
  }));

  return {
    residents: rankedResidents,
    totalCount,
    period: type,
    startDate,
    endDate,
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

/**
 * Get enhanced leaderboard by batch with period filtering
 */
export const getLeaderboardByBatch = async (batchNumber, options = {}) => {
  const {
    type = 'current', // 'current', 'total', 'month', 'year'
    limit = 50,
    offset = 0
  } = options;

  return getLeaderboard({
    batchNumber: parseInt(batchNumber),
    type,
    limit,
    offset
  });
};

/**
 * Get batch statistics with period comparison
 */
export const getBatchStatistics = async (batchNumber, period = 'month') => {
  const now = new Date();
  let startDate;

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0); // All time
  }

  const query = `
    SELECT 
      COUNT(DISTINCT r."User_ID") as "totalResidents",
      AVG(r."Current_Points")::INTEGER as "avgCurrentPoints",
      AVG(r."Total_Points")::INTEGER as "avgTotalPoints",
      MAX(r."Current_Points") as "maxCurrentPoints",
      MAX(r."Total_Points") as "maxTotalPoints",
      MIN(r."Current_Points") as "minCurrentPoints",
      MIN(r."Total_Points") as "minTotalPoints",
      COALESCE(SUM(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $2
        THEN t."Points_Change" 
        ELSE 0 
      END), 0) as "periodPointsGained",
      COUNT(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $2
        THEN 1 
      END) as "periodCompletions",
      COUNT(CASE 
        WHEN t."Transaction_Type" = 'redemption' AND t."Transaction_Date" >= $2
        THEN 1 
      END) as "periodRedemptions"
    FROM "public"."MWH_Resident" r
    LEFT JOIN "public"."MWH_Transaction" t ON r."User_ID" = t."User_ID"
    WHERE r."Batch_Number" = $1
  `;

  const params = [parseInt(batchNumber), startDate];
  const result = await prisma.$queryRawUnsafe(query, ...params);

  return {
    batchNumber: parseInt(batchNumber),
    period,
    statistics: result[0]
  };
};

/**
 * Get recent point changes for leaderboard
 */
export const getRecentPointChanges = async (options = {}) => {
  const {
    batchNumber,
    limit = 20,
    hours = 24
  } = options;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  let whereClause = `WHERE t."Transaction_Date" >= $1`;
  const params = [since];
  let paramIndex = 2;

  if (batchNumber) {
    whereClause += ` AND r."Batch_Number" = $${paramIndex}`;
    params.push(parseInt(batchNumber));
    paramIndex++;
  }

  const query = `
    SELECT 
      r."User_ID" as "userId",
      u."User_Name" as "userName",
      r."Batch_Number" as "batchNumber",
      t."Points_Change" as "pointsChange",
      t."Transaction_Type" as "transactionType",
      t."Transaction_Date" as "transactionDate",
      CASE 
        WHEN t."Transaction_Type" = 'completion' THEN task."Task_Name"
        WHEN t."Transaction_Type" = 'redemption' THEN prod."Product_Name"
        ELSE NULL
      END as "itemName"
    FROM "public"."MWH_Transaction" t
    INNER JOIN "public"."MWH_Resident" r ON t."User_ID" = r."User_ID"
    INNER JOIN "public"."MWH_User" u ON r."User_ID" = u."User_ID"
    LEFT JOIN "public"."MWH_Completion" comp ON t."Transaction_ID" = comp."Transaction_ID"
    LEFT JOIN "public"."MWH_Task" task ON comp."Task_ID" = task."Task_ID"
    LEFT JOIN "public"."MWH_Redemption" red ON t."Transaction_ID" = red."Transaction_ID"
    LEFT JOIN "public"."MWH_Product" prod ON red."Product_ID" = prod."Product_ID"
    ${whereClause}
    ORDER BY t."Transaction_Date" DESC
    LIMIT $${paramIndex}
  `;

  params.push(parseInt(limit));

  const changes = await prisma.$queryRawUnsafe(query, ...params);

  return changes.map(change => ({
    userId: change.userId,
    userName: change.userName,
    batchNumber: change.batchNumber,
    pointsChange: change.pointsChange,
    transactionType: change.transactionType,
    transactionDate: change.transactionDate,
    itemName: change.itemName
  }));
};

/**
 * Compare residents performance
 */
export const compareResidents = async (userIds) => {
  const userIdArray = userIds.map(id => parseInt(id));
  
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const query = `
    SELECT 
      r."User_ID" as "userId",
      u."User_Name" as "userName",
      r."Current_Points" as "currentPoints",
      r."Total_Points" as "totalPoints",
      r."Batch_Number" as "batchNumber",
      COALESCE(SUM(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $2
        THEN t."Points_Change" 
        ELSE 0 
      END), 0) as "monthPoints",
      COALESCE(SUM(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $3
        THEN t."Points_Change" 
        ELSE 0 
      END), 0) as "yearPoints",
      COUNT(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $2
        THEN 1 
      END) as "monthCompletions",
      COUNT(CASE 
        WHEN t."Transaction_Type" = 'completion' AND t."Transaction_Date" >= $3
        THEN 1 
      END) as "yearCompletions"
    FROM "public"."MWH_Resident" r
    INNER JOIN "public"."MWH_User" u ON r."User_ID" = u."User_ID"
    LEFT JOIN "public"."MWH_Transaction" t ON r."User_ID" = t."User_ID"
    WHERE r."User_ID" = ANY($1)
    GROUP BY r."User_ID", u."User_Name", r."Current_Points", r."Total_Points", r."Batch_Number"
    ORDER BY r."Current_Points" DESC
  `;

  const residents = await prisma.$queryRawUnsafe(query, userIdArray, thisMonth, thisYear);

  return residents.map(resident => ({
    userId: resident.userId,
    userName: resident.userName,
    currentPoints: resident.currentPoints,
    totalPoints: resident.totalPoints,
    batchNumber: resident.batchNumber,
    monthPoints: parseInt(resident.monthPoints),
    yearPoints: parseInt(resident.yearPoints),
    monthCompletions: parseInt(resident.monthCompletions),
    yearCompletions: parseInt(resident.yearCompletions)
  }));
};
