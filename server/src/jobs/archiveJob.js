// jobs/archiveJob.js
import cron from 'node-cron';
import * as archiveModel from '../models/archiveModel.js';

/**
 * Schedule automatic archiving of inactive residents
 */
export const scheduleArchiveJob = () => {
  cron.schedule('0 3 * * * *', async () => {
    console.log('Starting scheduled archive job...');
    
    try {
      const result = await archiveModel.archiveInactiveResidents(6);
      
      console.log(`Archive job completed: ${result.archived} residents archived`);
      
      if (result.errors.length > 0) {
        console.error('Archive job errors:', result.errors);
      }
    } catch (error) {
      console.error('Archive job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Singapore" // Adjust timezone as needed
  });

  console.log('Archive job scheduled: Monthly on 1st at 2:00 AM');
};

/**
 * Run archive job immediately (for testing)
 */
export const runArchiveJobNow = async () => {
  console.log('Running archive job immediately...');
  
  try {
    const result = await archiveModel.archiveInactiveResidents(6);
    
    console.log(`Archive job completed: ${result.archived} residents archived`);
    
    if (result.errors.length > 0) {
      console.error('Archive job errors:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('Archive job failed:', error);
    throw error;
  }
};

/**
 * Schedule more frequent archiving (for testing)
 * Runs every day at 3 AM
 */
export const scheduleDailyArchiveJob = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('Starting daily archive job...');
    
    try {
      const result = await archiveModel.archiveInactiveResidents(6);
      
      console.log(`Daily archive job completed: ${result.archived} residents archived`);
      
      if (result.errors.length > 0) {
        console.error('Daily archive job errors:', result.errors);
      }
    } catch (error) {
      console.error('Daily archive job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Singapore"
  });

  console.log('Daily archive job scheduled: Every day at 3:00 AM');
};
