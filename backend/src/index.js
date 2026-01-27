import express from 'express';
import cors from 'cors';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import passport from './config/passport.js';
import cron from 'node-cron';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models to register them
import './models/User.js';
import './models/Activity.js';
import './models/Goal.js';
import './models/RacePB.js';

// Import routes
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import coachRoutes from './routes/coach.js';
import userRoutes from './routes/user.js';
import goalRoutes from './routes/goals.js';
import racePBRoutes from './routes/racePBs.js';

// Import services
import { syncAllUsersActivities } from './services/stravaSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create session store
const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000 // Sessions last 24 hours
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration - must be before passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'mypace-secret-key-2026',
  store: sessionStore,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to ensure session.passport exists (fixes passport-oauth bug)
app.use((req, res, next) => {
  if (req.session && !req.session.passport) {
    req.session.passport = {};
  }
  
  // Override logIn to ensure passport object exists
  const originalLogIn = req.logIn;
  req.logIn = req.login = function(user, options, done) {
    if (!req.session.passport) {
      req.session.passport = {};
    }
    return originalLogIn.call(this, user, options, done);
  };
  
  next();
});

// PostgreSQL connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
    // Sync session store table
    return sessionStore.sync();
  })
  .then(() => {
    console.log('✅ Session store synchronized');
    return sequelize.sync({ alter: true }); // Auto-sync tables (use migrations in production)
  })
  .then(() => {
    console.log('✅ Database tables synchronized');
  })
  .catch(err => console.error('❌ Database connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/user', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/race-pbs', racePBRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MyPace API is running' });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Schedule daily Strava sync at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('🔄 Running daily Strava sync...');
  await syncAllUsersActivities();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MyPace backend running on http://localhost:${PORT}`);
});
