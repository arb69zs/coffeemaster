// Re-export all types from types/index.ts
export * from './types/index'; 

// User types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier'
}

export interface User {
  id: number;
  username: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  active?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Order item interface
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    category: string;
  };
}

// Order interface
export interface Order {
  id: number;
  user_id: number;
  user_name: string;
  total_amount: number;
  payment_method: 'cash' | 'card';
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  cash_received?: number;  // Optional field for cash payments
  items: OrderItem[];
} 