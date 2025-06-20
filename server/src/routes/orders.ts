import express, { Request, Response, NextFunction } from 'express';
import { OrderModel, Order, OrderItem } from '../models/mysql/Order';
import { ProductModel } from '../models/mysql/Product';
import { InventoryModel } from '../models/mysql/Inventory';
import { ProductRecipe } from '../models/mongo/ProductRecipe';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models/mysql/User';
import { LogCategory, LogLevel, createLog } from '../models/mongo/SystemLog';
import { mysqlPool } from '../config/database';

const router = express.Router();

// Advanced search endpoint
router.get('/search', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate and parse search parameters
    const {
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      status,
      userId,
      productId,
      page = '1',
      limit = '10'
    } = req.query;

    // Validate page and limit
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({ 
        message: 'Invalid page number. Must be a positive integer.',
        orders: [],
        total: 0
      });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ 
        message: 'Invalid limit. Must be between 1 and 100.',
        orders: [],
        total: 0
      });
      return;
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ 
          message: 'Invalid date format. Please use YYYY-MM-DD format.',
          orders: [],
          total: 0
        });
        return;
      }
      
      if (end < start) {
        res.status(400).json({ 
          message: 'End date cannot be before start date.',
          orders: [],
          total: 0
        });
        return;
      }
    }

    // Validate amount range if provided
    if (minAmount && maxAmount) {
      const min = parseFloat(minAmount as string);
      const max = parseFloat(maxAmount as string);
      
      if (isNaN(min) || isNaN(max)) {
        res.status(400).json({ 
          message: 'Invalid amount values. Please enter valid numbers.',
          orders: [],
          total: 0
        });
        return;
      }
      
      if (max < min) {
        res.status(400).json({ 
          message: 'Maximum amount cannot be less than minimum amount.',
          orders: [],
          total: 0
        });
        return;
      }
    }

    // Prepare search criteria
    const searchCriteria = {
      startDate: startDate as string,
      endDate: endDate as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      paymentMethod: paymentMethod as string,
      status: status as string,
      userId: userId ? parseInt(userId as string) : undefined,
      productId: productId ? parseInt(productId as string) : undefined
    };

    try {
      // Execute the search with error handling
      const result = await OrderModel.advancedSearch(
        searchCriteria,
        pageNum,
        limitNum
      );
      
      console.log(`Search completed: Found ${result.total} orders`);
      
      // Send the response
      res.json({
        orders: result.orders || [],
        total: result.total || 0,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total || 0,
          pages: Math.ceil((result.total || 0) / limitNum)
        }
      });
    } catch (searchError: any) {
      console.error('Error in OrderModel.advancedSearch:', searchError);
      
      // Log the specific search error
      await createLog(
        LogLevel.ERROR,
        LogCategory.ORDER,
        'Error in OrderModel.advancedSearch',
        { error: searchError.message || 'Unknown error', stack: searchError.stack },
        req.user?.id
      );
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Error fetching orders.';
      if (searchError.code === 'ER_PARSE_ERROR') {
        errorMessage = 'Invalid search criteria. Please check your search parameters.';
      } else if (searchError.code === 'ER_TIMEOUT') {
        errorMessage = 'Search timed out. Please try with fewer search criteria.';
      } else if (searchError.code === 'ER_TOO_MANY_ROWS') {
        errorMessage = 'Too many results. Please narrow your search criteria.';
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: searchError.message || 'Unknown database error',
        orders: [],
        total: 0
      });
    }
  } catch (error: any) {
    console.error('Error in orders/search route handler:', error);
    console.error('Error stack:', error.stack);
    
    // Log the error
    await createLog(
      LogLevel.ERROR,
      LogCategory.ORDER,
      'Error in orders/search route handler',
      { error: error.message || 'Unknown error', stack: error.stack },
      req.user?.id
    );
    
    res.status(500).json({ 
      message: 'Error performing advanced order search. Please try again with different criteria.',
      error: error.message || 'Unknown server error',
      orders: [],
      total: 0
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      res.status(400).json({ message: 'Invalid order ID. Must be a number.' });
      return;
    }

    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    
    // Check permissions: cashiers can only see their own orders
    if (req.user?.role === UserRole.CASHIER && order.user_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order.' });
  }
});

