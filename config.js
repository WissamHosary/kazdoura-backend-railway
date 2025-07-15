// Unified configuration for Kazdoura E-commerce
const config = {
  server: {
    port: process.env.PORT || 5001,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kazdoura_db',
    port: process.env.DB_PORT || 3306
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // Increased to 1000 requests per 15 minutes for handling 100+ products
    }
  },
  
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      'https://kazdoura-lb.com',
      'https://www.kazdoura-lb.com',
      'https://admin.kazdoura-lb.com',
      'https://kazdoura-backend-railway-production.up.railway.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ]
  },
  
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadPath: './public/uploads/'
  },
  
  whatsapp: {
    number: process.env.WHATSAPP_NUMBER || '+96178817112'
  }
};

const helpers = {
  // Helper function to format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  // Helper function to validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Helper function to generate random string
  generateRandomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Helper function to sanitize input
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }
};

module.exports = { config, helpers }; 