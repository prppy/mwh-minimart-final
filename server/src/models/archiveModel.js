import prisma from '../lib/db.js';

/**
 * Archive residents who have been inactive for more than 6 months
 * @param {number} monthsThreshold - Number of months to consider inactive (default: 6)
 * @returns {Promise<{archived: number, errors: string[]}>}
 */
export const archiveInactiveResidents = async (monthsThreshold = 6) => {
  const errors = [];
  let archivedCount = 0;

  try {
    // Calculate the cutoff date (6 months ago)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsThreshold);

    console.log(`Archiving residents inactive since: ${cutoffDate.toISOString()}`);

    // Find residents who should be archived
    const residentsToArchive = await prisma.resident.findMany({
      where: {
        isActive: true,
        OR: [
          // No activity date and admission was before cutoff
          {
            lastActivityDate: null,
            dateOfAdmission: {
              lt: cutoffDate
            }
          },
          // Last activity was before cutoff
          {
            lastActivityDate: {
              lt: cutoffDate
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            userName: true
          }
        }
      }
    });

    console.log(`Found ${residentsToArchive.length} residents to archive`);

    // Archive each resident
    for (const resident of residentsToArchive) {
      try {
        await prisma.resident.update({
          where: {
            userId: resident.userId
          },
          data: {
            isActive: false
          }
        });

        archivedCount++;
        console.log(`Archived resident: ${resident.user.userName} (ID: ${resident.userId})`);
      } catch (error) {
        const errorMsg = `Failed to archive resident ${resident.userId}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      archived: archivedCount,
      errors
    };

  } catch (error) {
    console.error('Archive service error:', error);
    throw error;
  }
};

/**
 * Unarchive a resident (manual action by officers)
 * @param {number} userId - User ID to unarchive
 * @returns {Promise<boolean>}
 */
export const unarchiveResident = async (userId) => {
  try {
    const result = await prisma.resident.update({
      where: { userId },
      data: {
        isActive: true,
        lastActivityDate: new Date() // Reset activity date
      }
    });

    console.log(`Unarchived resident: ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to unarchive resident ${userId}:`, error);
    throw error;
  }
};

/**
 * Get archived residents
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
export const getArchivedResidents = async (options = {}) => {
  const {
    limit = 50,
    offset = 0,
    batchNumber,
    search
  } = options;

  const where = {
    isActive: false
  };

  if (batchNumber) {
    where.batchNumber = parseInt(batchNumber);
  }

  if (search) {
    where.user = {
      userName: {
        contains: search,
        mode: 'insensitive'
      }
    };
  }

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
        lastActivityDate: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.resident.count({ where })
  ]);

  return {
    residents: residents.map(resident => ({
      userId: resident.userId,
      userName: resident.user.userName,
      profilePicture: resident.user.profilePicture,
      currentPoints: resident.currentPoints,
      totalPoints: resident.totalPoints,
      batchNumber: resident.batchNumber,
      lastActivityDate: resident.lastActivityDate,
      dateOfAdmission: resident.dateOfAdmission
    })),
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
 * Update resident activity (call this when resident performs any action)
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const updateResidentActivity = async (userId) => {
  try {
    await prisma.resident.update({
      where: { userId },
      data: {
        lastActivityDate: new Date()
      }
    });
  } catch (error) {
    console.error(`Failed to update activity for resident ${userId}:`, error);
    // Don't throw error as this shouldn't break the main operation
  }
};

/**
 * Get archive statistics
 * @returns {Promise<Object>}
 */
export const getArchiveStats = async () => {
  const [activeCount, archivedCount, totalCount] = await Promise.all([
    prisma.resident.count({ where: { isActive: true } }),
    prisma.resident.count({ where: { isActive: false } }),
    prisma.resident.count()
  ]);

  const recentlyArchived = await prisma.resident.count({
    where: {
      isActive: false,
      lastActivityDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  });

  return {
    active: activeCount,
    archived: archivedCount,
    total: totalCount,
    recentlyArchived
  };
};
