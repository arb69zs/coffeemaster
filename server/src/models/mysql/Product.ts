import { mysqlPool } from '../../config/database';

// Product interface
export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Product model class
export class ProductModel {
  // Create MySQL products table if it doesn't exist
  static async initTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await mysqlPool.query(createTableQuery);
      console.log('Products table initialized');
    } catch (error) {
      console.error('Error initializing products table:', error);
      throw error;
    }
  }

  // Create a new product
  static async create(product: Product): Promise<Product> {
    const { name, price, category, description, image_url, is_available } = product;
    
    const query = `
      INSERT INTO products 
      (name, price, category, description, image_url, is_available) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result]: any = await mysqlPool.query(query, [
        name, price, category, description, image_url, is_available
      ]);
      
      return { ...product, id: result.insertId };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Find product by ID
  static async findById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [id]);
      if (rows.length === 0) return null;
      
      return rows[0];
    } catch (error) {
      console.error('Error finding product by ID:', error);
      throw error;
    }
  }

  // Find all products
  static async findAll(): Promise<Product[]> {
    const query = 'SELECT * FROM products';
    
    try {
      const [rows]: any = await mysqlPool.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding all products:', error);
      throw error;
    }
  }

  // Find products by category
  static async findByCategory(category: string): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE category = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [category]);
      return rows;
    } catch (error) {
      console.error('Error finding products by category:', error);
      throw error;
    }
  }

  // Update product
  static async update(id: number, updates: Partial<Product>): Promise<Product | null> {
    // Don't allow updating the ID
    const { id: _, ...validUpdates } = updates;
    
    // Build the query dynamically based on what's being updated
    const entries = Object.entries(validUpdates);
    if (entries.length === 0) return this.findById(id);
    
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([_, value]) => value);
    
    const query = `UPDATE products SET ${setClause} WHERE id = ?`;
    
    try {
      await mysqlPool.query(query, [...values, id]);
      return this.findById(id);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = ?';
    
    try {
      const [result]: any = await mysqlPool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
} 