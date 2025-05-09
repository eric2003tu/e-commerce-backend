const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, orderController.createOrder);

// @route   GET /api/orders
// @desc    Get logged in user orders
// @access  Private
router.get('/', protect, orderController.getUserOrders);

// @route   GET /api/orders/admin
// @desc    Get all orders
// @access  Private/Admin
router.get('/admin', protect, admin, orderController.getOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, orderController.getOrderById);

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', protect, orderController.updateOrderToPaid);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);

module.exports = router;