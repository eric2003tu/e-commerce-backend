const { validationResult } = require('express-validator');
const Product = require('../models/product.model');

const productController = {
  // Get all products with pagination, filtering, and sorting
  getProducts: async (req, res) => {
    try {
      // Pagination
      const pageSize = parseInt(req.query.pageSize) || 10;
      const page = parseInt(req.query.page) || 1;
      
      // Filtering
      const filter = {};
      if (req.query.category) filter.category = req.query.category;
      if (req.query.featured) filter.featured = req.query.featured === 'true';
      
      // Sorting
      const sort = {};
      if (req.query.sort) {
        const sortFields = req.query.sort.split(',');
        sortFields.forEach(field => {
          const [key, value] = field.split(':');
          sort[key] = value === 'desc' ? -1 : 1;
        });
      } else {
        sort.createdAt = -1;
      }
      
      // Price range
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
      }

      const count = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .sort(sort)
        .skip(pageSize * (page - 1))
        .limit(pageSize);

      res.json({
        success: true,
        count,
        page,
        pages: Math.ceil(count / pageSize),
        products
      });
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching products'
      });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const products = await Product.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });

      res.json({
        success: true,
        count: products.length,
        products
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching products'
      });
    }
  },

  // Create a new product
  createProduct: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const product = new Product({
        ...req.body,
        seller: req.user.id // Associate product with the seller
      });

      const createdProduct = await product.save();
      
      res.status(201).json({
        success: true,
        product: createdProduct
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating product'
      });
    }
  },

  // Get featured products
  getFeaturedProducts: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const products = await Product.find({ featured: true })
        .limit(limit)
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: products.length,
        products
      });
    } catch (error) {
      console.error('Error getting featured products:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching featured products'
      });
    }
  },

  // Get product categories
  getProductCategories: async (req, res) => {
    try {
      const categories = await Product.distinct('category');
      res.json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching categories'
      });
    }
  },

  // Get single product by ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        product
      });
    } catch (error) {
      console.error('Error getting product:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error while fetching product'
      });
    }
  },

  // Update a product
  updateProduct: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      let product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if the user is the seller or admin
      if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this product'
        });
      }

      product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating product'
      });
    }
  },

  // Delete a product
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if the user is the seller or admin
      if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this product'
        });
      }

      await product.remove();
      res.json({
        success: true,
        message: 'Product removed successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error while deleting product'
      });
    }
  }
};

module.exports = productController;