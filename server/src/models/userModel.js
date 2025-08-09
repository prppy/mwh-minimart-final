// models/User.js
import { prisma } from '../lib/db.js';
import bcryptjs from 'bcryptjs';
const { genSalt, hash, compare } = bcryptjs;

/**
 * Find user by username with role-specific data
 */
export const findByUserName = async (userName) => {
  return prisma.user.findUnique({
    where: { userName },
    include: {
      resident: true,
      officer: true
    }
  });
};

/**
 * Find user by ID with optional includes
 */
export const findById = async (id, options = {}) => {
  const { includeResident = false, includeOfficer = false, includeTransactions = false } = options;
  
  try {
    // Try the standard Prisma query first
    const include = {};
    if (includeResident) include.resident = true;
    if (includeOfficer) include.officer = true;
    if (includeTransactions) {
      include.transactions = {
        include: {
          redemptions: { include: { product: true } },
          completions: { include: { task: true } },
          abscondence: true
        },
        orderBy: { transactionDate: 'desc' },
        take: 10 // Last 10 transactions
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include
    });

    // Handle null values in resident data if it exists
    if (user && user.resident) {
      user.resident = {
        ...user.resident,
        currentPoints: user.resident.currentPoints ?? 0,
        totalPoints: user.resident.totalPoints ?? 0
      };
    }

    return user;
  } catch (error) {
    // If the error is related to null values, use raw query
    if (error.code === 'P2032') {
      console.log('Attempting raw query for findById due to null value constraint violation...');
      
      const rawUser = await prisma.$queryRawUnsafe(`
        SELECT 
          u."User_ID" as id,
          u."User_Name" as "userName",
          u."User_Role" as "userRole",
          u."Profile_Picture" as "profilePicture",
          u."Password_Hash" as "passwordHash",
          u."Biometric_Hash" as "biometricHash",
          u."Created_At" as "createdAt",
          u."Updated_At" as "updatedAt",
          r."Date_Of_Birth" as "resident_dateOfBirth",
          r."Date_Of_Admission" as "resident_dateOfAdmission",
          r."Last_Abscondence" as "resident_lastAbscondence",
          COALESCE(r."Current_Points", 0) as "resident_currentPoints",
          COALESCE(r."Total_Points", 0) as "resident_totalPoints",
          r."Batch_Number" as "resident_batchNumber",
          o."Officer_Email" as "officer_officerEmail"
        FROM "public"."MWH_User" u
        LEFT JOIN "public"."MWH_Resident" r ON u."User_ID" = r."User_ID"
        LEFT JOIN "public"."MWH_Officer" o ON u."User_ID" = o."User_ID"
        WHERE u."User_ID" = $1
      `, parseInt(id));

      if (rawUser.length === 0) return null;

      const user = rawUser[0];
      
      // Transform to match expected format
      const transformedUser = {
        id: user.id,
        userName: user.userName,
        userRole: user.userRole,
        profilePicture: user.profilePicture,
        passwordHash: user.passwordHash,
        biometricHash: user.biometricHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        resident: (includeResident && (user.resident_currentPoints !== null || user.resident_dateOfBirth !== null)) ? {
          userId: user.id,
          dateOfBirth: user.resident_dateOfBirth,
          dateOfAdmission: user.resident_dateOfAdmission,
          lastAbscondence: user.resident_lastAbscondence,
          currentPoints: parseInt(user.resident_currentPoints) || 0,
          totalPoints: parseInt(user.resident_totalPoints) || 0,
          batchNumber: user.resident_batchNumber
        } : null,
        officer: (includeOfficer && user.officer_officerEmail) ? {
          userId: user.id,
          officerEmail: user.officer_officerEmail
        } : null
      };

      return transformedUser;
    }
    
    throw error;
  }
};

/**
 * Create a new user with role-specific data
 */
export const create = async (userData) => {
  const { userName, password, userRole, ...roleData } = userData;
  
  // Hash password
  const salt = await genSalt(12);
  const passwordHash = await hash(password, salt);
  return prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        userName,
        passwordHash,
        userRole: userRole || 'resident'
      }
    });
    // Create role-specific record
    if (userRole === 'resident' || !userRole) {
      await tx.resident.create({
        data: {
          userId: user.id,
          dateOfBirth: roleData.dateOfBirth ? new Date(roleData.dateOfBirth) : null,
          batchNumber: roleData.batchNumber ? parseInt(roleData.batchNumber) : null,
          currentPoints: roleData.currentPoints || 0,
          totalPoints: roleData.totalPoints || 0
        }
      });
    } else if (userRole === 'officer') {
      await tx.officer.create({
        data: {
          userId: user.id,
          officerEmail: roleData.email
        }
      });
    }
    return user;
  });
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
  const user = await findById(userId, { includeResident: true, includeOfficer: true });
  
  if (!user) {
    throw new Error('User not found');
  }
  return prisma.$transaction(async (tx) => {
    // Update user fields
    const userUpdateData = {};
    if (updates.userName) userUpdateData.userName = updates.userName;
    if (updates.profilePicture !== undefined) userUpdateData.profilePicture = updates.profilePicture;
    
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }
    // Update role-specific fields
    if (user.userRole === 'resident' && user.resident && updates.resident) {
      const residentUpdates = updates.resident;
      const residentUpdateData = {};
      
      if (residentUpdates.dateOfBirth) {
        residentUpdateData.dateOfBirth = new Date(residentUpdates.dateOfBirth);
      }
      if (residentUpdates.batchNumber) {
        residentUpdateData.batchNumber = parseInt(residentUpdates.batchNumber);
      }
      
      if (Object.keys(residentUpdateData).length > 0) {
        await tx.resident.update({
          where: { userId },
          data: residentUpdateData
        });
      }
    } else if (user.userRole === 'officer' && user.officer && updates.officer) {
      const officerUpdates = updates.officer;
      const officerUpdateData = {};
      
      if (officerUpdates.email) {
        officerUpdateData.officerEmail = officerUpdates.email;
      }
      
      if (Object.keys(officerUpdateData).length > 0) {
        await tx.officer.update({
          where: { userId },
          data: officerUpdateData
        });
      }
    }
    return findById(userId, { includeResident: true, includeOfficer: true });
  });
};

