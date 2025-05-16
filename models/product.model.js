const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      max: [1000000, 'Price cannot exceed 1,000,000']
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: function(v) {
          return v.length > 0;
        },
        message: 'At least one product image is required'
      }
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
      set: v => Math.round(v * 10) / 10
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    seller: {
      type: String,
      required: [true, 'Seller name is required'],
      maxlength: [50, 'Category cannot exceed 50 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text' 
}, {
  weights: {
    name: 5,
    category: 3,
    description: 1
  }
});

productSchema.virtual('discountedPrice').get(function() {
  return this.price;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;