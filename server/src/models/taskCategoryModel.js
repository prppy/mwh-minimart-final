// models/taskCategoryModel.js
import { prisma } from '../lib/db.js';

/**
 * Get all task categories with optional task count
 */
export const findAll = async (options = {}) => {
  const { includeTaskCount = false, includeTasks = false } = options;

  const include = {};

  if (includeTaskCount) {
    include._count = {
      select: {
        tasks: true
      }
    };
  }

  if (includeTasks) {
    include.tasks = {
      orderBy: { taskName: 'asc' }
    };
  }

  return prisma.taskCategory.findMany({
    include,
    orderBy: { taskCategoryName: 'asc' }
  });
};

/**
 * Get task category by ID
 */
export const findById = async (id, options = {}) => {
  const { includeTasks = false } = options;

  const include = {};

  if (includeTasks) {
    include.tasks = {
      orderBy: { taskName: 'asc' }
    };
  }

  return prisma.taskCategory.findUnique({
    where: { id: parseInt(id) },
    include
  });
};

/**
 * Create new task category
 */
export const create = async (taskCategoryData) => {
  const { taskCategoryName } = taskCategoryData;

  // Check if exists
  const existing = await prisma.taskCategory.findUnique({
    where: { taskCategoryName }
  });

  if (existing) {
    throw new Error('Task category with this name already exists');
  }

  return prisma.taskCategory.create({
    data: taskCategoryData
  });
};

/**
 * Update task category
 */
export const update = async (id, updates) => {
  const category = await prisma.taskCategory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!category) {
    throw new Error('Task category not found');
  }

  // Prevent name conflict
  if (
    updates.taskCategoryName &&
    updates.taskCategoryName !== category.taskCategoryName
  ) {
    const existing = await prisma.taskCategory.findUnique({
      where: { taskCategoryName: updates.taskCategoryName }
    });

    if (existing) {
      throw new Error('Task category with this name already exists');
    }
  }

  return prisma.taskCategory.update({
    where: { id: parseInt(id) },
    data: updates
  });
};

/**
 * Delete a task category
 */
export const remove = async (id) => {
  const category = await prisma.taskCategory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!category) {
    throw new Error('Task category not found');
  }

  // Prevent delete if tasks exist
  const taskCount = await prisma.task.count({
    where: { taskCategoryId: parseInt(id) }
  });

  if (taskCount > 0) {
    throw new Error('Cannot delete task category with existing tasks');
  }

  return prisma.taskCategory.delete({
    where: { id: parseInt(id) }
  });
};

/**
 * Get task category statistics
 */
export const getStatistics = async () => {
  const [
    totalCategories,
    categoriesWithTasks,
    topCategories
  ] = await Promise.all([
    prisma.taskCategory.count(),
    prisma.taskCategory.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    }),
    prisma.taskCategory.findMany({
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: {
        tasks: { _count: 'desc' }
      },
      take: 5
    })
  ]);

  return {
    totalCategories,
    categoriesWithTasks: categoriesWithTasks.filter(c => c._count.tasks > 0).length,
    emptyCategories: categoriesWithTasks.filter(c => c._count.tasks === 0).length,
    topCategories: topCategories.map(c => ({
      id: c.id,
      taskCategoryName: c.taskCategoryName,
      taskCount: c._count.tasks
    })),
    allCategories: categoriesWithTasks.map(c => ({
      id: c.id,
      taskCategoryName: c.taskCategoryName,
      taskCount: c._count.tasks
    }))
  };
};

/**
 * Search task categories
 */
export const search = async (query, options = {}) => {
  const { includeTaskCount = false } = options;

  const include = {};

  if (includeTaskCount) {
    include._count = {
      select: { tasks: true }
    };
  }

  return prisma.taskCategory.findMany({
    where: {
      taskCategoryName: {
        contains: query,
        mode: 'insensitive'
      }
    },
    include,
    orderBy: { taskCategoryName: 'asc' }
  });
};