/**
 * Validate user password
 */
export const validatePassword = async (user, password) => {
  return compare(password, user.passwordHash);
};

/**
 * Get users with filtering
 */
export const findMany = async (options = {}) => {
  const {
    role,
    batchNumber,
    limit = 50,
    offset = 0,
    search,
    sortBy = 'userName',
    sortOrder = 'asc'
  } = options;
  const where = {};
  if (role) where.userRole = role;
  if (search) {
    where.userName = {
      contains: search,
      mode: 'insensitive'
    };
  }
  const include = {
    resident: true,
    officer: true
  };
  let orderBy = {};
  if (sortBy === 'userName') {
    orderBy.userName = sortOrder;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = sortOrder;
  }
  // Use raw query to handle null values properly
  try {
    // Build the WHERE clause dynamically
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    if (role) {
      whereClause += ` AND u."User_Role" = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (search) {
      whereClause += ` AND u."User_Name" ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    // Main query
    const rawUsers = await prisma.$queryRawUnsafe(`
      SELECT 
        u."User_ID" as id,
        u."User_Name" as "userName",
        u."User_Role" as "userRole",
        u."Profile_Picture" as "profilePicture",
        u."Created_At" as "createdAt",
        u."Updated_At" as "updatedAt",
        r."Date_Of_Birth" as "resident_dateOfBirth",
        r."Date_Of_Admission" as "resident_dateOfAdmission",
        r."Last_Abscondence" as "resident_lastAbscondence",
        COALESCE(r."Current_Points", 0) as "resident_currentPoints",
        COALESCE(r."Total_Points", 0) as "resident_totalPoints",
        r."Batch_Number" as "resident_batchNumber",
        o."Officer_Email" as "officer_officerEmail"
      FROM "public"."MWH_User" u
      LEFT JOIN "public"."MWH_Resident" r ON u."User_ID" = r."User_ID"
      LEFT JOIN "public"."MWH_Officer" o ON u."User_ID" = o."User_ID"
      ${whereClause}
      ORDER BY u."User_Name" ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, parseInt(limit), parseInt(offset));
    // Count query
    const totalCountResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM "public"."MWH_User" u
      ${whereClause}
    `, ...params);
    // Transform raw query results to match expected format
    const transformedUsers = rawUsers.map(user => ({
      id: user.id,
      userName: user.userName,
      userRole: user.userRole,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      resident: user.resident_currentPoints !== null || user.resident_dateOfBirth !== null ? {
        userId: user.id,
        dateOfBirth: user.resident_dateOfBirth,
        dateOfAdmission: user.resident_dateOfAdmission,
        lastAbscondence: user.resident_lastAbscondence,
        currentPoints: parseInt(user.resident_currentPoints) || 0,
        totalPoints: parseInt(user.resident_totalPoints) || 0,
        batchNumber: user.resident_batchNumber
      } : null,
      officer: user.officer_officerEmail ? {
        userId: user.id,
        officerEmail: user.officer_officerEmail
      } : null
    }));
    // Filter by batch number if specified (post-query filtering)
    let filteredUsers = transformedUsers;
    if (batchNumber) {
      filteredUsers = transformedUsers.filter(user => 
        user.resident && user.resident.batchNumber === parseInt(batchNumber)
      );
    }
    const totalCount = parseInt(totalCountResult[0].count);
    return {
      users: filteredUsers,
      totalCount,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Error in findMany:', error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new Error('User not found');
  }
  // Verify current password
  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }
  // Hash new password
  const salt = await genSalt(12);
  const newPasswordHash = await hash(newPassword, salt);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });
};

/**
 * Soft delete user (mark as inactive)
 */
export const softDelete = async (userId) => {
  // Check if user has transactions
  const transactionCount = await prisma.transaction.count({
    where: { userId }
  });
  if (transactionCount > 0) {
    throw new Error('Cannot delete user with existing transactions');
  }
  return prisma.user.delete({
    where: { id: userId }
  });
};

/**
 * Get user statistics
 */
export const getStatistics = async () => {
  const stats = await prisma.user.groupBy({
    by: ['userRole'],
    _count: {
      id: true
    }
  });
  const totalUsers = await prisma.user.count();
  
  return {
    total: totalUsers,
    byRole: stats.reduce((acc, stat) => {
      acc[stat.userRole] = stat._count.id;
      return acc;
    }, {})
  };
};

/**
 * Sanitize user data for API response
 */
export const sanitize = (user) => {
  if (!user) return null;
  
  const sanitized = { ...user };
  delete sanitized.passwordHash;
  delete sanitized.biometricHash;
  
  // Handle null values in resident data
  if (sanitized.resident) {
    sanitized.resident = {
      ...sanitized.resident,
      currentPoints: sanitized.resident.currentPoints ?? 0,
      totalPoints: sanitized.resident.totalPoints ?? 0
    };
  }
  
  return sanitized;
};
