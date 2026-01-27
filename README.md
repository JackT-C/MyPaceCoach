# MyPace - AI-Powered Running Coach

MyPace is a modern web application that functions as your personal AI running coach. It integrates with Strava to analyze your training, provide personalized insights, and help you reach your running goals.

## Features

### 🏃 Strava Integration

- Secure OAuth authentication with Strava
- Automatic daily sync of runs, workouts, and race results
- Comprehensive activity data including heart rate, pace, elevation, and training load
- Visual training history with weekly/monthly mileage and intensity distribution

### 🤖 AI Training Analysis

- Analyze training logs to identify trends, fatigue, and fitness progression
- Detect overtraining patterns, plateaus, and under-recovery
- Generate actionable insights for pacing, recovery, and workload adjustments
- Race-specific time predictions (800m, 5K, 10K, half marathon, marathon)

### 💬 AI Coach Chatbot

- Conversational AI coach powered by Groq (Llama 3.3 70B)
- Personalized advice based on your historical training data
- Answers questions about training, recovery, and race strategy
- Supportive, motivating, and practical coaching tone

### 📝 Manual Training Logging

- Log runs, workouts, races, cross-training, and rest days manually
- Track distance, pace, effort level, terrain, and notes
- Full integration with AI analysis and coaching insights

### 🎯 Goals & Training Plans

- Set time-based, distance-based, or race-based goals
- AI-generated personalized training plans
- Adaptive plans that evolve based on performance and recovery
- Progress tracking with visual indicators

### 🎨 Modern UI/UX

- Clean, minimalist design with neutral colors and subtle accents
- Smooth transitions and micro-animations
- Interactive data visualizations (charts, progress rings, trend lines)
- Mobile-first responsive design
- Dashboard-first experience with quick access to key features

## Tech Stack

### Backend

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** for data persistence
- **Passport.js** for Strava OAuth authentication
- **Groq SDK** for AI coaching features
- **Axios** for external API calls
- **node-cron** for scheduled data syncing

### Frontend

- **React 18** with **React Router**
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Recharts** for data visualizations
- **TanStack Query** (React Query) for data fetching
- **Lucide React** for icons
- **date-fns** for date formatting

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Strava API credentials
- Groq API key

## Installation

### 1. Clone the repository

```bash
cd mypace
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure environment variables

The backend `.env` file is already configured with your credentials:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mypace

STRAVA_CLIENT_ID=189044
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_CALLBACK_URL=http://localhost:3000/api/auth/strava/callback

FRONTEND_URL=http://localhost:8081

GROQ_API_KEY=your_groq_api_key_here

SESSION_SECRET=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-change-in-production
```

**⚠️ Important:** Update `SESSION_SECRET` and `JWT_SECRET` with secure random strings before deploying to production.

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use MongoDB Atlas (cloud) by updating MONGODB_URI
```

### 5. Run the application

From the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the application

- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:3000

## Usage

### First Time Setup

1. Open http://localhost:8081 in your browser
2. Click "Connect with Strava"
3. Authorize the application with your Strava account
4. You'll be redirected to the dashboard

### Using MyPace

#### Dashboard

- View your weekly training summary
- See recent activities and key metrics
- Get AI coaching insights
- Sync your latest activities from Strava

#### Activities

- Browse all your activities with filters
- Manually log new activities
- View detailed activity information
- Delete activities as needed

#### AI Coach

- Chat with your AI coach for personalized advice
- Ask questions about training, recovery, and goals
- Get race time predictions
- Receive insights based on your training data

#### Goals

- Create new training goals
- Generate AI-powered training plans
- Track progress toward your goals
- Mark goals as completed

#### Profile

- View your account information
- See your overall statistics
- Check when you last synced with Strava

## API Endpoints

### Authentication

- `GET /api/auth/strava` - Initiate Strava OAuth
- `GET /api/auth/strava/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Activities

- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create manual activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `POST /api/activities/sync` - Sync from Strava
- `GET /api/activities/stats/summary` - Get statistics

### AI Coach

- `GET /api/coach/insights` - Get training insights
- `POST /api/coach/chat` - Chat with AI coach
- `GET /api/coach/predictions` - Get race predictions
- `GET /api/coach/analysis` - Get training analysis

### Goals

- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get goal by ID
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/plan` - Generate training plan

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/preferences` - Update preferences

## Scheduled Jobs

The application runs a daily cron job at 6 AM to automatically sync all users' activities from Strava.

## Project Structure

```
mypace/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── passport.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Activity.js
│   │   │   └── Goal.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── activities.js
│   │   │   ├── coach.js
│   │   │   ├── goals.js
│   │   │   └── user.js
│   │   ├── services/
│   │   │   ├── stravaSync.js
│   │   │   └── aiCoach.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Activities.jsx
│   │   │   ├── Coach.jsx
│   │   │   ├── Goals.jsx
│   │   │   └── Profile.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── package.json
```

## Development

### Adding New Features

1. **Backend:** Add routes in `backend/src/routes/`, models in `backend/src/models/`, and services in `backend/src/services/`
2. **Frontend:** Add pages in `frontend/src/pages/` and components in `frontend/src/components/`
3. **API calls:** Add new API methods in `frontend/src/api/index.js`

### Environment Variables

Never commit sensitive credentials. Use environment variables for all secrets.

## Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Update `SESSION_SECRET` and `JWT_SECRET`
3. Use a production MongoDB instance (MongoDB Atlas recommended)
4. Update `FRONTEND_URL` to your production frontend URL
5. Update `STRAVA_CALLBACK_URL` to your production callback URL

### Frontend Deployment

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to a static hosting service (Vercel, Netlify, etc.)
3. Update backend CORS settings to allow your production domain

## Security Notes

- All Strava tokens are securely stored and automatically refreshed
- Sessions are encrypted with secure secrets
- API endpoints are protected with authentication middleware
- CORS is configured to only allow requests from the frontend URL

## Future Enhancements

- Integration with Garmin, Apple Health, and Polar
- Weather data integration
- Social features (follow friends, share achievements)
- Advanced analytics and performance trends
- Mobile app (React Native)
- Workout builder with custom intervals
- Race calendar and event discovery

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on the GitHub repository.

## Acknowledgments

- Strava API for activity data
- Groq for AI capabilities
- The running community for inspiration

---

Built with ❤️ for runners by runners
