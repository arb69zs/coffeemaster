import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models/mysql/User';
import { InventoryModel } from '../models/mysql/Inventory';
import { ProductModel } from '../models/mysql/Product';
import { UserModel } from '../models/mysql/User';
import { OrderModel } from '../models/mysql/Order';

const router = express.Router();

// Get inventory value report (manager/admin only)
router.get('/inventory-value', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all inventory items from database
    const items = await InventoryModel.findAll();
    console.log('=== Inventory Value Report ===');
    console.log('Total inventory items:', items.length);
    
    // Calculate value for each item and total value
    let totalValue = 0;
    let lowStockCount = 0;
    const itemsWithValue = items.map(item => {
      // Skip items with zero or null cost per unit
      if (!item.cost_per_unit || item.cost_per_unit <= 0) {
        console.log(`Skipping item with zero/null cost: ${item.name}`);
        return null;
      }

      // Calculate value and stock status
      const value = Number(item.current_stock_level) * Number(item.cost_per_unit);
      const isLowStock = Number(item.current_stock_level) < Number(item.minimum_stock_level);
      
      // Log item details for debugging
      console.log(`Item: ${item.name}`);
      console.log(`  Current Stock: ${Number(item.current_stock_level).toFixed(2)} ${item.unit}`);
      console.log(`  Minimum Stock: ${Number(item.minimum_stock_level).toFixed(2)} ${item.unit}`);
      console.log(`  Stock Status: ${isLowStock ? 'LOW' : 'NORMAL'}`);
      console.log(`  Cost Per Unit: €${Number(item.cost_per_unit).toFixed(2)}`);
      console.log(`  Total Value: €${value.toFixed(2)}`);
      
      if (isLowStock) {
        console.log(`  WARNING: Low stock! Current (${Number(item.current_stock_level).toFixed(2)}) is below minimum (${Number(item.minimum_stock_level).toFixed(2)})`);
        lowStockCount++;
      }
      
      totalValue += value;
      
      return {
        id: item.id,
        name: item.name,
        current_stock: Number(item.current_stock_level).toFixed(2),
        unit: item.unit,
        cost_per_unit: Number(item.cost_per_unit).toFixed(2),
        total_value: value.toFixed(2),
        status: isLowStock ? 'low' : 'normal'
      };
    }).filter(item => item !== null); // Remove null items
    
    // Sort by value (highest first)
    itemsWithValue.sort((a, b) => Number(b.total_value) - Number(a.total_value));
    
    console.log('=== Summary ===');
    console.log('Total items with valid costs:', itemsWithValue.length);
    console.log('Low stock items:', lowStockCount);
    console.log('Total inventory value: €' + totalValue.toFixed(2));
    
    const report = {
      items: itemsWithValue,
      summary: {
        total_value: totalValue.toFixed(2),
        total_items: itemsWithValue.length,
        low_stock_items: lowStockCount
      }
    };
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating inventory value report:', error);
    res.status(500).json({ message: 'Error generating inventory value report.' });
  }
});

// Get product categories report (manager/admin only)
router.get('/product-categories', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all products
    const products = await ProductModel.findAll();
    
    // Group products by category
    const categoryMap = new Map();
    
    products.forEach(product => {
      if (!categoryMap.has(product.category)) {
        categoryMap.set(product.category, {
          category: product.category,
          count: 0,
          available_count: 0,
          unavailable_count: 0,
          avg_price: 0,
          total_price: 0
        });
      }
      
      const categoryData = categoryMap.get(product.category);
      categoryData.count += 1;
      categoryData.total_price += product.price;
      
      if (product.is_available) {
        categoryData.available_count += 1;
      } else {
        categoryData.unavailable_count += 1;
      }
    });
    
    // Calculate average price per category
    categoryMap.forEach(category => {
      category.avg_price = category.total_price / category.count;
    });
    
    const report = Array.from(categoryMap.values());
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating product categories report:', error);
    res.status(500).json({ message: 'Error generating product categories report.' });
  }
});

// Get user activity report (admin only)
router.get('/user-activity', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all users
    const users = await UserModel.findAll();
    
    // Get all orders
    const { orders } = await OrderModel.findAll(1, 1000); // Get up to 1000 orders
    
    // Create a report of users and their order counts
    const userActivityMap = new Map();
    
    // Initialize with all users
    users.forEach(user => {
      if (user.id) {
        userActivityMap.set(user.id, {
          user_id: user.id,
          username: user.username,
          role: user.role,
          orders_count: 0,
          total_sales: 0,
          last_active: user.lastLogin || null
        });
      }
    });
    
    // Add order data
    orders.forEach(order => {
      if (userActivityMap.has(order.user_id)) {
        const userData = userActivityMap.get(order.user_id);
        userData.orders_count += 1;
        userData.total_sales += order.total_amount;
        
        // Track last activity from orders
        const orderDate = new Date(order.created_at || '');
        if (!userData.last_active || orderDate > new Date(userData.last_active)) {
          userData.last_active = order.created_at;
        }
      }
    });
    
    const report = Array.from(userActivityMap.values());
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating user activity report:', error);
    res.status(500).json({ message: 'Error generating user activity report.' });
  }
});

export default router; 