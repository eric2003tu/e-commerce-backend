const express = require('express');
const multer = require('multer');
const path = require('path');
const { check } = require('express-validator');
const productController = require('../controllers/product.controller');

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/products/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Store just filename
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpg, jpeg, png, webp) are allowed'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getProductCategories);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);

// Product management routes
router.post(
  '/',
  upload.array('images', 5), // Max 5 images
  [
    check('name', 'Name is required').trim().not().isEmpty(),
    check('description', 'Description is required').trim().not().isEmpty(),
    check('price', 'Valid price is required').isFloat({ min: 0 }),
    check('category', 'Category is required').trim().not().isEmpty(),
    check('stock', 'Stock must be a non-negative integer').isInt({ min: 0 })
  ],
  productController.createProduct
);

router.put(
  '/:id',
  upload.array('images', 5),
  [
    check('name', 'Name cannot be empty').optional().trim().not().isEmpty(),
    check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
    check('stock', 'Stock must be a non-negative integer').optional().isInt({ min: 0 })
  ],
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);

module.exports = router;