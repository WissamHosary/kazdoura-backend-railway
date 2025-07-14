# Railway Setup Guide for Kazdoura Backend

## 🚀 Step 1: Get Your Railway Database Credentials

### 1.1 Create Railway Account
- Go to [Railway.app](https://railway.app)
- Sign up/Login with your GitHub account

### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Select the `kazdoura-backend-railway` folder

### 1.3 Add MySQL Database
1. In your Railway project dashboard, click "New"
2. Select "Database" → "MySQL"
3. Railway will automatically create a MySQL database

### 1.4 Get Database Credentials
1. Click on your MySQL database service
2. Go to "Connect" tab
3. Copy these credentials:
   - **DB_HOST**: `mysql.railway.app` (or your specific host)
   - **DB_USER**: Your database username
   - **DB_PASSWORD**: Your database password
   - **DB_NAME**: Your database name
   - **DB_PORT**: `3306`

### 1.5 Set Environment Variables
1. Go to your backend service in Railway
2. Click "Variables" tab
3. Add these environment variables:

```env
# Database Configuration
DB_HOST=your-railway-mysql-host
DB_USER=your-railway-mysql-user
DB_PASSWORD=your-railway-mysql-password
DB_NAME=your-railway-mysql-database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d

# Admin Credentials
ADMIN_EMAIL=admin@kazdoura.com
ADMIN_PASSWORD=Awsedrft123

# Server Configuration
PORT=5001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://admin.kazdoura-lb.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./public/uploads

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12
```

## 🔧 Step 2: Update Dashboard API Configuration

### 2.1 Update Dashboard API URL
In your dashboard project, update the API URL to point to Railway:

```javascript
// In dashboard/src/services/api.js
const API_BASE_URL = 'https://your-railway-backend-url.up.railway.app/api';
```

### 2.2 Get Your Railway Backend URL
1. After deploying your backend to Railway
2. Go to your backend service
3. Copy the generated URL (e.g., `https://kazdoura-backend-railway-production.up.railway.app`)

## 🚀 Step 3: Deploy to Railway

### 3.1 Push to GitHub
```bash
cd kazdoura-backend-railway
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### 3.2 Railway Auto-Deploy
- Railway will automatically detect changes and deploy
- Monitor the deployment in Railway dashboard

## 🔍 Step 4: Test Connection

### 4.1 Test Health Endpoint
Visit: `https://your-railway-backend-url.up.railway.app/api/health`

Expected response:
```json
{
  "status": "success",
  "message": "Kazdoura API is running",
  "database": "connected",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### 4.2 Test Admin Login
Use these credentials in your dashboard:
- **Email**: `admin@kazdoura.com`
- **Password**: `Awsedrft123`

## 🛠️ Troubleshooting

### Database Connection Issues
1. Check Railway database credentials
2. Ensure all environment variables are set
3. Check Railway logs for connection errors

### CORS Issues
1. Verify your dashboard domain is in CORS origins
2. Check browser console for CORS errors

### Authentication Issues
1. Verify JWT_SECRET is set
2. Check token expiration settings
3. Ensure admin credentials are correct

## 📞 Support
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

## 🔐 Security Notes
- Change the default admin password in production
- Use a strong JWT_SECRET
- Consider using Railway's secrets management
- Enable SSL/TLS for production 