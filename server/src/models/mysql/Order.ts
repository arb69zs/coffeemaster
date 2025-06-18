import { mysqlPool } from '../../config/database';
import { Product } from './Product';

// Order interface
export interface Order {
  id?: number;
  user_id: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
  items?: OrderItem[];
}

// Order item interface
export interface OrderItem {
  id?: number;
  order_id?: number;  // Make order_id optional since it's not known when creating a new order
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

// Order model class
export class OrderModel {
  // Create MySQL orders and order_items tables if they don't exist
  static async initTables(): Promise<void> {
    const createOrdersTableQuery = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cash', 'card') NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    const createOrderItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;
    
    try {
      await mysqlPool.query(createOrdersTableQuery);
      console.log('Orders table initialized');
      
      await mysqlPool.query(createOrderItemsTableQuery);
      console.log('Order items table initialized');
    } catch (error) {
      console.error('Error initializing orders tables:', error);
      throw error;
    }
  }

  // Create a new order with its items
  static async create(order: Order): Promise<Order> {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insert the order
      const { user_id, total_amount, payment_method, status = 'pending', items = [], created_at = new Date() } = order;
      
      const orderQuery = `
        INSERT INTO orders 
        (user_id, total_amount, payment_method, status, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [orderResult]: any = await connection.query(orderQuery, [
        user_id, total_amount, payment_method, status, created_at
      ]);
      
      const orderId = orderResult.insertId;
      
      // Insert order items
      if (items.length > 0) {
        const itemsQuery = `
          INSERT INTO order_items 
          (order_id, product_id, quantity, unit_price, subtotal) 
          VALUES ?
        `;
        
        const itemsValues = items.map(item => [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        ]);
        
        await connection.query(itemsQuery, [itemsValues]);
      }
      
      await connection.commit();
      
      // Get the created order with its items
      const createdOrder = await this.findById(orderId);
      if (!createdOrder) {
        throw new Error('Failed to retrieve created order');
      }
      
      return createdOrder;
    } catch (error) {
      await connection.rollback();
      console.error('Error creating order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find order by ID with its items
  static async findById(id: number): Promise<Order | null> {
    // Validate id
    const orderId = Number(id);
    if (isNaN(orderId)) {
      console.error('Invalid order ID:', id);
      return null;
    }

    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const itemsQuery = `
      SELECT oi.*, IFNULL(p.name, 'Unknown Product') as product_name, IFNULL(p.category, 'Unknown Category') as product_category
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    try {
      console.log(`Finding order by ID: ${orderId}`);
      
      // Get the order
      const [orderRows]: any = await mysqlPool.query(orderQuery, [orderId]);
      if (!orderRows || orderRows.length === 0) {
        console.log(`No order found with ID: ${orderId}`);
        return null;
      }
      
      const order = orderRows[0];
      
      // Get the order items
      const [itemRows]: any = await mysqlPool.query(itemsQuery, [orderId]);
      console.log(`Found ${itemRows?.length || 0} items for order ${orderId}`);
      
      // Map the items with product info
      const items = itemRows && itemRows.length > 0 ? itemRows.map((row: any) => ({
        id: row.id || 0,
        order_id: row.order_id || orderId,
        product_id: row.product_id || 0,
        quantity: row.quantity || 0,
        unit_price: row.unit_price || 0,
        subtotal: row.subtotal || 0,
        product: {
          id: row.product_id || 0,
          name: row.product_name || 'Unknown Product',
          category: row.product_category || 'Unknown Category'
        }
      })) : [];
      
      // Format dates for consistent JSON serialization
      const formattedOrder = {
        ...order,
        created_at: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
        updated_at: order.updated_at instanceof Date ? order.updated_at.toISOString() : order.updated_at,
        items
      };
      
      return formattedOrder;
    } catch (error) {
      console.error(`Error finding order by ID ${orderId}:`, error);
      throw error;
    }
  }

