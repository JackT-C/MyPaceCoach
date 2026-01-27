import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['accessToken', 'refreshToken'] }
    });
    
    // Calculate stats from activities
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get total runs
    const totalRuns = await Activity.count({
      where: { userId: req.user.id }
    });
    
    // Get yearly distance and time
    const yearlyActivities = await Activity.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: startOfYear }
      }
    });
    
    const yearlyDistance = yearlyActivities.reduce((sum, activity) => {
      return sum + (activity.distance || 0);
    }, 0) / 1000; // Convert to km
    
    const yearlyTime = yearlyActivities.reduce((sum, activity) => {
      return sum + (activity.movingTime || 0);
    }, 0) / 3600; // Convert to hours
    
    // Return user with calculated stats
    const userProfile = user.toJSON();
    userProfile.totalRuns = totalRuns;
    userProfile.yearlyDistance = yearlyDistance;
    userProfile.yearlyTime = yearlyTime;
    
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly stats (with pagination)
router.get('/weekly-stats', isAuthenticated, async (req, res) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    
    // Calculate the start and end of the target week
    const now = new Date();
    const targetDate = new Date(now.getTime() - weekOffset * 7 * 24 * 60 * 60 * 1000);
    
    // Get Monday of the target week
    const dayOfWeek = targetDate.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get Sunday of the target week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(0, 0, 0, 0);
    
    // Get activities for this week
    const weeklyActivities = await Activity.findAll({
      where: {
        userId: req.user.id,
        date: {
          [Op.gte]: weekStart,
          [Op.lt]: weekEnd
        }
      },
      order: [['date', 'ASC']]
    });
    
    const totalDistance = weeklyActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
    const totalTime = weeklyActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0) / 3600;
    const totalRuns = weeklyActivities.length;
    
    const paces = weeklyActivities
      .filter(a => a.pace && a.pace > 0)
      .map(a => a.pace);
    const averagePace = paces.length > 0 
      ? paces.reduce((sum, p) => sum + p, 0) / paces.length 
      : 0;
    
    res.json({
      totalDistance,
      totalTime,
      totalRuns,
      averagePace,
      weekStart,
      weekEnd
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.put('/preferences', isAuthenticated, async (req, res) => {
  try {
    const { coachingStyle } = req.body;
    
    await req.user.update({ coachingStyle });
    
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['accessToken', 'refreshToken'] }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update race personal bests
router.put('/race-pbs', isAuthenticated, async (req, res) => {
  try {
    const { racePBs } = req.body;
    
    if (!racePBs || typeof racePBs !== 'object') {
      return res.status(400).json({ error: 'Invalid race PBs data' });
    }
    
    await req.user.update({ racePBs });
    
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['accessToken', 'refreshToken'] }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
