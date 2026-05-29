import { prisma } from "../lib/db.js";

/**
 * Get aggregated metrics for the Admin Dashboard
 */
export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const [
      stocksAvailable,
      feedbacksReceived,
      feedbacksResolved,
      popularProducts,
      residents
    ] = await Promise.all([
      // 1) Number of stocks available (products currently available)
      prisma.product.count({
        where: { available: true }
      }),
      
      // 2) Feedback - received count
      prisma.mWH_Rating_Feedback.count(),
      
      // 2) Feedback - resolved (reviewed) count
      prisma.mWH_Rating_Feedback.count({
        where: { Feedback_Status: 'reviewed' }
      }),
      
      // 3) High demand items (top 5 by redemption count)
      prisma.product.findMany({
        where: { available: true },
        include: {
          _count: {
            select: { redemptions: true }
          }
        },
        orderBy: {
          redemptions: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // 4) Number of vouchers and points issued to each resident
      prisma.resident.findMany({
        include: {
          user: {
            select: {
              userName: true,
              transactions: {
                where: {
                  transactionType: 'completion'
                },
                select: {
                  id: true
                }
              }
            }
          }
        }
      })
    ]);

    // Format high demand items
    const highDemandItems = popularProducts.map(p => ({
      id: p.id,
      productName: p.productName,
      points: p.points,
      redemptionCount: p._count?.redemptions || 0
    }));

    // Format resident metrics
    const residentMetrics = residents.map(r => ({
      userId: r.userId,
      userName: r.user.userName,
      vouchersCount: r.user.transactions.length,
      totalPoints: r.totalPoints,
      currentPoints: r.currentPoints
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      success: true,
      data: {
        stocksAvailable,
        feedbacks: {
          received: feedbacksReceived,
          resolved: feedbacksResolved
        },
        highDemandItems,
        residentMetrics
      }
    });

  } catch (error) {
    console.error('Get admin dashboard metrics error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
};