  // Find all orders with pagination
  static async findAll(page: number = 1, limit: number = 10): Promise<{ orders: Order[], total: number }> {
    const offset = (page - 1) * limit;
    
    const countQuery = 'SELECT COUNT(*) as total FROM orders';
    const ordersQuery = `
      SELECT o.*, IFNULL(u.username, 'Unknown User') as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    try {
      console.log(`Finding all orders with page ${page}, limit ${limit}`);
      
      // Get total count
      const [countRows]: any = await mysqlPool.query(countQuery);
      if (!countRows || countRows.length === 0) {
        console.log('Count query returned no results');
        return { orders: [], total: 0 };
      }
      
      const total = countRows[0].total || 0;
      
      // If there are no orders, return empty array
      if (total === 0) {
        console.log('No orders found');
        return { orders: [], total: 0 };
      }
      
      // Get orders for the page
      const [orderRows]: any = await mysqlPool.query(ordersQuery, [limit, offset]);
      console.log(`Found ${orderRows?.length || 0} orders`);
      
      // Format dates for consistent JSON serialization
      const orders = orderRows.map((order: any) => {
        try {
          return {
            ...order,
            created_at: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
            updated_at: order.updated_at instanceof Date ? order.updated_at.toISOString() : order.updated_at,
            items: [] // Initialize with empty items array
          };
        } catch (formatError) {
          console.error('Error formatting order:', formatError);
          // Return a minimal valid order object if there's an error
          return {
            id: order.id || 0,
            user_id: order.user_id || 0,
            user_name: order.user_name || 'Unknown',
            total_amount: order.total_amount || 0,
            payment_method: order.payment_method || 'cash',
            status: order.status || 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: []
          };
        }
      }).filter((order: Order | null) => order !== null);
      
      return {
        orders,
        total
      };
    } catch (error) {
      console.error('Error finding all orders:', error);
      // Instead of throwing, return empty results
      return { orders: [], total: 0 };
    }
  }

  // Find orders by user ID
  static async findByUserId(userId: number): Promise<Order[]> {
    const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error('Error finding orders by user ID:', error);
      throw error;
    }
  }

  // Update order status
  static async updateStatus(id: number, status: 'pending' | 'completed' | 'cancelled'): Promise<Order | null> {
    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    
    try {
      await mysqlPool.query(query, [status, id]);
      return this.findById(id);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Delete order (and its items via CASCADE)
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM orders WHERE id = ?';
    
    try {
      const [result]: any = await mysqlPool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Get daily sales report
  static async getDailySalesReport(date: string): Promise<any> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales,
        payment_method,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE DATE(created_at) = ?
      GROUP BY DATE(created_at), payment_method
    `;
    
    try {
      const [rows]: any = await mysqlPool.query(query, [date]);
      return rows;
    } catch (error) {
      console.error('Error getting daily sales report:', error);
      throw error;
    }
  }

  // Get sales report by date range
  static async getDateRangeSalesReport(startDate: string, endDate: string): Promise<any> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    try {
      const [rows]: any = await mysqlPool.query(query, [startDate, endDate]);
      return rows;
    } catch (error) {
      console.error('Error getting sales report by date range:', error);
      throw error;
    }
  }

  // Get best-selling products
  static async getBestSellingProducts(limit: number = 10, startDate?: string, endDate?: string): Promise<any> {
    let query = `
      SELECT 
        oi.product_id,
        IFNULL(p.name, 'Unknown Product') as name,
        IFNULL(p.category, 'Unknown Category') as category,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_sales
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND o.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += `
      GROUP BY oi.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    try {
      console.log('Getting best selling products with params:', params);
      const [rows]: any = await mysqlPool.query(query, params);
      console.log(`Found ${rows?.length || 0} best selling products`);
      return rows || [];
    } catch (error) {
      console.error('Error getting best selling products:', error);
      throw error;
    }
  }
  
