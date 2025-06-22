import api, { authAPI, productsAPI, inventoryAPI, ordersAPI, usersAPI, reportsAPI, logsAPI } from './api';

// Export the real API services
export const apiService = api;
export const products = productsAPI;
export const orders = ordersAPI;
export const inventory = inventoryAPI;
export const auth = authAPI;
export const users = usersAPI;
export const reports = reportsAPI;
export const logs = logsAPI; 