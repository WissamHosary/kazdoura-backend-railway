const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Check for admin user from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kazdoura.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Awsedrft123';
    
    if (email === adminEmail && password === adminPassword) {
      // Create JWT token
      const expiresIn = process.env.JWT_EXPIRE && typeof process.env.JWT_EXPIRE === 'string' ? process.env.JWT_EXPIRE : '30d';
      const token = jwt.sign(
        { 
          id: 1, 
          email: adminEmail, 
          name: 'Admin User',
          role: 'admin' 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn }
      );

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: {
            id: 1,
            email: adminEmail,
            name: 'Admin User',
            role: 'admin'
          }
        }
      });
    } else {
      // Check database for other users
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      // Create JWT token
      const expiresIn = process.env.JWT_EXPIRE && typeof process.env.JWT_EXPIRE === 'string' ? process.env.JWT_EXPIRE : '30d';
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn }
      );

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.status(200).json({
      status: 'success',
      data: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
});

// @desc    Register user (for future use)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        id: result.insertId,
        name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

module.exports = router; 