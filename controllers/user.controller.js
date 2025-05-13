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
      password,
      phone,
      address
    });

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: userResponse(user),
      message: 'User created successfully'
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token,
      user: userResponse(user),
      message: "Login Successfully"
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
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