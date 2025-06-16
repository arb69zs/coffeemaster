import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import { UserRole } from './types';
import { Box, Typography, Paper, Container } from '@mui/material';
import './styles/App.css';

// Import pages directly
import InventoryPage from './pages/Inventory';
import ProductsPage from './pages/Products';
import OrdersPage from './pages/Orders';
import ReportsPage from './pages/Reports';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';
import LogsPage from './pages/Logs';

const Unauthorized = () => (
  <Container maxWidth="sm" sx={{ mt: 8 }}>
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" color="error" gutterBottom>
        Unauthorized
      </Typography>
      <Typography variant="body1">
        You don't have permission to access this page. Please contact an administrator if you need access.
      </Typography>
    </Paper>
  </Container>
);

const NotFound = () => (
  <Container maxWidth="sm" sx={{ mt: 8 }}>
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        404 - Not Found
      </Typography>
      <Typography variant="body1">
        The page you're looking for doesn't exist or has been moved.
      </Typography>
    </Paper>
  </Container>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Manager and Admin only routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} />}>
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>
                
                {/* Admin only routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                </Route>
              </Route>
            </Route>
            
            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
