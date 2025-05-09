# ShopEasy E-Commerce Backend

This is the backend API for the ShopEasy e-commerce platform. It provides all the necessary endpoints for user authentication, product management, shopping cart functionality, and order processing.

## Features

- **User Authentication**: Register, login, and profile management
- **Product Management**: CRUD operations for products, search, and filtering
- **Shopping Cart**: Add, update, remove items from cart
- **Order Processing**: Create orders, update order status, payment integration
- **Admin Dashboard**: Manage products, orders, and users (admin only)

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **bcrypt.js**: Password hashing

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/profile`: Get user profile (protected)
- `PUT /api/auth/profile`: Update user profile (protected)

### Products

- `GET /api/products`: Get all products
- `GET /api/products/featured`: Get featured products
- `GET /api/products/categories`: Get product categories
- `GET /api/products/:id`: Get product by ID
- `POST /api/products`: Create a product (admin only)
- `PUT /api/products/:id`: Update a product (admin only)
- `DELETE /api/products/:id`: Delete a product (admin only)

### Cart

- `GET /api/cart`: Get user's cart (protected)
- `POST /api/cart`: Add item to cart (protected)
- `PUT /api/cart/:id`: Update cart item quantity (protected)
- `DELETE /api/cart/:id`: Remove item from cart (protected)
- `DELETE /api/cart`: Clear cart (protected)

### Orders

- `POST /api/orders`: Create a new order (protected)
- `GET /api/orders`: Get user's orders (protected)
- `GET /api/orders/admin`: Get all orders (admin only)
- `GET /api/orders/:id`: Get order by ID (protected)
- `PUT /api/orders/:id/pay`: Update order to paid (protected)
- `PUT /api/orders/:id/status`: Update order status (admin only)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```
4. Run the development server:
   ```
   npm run dev
   ```

### Seeding the Database

To seed the database with sample data:
```
node utils/seeder.js
```

To clear the database:
```
node utils/seeder.js -d
```

## Default Admin User

After seeding the database, you can login with the following credentials:
- Email: admin@example.com
- Password: admin123

## License

This project is licensed under the MIT License.