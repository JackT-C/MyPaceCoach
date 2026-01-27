@echo off
echo 🏃 MyPace Setup Script
echo =====================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detected

REM Check MongoDB
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  MongoDB not detected. Please install MongoDB or use MongoDB Atlas.
    echo    Visit: https://www.mongodb.com/try/download/community
) else (
    echo ✅ MongoDB detected
)

echo.
echo 📦 Installing dependencies...
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start MyPace:
echo    npm run dev
echo.
echo 📖 Read QUICKSTART.md for detailed instructions
echo.
echo Important reminders:
echo 1. Make sure MongoDB is running
echo 2. Check that your .env file has the correct credentials
echo 3. Open http://localhost:8081 in your browser
echo.
echo Happy running! 🏃‍♂️💨

pause
