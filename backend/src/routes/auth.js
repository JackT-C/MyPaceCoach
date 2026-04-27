import express from 'express';
import passport from 'passport';
import User from '../models/User.js';

const router = express.Router();

// Middleware to ensure session.passport exists
const ensureSessionPassport = (req, res, next) => {
  if (req.session && !req.session.passport) {
    req.session.passport = {};
  }
  next();
};

// Initiate Strava OAuth
router.get('/strava', 
  ensureSessionPassport,
  passport.authenticate('strava', { 
    scope: 'read,activity:read'
  })
);

// Strava OAuth callback
router.get('/strava/callback',
  ensureSessionPassport,
  (req, res, next) => {
    passport.authenticate('strava', (err, user, info) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      if (err) {
        console.error('Strava auth error:', err);
        return res.redirect(`${frontendUrl}?error=auth_failed`);
      }
      if (!user) {
        console.error('Strava auth: no user returned', info);
        return res.redirect(`${frontendUrl}?error=no_user`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error after Strava auth:', loginErr);
          return res.redirect(`${frontendUrl}?error=login_failed`);
        }
        return res.redirect(`${frontendUrl}/dashboard`);
      });
    })(req, res, next);
  }
);

// Manual entry route (no Strava required)
router.post('/manual', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Create manual user (no Strava integration)
    const user = await User.create({
      stravaId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: username,
      email: email || null,
      firstName: username,
      premium: false
    });
    
    // Log the user in via session
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log in' });
      }
      res.json({ success: true, user });
    });
  } catch (error) {
    console.error('Manual entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        stravaId: req.user.stravaId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
        profile: req.user.profile,
        email: req.user.email
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
