# Kazdoura Backend API

A complete Node.js/Express backend API for the Kazdoura e-commerce platform with MongoDB database.

## Features

✅ **User Authentication**: JWT-based authentication with bcrypt password hashing  
✅ **Product Management**: Full CRUD operations with reviews and ratings  
✅ **Shopping Cart**: Complete cart functionality with quantity management  
✅ **Order Processing**: Order creation, payment, and delivery tracking  
✅ **Admin Panel**: User and order management for administrators  
✅ **Security**: Rate limiting, CORS, helmet, input validation  
✅ **Database**: MongoDB with Mongoose ODM  

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp config.env.example config.env
# Edit config.env with your values
```

3. Start MongoDB (make sure MongoDB is running locally or update MONGODB_URI)

4. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

Create a `config.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kazdoura
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
BCRYPT_SALT_ROUNDS=12
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `POST /api/products/:id/reviews` - Add product review
- `GET /api/products/featured` - Get featured products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item quantity
- `DELETE /api/cart/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Mark order as paid
- `PUT /api/orders/:id/deliver` - Mark order as delivered (Admin only)
- `GET /api/orders` - Get all orders (Admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Models

### User
- Authentication fields (email, password)
- Profile information (name, phone, address)
- Role-based access (user, admin)
- Password reset functionality

### Product
- Product details (name, description, price, images)
- Inventory management (stock, SKU)
- Categories and tags
- Reviews and ratings system
- Featured products flag

### Cart
- User-specific shopping cart
- Item management with quantities
- Automatic total calculation
- Stock validation

### Order
- Order items with quantities and prices
- Shipping address
- Payment information
- Order status tracking
- Automatic price calculations

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Get JWT token
2. **Protected Routes**: Include token in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Validation

All input is validated using express-validator:
- Email format validation
- Password strength requirements
- Required field validation
- Data type validation

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: All inputs validated
- **Password Hashing**: bcryptjs with configurable salt rounds
- **JWT**: Secure token-based authentication

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### File Structure
```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── config.env       # Environment variables
├── server.js        # Main server file
└── package.json     # Dependencies
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure MongoDB connection string
4. Set up proper CORS origins
5. Use environment variables for all sensitive data

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": {...}
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "status": "success",
  "count": 10,
  "pagination": {
    "current": 1,
    "pages": 5
  },
  "data": [...]
}
```

## Testing

The API includes comprehensive error handling and validation. Test endpoints using:

- **Postman**: Import the API collection
- **cURL**: Command line testing
- **Frontend**: Connect React frontend to these endpoints

## Support

For questions or issues, please refer to the main project documentation or create an issue in the repository. "# kazdoura-backend-railway" 
