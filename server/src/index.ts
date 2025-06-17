import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMongoDB } from './config/database';
import { initializeDatabase } from './utils/initDb';
import { LogCategory, LogLevel, createLog } from './models/mongo/SystemLog';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectMongoDB().then(() => {
  // Initialize database tables and default data
  initializeDatabase().then(() => {
    console.log('Database initialized successfully');
  }).catch(err => {
    console.error('Error initializing database:', err);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';
import logsRoutes from './routes/logs';

// Test route to verify Express is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/logs', logsRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('CoffeeMaster API is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Log server start
  createLog(
    LogLevel.INFO,
    LogCategory.SYSTEM,
    `Server started on port ${PORT}`
  ).catch(err => {
    console.error('Error logging server start:', err);
  });
}); 