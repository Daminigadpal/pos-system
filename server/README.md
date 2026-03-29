# POS System Backend

A comprehensive omnichannel retail Point of Sale (POS) and Inventory Management System backend built with Node.js, Express, TypeScript, MongoDB, and Redis.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Product Catalog Management**: Full CRUD operations with variants, categories, and search functionality
- **Inventory Management**: Real-time stock tracking with low-stock alerts and adjustments
- **Order Processing**: Complete order lifecycle with payment processing and inventory reservation
- **Caching**: Redis integration for performance optimization
- **Data Integrity**: ACID-compliant transactions for inventory and order operations
- **API Documentation**: RESTful API with comprehensive validation
- **Testing**: Unit and integration tests with Jest
- **Logging**: Structured logging with Winston
- **Security**: Rate limiting, CORS, helmet security headers

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Containerization**: Docker

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pos-system/server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pos-system
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

### Using Docker Compose

1. Start services:
```bash
cd pos-system
docker-compose up -d
```

2. Install dependencies and start backend:
```bash
cd server
npm install
npm run dev
```

## Database Seeding

To populate the database with sample data:

```bash
npm run seed
```

This will create:
- A sample store
- Default users (Admin, Manager, Cashier)
- Product categories and sample products
- Initial inventory levels

Default login credentials:
- Admin: `admin@store.com` / `admin123`
- Manager: `manager@store.com` / `manager123`
- Cashier: `cashier@store.com` / `cashier123`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Product Endpoints

- `GET /api/products` - Get products (with pagination)
- `GET /api/products/search` - Search products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Manager/Admin)
- `PUT /api/products/:id` - Update product (Manager/Admin)
- `DELETE /api/products/:id` - Deactivate product (Manager/Admin)

### Inventory Endpoints

- `GET /api/inventory` - Get inventory list
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:sku` - Get inventory item details
- `PUT /api/inventory/:sku` - Update inventory (Manager/Admin)
- `POST /api/inventory/:sku/adjust` - Adjust inventory (Manager/Admin)

### Order Endpoints

- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `POST /api/orders/:id/confirm` - Confirm order with payment
- `POST /api/orders/:id/cancel` - Cancel order (Manager/Admin)

## User Roles

### Administrator
- Full system access
- Manage all stores
- View all reports and analytics

### Manager
- Store management
- Product and inventory management
- Order management and cancellations
- Staff management within store

### Cashier
- Process sales transactions
- View product information
- Basic inventory lookup
- Customer management

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
src/
├── config/          # Database and Redis configuration
├── controllers/     # API route handlers
├── middleware/      # Authentication, validation, etc.
├── models/          # Mongoose data models
├── routes/          # API route definitions
├── tests/           # Test files
├── utils/           # Utility functions (logger, seed data)
└── index.ts         # Application entry point
```

## Performance Features

- **Redis Caching**: Product catalog and search results cached for fast response times
- **Database Indexing**: Optimized indexes for frequently queried fields
- **Pagination**: Cursor-based pagination for large datasets
- **Connection Pooling**: MongoDB connection pooling for high concurrency
- **Rate Limiting**: API rate limiting to prevent abuse

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access Control**: Granular permissions by user role
- **Input Validation**: Comprehensive request validation with Joi
- **Security Headers**: Helmet for security headers
- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: Prevent API abuse and DDoS attacks

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/pos-system |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | JWT refresh token secret | - |
| FRONTEND_URL | Frontend application URL | http://localhost:3000 |
| LOG_LEVEL | Logging level | info |

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t pos-backend .
docker run -p 3000:3000 --env-file .env pos-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## License

This project is licensed under the ISC License.
