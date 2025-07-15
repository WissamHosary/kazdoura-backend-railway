const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fileUpload = require('express-fileupload');

// Load environment variables
require('dotenv').config({ path: './config.env' });
console.log('🌍 Loading MySQL configuration...');

// Import unified configuration
const { config, helpers } = require('./config.js');

// Import database utilities
const { testConnection, initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth-mysql');
const productRoutes = require('./routes/products-mysql');
const orderRoutes = require('./routes/orders-mysql');
const cartRoutes = require('./routes/cart-mysql');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting using unified config
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Enhanced CORS configuration using unified config
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

// Global CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
  res.header('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Serve static files with enhanced CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, 'public/uploads')));

app.use('/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, 'public/images')));

// Body parser middleware with increased limits
app.use(express.json({ 
  limit: '100mb', // Increased for large image uploads
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb' // Increased for large image uploads
}));

// File upload middleware with express-fileupload
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB limit
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached',
  createParentPath: true,
  useTempFiles: false,
  tempFileDir: '/tmp/',
  debug: false, // Disable debug messages to reduce console noise
  parseNested: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Add timeout for large uploads
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout for large uploads
  res.setTimeout(300000);
  next();
});

// Add middleware to handle large payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON data or payload too large'
    });
  }
  next();
});

// Initialize database connection and tables
const initializeApp = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to MySQL database');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database initialization completed');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Initialize the application
initializeApp();

// Static files are now served with CORS headers above

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// Debug middleware to log important requests only
app.use((req, res, next) => {
  // Only log POST, PUT, DELETE requests and file uploads
  if (req.method !== 'GET' || req.url.includes('/upload') || req.url.includes('/products')) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Enhanced health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    const dbStatus = isConnected ? 'connected' : 'disconnected';
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Kazdoura API is running',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error occurred'
    });
  }
  
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found' 
  });
});

const PORT = config.server.port;

app.listen(PORT, config.server.host, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.environment}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`📋 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`🖼️ Images: http://localhost:${PORT}/uploads`);
});