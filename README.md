# E-Commerce REST API

A comprehensive REST API for an e-commerce platform built with Node.js, Express.js, PostgreSQL (Supabase), and Cloudinary for image uploads.

## Features

- JWT-based authentication with role-based access control (Admin/Customer)
- User management (signup, login, profile)
- Category management (CRUD operations)
- Product management with image upload to Cloudinary
- Advanced product filtering (price range, category, search, pagination)
- Shopping cart with persistent pricing
- Order management and processing
- Comprehensive API documentation with Swagger
- Automated testing with Jest
- Security best practices with Helmet and CORS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Validation**: express-validator
- **API Documentation**: Swagger
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, bcryptjs

## Project Structure

```
.
├── src/
│   ├── config/
│   │   ├── database.js        # Supabase client configuration
│   │   ├── cloudinary.js      # Cloudinary setup
│   │   └── swagger.js         # Swagger documentation config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication & authorization
│   │   └── validation.js      # Input validation middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   ├── utils/
│   │   └── auth.js            # Password hashing & JWT utilities
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── __tests__/
│   ├── auth.test.js
│   ├── categories.test.js
│   ├── products.test.js
│   ├── cart.test.js
│   └── orders.test.js
├── .env.example
├── .env
├── jest.config.js
└── package.json
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `JWT_SECRET`: Your secret key for JWT
     - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
     - `CLOUDINARY_API_KEY`: Your Cloudinary API key
     - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. Database setup:
   - The database migrations are already applied to your Supabase instance
   - Tables created: users, categories, products, cart_items, orders, order_items

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## API Documentation

Once the server is running, visit: `http://localhost:3000/api-docs`

The Swagger UI provides interactive documentation for all API endpoints.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

### Categories (Admin only for write operations)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Products (Admin only for write operations)
- `GET /api/products` - Get all products with filters
  - Query params: `minPrice`, `maxPrice`, `categoryId`, `search`, `page`, `limit`
- `POST /api/products` - Create product (Admin)
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart (Customer)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add product to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders
- `POST /api/orders` - Create order from cart (Customer)
- `GET /api/orders` - Get user's orders (Customer) or all orders (Admin)
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status (Admin)

## Key Features

### Role-Based Access Control
- **Admin**: Full access to manage categories, products, and view all orders
- **Customer**: Can browse products, manage cart, and place orders

### Persistent Cart Pricing
When a product is added to the cart, its price at the time of addition is stored. Even if the product price changes later, the cart and resulting order maintain the original price.

### Product Filtering
Products can be filtered by:
- Price range (min/max)
- Category
- Name search
- Pagination support

### Image Upload
Products support image uploads via Cloudinary:
- Images are automatically optimized
- Stored in the cloud with public URLs
- Size limited to 5MB

### Security
- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Helmet for security headers
- CORS enabled
- Input validation on all endpoints
- Row Level Security (RLS) policies in database

## Testing

The project includes comprehensive test suites covering:
- User authentication (signup, login, profile)
- Category management (CRUD operations)
- Product management (CRUD, filtering, pagination)
- Shopping cart operations
- Order processing and management

Tests use Jest and Supertest for API testing.

## Database Schema

### Users
- id (UUID)
- email (unique)
- password (hashed)
- role (customer/admin)
- timestamps

### Categories
- id (UUID)
- name (unique)
- description
- timestamps

### Products
- id (UUID)
- name
- description
- price
- stock
- category_id (foreign key)
- image_url (Cloudinary URL)
- timestamps

### Cart Items
- id (UUID)
- user_id (foreign key)
- product_id (foreign key)
- quantity
- price_at_addition (persistent pricing)
- timestamps

### Orders
- id (UUID)
- user_id (foreign key)
- total_amount
- status (pending/processing/completed/cancelled)
- timestamps

### Order Items
- id (UUID)
- order_id (foreign key)
- product_id (foreign key)
- quantity
- price_at_purchase (persistent pricing)
- timestamp

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Environment Variables

Required environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
NODE_ENV=development
```

## License

MIT
