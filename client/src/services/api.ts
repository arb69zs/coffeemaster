import axios from 'axios';
import { 
  User, 
  Product, 
  ProductRecipe, 
  InventoryItem, 
  Order, 
  DailySalesReport,
  SalesReportByDate,
  BestSellingProduct
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { username, password, role });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data.products;
  },
  getById: async (id: number): Promise<{ product: Product, recipe: ProductRecipe | null }> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${category}`);
    return response.data.products;
  },
  create: async (product: Partial<Product>, recipe?: { ingredients: { inventoryItemId: number, quantity: number }[] }) => {
    const response = await api.post('/products', { ...product, recipe });
    return response.data;
  },
  update: async (id: number, product: Partial<Product>, recipe?: { ingredients: { inventoryItemId: number, quantity: number }[] }) => {
    const response = await api.put(`/products/${id}`, { ...product, recipe });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  getRecipe: async (id: number): Promise<ProductRecipe> => {
    const response = await api.get(`/products/${id}/recipe`);
    return response.data.recipe;
  }
};

// Inventory API
export const inventoryAPI = {
  getAll: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory');
    return response.data.items;
  },
  getById: async (id: number): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data.item;
  },
  create: async (item: Partial<InventoryItem>) => {
    const response = await api.post('/inventory', item);
    return response.data;
  },
  update: async (id: number, item: Partial<InventoryItem>) => {
    const response = await api.put(`/inventory/${id}`, item);
    return response.data;
  },
  updateStock: async (id: number, quantity: number) => {
    const response = await api.patch(`/inventory/${id}/stock`, { quantity });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory/status/low');
    return response.data.items;
  }
};

// Orders API
export const ordersAPI = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/orders?page=${page}&limit=${limit}`);
    return response.data;
  },
  getById: async (id: number): Promise<Order> => {
    try {
      // Ensure id is a valid number
      const orderId = Number(id);
      if (isNaN(orderId)) {
        throw new Error('Invalid order ID');
      }

      const response = await api.get(`/orders/${orderId}`);
      const order = response.data.order || response.data;
      
      // Ensure all required properties are present and properly typed
      return {
        id: Number(order.id),
        user_id: Number(order.user_id),
        user_name: order.user_name || 'Unknown User',
        total_amount: Number(order.total_amount),
        payment_method: order.payment_method as 'cash' | 'card',
        status: order.status as 'pending' | 'completed' | 'cancelled',
        created_at: order.created_at,
        updated_at: order.updated_at || order.created_at,
        cash_received: order.cash_received ? Number(order.cash_received) : undefined,
        items: Array.isArray(order.items) ? order.items.map((item: any) => ({
          id: Number(item.id),
          order_id: Number(item.order_id),
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          product: item.product ? {
            id: Number(item.product.id),
            name: item.product.name,
            category: item.product.category
          } : undefined
        })) : []
      };
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },
  create: async (
    items: { product_id: number, quantity: number }[], 
    paymentDetails: { paymentMethod: 'cash' | 'card', cashReceived?: number }
  ) => {
    const response = await api.post('/orders', { 
      items, 
      payment_method: paymentDetails.paymentMethod,
      cash_received: paymentDetails.cashReceived
    });
    return response.data;
  },
  updateStatus: async (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  advancedSearch: async (criteria: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
    status?: string;
    userId?: number;
    productId?: number;
    page?: number;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      
      // Only append parameters that have values
      if (criteria.startDate) params.append('startDate', criteria.startDate);
      if (criteria.endDate) params.append('endDate', criteria.endDate);
      if (criteria.minAmount !== undefined) params.append('minAmount', criteria.minAmount.toString());
      if (criteria.maxAmount !== undefined) params.append('maxAmount', criteria.maxAmount.toString());
      if (criteria.paymentMethod) params.append('paymentMethod', criteria.paymentMethod);
      if (criteria.status) params.append('status', criteria.status);
      if (criteria.userId) params.append('userId', criteria.userId.toString());
      if (criteria.productId) params.append('productId', criteria.productId.toString());
      if (criteria.page) params.append('page', criteria.page.toString());
      if (criteria.limit) params.append('limit', criteria.limit.toString());
      
      const url = `/orders/search?${params.toString()}`;
      console.log('Making API request to:', url);
      
      const response = await api.get(url);
      console.log('API response received:', response.status);
      
      if (!response.data) {
        throw new Error('No data received from the server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error in advancedSearch API call:', error);
      
      // Enhance error message based on response
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Error fetching orders';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },
  getDailySalesReport: async (date: string): Promise<DailySalesReport[]> => {
    const response = await api.get(`/orders/reports/daily/${date}`);
    return response.data.report;
  },
  getSalesReportByDateRange: async (startDate: string, endDate: string): Promise<SalesReportByDate[]> => {
    const response = await api.get(`/orders/reports/range/${startDate}/${endDate}`);
    return response.data.report;
  },
  getBestSellingProducts: async (limit: number = 10, startDate?: string, endDate?: string): Promise<BestSellingProduct[]> => {
    let url = `/orders/reports/best-selling?limit=${limit}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data.products;
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data.users;
  },
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },
  create: async (user: Partial<User>) => {
    const response = await api.post('/users', user);
    return response.data;
  },
  update: async (id: number, user: Partial<User>) => {
    const response = await api.put(`/users/${id}`, user);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  resetPassword: async (id: number, newPassword: string) => {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  getInventoryValueReport: async () => {
    const response = await api.get('/reports/inventory-value');
    return response.data.report;
  },
  getProductCategoriesReport: async () => {
    const response = await api.get('/reports/product-categories');
    return response.data.report;
  },
  getUserActivityReport: async () => {
    const response = await api.get('/reports/user-activity');
    return response.data.report;
  }
};

// Logs API
export const logsAPI = {
  getLogs: async (params: { 
    level?: string, 
    category?: string, 
    startDate?: string, 
    endDate?: string, 
    limit?: number, 
    page?: number 
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.level) queryParams.append('level', params.level);
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    
    const response = await api.get(`/logs?${queryParams.toString()}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/logs/categories');
    return response.data.categories;
  },
  getLevels: async () => {
    const response = await api.get('/logs/levels');
    return response.data.levels;
  },
  getSummary: async () => {
    const response = await api.get('/logs/summary');
    return response.data.summary;
  }
};

export default api; 