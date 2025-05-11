const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Unified user response format
const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address
});

// @desc    Register/Signup a new user
// @route   POST /api/v1/users/register or /api/v1/users/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please include name, email, and password'
      });
    }

    // Check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      phone,
      address
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: userResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: userResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// [Include all other controller methods following the same pattern]

module.exports = {
  signupUser: registerUser, // Alias for registerUser
  registerUser,
  loginUser,
  forgotPassword: async (req, res) => { /* implementation */ },
  resetPassword: async (req, res) => { /* implementation */ },
  getUserProfile: async (req, res) => { /* implementation */ },
  updateProfile: async (req, res) => { /* implementation */ },
  updatePassword: async (req, res) => { /* implementation */ },
  getAllUsers: async (req, res) => { /* implementation */ },
  getUser: async (req, res) => { /* implementation */ },
  deleteUser: async (req, res) => { /* implementation */ },
  updateUserRole: async (req, res) => { /* implementation */ }
};