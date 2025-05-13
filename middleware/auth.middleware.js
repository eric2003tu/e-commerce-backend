const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config');

// Hardcoded admin credentials (DEV ONLY)
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  id: '000000000000000000000001', // Fake MongoDB-like ID
  role: 'admin'
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check against hardcoded admin credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const token = jwt.sign(
        {
          id: ADMIN_CREDENTIALS.id,
          role: ADMIN_CREDENTIALS.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Set both cookie and return token in response
      res.cookie('token', token, {
        expires: new Date(Date.now() + config.jwt.cookieExpires * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return res.status(200).json({
        success: true,
        token,
        role: ADMIN_CREDENTIALS.role,
        user: {
          id: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email,
          role: ADMIN_CREDENTIALS.role
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};

// Middleware: Protect Routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user still exists or is hardcoded admin
    let user;
    if (decoded.id === ADMIN_CREDENTIALS.id) {
      user = ADMIN_CREDENTIALS;
    } else {
      user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
    }

    req.user = user; // attach user to request
    next();

  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware: Restrict Access by Role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
