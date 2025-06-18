import { mysqlPool } from '../../config/database';

// Inventory item interface
export interface InventoryItem {
  id?: number;
  name: string;
  current_stock_level: number;
  unit: string;
  minimum_stock_level: number;
  cost_per_unit?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Inventory model class
export class InventoryModel {
  // Create MySQL inventory_items table if it doesn't exist
  static async initTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        current_stock_level DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(20) NOT NULL,
        minimum_stock_level DECIMAL(10, 2) NOT NULL DEFAULT 0,
        cost_per_unit DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await mysqlPool.query(createTableQuery);
      console.log('Inventory items table initialized');
    } catch (error) {
      console.error('Error initializing inventory items table:', error);
      throw error;
    }
  }

  // Create a new inventory item
  static async create(item: InventoryItem): Promise<InventoryItem> {
    const { name, current_stock_level, unit, minimum_stock_level, cost_per_unit } = item;
    
    const query = `
      INSERT INTO inventory_items 
      (name, current_stock_level, unit, minimum_stock_level, cost_per_unit) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      const [result]: any = await mysqlPool.query(query, [
        name, current_stock_level, unit, minimum_stock_level, cost_per_unit
      ]);
      
      return { ...item, id: result.insertId };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Find inventory item by ID
  static async findById(id: number): Promise<InventoryItem | null> {
    const query = 'SELECT * FROM inventory_items WHERE id = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [id]);
      if (rows.length === 0) return null;
      
      return rows[0];
    } catch (error) {
      console.error('Error finding inventory item by ID:', error);
      throw error;
    }
  }

  // Find all inventory items
  static async findAll(): Promise<InventoryItem[]> {
    const query = 'SELECT * FROM inventory_items';
    
    try {
      const [rows]: any = await mysqlPool.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding all inventory items:', error);
      throw error;
    }
  }

  // Find low stock items
  static async findLowStock(): Promise<InventoryItem[]> {
    const query = 'SELECT * FROM inventory_items WHERE current_stock_level < minimum_stock_level';
    
    try {
      console.log('Executing low stock query:', query);
      const [rows]: any = await mysqlPool.query(query);
      console.log('Low stock query results:', rows.map((item: InventoryItem) => ({
        name: item.name,
        current: item.current_stock_level,
        min: item.minimum_stock_level,
        unit: item.unit
      })));
      return rows;
    } catch (error) {
      console.error('Error finding low stock items:', error);
      throw error;
    }
  }

  // Update inventory item
  static async update(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    // Don't allow updating the ID
    const { id: _, ...validUpdates } = updates;
    
    // Build the query dynamically based on what's being updated
    const entries = Object.entries(validUpdates);
    if (entries.length === 0) return this.findById(id);
    
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([_, value]) => value);
    
    const query = `UPDATE inventory_items SET ${setClause} WHERE id = ?`;
    
    try {
      await mysqlPool.query(query, [...values, id]);
      return this.findById(id);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Update stock level (increment or decrement)
  static async updateStock(id: number, quantity: number): Promise<InventoryItem | null> {
    const query = `
      UPDATE inventory_items 
      SET current_stock_level = current_stock_level + ? 
      WHERE id = ?
    `;
    
    try {
      await mysqlPool.query(query, [quantity, id]);
      return this.findById(id);
    } catch (error) {
      console.error('Error updating stock level:', error);
      throw error;
    }
  }

  // Delete inventory item
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM inventory_items WHERE id = ?';
    
    try {
      const [result]: any = await mysqlPool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Reset inventory table
  static async resetTable(): Promise<void> {
    try {
      // Drop the table
      await mysqlPool.query('DROP TABLE IF EXISTS inventory_items');
      console.log('Inventory items table dropped');
      
      // Recreate the table
      await this.initTable();
      console.log('Inventory items table recreated');
    } catch (error) {
      console.error('Error resetting inventory table:', error);
      throw error;
    }
  }

  // Find inventory item by name
  static async findByName(name: string): Promise<InventoryItem | null> {
    const query = 'SELECT * FROM inventory_items WHERE name = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [name]);
      if (rows.length === 0) return null;
      
      return rows[0];
    } catch (error) {
      console.error('Error finding inventory item by name:', error);
      throw error;
    }
  }
} 