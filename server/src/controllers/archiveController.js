// controllers/archiveController.js
import { validationResult } from 'express-validator';
import * as archiveModel from '../models/archiveModel.js';

// Archive inactive residents (manual trigger)
export const archiveInactiveResidents = async (req, res) => {
  try {
    const { monthsThreshold = 6 } = req.body;
    
    const result = await archiveModel.archiveInactiveResidents(parseInt(monthsThreshold));
    
    res.json({
      success: true,
      message: `Successfully archived ${result.archived} residents`,
      data: {
        archived: result.archived,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Archive inactive residents error:', error);
    res.status(500).json({
      error: { message: 'Failed to archive inactive residents' }
    });
  }
};

// Get archived residents
export const getArchivedResidents = async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      batchNumber,
      search
    } = req.query;

    const result = await archiveModel.getArchivedResidents({
      limit: parseInt(limit),
      offset: parseInt(offset),
      batchNumber: batchNumber ? parseInt(batchNumber) : undefined,
      search
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get archived residents error:', error);
    res.status(500).json({
      error: { message: 'Failed to get archived residents' }
    });
  }
};

// Unarchive a resident
export const unarchiveResident = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await archiveModel.unarchiveResident(parseInt(userId));
    
    res.json({
      success: true,
      message: 'Resident unarchived successfully'
    });
  } catch (error) {
    console.error('Unarchive resident error:', error);
    res.status(500).json({
      error: { message: 'Failed to unarchive resident' }
    });
  }
};

// Get archive statistics
export const getArchiveStats = async (req, res) => {
  try {
    const stats = await archiveModel.getArchiveStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get archive stats error:', error);
    res.status(500).json({
      error: { message: 'Failed to get archive statistics' }
    });
  }
};

// Update resident activity (internal use)
export const updateResidentActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await archiveModel.updateResidentActivity(parseInt(userId));
    
    res.json({
      success: true,
      message: 'Resident activity updated'
    });
  } catch (error) {
    console.error('Update resident activity error:', error);
    res.status(500).json({
      error: { message: 'Failed to update resident activity' }
    });
  }
};
