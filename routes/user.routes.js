const express = require('express');
const router = express.Router();
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

// Public routes
router.post('/signup', signupUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes (require auth)
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