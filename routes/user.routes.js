const express = require('express');
const { protect, admin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.put('/reset-password/:token', userController.resetPassword);

// Protected routes (require user authentication)
router.use(protect); // All routes below this will use protect middleware

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateProfile);
router.put('/update-password', userController.updatePassword);

// Admin-only routes (require admin privileges)
router.use(admin); // All routes below this will require admin role

router.get('/', userController.getAllUsers);
router.route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser)
  .put(userController.updateUserRole);

module.exports = router;