// models/Task.js
import { prisma } from '../lib/db.js';

/**
 * Get all tasks with filtering
 */
export const findMany = async (options = {}) => {
  try {
    const {
      categoryId,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'taskName',
      sortOrder = 'asc'
    } = options;

    const where = {};
    // Remove the active filter since it doesn't exist in the schema
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

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findMany due to schema mismatch...');
      
      // Build the raw SQL query
      let query = `
        SELECT 
          t."Task_ID" as id,
          t."Task_Name" as "taskName",
          t."Task_Description" as "taskDescription",
          t."Points" as points,
          t."Task_Category_ID" as "taskCategoryId",
          tc."Task_Category_Name" as "category_name",
          tc."Task_Category_Description" as "category_description"
        FROM "public"."MWH_Task" t
        LEFT JOIN "public"."MWH_Task_Category" tc ON t."Task_Category_ID" = tc."Task_Category_ID"
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (categoryId) {
        query += ` AND t."Task_Category_ID" = $${paramIndex}`;
        params.push(parseInt(categoryId));
        paramIndex++;
      }

      if (search) {
        query += ` AND (t."Task_Name" ILIKE $${paramIndex} OR t."Task_Description" ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Add ordering
      const validOrderColumns = {
        'taskName': 't."Task_Name"',
        'points': 't."Points"'
      };
      
      const orderColumn = validOrderColumns[sortBy] || 't."Task_Name"';
      const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${orderColumn} ${direction}`;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const rawTasks = await prisma.$queryRawUnsafe(query, ...params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM "public"."MWH_Task" t
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (categoryId) {
        countQuery += ` AND t."Task_Category_ID" = $${countParamIndex}`;
        countParams.push(parseInt(categoryId));
        countParamIndex++;
      }

      if (search) {
        countQuery += ` AND (t."Task_Name" ILIKE $${countParamIndex} OR t."Task_Description" ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
      const totalCount = parseInt(countResult[0].total);

      // Transform raw results to match expected format
      const tasks = rawTasks.map(task => ({
        id: task.id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        points: task.points,
        taskCategoryId: task.taskCategoryId,
        taskCategory: task.category_name ? {
          id: task.taskCategoryId,
          taskCategoryName: task.category_name,
          taskCategoryDescription: task.category_description
        } : null,
        _count: { completions: 0 } // Placeholder for now
      }));

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

    throw error;
  }
};

/**
 * Get task by ID
 */
export const findById = async (id) => {
  try {
    return await prisma.task.findUnique({
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

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findById due to schema mismatch...');
      
      const query = `
        SELECT 
          t."Task_ID" as id,
          t."Task_Name" as "taskName",
          t."Task_Description" as "taskDescription",
          t."Points" as points,
          t."Task_Category_ID" as "taskCategoryId",
          tc."Task_Category_Name" as "category_name",
          tc."Task_Category_Description" as "category_description"
        FROM "public"."MWH_Task" t
        LEFT JOIN "public"."MWH_Task_Category" tc ON t."Task_Category_ID" = tc."Task_Category_ID"
        WHERE t."Task_ID" = $1
      `;

      const rawTasks = await prisma.$queryRawUnsafe(query, parseInt(id));
      
      if (rawTasks.length === 0) {
        return null;
      }

      const task = rawTasks[0];
      
      return {
        id: task.id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        points: task.points,
        taskCategoryId: task.taskCategoryId,
        taskCategory: task.category_name ? {
          id: task.taskCategoryId,
          taskCategoryName: task.category_name,
          taskCategoryDescription: task.category_description
        } : null,
        _count: { completions: 0 },
        completions: [] // Placeholder for now
      };
    }

    throw error;
  }
};

// Add this method to your existing taskModel.js

/**
 * Get tasks by category
 */
export const findByCategory = async (options = {}) => {
  try {
    const {
      categoryId,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'taskName',
      sortOrder = 'asc'
    } = options;

    // Validate categoryId is provided
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const where = {
      taskCategoryId: parseInt(categoryId)
    };

    // Add search functionality
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

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findByCategory due to schema mismatch...');
      
      // Build the raw SQL query
      let query = `
        SELECT 
          t."Task_ID" as id,
          t."Task_Name" as "taskName",
          t."Task_Description" as "taskDescription",
          t."Points" as points,
          t."Task_Category_ID" as "taskCategoryId",
          tc."Task_Category_Name" as "category_name",
          tc."Task_Category_Description" as "category_description"
        FROM "public"."MWH_Task" t
        LEFT JOIN "public"."MWH_Task_Category" tc ON t."Task_Category_ID" = tc."Task_Category_ID"
        WHERE t."Task_Category_ID" = $1
      `;

      const params = [parseInt(categoryId)];
      let paramIndex = 2;

      if (search) {
        query += ` AND (t."Task_Name" ILIKE $${paramIndex} OR t."Task_Description" ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Add ordering
      const validOrderColumns = {
        'taskName': 't."Task_Name"',
        'points': 't."Points"'
      };
      
      const orderColumn = validOrderColumns[sortBy] || 't."Task_Name"';
      const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${orderColumn} ${direction}`;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const rawTasks = await prisma.$queryRawUnsafe(query, ...params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM "public"."MWH_Task" t
        WHERE t."Task_Category_ID" = $1
      `;

      const countParams = [parseInt(categoryId)];
      let countParamIndex = 2;

      if (search) {
        countQuery += ` AND (t."Task_Name" ILIKE $${countParamIndex} OR t."Task_Description" ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
      const totalCount = parseInt(countResult[0].total);

      // Transform raw results to match expected format
      const tasks = rawTasks.map(task => ({
        id: task.id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        points: task.points,
        taskCategoryId: task.taskCategoryId,
        taskCategory: task.category_name ? {
          id: task.taskCategoryId,
          taskCategoryName: task.category_name,
          taskCategoryDescription: task.category_description
        } : null,
        _count: { completions: 0 } // Placeholder for now
      }));

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

    throw error;
  }
};

/**
 * Create new task
 */
export const create = async (taskData) => {
  const {
    taskName,
    taskDescription,
    points,
    taskCategoryId
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
      taskCategoryId: parseInt(taskCategoryId)
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
    // Cannot delete tasks with completions - return an error
    throw new Error('Cannot delete task with existing completions. Please deactivate the task instead.');
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
    categoryName: task.taskCategory?.taskCategoryName,
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
  const [totalTasks, categoryStats] = await Promise.all([
    prisma.task.count(),
    prisma.taskCategory.findMany({
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })
  ]);

  const totalCompletions = await prisma.completion.count();
  const avgPointsResult = await prisma.task.aggregate({
    _avg: { points: true },
    _max: { points: true },
    _min: { points: true }
  });

  return {
    totalTasks,
    totalCompletions,
    averagePoints: Math.round(avgPointsResult._avg.points || 0),
    maxPoints: avgPointsResult._max.points || 0,
    minPoints: avgPointsResult._min.points || 0,
    byCategory: categoryStats.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.taskCategoryName,
      taskCount: cat._count.tasks
    }))
  };
};

/**
 * Get task categories
 */
export const getCategories = async () => {
  try {
    return await prisma.taskCategory.findMany({
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        taskCategoryName: 'asc'
      }
    });

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for getCategories due to schema mismatch...');
      
      const query = `
        SELECT 
          tc."Task_Category_ID" as id,
          tc."Task_Category_Name" as "taskCategoryName",
          tc."Task_Category_Description" as "taskCategoryDescription"
        FROM "public"."MWH_Task_Category" tc
        ORDER BY tc."Task_Category_Name" ASC
      `;

      const rawCategories = await prisma.$queryRawUnsafe(query);
      
      // Transform results and add task counts
      const categories = rawCategories.map(category => ({
        id: category.id,
        taskCategoryName: category.taskCategoryName,
        taskCategoryDescription: category.taskCategoryDescription,
        _count: { tasks: 0 } // Placeholder for now
      }));

      return categories;
    }

    throw error;
  }
};

/**
 * Get all tasks without filtering
 */
export const findAll = async () => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        taskCategory: true
      },
      orderBy: {
        taskName: 'asc'
      }
    });

    return tasks;

  } catch (error) {
    if (error.code === 'P2022' || error.code === 'P2032') {
      console.log('Attempting raw query for findAll due to schema mismatch...');
      
      const query = `
        SELECT 
          t."Task_ID" as id,
          t."Task_Name" as "taskName",
          t."Task_Description" as "taskDescription",
          t."Points" as points,
          t."Task_Category_ID" as "taskCategoryId",
          tc."Task_Category_Name" as "category_name",
          tc."Task_Category_Description" as "category_description"
        FROM "public"."MWH_Task" t
        LEFT JOIN "public"."MWH_Task_Category" tc ON t."Task_Category_ID" = tc."Task_Category_ID"
        ORDER BY t."Task_Name" ASC
      `;

      const rawTasks = await prisma.$queryRawUnsafe(query);

      // Transform raw results to match expected format
      const tasks = rawTasks.map(task => ({
        id: task.id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        points: task.points,
        taskCategoryId: task.taskCategoryId,
        taskCategory: task.category_name ? {
          id: task.taskCategoryId,
          taskCategoryName: task.category_name,
          taskCategoryDescription: task.category_description
        } : null
      }));

      return tasks;
    }

    throw error;
  }
};