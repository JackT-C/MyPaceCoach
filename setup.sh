#!/bin/bash

echo "🏃 MyPace Setup Script"
echo "====================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not detected. Please install MongoDB or use MongoDB Atlas."
    echo "   Visit: https://www.mongodb.com/try/download/community"
else
    echo "✅ MongoDB detected"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start MyPace:"
echo "   npm run dev"
echo ""
echo "📖 Read QUICKSTART.md for detailed instructions"
echo ""
echo "Important reminders:"
echo "1. Make sure MongoDB is running"
echo "2. Check that your .env file has the correct credentials"
echo "3. Open http://localhost:8081 in your browser"
echo ""
echo "Happy running! 🏃‍♂️💨"
