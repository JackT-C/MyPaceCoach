import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import RacePB from '../models/RacePB.js';

const router = express.Router();

// Get all PBs for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const pbs = await RacePB.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json(pbs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new PB
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { distance, time, date, raceName, notes } = req.body;
    
    const pb = await RacePB.create({
      userId: req.user.id,
      distance,
      time,
      date,
      raceName,
      notes
    });
    
    res.status(201).json(pb);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update PB
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const pb = await RacePB.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!pb) {
      return res.status(404).json({ error: 'PB not found' });
    }
    
    await pb.update(req.body);
    res.json(pb);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete PB
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const pb = await RacePB.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!pb) {
      return res.status(404).json({ error: 'PB not found' });
    }
    
    await pb.destroy();
    res.json({ message: 'PB deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
