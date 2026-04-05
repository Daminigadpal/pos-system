# POS System
Omnichannel Retail Point of Sale (POS) and Inventory Management System

A comprehensive retail management system built with Node.js, Express, TypeScript, MongoDB, and Redis.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Product Catalog Management**: Full CRUD operations with variants, categories, and search
- **Inventory Management**: Real-time stock tracking with low-stock alerts and adjustments
- **Order Processing**: Complete order lifecycle with payment processing and inventory reservation
- **User Management**: Admin, Manager, and Cashier roles with appropriate permissions
- **Caching**: Redis integration for performance optimization
- **Data Integrity**: ACID-compliant transactions for inventory and order operations

## Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Daminigadpal/pos-system.git
cd pos-system
```

2. Install dependencies:
```bash
cd server
npm install
```

3. Set up environment variables:
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
- A sample store (STORE001)
- Default users with different roles
- Product categories and sample products
- Initial inventory levels

## 🔑 Login Details

### Default User Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Administrator** | `admin@store.com` | `admin123` | Full system access |
| **Manager** | `manager@store.com` | `manager123` | Store management, products, inventory, orders |
| **Cashier** | `cashier@store.com` | `cashier123` | Process sales, basic inventory lookup |

### API Login

**Endpoint**: `POST /api/auth/login`

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@store.com",
    "password": "admin123"
  }'
```

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

## User Roles & Permissions

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
server/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── controllers/     # API route handlers
│   ├── middleware/      # Authentication, validation, etc.
│   ├── models/          # Mongoose data models
│   ├── routes/          # API route definitions
│   ├── tests/           # Test files
│   ├── utils/           # Utility functions (logger, seed data)
│   └── index.ts         # Application entry point
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

---

**Note**: The default login credentials are for development purposes only. Make sure to change them in production environment.
