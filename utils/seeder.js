const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Sample products data
const products = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and long battery life.',
    price: 129.99,
    imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Electronics',
    stock: 50,
    rating: 4.5,
    numReviews: 12,
    featured: true,
  },
  {
    name: 'Smartphone X Pro',
    description: 'Latest smartphone with advanced camera system and powerful processor.',
    price: 899.99,
    imageUrl: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Electronics',
    stock: 35,
    rating: 4.8,
    numReviews: 24,
    featured: true,
  },
  {
    name: 'Casual Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt for everyday wear.',
    price: 19.99,
    imageUrl: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Clothing',
    stock: 100,
    rating: 4.2,
    numReviews: 8,
    featured: false,
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Eco-friendly water bottle that keeps drinks cold for 24 hours or hot for 12 hours.',
    price: 24.99,
    imageUrl: 'https://images.pexels.com/photos/1342529/pexels-photo-1342529.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Home & Kitchen',
    stock: 75,
    rating: 4.6,
    numReviews: 15,
    featured: false,
  },
  {
    name: 'Fitness Tracker Watch',
    description: 'Smart fitness tracker with heart rate monitor and sleep tracking.',
    price: 79.99,
    imageUrl: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Electronics',
    stock: 40,
    rating: 4.4,
    numReviews: 18,
    featured: true,
  },
  {
    name: 'Leather Wallet',
    description: 'Genuine leather wallet with multiple card slots and RFID protection.',
    price: 39.99,
    imageUrl: 'https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Accessories',
    stock: 60,
    rating: 4.3,
    numReviews: 10,
    featured: false,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof portable speaker with 360-degree sound and 20-hour battery life.',
    price: 59.99,
    imageUrl: 'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Electronics',
    stock: 45,
    rating: 4.7,
    numReviews: 22,
    featured: true,
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip yoga mat with alignment lines for proper positioning.',
    price: 29.99,
    imageUrl: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    category: 'Sports & Outdoors',
    stock: 55,
    rating: 4.5,
    numReviews: 14,
    featured: false,
  },
];

// Sample admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    await User.create({
      ...adminUser,
      password: hashedPassword,
    });

    // Create products
    await Product.insertMany(products);

    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete data
const destroyData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();

    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Run script
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}