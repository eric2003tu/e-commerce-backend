const mongoose = require('mongoose');
const Product = require('../models/product.model');
const path = require('path');
require('dotenv').config(); // Load environment variables

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB...');
    
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      const updatedImages = product.images.map(img => {
        if (typeof img === 'string') {
          // Handle both Windows and Unix paths
          const normalized = img.replace(/\\/g, '/');
          // Extract just the filename (last part after slash)
          return path.basename(normalized);
        }
        return img;
      });

      if (JSON.stringify(product.images) !== JSON.stringify(updatedImages)) {
        product.images = updatedImages;
        await product.save();
        updatedCount++;
        console.log(`Updated product ${product._id}`);
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} products`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();