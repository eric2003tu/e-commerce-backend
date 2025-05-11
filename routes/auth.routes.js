// routes/auth.routes.js
const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

const router = express.Router();
const path = require('path');
console.log('Importing auth controller from:', path.resolve('../controllers/auth.controller'));


// Public Routes
router.post(
  '/register',
  [
    check('name', 'Name is required')
      .not().isEmpty()
      .trim()
      .escape()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters'),
    
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new Error('Email already in use');
        }
      }),
    
    check('password', 'Password must be at least 8 characters')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
    
    check('confirmPassword', 'Passwords do not match')
      .custom((value, { req }) => value === req.body.password),
    
    check('phone', 'Please include a valid phone number')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format')
  ],
  authController.register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail(),
    
    check('password', 'Password is required')
      .not().isEmpty()
  ],
  authController.login
);

router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail()
  ],
  authController.forgotPassword
);

router.patch(
  '/reset-password/:token',
  [
    check('password', 'Password must be at least 8 characters')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
    
    check('confirmPassword', 'Passwords do not match')
      .custom((value, { req }) => value === req.body.password)
  ],
  authController.resetPassword
);

// Protected Routes (require authentication)
router.use(protect);

router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.delete('/delete-me', authController.deleteMe);

router.patch(
  '/update-my-password',
  [
    check('currentPassword', 'Current password is required')
      .not().isEmpty(),
    
    check('newPassword', 'Password must be at least 8 characters')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
    
    check('confirmPassword', 'Passwords do not match')
      .custom((value, { req }) => value === req.body.newPassword)
  ],
  authController.updateMyPassword
);

// Admin-only Routes
router.use(restrictTo('admin'));

router.get('/', authController.getAllUsers);
router.get('/:id', authController.getUser);
router.patch('/:id', authController.updateUser);
router.delete('/:id', authController.deleteUser);

module.exports = router;
