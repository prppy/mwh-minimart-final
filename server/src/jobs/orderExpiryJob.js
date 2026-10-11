// jobs/orderExpiryJob.js
import cron from 'node-cron';
import { expireOverdueOrders } from '../models/orderModel.js';

/**
 * Every 5 minutes: expire redemption tickets past their collection time and
 * refund the points. Order lists also run this check on every request, so
 * residents and staff never see a stale "pending" ticket.
 */
export const scheduleOrderExpiryJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await expireOverdueOrders();
      if (expired > 0) {
        console.log(`Order expiry job: ${expired} ticket(s) expired and refunded`);
      }
    } catch (error) {
      console.error('Order expiry job failed:', error);
    }
  }, {
    timezone: 'Asia/Singapore'
  });

  console.log('Order expiry job scheduled: every 5 minutes');
};
