# CoffeeMaster - Coffee Shop Management System

CoffeeMaster is a full-stack coffee shop management system designed to streamline daily operations. It features a modern web interface built with React.js and a robust backend powered by Express.js.

## Overview

The application serves key staff roles—Cashier, Manager, and Admin—with role-based access to its features. The Point of Sale (POS) system functions exclusively as an order logger and receipt generator, with all financial transactions (cash or card payments) handled by a separate, external terminal.

A defining feature of this project is its hybrid database architecture, strategically using MySQL for structured, transactional data and MongoDB for flexible, document-based data.

## Features

- **Point of Sale (POS) System**:
  - Visual, touch-friendly grid of menu items
  - Order cart with totals calculation
  - Payment method selection (cash/card)
  - Digital receipt generation

- **Inventory Management**:
  - Track stock levels for ingredients
  - Recipe-based automatic stock deduction
  - Low-stock alerts
  - Stock replenishment interface

- **Menu & Recipe Management**:
  - Add, edit, or remove menu items
  - Define recipes linking to inventory components
  - Set prices and categories

- **Employee Management**:
  - Create and manage employee accounts
  - Role-based access control (Cashier, Manager, Admin)

- **Reporting & Analytics**:
  - Real-time dashboard
  - Historical sales reports
  - Inventory consumption analysis

## Technology Stack

- **Frontend**:
  - React.js with TypeScript
  - React Router for navigation
  - Context API for state management
  - Axios for API requests
  - CSS for styling

- **Backend**:
  - Node.js with Express
  - TypeScript for type safety
  - JWT for authentication
  - MySQL for transactional data
  - MongoDB for flexible data (recipes, logs)

## Project Structure

```
CoffeeMaster/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # Source code
│       ├── components/     # Reusable components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── styles/         # CSS styles
│       └── types/          # TypeScript types
└── server/                 # Express backend
    ├── src/                # Source code
    │   ├── config/         # Configuration files
    │   ├── controllers/    # Request handlers
    │   ├── middleware/     # Custom middleware
    │   ├── models/         # Data models
    │   │   ├── mysql/      # MySQL models
    │   │   └── mongo/      # MongoDB models
    │   ├── routes/         # API routes
    │   └── utils/          # Utility functions
    └── dist/               # Compiled JavaScript
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MySQL (v8 or later)
- MongoDB (v4 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/coffeemaster.git
   cd coffeemaster
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Initialize the database:
   ```
   npm run build
   npm start
   ```

5. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

6. Start the client:
   ```
   npm start
   ```

7. Access the application at `http://localhost:3000`

## Default Credentials

- Admin: username: `admin`, password: `admin123`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 