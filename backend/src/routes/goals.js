import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import Goal from '../models/Goal.js';
import { generateTrainingPlan } from '../services/aiCoach.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all goals for authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get goal by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new goal
router.post('/', isAuthenticated, [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['race', 'distance', 'time', 'consistency', 'custom'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const goalData = {
      ...req.body,
      userId: req.user.id
    };
    
    // Convert empty string dates to null
    if (goalData.raceDate === '' || !goalData.raceDate) {
      goalData.raceDate = null;
    }
    
    console.log('Creating goal with data:', goalData);
    const goal = await Goal.create(goalData);
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update goal
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await goal.update(req.body);
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await goal.destroy();
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI training plan for goal
router.post('/:id/plan', isAuthenticated, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const plan = await generateTrainingPlan(req.user.id, req.params.id);
    
    // Save plan to goal
    await goal.update({ trainingPlan: plan });
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
