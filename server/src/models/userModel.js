// models/User.js
import { prisma } from '../lib/db.js';

class UserModel {
  /**
   * Find user by username with role-specific data
   */
  static async findByUserName(userName) {
    return prisma.user.findUnique({
      where: { userName },
      include: {
        resident: true,
        officer: true
      }
    });
  }

  /**
   * Find user by ID with optional includes
   */
  static async findById(id, options = {}) {
    const { includeResident = false, includeOfficer = false, includeTransactions = false } = options;
    
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

    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      include
    });
  }

  /**
   * Create a new user with role-specific data
   */
  static async create(userData) {
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
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    const user = await this.findById(userId, { includeResident: true, includeOfficer: true });
    
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

      return this.findById(userId, { includeResident: true, includeOfficer: true });
    });
  }

  /**
   * Validate user password
   */
  static async validatePassword(user, password) {
    return compare(password, user.passwordHash);
  }

  /**
   * Get users with filtering
   */
  static async findMany(options = {}) {
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

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include,
        orderBy,
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.user.count({ where })
    ]);

    // Filter by batch number if specified (post-query filtering)
    let filteredUsers = users;
    if (batchNumber) {
      filteredUsers = users.filter(user => 
        user.resident && user.resident.batchNumber === parseInt(batchNumber)
      );
    }

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
  }

  /**
   * Change user password
   */
  static async changePassword(userId, currentPassword, newPassword) {
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
  }

  /**
   * Soft delete user (mark as inactive)
   */
  static async softDelete(userId) {
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
  }

  /**
   * Get user statistics
   */
  static async getStatistics() {
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
  }

  /**
   * Sanitize user data for API response
   */
  static sanitize(user) {
    if (!user) return null;
    
    const sanitized = { ...user };
    delete sanitized.passwordHash;
    delete sanitized.biometricHash;
    
    return sanitized;
  }
}

export default UserModel;