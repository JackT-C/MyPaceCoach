# MyPace - AI-Powered Running Coach

MyPace is a modern web application that functions as your personal AI running coach. It integrates with Strava to analyze your training, provide personalized insights, and help you reach your running goals.

## Features

### Strava Integration

- Secure OAuth authentication with Strava
- Automatic daily sync of runs, workouts, and race results
- Comprehensive activity data including heart rate, pace, elevation, and training load
- Visual training history with weekly/monthly mileage and intensity distribution

### AI Training Analysis

- Analyze training logs to identify trends, fatigue, and fitness progression
- Detect overtraining patterns, plateaus, and under-recovery
- Generate actionable insights for pacing, recovery, and workload adjustments
- Race-specific time predictions (800m, 5K, 10K, half marathon, marathon)

### AI Coach Chatbot

- Conversational AI coach powered by Groq (Llama 3.3 70B)
- Personalized advice based on your historical training data
- Answers questions about training, recovery, and race strategy
- Supportive, motivating, and practical coaching tone

### Manual Training Logging

- Log runs, workouts, races, cross-training, and rest days manually
- Track distance, pace, effort level, terrain, and notes
- Full integration with AI analysis and coaching insights

### Goals & Training Plans

- Set time-based, distance-based, or race-based goals
- AI-generated personalized training plans
- Adaptive plans that evolve based on performance and recovery
- Progress tracking with visual indicators

### Modern UI/UX

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

## Acknowledgments

- Strava API for activity data
- Groq for AI capabilities
- The running community for inspiration

---

Built with ❤️ for runners by a runner
