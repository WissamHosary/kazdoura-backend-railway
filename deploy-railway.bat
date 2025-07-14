@echo off
echo 🚀 Starting Railway deployment...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Add all changes
echo 📦 Adding files to git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Deploy to Railway - %date% %time%"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push origin main

echo ✅ Deployment initiated!
echo.
echo 📋 Next steps:
echo 1. Go to Railway.app dashboard
echo 2. Create new project from GitHub repo
echo 3. Add MySQL database service
echo 4. Set environment variables (see RAILWAY_SETUP_GUIDE.md)
echo 5. Deploy your backend
echo.
echo 🔗 Your dashboard is live at: https://admin.kazdoura-lb.com/
echo 🔗 Railway dashboard: https://railway.app
pause 