// Get all orders with pagination
router.get('/', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const { orders, total } = await OrderModel.findAll(page, limit);
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders.' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const connection = await mysqlPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { items, payment_method } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      res.status(400).json({ message: 'Order items are required.' });
      return;
    }
    
    if (!payment_method || !['cash', 'card'].includes(payment_method)) {
      await connection.rollback();
      res.status(400).json({ message: 'Valid payment method (cash or card) is required.' });
      return;
    }
    
    // Calculate order total and prepare order items
    let totalAmount = 0;
    const orderItems: OrderItem[] = [];
    const inventoryUpdates = [];
    
    // Process each item in the order
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity || quantity <= 0) {
        await connection.rollback();
        res.status(400).json({ message: 'Each item must have a valid product ID and quantity.' });
        return;
      }
      
      // Get product details
      const product = await ProductModel.findById(product_id);
      if (!product) {
        await connection.rollback();
        res.status(404).json({ message: `Product with ID ${product_id} not found.` });
        return;
      }
      
      if (!product.is_available) {
        await connection.rollback();
        res.status(400).json({ message: `Product ${product.name} is not available.` });
        return;
      }
      
      // Calculate subtotal
      const subtotal = product.price * quantity;
      totalAmount += subtotal;
      
      // Add to order items
      orderItems.push({
        product_id,
        quantity,
        unit_price: product.price,
        subtotal
      });
      
      // Get recipe to update inventory
      const recipe = await ProductRecipe.findOne({ productId: product_id });
      if (recipe && recipe.ingredients.length > 0) {
        for (const ingredient of recipe.ingredients) {
          const { inventoryItemId, quantity: ingredientQuantity } = ingredient;
          
          // Calculate total quantity needed for this ingredient
          const totalQuantityNeeded = ingredientQuantity * quantity;
          
          // Check if we have enough in stock
          const inventoryItem = await InventoryModel.findById(inventoryItemId);
          if (!inventoryItem) {
            await connection.rollback();
            res.status(404).json({ 
              message: `Inventory item for recipe ingredient not found.` 
            });
            return;
          }
          
          if (inventoryItem.current_stock_level < totalQuantityNeeded) {
            await connection.rollback();
            res.status(400).json({ 
              message: `Not enough ${inventoryItem.name} in stock for this order.` 
            });
            return;
          }
          
          // Add to inventory updates (negative quantity to reduce stock)
          inventoryUpdates.push({
            id: inventoryItemId,
            quantity: -totalQuantityNeeded
          });
        }
      }
    }
    
    // Create the order
    const order: Order = {
      user_id: req.user!.id,
      total_amount: totalAmount,
      payment_method: payment_method as 'cash' | 'card',
      status: 'completed',
      items: orderItems,
      created_at: new Date()  // Explicitly set the creation date
    };
    
    const createdOrder = await OrderModel.create(order);
    
    // Update inventory
    for (const update of inventoryUpdates) {
      await InventoryModel.updateStock(update.id, update.quantity);
    }
    
    // Log order creation
    await createLog(
      LogLevel.INFO,
      LogCategory.ORDER,
      `Order #${createdOrder.id} created with ${orderItems.length} items for $${totalAmount.toFixed(2)}`,
      { orderId: createdOrder.id, items: orderItems.length, total: totalAmount },
      req.user?.id
    );
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Order created successfully',
      order: createdOrder
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.ORDER,
      'Error creating order',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error creating order.' });
  } finally {
    connection.release();
  }
});

// Update order status (manager/admin only)
router.patch('/:id/status', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ 
        message: 'Valid status (pending, completed, or cancelled) is required.' 
      });
      return;
    }
    
    // Check if order exists
    const existingOrder = await OrderModel.findById(orderId);
    if (!existingOrder) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    
    // Update order status
    const updatedOrder = await OrderModel.updateStatus(
      orderId, 
      status as 'pending' | 'completed' | 'cancelled'
    );
    
    // Log status update
    await createLog(
      LogLevel.INFO,
      LogCategory.ORDER,
      `Order #${orderId} status updated to ${status}`,
      { orderId, previousStatus: existingOrder.status, newStatus: status },
      req.user?.id
    );
    
    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.ORDER,
      'Error updating order status',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error updating order status.' });
  }
});

// Get daily sales report (manager/admin only)
router.get('/reports/daily/:date', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = req.params.date;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }
    
    // Get daily sales report
    const report = await OrderModel.getDailySalesReport(date);
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating daily sales report:', error);
    res.status(500).json({ message: 'Error generating daily sales report.' });
  }
});

// Get date range sales report (manager/admin only)
router.get('/reports/range/:startDate/:endDate', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }
    
    // Get date range sales report
    const report = await OrderModel.getDateRangeSalesReport(startDate, endDate);
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating date range sales report:', error);
    res.status(500).json({ message: 'Error generating date range sales report.' });
  }
});

// Get best-selling products (manager/admin only)
router.get('/reports/best-selling', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get best-selling products
    const products = await OrderModel.getBestSellingProducts(limit, startDate, endDate);
    
    res.json({ products });
  } catch (error) {
    console.error('Error fetching best-selling products:', error);
    res.status(500).json({ message: 'Error fetching best-selling products.' });
  }
});

export default router; 