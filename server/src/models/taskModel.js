// models/Task.js
import { prisma } from '../lib/db.js';

/**
 * Get all tasks with filtering
 */
export const findMany = async (options = {}) => {
  const {
    active = true,
    categoryId,
    search,
    limit = 50,
    offset = 0,
    sortBy = 'taskName',
    sortOrder = 'asc'
  } = options;

  const where = {};
  if (active !== undefined) where.active = active;
  if (categoryId) where.taskCategoryId = parseInt(categoryId);
  if (search) {
    where.OR = [
      {
        taskName: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        taskDescription: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const orderBy = {};
  if (sortBy === 'taskName') {
    orderBy.taskName = sortOrder;
  } else if (sortBy === 'points') {
    orderBy.points = sortOrder;
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        taskCategory: {
          select: {
            id: true,
            taskCategoryName: true,
            taskCategoryDescription: true
          }
        },
        _count: {
          select: {
            completions: true
          }
        }
      },
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.task.count({ where })
  ]);

  return {
    tasks,
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
 * Get task by ID
 */
export const findById = async (id) => {
  return prisma.task.findUnique({
    where: { id: parseInt(id) },
    include: {
      taskCategory: {
        select: {
          id: true,
          taskCategoryName: true,
          taskCategoryDescription: true
        }
      },
      _count: {
        select: {
          completions: true
        }
      },
      completions: {
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
        take: 10 // Last 10 completions
      }
    }
  });
};

/**
 * Create new task
 */
export const create = async (taskData) => {
  const {
    taskName,
    taskDescription,
    points,
    taskCategoryId,
    difficultyLevel = 'medium',
    estimatedDurationMinutes,
    instructions,
    active = true
  } = taskData;

  // Validate required fields
  if (!taskName || !taskDescription || !points || !taskCategoryId) {
    throw new Error('Missing required fields: taskName, taskDescription, points, taskCategoryId');
  }

  // Check if category exists
  const category = await prisma.taskCategory.findUnique({
    where: { id: parseInt(taskCategoryId) }
  });

  if (!category) {
    throw new Error('Task category not found');
  }

  return prisma.task.create({
    data: {
      taskName,
      taskDescription,
      points: parseInt(points),
      taskCategoryId: parseInt(taskCategoryId),
      difficultyLevel,
      estimatedDurationMinutes: estimatedDurationMinutes ? parseInt(estimatedDurationMinutes) : null,
      instructions,
      active
    },
    include: {
      taskCategory: true
    }
  });
};

/**
 * Update task
 */
export const update = async (id, updates) => {
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // If updating category, verify it exists
  if (updates.taskCategoryId) {
    const category = await prisma.taskCategory.findUnique({
      where: { id: parseInt(updates.taskCategoryId) }
    });

    if (!category) {
      throw new Error('Task category not found');
    }
  }

  // Prepare update data
  const updateData = { ...updates };
  if (updateData.points) updateData.points = parseInt(updateData.points);
  if (updateData.taskCategoryId) updateData.taskCategoryId = parseInt(updateData.taskCategoryId);
  if (updateData.estimatedDurationMinutes) updateData.estimatedDurationMinutes = parseInt(updateData.estimatedDurationMinutes);

  return prisma.task.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      taskCategory: true
    }
  });
};

/**
 * Delete task
 */
export const remove = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Check if task has completions
  const completionCount = await prisma.completion.count({
    where: { taskId: parseInt(id) }
  });

  if (completionCount > 0) {
    // Soft delete by setting active to false
    return prisma.task.update({
      where: { id: parseInt(id) },
      data: { active: false }
    });
  } else {
    // Hard delete if no completions
    return prisma.task.delete({
      where: { id: parseInt(id) }
    });
  }
};

/**
 * Get popular tasks
 */
export const getPopular = async (limit = 10, timeframe = 'month') => {
  const now = new Date();
  let dateFilter = {};

  if (timeframe !== 'all') {
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

  const tasks = await prisma.task.findMany({
    where: {
      active: true
    },
    include: {
      taskCategory: {
        select: {
          taskCategoryName: true
        }
      },
      completions: {
        where: dateFilter,
        select: {
          id: true
        }
      }
    }
  });

  // Sort by completion count and return top tasks
  const tasksWithCounts = tasks.map(task => ({
    id: task.id,
    taskName: task.taskName,
    taskDescription: task.taskDescription,
    points: task.points,
    difficultyLevel: task.difficultyLevel,
    categoryName: task.taskCategory.taskCategoryName,
    completionCount: task.completions.length
  }))
  .sort((a, b) => b.completionCount - a.completionCount)
  .slice(0, parseInt(limit));

  return tasksWithCounts;
};

/**
 * Get task analytics
 */
export const getAnalytics = async (id, period = 'month') => {
  const task = await findById(id);
  if (!task) {
    throw new Error('Task not found');
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

  const completions = await prisma.completion.findMany({
    where: {
      taskId: parseInt(id),
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

  // Group completions by day
  const dailyCompletions = {};
  completions.forEach(completion => {
    const date = completion.transaction.transactionDate.toISOString().split('T')[0];
    if (!dailyCompletions[date]) {
      dailyCompletions[date] = 0;
    }
    dailyCompletions[date]++;
  });

  // Group by batch
  const batchCompletions = {};
  completions.forEach(completion => {
    const batch = completion.transaction.user.resident?.batchNumber || 'Unknown';
    if (!batchCompletions[batch]) {
      batchCompletions[batch] = 0;
    }
    batchCompletions[batch]++;
  });

  return {
    taskId: parseInt(id),
    taskName: task.taskName,
    period,
    totalCompletions: completions.length,
    uniqueUsers: new Set(completions.map(c => c.transaction.userId)).size,
    dailyBreakdown: dailyCompletions,
    batchBreakdown: batchCompletions,
    completions: completions.map(c => ({
      userId: c.transaction.userId,
      userName: c.transaction.user.userName,
      batchNumber: c.transaction.user.resident?.batchNumber,
      completionDate: c.transaction.transactionDate
    }))
  };
};

/**
 * Get task statistics
 */
export const getStatistics = async () => {
  const [totalTasks, activeTasks, categoryStats, difficultyStats] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { active: true } }),
    prisma.taskCategory.findMany({
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    }),
    prisma.task.groupBy({
      by: ['difficultyLevel'],
      where: { active: true },
      _count: {
        difficultyLevel: true
      }
    })
  ]);

  const totalCompletions = await prisma.completion.count();
  const avgPointsResult = await prisma.task.aggregate({
    where: { active: true },
    _avg: { points: true },
    _max: { points: true },
    _min: { points: true }
  });

  return {
    totalTasks,
    activeTasks,
    inactiveTasks: totalTasks - activeTasks,
    totalCompletions,
    averagePoints: Math.round(avgPointsResult._avg.points || 0),
    maxPoints: avgPointsResult._max.points || 0,
    minPoints: avgPointsResult._min.points || 0,
    byCategory: categoryStats.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.taskCategoryName,
      taskCount: cat._count.tasks
    })),
    byDifficulty: difficultyStats.reduce((acc, stat) => {
      acc[stat.difficultyLevel] = stat._count.difficultyLevel;
      return acc;
    }, {})
  };
};

/**
 * Get task categories
 */
export const getCategories = async () => {
  return prisma.taskCategory.findMany({
    include: {
      _count: {
        select: {
          tasks: {
            where: {
              active: true
            }
          }
        }
      }
    },
    orderBy: {
      taskCategoryName: 'asc'
    }
  });
};
