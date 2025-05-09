const express = require('express');
const { check } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', productController.getFeaturedProducts);

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', productController.getProductCategories);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    admin,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Price is required and must be a number').isNumeric(),
      check('imageUrl', 'Image URL is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('stock', 'Stock is required and must be a number').isNumeric(),
    ],
  ],
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, admin, productController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, admin, productController.deleteProduct);

module.exports = router;