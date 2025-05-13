const { check } = require('express-validator');
const jwt = require('jsonwebtoken');


// Hardcoded admin credentials (FOR DEVELOPMENT ONLY)
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'AdminPass123!', // Change this in production!
  name: 'Super Admin'
};

exports.registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6+ characters').isLength({ min: 6 })
];

exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Admin login shortcut (NEW)
exports.adminLoginValidation = [
  check('email', 'Email must match admin credentials').custom((value) => {
    return value === ADMIN_CREDENTIALS.email;
  }),
  check('password', 'Password must match admin credentials').custom((value) => {
    return value === ADMIN_CREDENTIALS.password;
  })
];

// Middleware to auto-login admin (NEW)
exports.autoLoginAdmin = (req, res, next) => {
  if (
    req.body.email === ADMIN_CREDENTIALS.email &&
    req.body.password === ADMIN_CREDENTIALS.password
  ) {
    // Manually generate admin JWT token
    const token = jwt.sign(
      { id: 'admin', role: 'admin' }, // Fake admin ID
      'your_jwt_secret', // Use your real JWT secret
      { expiresIn: '1h' }
    );

    // Attach token to response (cookie or header)
    res.cookie('token', token, { httpOnly: true });
    // OR: res.set('Authorization', `Bearer ${token}`);

    // Redirect to admin dashboard
    return res.redirect('/admin/dashboard');
  }
  next(); // Proceed to normal login if credentials don't match
};