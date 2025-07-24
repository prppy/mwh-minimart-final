// controllers/userController.js (Fixed)
import { validationResult } from 'express-validator';
import UserModel from '../models/userModel.js';

class UserController {
  // Get all users with filtering
  static async getAllUsers(req, res) {
    try {
      const {
        role,
        batchNumber,
        limit,
        offset,
        search,
        sortBy,
        sortOrder
      } = req.query;

      const result = await UserModel.findMany({
        role,
        batchNumber,
        limit,
        offset,
        search,
        sortBy,
        sortOrder
      });

      // Sanitize user data
      const sanitizedUsers = result.users.map(user => UserModel.sanitize(user));

      res.json({
        success: true,
        data: {
          users: sanitizedUsers,
          pagination: result.pagination
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const { includeTransactions = false } = req.query;

      const user = await UserModel.findById(parseInt(id), {
        includeResident: true,
        includeOfficer: true,
        includeTransactions: includeTransactions === 'true'
      });

      if (!user) {
        return res.status(404).json({ 
          error: { message: 'User not found' }
        });
      }

      const sanitizedUser = UserModel.sanitize(user);

      res.json({
        success: true,
        data: sanitizedUser
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update user profile
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { id } = req.params;
      const updates = req.body;

      const updatedUser = await UserModel.updateProfile(parseInt(id), updates);

      const sanitizedUser = UserModel.sanitize(updatedUser);

      res.json({
        success: true,
        data: sanitizedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      await UserModel.softDelete(parseInt(id));

      res.json({
        success: true,
        data: { message: 'User deleted successfully' }
      });

    } catch (error) {
      console.error('Delete user error:', error);
      if (error.message.includes('Cannot delete user with existing transactions')) {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Change user password
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Check if user can change this password
      const requestedUserId = parseInt(id);
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
        return res.status(403).json({ 
          error: { message: 'Access denied' }
        });
      }

      await UserModel.changePassword(requestedUserId, currentPassword, newPassword);

      res.json({
        success: true,
        data: { message: 'Password changed successfully' }
      });

    } catch (error) {
      console.error('Change password error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get user statistics
  static async getUserStatistics(req, res) {
    try {
      const statistics = await UserModel.getStatistics();

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Get user statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get current user profile
  static async getCurrentUser(req, res) {
    try {
      const userId = req.user.userId;

      const user = await UserModel.findById(userId, {
        includeResident: true,
        includeOfficer: true
      });

      if (!user) {
        return res.status(404).json({ 
          error: { message: 'User not found' }
        });
      }

      const sanitizedUser = UserModel.sanitize(user);

      res.json({
        success: true,
        data: sanitizedUser
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update current user profile
  static async updateCurrentUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const userId = req.user.userId;
      const updates = req.body;

      // Remove sensitive fields that users shouldn't be able to update themselves
      delete updates.userRole;
      delete updates.passwordHash;
      delete updates.biometricHash;

      const updatedUser = await UserModel.updateProfile(userId, updates);

      const sanitizedUser = UserModel.sanitize(updatedUser);

      res.json({
        success: true,
        data: sanitizedUser
      });

    } catch (error) {
      console.error('Update current user error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: { message: error.message }
        });
      }
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No file uploaded' }
        });
      }

      // Update user with profile picture
      const updatedUser = await UserModel.updateProfile(userId, {
        profilePicture: req.file.buffer
      });

      const sanitizedUser = UserModel.sanitize(updatedUser);

      res.json({
        success: true,
        data: sanitizedUser
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Search users
  static async searchUsers(req, res) {
    try {
      const { q: search, role, limit = 20 } = req.query;

      if (!search) {
        return res.status(400).json({ 
          error: { message: 'Search query is required' }
        });
      }

      const result = await UserModel.findMany({
        search,
        role,
        limit,
        offset: 0
      });

      const sanitizedUsers = result.users.map(user => UserModel.sanitize(user));

      res.json({
        success: true,
        data: sanitizedUsers
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

export default UserController;