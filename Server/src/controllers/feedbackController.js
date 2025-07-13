// controllers/feedbackController.js (Fixed)
import { validationResult } from 'express-validator';
import FeedbackModel from '../models/feedbackModel.js';

class FeedbackController {
  // Submit product request
  static async submitProductRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const userId = req.user.userId;
      const { productName, description, category, urgency } = req.body;

      const request = await FeedbackModel.submitProductRequest(userId, {
        productName,
        description,
        category,
        urgency
      });

      res.status(201).json({
        success: true,
        data: request
      });

    } catch (error) {
      console.error('Submit product request error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Submit rating/feedback
  static async submitRating(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const userId = req.user.userId;
      const { rating, feedback, category } = req.body;

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: { message: 'Rating must be between 1 and 5' }
        });
      }

      const ratingRecord = await FeedbackModel.submitRating(userId, {
        rating,
        feedback,
        category
      });

      res.status(201).json({
        success: true,
        data: ratingRecord
      });

    } catch (error) {
      console.error('Submit rating error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get product requests (officer/admin only)
  static async getProductRequests(req, res) {
    try {
      const {
        limit = 50,
        offset = 0,
        status,
        userId
      } = req.query;

      const result = await FeedbackModel.getProductRequests({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        userId: userId ? parseInt(userId) : undefined
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get product requests error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Update product request status (officer/admin only)
  static async updateRequestStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { requestId } = req.params;
      const { status, comments } = req.body;
      const officerId = req.user.userId;

      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: { message: 'Invalid status value' }
        });
      }

      const updatedRequest = await FeedbackModel.updateRequestStatus(
        requestId,
        status,
        officerId,
        comments
      );

      res.json({
        success: true,
        data: updatedRequest
      });

    } catch (error) {
      console.error('Update request status error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get feedback statistics (officer/admin only)
  static async getFeedbackStatistics(req, res) {
    try {
      const { period = 'month' } = req.query;

      const statistics = await FeedbackModel.getFeedbackStatistics(period);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Get feedback statistics error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get user's own product requests
  static async getUserProductRequests(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check access permissions
      const requestedUserId = parseInt(userId);
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      if (requestedUserId !== currentUserId && !['officer', 'admin'].includes(userRole)) {
        return res.status(403).json({ 
          error: { message: 'Access denied' }
        });
      }

      const result = await FeedbackModel.getProductRequests({
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId: requestedUserId
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get user product requests error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get feedback categories
  static async getFeedbackCategories(req, res) {
    try {
      // Standard feedback categories
      const categories = [
        { id: 'general', name: 'General Feedback' },
        { id: 'product', name: 'Product Feedback' },
        { id: 'service', name: 'Service Quality' },
        { id: 'facility', name: 'Facility Feedback' },
        { id: 'suggestion', name: 'Suggestions' },
        { id: 'complaint', name: 'Complaints' }
      ];

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get feedback categories error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get product request categories
  static async getProductRequestCategories(req, res) {
    try {
      // Standard product request categories
      const categories = [
        { id: 'hygiene', name: 'Hygiene Products' },
        { id: 'snacks', name: 'Snacks & Food' },
        { id: 'drinks', name: 'Beverages' },
        { id: 'electronics', name: 'Electronics' },
        { id: 'games', name: 'Games & Entertainment' },
        { id: 'books', name: 'Books & Educational' },
        { id: 'clothing', name: 'Clothing & Accessories' },
        { id: 'other', name: 'Other' }
      ];

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get product request categories error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Get recent feedback activity (officer/admin only)
  static async getRecentActivity(req, res) {
    try {
      const { limit = 20, type } = req.query;

      // Mock recent activity data
      // In a real implementation, this would query actual feedback tables
      const recentActivity = [
        {
          id: 1,
          type: 'product_request',
          userId: 3,
          userName: 'john_doe',
          title: 'Gaming Mouse Request',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'pending'
        },
        {
          id: 2,
          type: 'rating',
          userId: 4,
          userName: 'jane_smith',
          title: 'Service Rating: 5 stars',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          category: 'service'
        },
        {
          id: 3,
          type: 'product_request',
          userId: 5,
          userName: 'bob_wilson',
          title: 'Protein Bars Request',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          status: 'approved'
        }
      ];

      // Filter by type if specified
      let filteredActivity = recentActivity;
      if (type && ['product_request', 'rating'].includes(type)) {
        filteredActivity = recentActivity.filter(item => item.type === type);
      }

      // Apply limit
      const limitedActivity = filteredActivity.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: limitedActivity
      });

    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }

  // Export feedback data (officer/admin only)
  static async exportFeedbackData(req, res) {
    try {
      const { startDate, endDate, format = 'json' } = req.query;

      // Get all feedback data for the specified period
      const [productRequests, statistics] = await Promise.all([
        FeedbackModel.getProductRequests({
          limit: 1000, // Large limit for export
          offset: 0
        }),
        FeedbackModel.getFeedbackStatistics('all')
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        period: { startDate, endDate },
        summary: statistics,
        productRequests: productRequests.requests,
        totalRecords: productRequests.totalCount
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = convertToCSV(productRequests.requests);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="feedback_export.csv"');
        res.send(csv);
      } else {
        // Return JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="feedback_export.json"');
        res.json({
          success: true,
          data: exportData
        });
      }

    } catch (error) {
      console.error('Export feedback data error:', error);
      res.status(500).json({ 
        error: { message: 'Internal server error' }
      });
    }
  }
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Escape commas and quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

export default FeedbackController;