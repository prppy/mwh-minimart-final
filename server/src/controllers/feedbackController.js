// controllers/feedbackController.js (Fixed)
import { validationResult } from 'express-validator';
import * as FeedbackModel from '../models/feedbackModel.js';

// Submit product request
export const submitProductRequest = async (req, res) => {
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
};

// Submit rating/feedback
export const submitRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const userId = req.user.userId;
    const { rating, feedback, category } = req.body;

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
};

// Get product requests (officer/admin only)
export const getProductRequests = async (req, res) => {
  try {
    const { limit, offset, status, userId } = req.query;

    const result = await FeedbackModel.getProductRequests({
      limit,
      offset,
      status,
      userId
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
};

// Update product request status (officer/admin only)
export const updateRequestStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { id } = req.params;
    const { status, comments } = req.body;
    const officerId = req.user.userId;

    const updatedRequest = await FeedbackModel.updateRequestStatus(
      id, 
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
};

// Get feedback statistics (officer/admin only)
export const getFeedbackStatistics = async (req, res) => {
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
};

// Get user's own product requests
export const getUserProductRequests = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const userId = req.user.userId;

    const result = await FeedbackModel.getProductRequests({
      limit,
      offset,
      userId
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
};

// Get feedback categories
export const getFeedbackCategories = async (req, res) => {
  try {
    const categories = [
      'general',
      'food',
      'accommodation',
      'activities',
      'staff',
      'facilities',
      'other'
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
};

// Get product request categories
export const getProductRequestCategories = async (req, res) => {
  try {
    const categories = [
      'Electronics',
      'Snacks',
      'Hygiene',
      'Games',
      'Books',
      'Clothing',
      'Sports',
      'Other'
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
};

// Get recent feedback activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Mock recent activity - in production, query real data
    const recentActivity = [
      {
        id: 1,
        type: 'rating',
        userName: 'john_doe',
        rating: 5,
        feedback: 'Great service!',
        category: 'general',
        submittedAt: new Date()
      },
      {
        id: 2,
        type: 'product_request',
        userName: 'jane_smith',
        productName: 'Gaming Mouse',
        category: 'Electronics',
        status: 'pending',
        submittedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: recentActivity.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};

// Export feedback data (officer/admin only)
export const exportFeedbackData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const [requests, statistics] = await Promise.all([
      FeedbackModel.getProductRequests({
        limit: 1000,
        offset: 0
      }),
      FeedbackModel.getFeedbackStatistics('all')
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: statistics,
      productRequests: requests.requests,
      totalRecords: requests.totalCount
    };

    if (format === 'csv') {
      // In a real implementation, convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback-export.csv');
      res.send('CSV export not implemented in this demo');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback-export.json');
      res.json(exportData);
    }

  } catch (error) {
    console.error('Export feedback data error:', error);
    res.status(500).json({ 
      error: { message: 'Internal server error' }
    });
  }
};
