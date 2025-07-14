const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's the hardcoded admin user
    if (decoded.email === 'wissamhosary@gmail.com') {
      req.user = {
        id: 'admin-001',
        email: 'wissamhosary@gmail.com',
        role: 'admin'
      };
      return next();
    }

    // For database users - use direct MySQL query
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 