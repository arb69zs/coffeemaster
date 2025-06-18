import { mysqlPool } from '../../config/database';
import bcrypt from 'bcrypt';

// User roles enum
export enum UserRole {
  CASHIER = 'cashier',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

// User interface
export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User model class
export class UserModel {
  // Create MySQL users table if it doesn't exist
  static async initTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        role ENUM('cashier', 'manager', 'admin') NOT NULL DEFAULT 'cashier',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        lastLogin DATETIME NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await mysqlPool.query(createTableQuery);
      console.log('Users table initialized');
    } catch (error) {
      console.error('Error initializing users table:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(user: User): Promise<User> {
    const { username, password, email, firstName, lastName, role, active } = user;
    
    // Hash the password if it's not already hashed
    let hashedPassword = password;
    if (!password.startsWith('$2b$')) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }
    
    const query = 'INSERT INTO users (username, password, email, firstName, lastName, role, active) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    try {
      const [result]: any = await mysqlPool.query(query, [username, hashedPassword, email, firstName, lastName, role, active !== false]);
      return { ...user, id: result.insertId, password: '[HIDDEN]' };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find all users
  static async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY username';
    
    try {
      const [rows]: any = await mysqlPool.query(query);
      
      // Hide passwords in the result
      return rows.map((user: User) => ({
        ...user,
        password: '[HIDDEN]'
      }));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [id]);
      if (rows.length === 0) return null;
      
      const user = rows[0];
      return { ...user, password: '[HIDDEN]' };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = ?';
    
    try {
      const [rows]: any = await mysqlPool.query(query, [username]);
      if (rows.length === 0) return null;
      
      return rows[0];
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Update user
  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    // Don't allow updating the ID
    const { id: _, ...validUpdates } = updates;
    
    // If password is being updated, hash it
    if (validUpdates.password && !validUpdates.password.startsWith('$2b$')) {
      const saltRounds = 10;
      validUpdates.password = await bcrypt.hash(validUpdates.password, saltRounds);
    }
    
    // Build the query dynamically based on what's being updated
    const entries = Object.entries(validUpdates);
    if (entries.length === 0) return this.findById(id);
    
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([_, value]) => value);
    
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    try {
      await mysqlPool.query(query, [...values, id]);
      return this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    
    try {
      const [result]: any = await mysqlPool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
} 