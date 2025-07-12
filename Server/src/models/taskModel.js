// models/Task.js
import { prisma } from '../lib/db';

class TaskModel {
  /**
   * Get all tasks with filtering
   */
  static async findMany(options = {}) {
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
  }

  /**
   * Get task by ID
   */
  static async findById(id) {
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
  }

  /**
   * Create new task
   */
  static async create(taskData) {
    const {
      taskName,
      taskDescription,
      points,
      taskCategoryId,
      active = true
    } = taskData;

    // Verify task category exists
    const taskCategory = await prisma.taskCategory.findUnique({
      where: { id: parseInt(taskCategoryId) }
    });

    if (!taskCategory) {
      throw new Error('Invalid task category ID');
    }

    return prisma.task.create({
      data: {
        taskName,
        taskDescription,
        points: parseInt(points),
        taskCategoryId: parseInt(taskCategoryId),
        active
      },
      include: {
        taskCategory: {
          select: {
            id: true,
            taskCategoryName: true,
            taskCategoryDescription: true
          }
        }
      }
    });
  }

  /**
   * Update task
   */
  static async update(id, updates) {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify task category exists if being updated
    if (updates.taskCategoryId) {
      const taskCategory = await prisma.taskCategory.findUnique({
        where: { id: parseInt(updates.taskCategoryId) }
      });

      if (!taskCategory) {
        throw new Error('Invalid task category ID');
      }
    }

    const updateData = {};
    if (updates.taskName !== undefined) updateData.taskName = updates.taskName;
    if (updates.taskDescription !== undefined) updateData.taskDescription = updates.taskDescription;
    if (updates.points !== undefined) updateData.points = parseInt(updates.points);
    if (updates.taskCategoryId !== undefined) updateData.taskCategoryId = parseInt(updates.taskCategoryId);
    if (updates.active !== undefined) updateData.active = updates.active;

    return prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        taskCategory: {
          select: {
            id: true,
            taskCategoryName: true,
            taskCategoryDescription: true
          }
        }
      }
    });
  }

  /**
   * Delete or deactivate task
   */
  static async delete(id) {
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
      // Don't delete, just mark as inactive
      return this.update(id, { active: false });
    }

    return prisma.task.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Get popular tasks (most completed)
   */
  static async getPopular(limit = 10, timeframe = 'month') {
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

    return prisma.task.findMany({
      where: { active: true },
      include: {
        taskCategory: {
          select: {
            id: true,
            taskCategoryName: true
          }
        },
        _count: {
          select: {
            completions: dateFilter.transaction ? {
              where: dateFilter
            } : true
          }
        }
      },
      orderBy: {
        completions: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });
  }

  /**
   * Get task analytics
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

    const [task, completions, periodCompletions] = await Promise.all([
      // Basic task info
      this.findById(id),
      
      // All-time completions
      prisma.completion.findMany({
        where: { taskId: parseInt(id) },
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

      // Period completions
      prisma.completion.findMany({
        where: {
          taskId: parseInt(id),
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

    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate analytics
    const totalCompletions = completions.length;
    const periodCompletionsCount = periodCompletions.length;
    
    // Points distributed
    const totalPointsDistributed = totalCompletions * task.points;
    const periodPointsDistributed = periodCompletionsCount * task.points;

    // Daily breakdown for the period
    const dailyBreakdown = {};
    periodCompletions.forEach(completion => {
      const date = completion.transaction.transactionDate.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { completions: 0 };
      }
      dailyBreakdown[date].completions += 1;
    });

    return {
      task,
      analytics: {
        allTime: {
          completions: totalCompletions,
          pointsDistributed: totalPointsDistributed
        },
        period: {
          completions: periodCompletionsCount,
          pointsDistributed: periodPointsDistributed,
          dailyBreakdown
        },
        recentCompletions: completions.slice(0, 10)
      }
    };
  }

  /**
   * Get task statistics
   */
  static async getStatistics() {
    const [overallStats, categoryStats] = await Promise.all([
      // Overall task statistics
      prisma.task.aggregate({
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
          active: true
        }
      }),

      // Statistics by category
      prisma.task.groupBy({
        by: ['taskCategoryId'],
        where: {
          active: true
        },
        _count: {
          id: true
        },
        _avg: {
          points: true
        }
      })
    ]);

    // Get category names
    const categoryStatsWithNames = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await prisma.taskCategory.findUnique({
          where: { id: stat.taskCategoryId },
          select: { taskCategoryName: true }
        });
        return {
          ...stat,
          categoryName: category?.taskCategoryName || 'Unknown'
        };
      })
    );

    return {
      overall: {
        totalTasks: overallStats._count.id,
        avgPoints: Math.round(overallStats._avg.points || 0),
        maxPoints: overallStats._max.points || 0,
        minPoints: overallStats._min.points || 0
      },
      byCategory: categoryStatsWithNames
    };
  }
}