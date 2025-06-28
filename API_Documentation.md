# CoffeeMaster API Documentation

## Overview

The CoffeeMaster API is a RESTful service built with Express.js and TypeScript. It provides endpoints for managing coffee shop operations including authentication, user management, inventory, orders, products, suppliers, and reporting.

**Base URL**: `http://localhost:3001/api`

**Authentication**: JWT Bearer Token (required for most endpoints)

---

## Authentication

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "arber2000"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@coffeemaster.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `500` - Server error

---

## Users

### Get All Users
**GET** `/users`

Get all users in the system.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@coffeemaster.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "active": true,
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get User by ID
**GET** `/users/:id`

Get a specific user by ID.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@coffeemaster.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "active": true
  }
}
```

### Create User
**POST** `/users`

Create a new user account.

**Request Body:**
```json
{
  "username": "cashier1",
  "password": "password123",
  "email": "cashier1@coffeemaster.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "cashier",
  "active": true
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "username": "cashier1",
    "email": "cashier1@coffeemaster.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "cashier"
  }
}
```

### Update User
**PUT** `/users/:id`

Update an existing user.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@coffeemaster.com",
  "role": "manager"
}
```

### Delete User
**DELETE** `/users/:id`

Delete a user account.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Products

### Get All Products
**GET** `/products`

Get all products in the menu.

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Espresso",
      "price": 2.50,
      "category": "Coffee",
      "description": "Single shot of espresso",
      "image_url": "/images/espresso.jpg",
      "is_available": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Product by ID
**GET** `/products/:id`

Get a specific product by ID.

### Create Product
**POST** `/products`

Create a new product.

**Request Body:**
```json
{
  "name": "Cappuccino",
  "price": 3.50,
  "category": "Coffee",
  "description": "Espresso with steamed milk and foam",
  "image_url": "/images/cappuccino.jpg",
  "is_available": true
}
```

### Update Product
**PUT** `/products/:id`

Update an existing product.

### Delete Product
**DELETE** `/products/:id`

Delete a product.

---

## Inventory

### Get All Inventory Items
**GET** `/inventory`

Get all inventory items.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Coffee Beans",
      "current_stock_level": 5000,
      "unit": "g",
      "minimum_stock_level": 1000,
      "cost_per_unit": 0.02,
      "supplier_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Inventory Item by ID
**GET** `/inventory/:id`

Get a specific inventory item.

### Create Inventory Item
**POST** `/inventory`

Create a new inventory item.

**Request Body:**
```json
{
  "name": "Milk",
  "current_stock_level": 10000,
  "unit": "ml",
  "minimum_stock_level": 2000,
  "cost_per_unit": 0.001,
  "supplier_id": 2
}
```

### Update Inventory Item
**PUT** `/inventory/:id`

Update an existing inventory item.

### Update Stock Level
**PATCH** `/inventory/:id/stock`

Update the stock level of an inventory item.

**Request Body:**
```json
{
  "quantity": 500
}
```

**Note:** Positive quantity adds stock, negative quantity removes stock.

### Delete Inventory Item
**DELETE** `/inventory/:id`

Delete an inventory item.

### Get Low Stock Items
**GET** `/inventory/status/low`

Get all inventory items that are below their minimum stock level.

---

## Suppliers

### Get All Suppliers
**GET** `/suppliers`

Get all suppliers.

**Response:**
```json
{
  "suppliers": [
    {
      "id": 1,
      "name": "Coffee Supplier Co",
      "contact_name": "John Smith",
      "email": "john@coffeesupplier.com",
      "phone": "+1234567890",
      "address": "123 Coffee Street, City, State",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Supplier by ID
**GET** `/suppliers/:id`

Get a specific supplier with their associated inventory items.

**Response:**
```json
{
  "supplier": {
    "id": 1,
    "name": "Coffee Supplier Co",
    "contact_name": "John Smith",
    "email": "john@coffeesupplier.com",
    "phone": "+1234567890",
    "address": "123 Coffee Street, City, State"
  },
  "items": [
    {
      "id": 1,
      "name": "Coffee Beans",
      "current_stock_level": 5000,
      "unit": "g",
      "supplier_id": 1
    }
  ]
}
```

### Create Supplier
**POST** `/suppliers`

Create a new supplier.

**Request Body:**
```json
{
  "name": "Milk Supplier Inc",
  "contact_name": "Jane Doe",
  "email": "jane@milksupplier.com",
  "phone": "+0987654321",
  "address": "456 Milk Avenue, City, State"
}
```

### Update Supplier
**PUT** `/suppliers/:id`

Update an existing supplier.

### Delete Supplier
**DELETE** `/suppliers/:id`

Delete a supplier.

---

## Orders

### Get All Orders
**GET** `/orders`

Get all orders with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `startDate` (string): Filter orders from this date (YYYY-MM-DD)
- `endDate` (string): Filter orders to this date (YYYY-MM-DD)
- `status` (string): Filter by order status (pending, completed, cancelled)
- `paymentMethod` (string): Filter by payment method (cash, card)

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "total_amount": 12.50,
      "payment_method": "card",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00.000Z",
      "items": [
        {
          "id": 1,
          "product_id": 1,
          "quantity": 2,
          "unit_price": 2.50,
          "subtotal": 5.00,
          "product": {
            "name": "Espresso",
            "category": "Coffee"
          }
        }
      ],
      "user": {
        "username": "admin",
        "firstName": "Admin"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### Get Order by ID
**GET** `/orders/:id`

Get a specific order with all details.

### Create Order
**POST** `/orders`

Create a new order.

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "payment_method": "card"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "user_id": 1,
    "total_amount": 12.50,
    "payment_method": "card",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Order Status
**PUT** `/orders/:id/status`

Update the status of an order.

**Request Body:**
```json
{
  "status": "cancelled"
}
```

### Delete Order
**DELETE** `/orders/:id`

Delete an order.

### Advanced Search
**POST** `/orders/search`

Advanced search with multiple criteria.

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "minAmount": 10.00,
  "maxAmount": 50.00,
  "paymentMethod": "card",
  "status": "completed",
  "userId": 1,
  "productId": 1,
  "page": 1,
  "limit": 10
}
```

