// User types
export enum UserRole {
  CASHIER = 'cashier',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Product types
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
}

export interface RecipeIngredient {
  inventoryItemId: number;
  quantity: number;
}

export interface ProductRecipe {
  productId: number;
  name: string;
  ingredients: RecipeIngredient[];
}

// Inventory types
export interface InventoryItem {
  id: number;
  name: string;
  current_stock_level: number;
  unit: string;
  minimum_stock_level: number;
  cost_per_unit?: number;
  supplier_id?: number;
}

// Order types
export interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id?: number;
  user_id: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  cash_received?: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  items?: OrderItem[];
}

// Cart types for POS
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Report types
export interface DailySalesReport {
  date: string;
  order_count: number;
  total_sales: number;
  payment_method: string;
  completed_orders: number;
  cancelled_orders: number;
}

export interface SalesReportByDate {
  date: string;
  order_count: number;
  total_sales: number;
}

export interface BestSellingProduct {
  id: number;
  name: string;
  category: string;
  total_quantity: number;
  total_sales: number;
}

// System Log types
export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum LogCategory {
  AUTH = 'auth',
  ORDER = 'order',
  INVENTORY = 'inventory',
  PRODUCT = 'product',
  SYSTEM = 'system'
}

export interface SystemLog {
  _id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogSummary {
  byCategory: { _id: LogCategory, count: number }[];
  byLevel: { _id: LogLevel, count: number }[];
  byDay: { _id: string, count: number }[];
} 