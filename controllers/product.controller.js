const { validationResult } = require('express-validator');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');

// Helper functions
const convertToNumber = (value, fieldName) => {
  const num = parseFloat(value);
  if (isNaN(num)) throw new Error(`${fieldName} must be a valid number`);
  return num;
};

const cleanUpFiles = (files) => {
  if (!files?.length) return;
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlink(file.path, err => {
        if (err) console.error(`Failed to delete ${file.path}:`, err);
      });
    }
  });
};

const processImages = (files) => {
  if (!files?.length) return [];
  
  return files.map(file => ({
    path: file.path.replace(/\\/g, '/'),
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  }));
};

// New helper function to get public image URL
const getPublicImageUrl = (filePath) => {
  if (!filePath) return null;
  return `/uploads/products/${path.basename(filePath)}`;
};

const productController = {
  // Get all products with enhanced query building
  getProducts: async (req, res) => {
    try {
      console.log('Product query received:', req.query);
      
      // Build query
      const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 100);
      const page = parseInt(req.query.page) || 1;
      
      const filter = {};
      const sort = { createdAt: -1 }; // Default sort
      
      // Filtering
      if (req.query.category) filter.category = req.query.category;
      if (req.query.featured) filter.featured = req.query.featured === 'true';
      
      // Price range
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = convertToNumber(req.query.minPrice, 'Min Price');
        if (req.query.maxPrice) filter.price.$lte = convertToNumber(req.query.maxPrice, 'Max Price');
      }
      
      // Sorting
      if (req.query.sort) {
        req.query.sort.split(',').forEach(field => {
          const [key, value] = field.split(':');
          sort[key] = value === 'desc' ? -1 : 1;
        });
      }

      // Execute query
      const [count, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .sort(sort)
          .skip(pageSize * (page - 1))
          .limit(pageSize)
          .lean()
      ]);

      // Transform image paths to URLs
      const productsWithUrls = products.map(product => ({
        ...product,
        images: product.images.map(img => getPublicImageUrl(img))
      }));

      res.json({
        success: true,
        count,
        page,
        pages: Math.ceil(count / pageSize),
        products: productsWithUrls
      });

    } catch (error) {
      console.error('Product fetch error:', {
        error: error.message,
        query: req.query,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  },

  // Search products with enhanced text search
  searchProducts: async (req, res) => {
    try {
      const query = req.query.q?.trim();
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const products = await Product.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(50)
        .lean();

      // Transform image paths to URLs
      const productsWithUrls = products.map(product => ({
        ...product,
        images: product.images.map(img => getPublicImageUrl(img))
      }));

      res.json({
        success: true,
        count: productsWithUrls.length,
        products: productsWithUrls
      });

    } catch (error) {
      console.error('Search error:', {
        query: req.query.q,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Search failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  },

  // Create product with enhanced validation
  createProduct: async (req, res) => {
    console.log('Create product request:', {
      body: req.body,
      files: req.files?.map(f => f.originalname)
    });

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      cleanUpFiles(req.files);
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        received: {
          ...req.body,
          files: req.files?.length
        }
      });
    }

    try {
      // Process images
      const images = processImages(req.files);
      if (!images.length) throw new Error('At least one image is required');

      // Prepare product data with filenames only
      const productData = {
        ...req.body,
        images: images.map(img => img.filename), // Store only filenames
        price: convertToNumber(req.body.price, 'Price'),
        stock: convertToNumber(req.body.stock, 'Stock'),
        featured: req.body.featured === 'true'
      };

      // Create and save product
      const product = new Product(productData);
      const createdProduct = await product.save();
      
      // Return product with public URLs
      const responseProduct = {
        ...createdProduct.toObject(),
        images: createdProduct.images.map(img => getPublicImageUrl(img))
      };
      
      res.status(201).json({
        success: true,
        product: responseProduct
      });

    } catch (error) {
      cleanUpFiles(req.files);
      
      console.error('Product creation failed:', {
        error: error.message,
        body: req.body,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Product creation failed',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          received: req.body 
        })
      });
    }
  },

  // Get featured products with caching headers
  getFeaturedProducts: async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 20);
      const products = await Product.find({ featured: true })
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      // Transform image paths to URLs
      const productsWithUrls = products.map(product => ({
        ...product,
        images: product.images.map(img => getPublicImageUrl(img))
      }));

      // Cache control
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      
      res.json({
        success: true,
        count: productsWithUrls.length,
        products: productsWithUrls
      });

    } catch (error) {
      console.error('Featured products error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to load featured products'
      });
    }
  },

  // Get categories with memoization potential
  getProductCategories: async (req, res) => {
    try {
      const categories = await Product.distinct('category');
      res.json({
        success: true,
        count: categories.length,
        categories: categories.sort()
      });
    } catch (error) {
      console.error('Categories error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to load categories'
      });
    }
  },

  // Get single product with enhanced error handling
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).lean();
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Transform image paths to URLs
      const productWithUrls = {
        ...product,
        images: product.images.map(img => getPublicImageUrl(img))
      };

      res.json({ success: true, product: productWithUrls });

    } catch (error) {
      console.error('Product fetch error:', {
        id: req.params.id,
        error: error.message
      });

      const status = error.kind === 'ObjectId' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: status === 404 ? 'Product not found' : 'Failed to fetch product'
      });
    }
  },

  // Update product with comprehensive checks
  updateProduct: async (req, res) => {
    console.log('Update product request:', {
      id: req.params.id,
      body: req.body,
      files: req.files?.map(f => f.originalname)
    });

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      cleanUpFiles(req.files);
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      // Find existing product
      let product = await Product.findById(req.params.id);
      if (!product) {
        cleanUpFiles(req.files);
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Process images
      let images = product.images;
      if (req.files?.length) {
        // Delete old images
        await Promise.all(
          product.images.map(imagePath => {
            const filename = path.basename(imagePath);
            const fullPath = path.join(__dirname, '../uploads/products', filename);
            return fs.promises.unlink(fullPath)
              .catch(err => console.error('Image delete error:', err));
          })
        );
        
        // Add new images (store only filenames)
        images = req.files.map(file => file.filename);
      }

      // Prepare update data
      const updateData = {
        ...req.body,
        images,
        price: req.body.price ? convertToNumber(req.body.price, 'Price') : product.price,
        stock: req.body.stock ? convertToNumber(req.body.stock, 'Stock') : product.stock,
        featured: req.body.featured ? req.body.featured === 'true' : product.featured
      };

      // Update product
      product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      // Return product with public URLs
      const responseProduct = {
        ...product.toObject(),
        images: product.images.map(img => getPublicImageUrl(img))
      };

      res.json({
        success: true,
        product: responseProduct
      });

    } catch (error) {
      cleanUpFiles(req.files);
      
      console.error('Product update failed:', {
        id: req.params.id,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Product update failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  },

  // Delete product with transaction-like cleanup
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Delete associated images
      const deleteOperations = product.images.map(async (imagePath) => {
        try {
          const filename = path.basename(imagePath);
          const fullPath = path.join(__dirname, '../uploads/products', filename);
          
          if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            console.log(`Deleted image: ${filename}`);
          } else {
            console.warn(`Image not found: ${filename}`);
          }
        } catch (err) {
          console.error(`Error deleting image ${imagePath}:`, err);
          // Don't throw error - continue with other deletions
        }
      });

      // Wait for all image deletions to complete
      await Promise.all(deleteOperations);

      // Delete product from database
      await Product.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Product deleted successfully',
        deletedProductId: req.params.id
      });

    } catch (error) {
      console.error('Product deletion failed:', {
        id: req.params.id,
        error: error.message,
        stack: error.stack
      });

      const status = error.kind === 'ObjectId' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: status === 404 ? 'Product not found' : 'Failed to delete product',
        errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = productController;