---

## Reports

### Get Sales Report
**GET** `/reports/sales`

Get sales analytics and reports.

**Query Parameters:**
- `startDate` (string): Start date for report (YYYY-MM-DD)
- `endDate` (string): End date for report (YYYY-MM-DD)
- `groupBy` (string): Group by day, week, month (default: day)

**Response:**
```json
{
  "totalSales": 1250.75,
  "totalOrders": 45,
  "averageOrderValue": 27.79,
  "salesByDate": [
    {
      "date": "2024-01-15",
      "sales": 125.50,
      "orders": 5
    }
  ],
  "topProducts": [
    {
      "product_id": 1,
      "name": "Espresso",
      "quantity": 25,
      "revenue": 62.50
    }
  ],
  "paymentMethodBreakdown": [
    {
      "method": "card",
      "count": 30,
      "total": 750.25
    },
    {
      "method": "cash",
      "count": 15,
      "total": 500.50
    }
  ]
}
```

### Get Inventory Report
**GET** `/reports/inventory`

Get inventory analytics.

**Response:**
```json
{
  "totalItems": 15,
  "lowStockItems": 3,
  "totalValue": 1250.00,
  "itemsByCategory": [
    {
      "category": "Coffee",
      "count": 5,
      "value": 500.00
    }
  ],
  "supplierBreakdown": [
    {
      "supplier_id": 1,
      "supplier_name": "Coffee Supplier Co",
      "items": 8,
      "value": 800.00
    }
  ]
}
```

### Get Best Selling Products
**GET** `/reports/best-selling`

Get best selling products.

**Query Parameters:**
- `limit` (number): Number of products to return (default: 10)
- `startDate` (string): Start date filter
- `endDate` (string): End date filter

**Response:**
```json
{
  "products": [
    {
      "product_id": 1,
      "name": "Espresso",
      "category": "Coffee",
      "total_quantity": 150,
      "total_sales": 375.00
    }
  ]
}
```

---

## Logs

### Get System Logs
**GET** `/logs`

Get system logs with filtering.

**Query Parameters:**
- `level` (string): Filter by log level (info, warning, error)
- `category` (string): Filter by category (auth, order, inventory, product, system)
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "level": "info",
      "category": "order",
      "message": "Order #1001 created",
      "details": {
        "orderId": 1001,
        "amount": 12.50,
        "items": 2
      },
      "userId": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 10
}
```

### Get Log Statistics
**GET** `/logs/stats`

Get log statistics and analytics.

**Response:**
```json
{
  "totalLogs": 1000,
  "logsByLevel": [
    {
      "level": "info",
      "count": 800
    },
    {
      "level": "warning",
      "count": 150
    },
    {
      "level": "error",
      "count": 50
    }
  ],
  "logsByCategory": [
    {
      "category": "order",
      "count": 400
    },
    {
      "category": "system",
      "count": 300
    }
  ],
  "recentActivity": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "count": 25
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### User Roles
- **cashier**: Can access POS, view orders, update inventory
- **manager**: Can access all features except user management
- **admin**: Full access to all features including user management

### Protected Endpoints
Most endpoints require authentication. Public endpoints:
- `POST /auth/login`

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **100 requests per minute** per IP address
- **1000 requests per hour** per IP address

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

## Data Types

### Common Fields
- `id`: Integer (auto-increment)
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

### Enums
- **User Role**: `cashier`, `manager`, `admin`
- **Order Status**: `pending`, `completed`, `cancelled`
- **Payment Method**: `cash`, `card`
- **Log Level**: `info`, `warning`, `error`
- **Log Category**: `auth`, `order`, `inventory`, `product`, `system`

---

## Example Usage

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "arber2000"}'
```

**Get All Products:**
```bash
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Order:**
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 3, "quantity": 1}
    ],
    "payment_method": "card"
  }'
```

**Get Sales Report:**
```bash
curl -X GET "http://localhost:3001/api/reports/sales?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing

### Test Endpoints

**Health Check:**
```bash
curl -X GET http://localhost:3001/api/health
```

**Database Connection Test:**
```bash
curl -X GET http://localhost:3001/api/test/db
```

---

## Development Notes

### Environment Variables
Required environment variables in `.env`:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=arber2000
MYSQL_DATABASE=coffeemaster
MONGO_URI=mongodb://localhost:27017/coffeemaster
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

### Database Setup
1. Create MySQL database: `coffeemaster`
2. Run migration scripts in `server/src/utils/`
3. Initialize with sample data

### API Versioning
Current version: v1
All endpoints are prefixed with `/api`

---

This API documentation covers all the main endpoints and functionality of the CoffeeMaster system. For additional support or questions, please refer to the project README or contact the development team.

**Last Updated:** January 2024
**Version:** 1.0.0 