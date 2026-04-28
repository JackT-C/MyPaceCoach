# MyPace - AI-Powered Running Coach

MyPace is a full-stack web app that acts as a personal AI running coach. It connects to Strava to sync training data, then uses AI to analyze performance, detect overtraining risks, predict race times, and generate tailored training plans.

## What it does

- Syncs runs automatically from Strava via OAuth and daily cron jobs
- AI coach analyzes training load, pacing trends, and recovery patterns
- Conversational chatbot provides personalized advice based on your data
- Predicts race times across distances from 800m to marathon
- Generates structured training plans for specific race goals
- Tracks personal bests and goals with progress indicators
- Voice coaching feature detects emotional tone and responds accordingly

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, TanStack Query, Recharts
- **Backend:** Node.js, Express, Sequelize (PostgreSQL), Passport OAuth2
- **AI:** OpenRouter API (Llama 3.3 70B) with automatic retry and model fallback
- **Deployment:** Heroku with GitHub auto-deploy

Built as a personal project combining my interests in running and software engineering.
