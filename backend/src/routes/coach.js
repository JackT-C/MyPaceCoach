import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { 
  generateCoachingInsights, 
  chatWithCoach, 
  predictRaceTimes,
  analyzeTraining,
  voiceCoaching
} from '../services/aiCoach.js';

const router = express.Router();

// Get AI coaching insights
router.get('/insights', isAuthenticated, async (req, res) => {
  try {
    const insights = await generateCoachingInsights(req.user.id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with AI coach
router.post('/chat', isAuthenticated, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await chatWithCoach(req.user.id, message, history);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get race time predictions
router.get('/predictions', isAuthenticated, async (req, res) => {
  try {
    const predictions = await predictRaceTimes(req.user.id);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get training analysis
router.get('/analysis', isAuthenticated, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analysis = await analyzeTraining(req.user.id, parseInt(days));
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Voice coaching - emotionally intelligent AI response
router.post('/voice', isAuthenticated, async (req, res) => {
  try {
    const { transcript, activityData, activityId } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    const response = await voiceCoaching(req.user.id, transcript, activityData, activityId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