  // Advanced search for orders
  static async advancedSearch(
    criteria: {
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      paymentMethod?: string;
      status?: string;
      userId?: number;
      productId?: number;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[], total: number }> {
    console.log('Starting advanced search with criteria:', JSON.stringify(criteria));
    
    try {
      // Default values and sanitization
      page = Math.max(1, page); // Ensure page is at least 1
      limit = Math.max(1, Math.min(100, limit)); // Ensure limit is between 1 and 100
      const offset = (page - 1) * limit;
      
      let whereConditions = ['1=1']; // Always true condition to start with
      const params: any[] = [];
      
      // Build WHERE clause based on criteria with validation
      try {
        if (criteria.startDate && criteria.endDate) {
          // Validate date format (accept both YYYY-MM-DD and ISO format)
          const startDate = new Date(criteria.startDate);
          const endDate = new Date(criteria.endDate);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Invalid date format in search criteria');
          } else {
            // Format dates consistently
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            whereConditions.push('o.created_at BETWEEN ? AND ?');
            params.push(startDate.toISOString(), endDate.toISOString());
          }
        } else if (criteria.startDate) {
          const startDate = new Date(criteria.startDate);
          if (isNaN(startDate.getTime())) {
            console.warn('Invalid start date format in search criteria');
          } else {
            startDate.setHours(0, 0, 0, 0);
            whereConditions.push('o.created_at >= ?');
            params.push(startDate.toISOString());
          }
        } else if (criteria.endDate) {
          const endDate = new Date(criteria.endDate);
          if (isNaN(endDate.getTime())) {
            console.warn('Invalid end date format in search criteria');
          } else {
            endDate.setHours(23, 59, 59, 999);
            whereConditions.push('o.created_at <= ?');
            params.push(endDate.toISOString());
          }
        }
        
        if (criteria.minAmount !== undefined && criteria.minAmount !== null) {
          if (isNaN(criteria.minAmount)) {
            console.warn('Invalid minAmount in search criteria');
          } else {
            whereConditions.push('o.total_amount >= ?');
            params.push(criteria.minAmount);
          }
        }
        
        if (criteria.maxAmount !== undefined && criteria.maxAmount !== null) {
          if (isNaN(criteria.maxAmount)) {
            console.warn('Invalid maxAmount in search criteria');
          } else {
            whereConditions.push('o.total_amount <= ?');
            params.push(criteria.maxAmount);
          }
        }
        
        if (criteria.paymentMethod) {
          whereConditions.push('o.payment_method = ?');
          params.push(criteria.paymentMethod);
        }
        
        if (criteria.status) {
          whereConditions.push('o.status = ?');
          params.push(criteria.status);
        }
        
        if (criteria.userId) {
          if (isNaN(criteria.userId)) {
            console.warn('Invalid userId in search criteria');
          } else {
            whereConditions.push('o.user_id = ?');
            params.push(criteria.userId);
          }
        }
      } catch (validationError) {
        console.error('Error validating search criteria:', validationError);
        // Continue with any valid criteria we have
      }
      
      // For product ID, we need to join with order_items
      let joinOrderItems = false;
      if (criteria.productId && !isNaN(criteria.productId)) {
        joinOrderItems = true;
        whereConditions.push('oi.product_id = ?');
        params.push(criteria.productId);
      }
      
      // Build the query
      let countQuery = 'SELECT COUNT(DISTINCT o.id) as total FROM orders o';
      let ordersQuery = `
        SELECT DISTINCT o.*, IFNULL(u.username, 'Unknown User') as user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
      `;
      
      // Add join if needed
      if (joinOrderItems) {
        countQuery += ' LEFT JOIN order_items oi ON o.id = oi.order_id';
        ordersQuery += ' LEFT JOIN order_items oi ON o.id = oi.order_id';
      }
      
      // Add WHERE clause
      const whereClause = whereConditions.join(' AND ');
      countQuery += ` WHERE ${whereClause}`;
      ordersQuery += ` WHERE ${whereClause}`;
      
      // Add sorting and pagination
      ordersQuery += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      
      // Clone params for count query (without limit and offset)
      const countParams = [...params];
      
      // Add limit and offset to params for orders query
      params.push(limit, offset);
      
      console.log('Count query:', countQuery);
      console.log('Orders query:', ordersQuery);
      console.log('Query parameters:', JSON.stringify(params));
      
      try {
        // Get total count
        console.log('Executing count query...');
        const [countRows]: any = await mysqlPool.query(countQuery, countParams);
        console.log('Count query result:', JSON.stringify(countRows));
        
        // Handle case where countRows might be empty
        if (!countRows || countRows.length === 0) {
          console.log('Count query returned no results, returning empty result');
          return { orders: [], total: 0 };
        }
        
        const total = countRows[0].total || 0;
        
        // If there are no orders, return empty array
        if (total === 0) {
          console.log('No orders found, returning empty result');
          return { orders: [], total: 0 };
        }
        
        // Get orders for the page
        console.log('Executing orders query...');
        const [orderRows]: any = await mysqlPool.query(ordersQuery, params);
        console.log(`Found ${orderRows?.length || 0} orders`);
        
        // If no orders were found (which shouldn't happen since total > 0), return empty array
        if (!orderRows || orderRows.length === 0) {
          console.log('Orders query returned no results, returning empty result');
          return { orders: [], total };
        }
        
        // Format the orders with proper date handling
        const formattedOrders = orderRows.map((order: any) => {
          try {
            return {
              ...order,
              created_at: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
              updated_at: order.updated_at instanceof Date ? order.updated_at.toISOString() : order.updated_at,
              items: [] // Initialize with empty items array
            };
          } catch (formatError) {
            console.error('Error formatting order:', formatError);
            // Return a minimal valid order object if there's an error
            return {
              id: order.id || 0,
              user_id: order.user_id || 0,
              user_name: order.user_name || 'Unknown',
              total_amount: order.total_amount || 0,
              payment_method: order.payment_method || 'cash',
              status: order.status || 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: []
            };
          }
        });
        
        return { orders: formattedOrders, total };
      } catch (queryError) {
        console.error('Error executing search queries:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      throw error;
    }
  }
} 