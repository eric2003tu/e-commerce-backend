const express = require('express');
const { check } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getProductCategories);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);

// Protected routes (Admin only)
// router.use(protect, admin);

// router.post(
//   '/',
//   [
//     check('name', 'Name is required').trim().not().isEmpty(),
//     check('description', 'Description is required').trim().not().isEmpty(),
//     check('price', 'Valid price is required').isFloat({ min: 0 }),
//     check('images', 'At least one image is required').isArray({ min: 1 }),
//     check('category', 'Category is required').trim().not().isEmpty(),
//     check('stock', 'Stock must be a non-negative integer').isInt({ min: 0 })
//   ],
//   productController.createProduct
// );

router.put(
  '/:id',
  [
    check('name', 'Name cannot be empty').optional().trim().not().isEmpty(),
    check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
    check('stock', 'Stock must be a non-negative integer').optional().isInt({ min: 0 })
  ],
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);

module.exports = router;