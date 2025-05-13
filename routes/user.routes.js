const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { adminLogout } = require('../controllers/user.controller'); // Adjust path as needed
const {
  signupUser,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateProfile,
  updatePassword,
  getAllUsers,
  getUser,
  deleteUser,
  updateUserRole
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Development-only admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  id: '000000000000000000000001'
};

// Admin login endpoint
router.post('/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: ADMIN_CREDENTIALS.id, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // Set cookie if using cookies
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES || 7) * 24 * 60 * 60 * 1000)
    });

    return res.status(200).json({
      success: true,
      token,
      role: 'admin'
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during admin login' 
    });
  }
});

// ✅ Admin logout endpoint (changed to POST)
router.post('/admin-logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Admin logged out successfully'
  });
});


// Original public routes
router.post('/signup', signupUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect);
router.get('/me', getUserProfile);
router.put('/me', updateProfile);
router.put('/update-password', updatePassword);

// Admin-only routes
router.use(restrictTo('admin'));
router.get('/', getAllUsers);
router.route('/:id')
  .get(getUser)
  .delete(deleteUser)
  .put(updateUserRole);

module.exports = router;