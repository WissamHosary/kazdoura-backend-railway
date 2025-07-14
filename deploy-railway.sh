#!/bin/bash

# Railway Deployment Script for Kazdoura Backend

echo "🚀 Starting Railway deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Git remote 'origin' not found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    exit 1
fi

# Add all changes
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy to Railway - $(date)"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway.app dashboard"
echo "2. Create new project from GitHub repo"
echo "3. Add MySQL database service"
echo "4. Set environment variables (see RAILWAY_SETUP_GUIDE.md)"
echo "5. Deploy your backend"
echo ""
echo "🔗 Your dashboard is live at: https://admin.kazdoura-lb.com/"
echo "🔗 Railway dashboard: https://railway.app" 