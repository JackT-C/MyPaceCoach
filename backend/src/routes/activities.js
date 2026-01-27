import express from 'express';
import { Op } from 'sequelize';
import { isAuthenticated } from '../middleware/auth.js';
import { syncUserActivities, getAthleteStats, updateExistingActivityTypes } from '../services/stravaSync.js';
import Activity from '../models/Activity.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all activities for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, type, limit = 50 } = req.query;
    
    const where = { userId: req.user.id };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.$gte = new Date(startDate);
      if (endDate) where.date.$lte = new Date(endDate);
    }
    
    if (type) where.type = type;
    
    const activities = await Activity.findAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually log a new activity
router.post('/', isAuthenticated, [
  body('name').notEmpty().withMessage('Activity name is required'),
  body('type').isIn(['Run', 'Workout', 'Race', 'CrossTraining', 'Rest']),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('distance').optional().isNumeric(),
  body('movingTime').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const activityData = {
      ...req.body,
      userId: req.user.id,
      source: 'manual'
    };
    
    const activity = await Activity.create(activityData);
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an activity
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    await activity.update(req.body);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an activity
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    await activity.destroy();
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync activities from Strava
router.post('/sync', isAuthenticated, async (req, res) => {
  try {
    const result = await syncUserActivities(req.user.id);
    res.json({
      message: 'Sync completed',
      ...result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rescan all activities for best efforts and update PBs
router.post('/rescan-pbs', isAuthenticated, async (req, res) => {
  try {
    const { rescanActivitiesForPBs } = await import('../services/stravaSync.js');
    const result = await rescanActivitiesForPBs(req.user.id);
    res.json({
      message: 'PB rescan completed',
      ...result
    });
  } catch (error) {
    console.error('PB rescan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update activity types for existing activities
router.post('/update-types', isAuthenticated, async (req, res) => {
  try {
    const result = await updateExistingActivityTypes(req.user.id);
    res.json({
      message: 'Activity types updated',
      ...result
    });
  } catch (error) {
    console.error('Update types error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity statistics
router.get('/stats/summary', isAuthenticated, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const activities = await Activity.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: startDate }
      }
    });
    
    const stats = {
      totalRuns: activities.length,
      totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000, // km
      totalTime: activities.reduce((sum, a) => sum + (a.movingTime || 0), 0) / 3600, // hours
      averagePace: 0,
      totalElevation: activities.reduce((sum, a) => sum + (a.totalElevationGain || 0), 0)
    };
    
    if (stats.totalDistance > 0 && stats.totalTime > 0) {
      stats.averagePace = (stats.totalTime * 60) / stats.totalDistance; // min/km
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
