// models/Feedback.js
class FeedbackModel {
  /**
   * Submit product request
   */
  static async submitProductRequest(userId, requestData) {
    const { productName, description, category, urgency = 'medium' } = requestData;

    // For now, we'll store this in a simple way
    // In a full implementation, you'd create a ProductRequest table
    const request = {
      id: Date.now(), // Temporary ID generation
      userId: parseInt(userId),
      productName,
      description,
      category,
      urgency,
      status: 'pending',
      submittedAt: new Date(),
      updatedAt: new Date()
    };

    // Log the request (in production, save to database)
    console.log('Product Request Submitted:', request);

    return request;
  }

  /**
   * Submit rating/feedback
   */
  static async submitRating(userId, ratingData) {
    const { rating, feedback, category = 'general' } = ratingData;

    const ratingRecord = {
      id: Date.now(),
      userId: parseInt(userId),
      rating: parseInt(rating),
      feedback,
      category,
      submittedAt: new Date()
    };

    // Log the rating (in production, save to database)
    console.log('Rating Submitted:', ratingRecord);

    return ratingRecord;
  }

  /**
   * Get product requests (for officers/admins)
   */
  static async getProductRequests(options = {}) {
    const { limit = 50, offset = 0, status, userId } = options;

    // This would be a real database query in production
    // For now, return mock data
    const mockRequests = [
      {
        id: 1,
        userId: 3,
        userName: 'john_doe',
        productName: 'Gaming Mouse',
        description: 'High-performance gaming mouse for gaming station',
        category: 'Electronics',
        urgency: 'high',
        status: 'pending',
        submittedAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 2,
        userId: 4,
        userName: 'jane_smith',
        productName: 'Protein Bars',
        description: 'Healthy snack option for residents',
        category: 'Snacks',
        urgency: 'medium',
        status: 'approved',
        submittedAt: new Date('2024-11-28'),
        updatedAt: new Date('2024-12-02')
      }
    ];

    let filteredRequests = mockRequests;
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    if (userId) {
      filteredRequests = filteredRequests.filter(req => req.userId === parseInt(userId));
    }

    return {
      requests: filteredRequests.slice(offset, offset + limit),
      totalCount: filteredRequests.length,
      pagination: {
        total: filteredRequests.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(filteredRequests.length / parseInt(limit))
      }
    };
  }

  /**
   * Update product request status
   */
  static async updateRequestStatus(requestId, status, officerId, comments) {
    // This would update the database in production
    console.log('Request Status Updated:', {
      requestId: parseInt(requestId),
      status,
      officerId: parseInt(officerId),
      comments,
      updatedAt: new Date()
    });

    return {
      id: parseInt(requestId),
      status,
      updatedBy: officerId,
      comments,
      updatedAt: new Date()
    };
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStatistics(period = 'month') {
    // Mock statistics - in production, query real data
    return {
      period,
      productRequests: {
        total: 25,
        pending: 8,
        approved: 12,
        rejected: 5
      },
      ratings: {
        total: 45,
        averageRating: 4.2,
        distribution: {
          5: 20,
          4: 15,
          3: 7,
          2: 2,
          1: 1
        }
      },
      categories: {
        'Electronics': 8,
        'Snacks': 6,
        'Hygiene': 4,
        'Games': 3,
        'Other': 4
      }
    };
  }
}