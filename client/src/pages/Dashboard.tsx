import React, { useState, useEffect } from 'react';
import { ordersAPI, inventoryAPI, productsAPI } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Grid as MuiGrid
} from '@mui/material';
import { Grid } from '../components/Grid';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocalCafe as LocalCafeIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';

// Define interfaces for API response types
interface DailySalesReportItem {
  date?: string;
  order_count: string | number;
  total_sales: string | number;
  payment_method?: string;
  completed_orders?: number;
  cancelled_orders?: number;
}

interface BestSellingProduct {
  id?: number;
  product_id?: number;
  name: string;
  category?: string;
  total_quantity: number;
  total_sales: string | number;
}

interface InventoryItem {
  id: number;
  name: string;
  current_stock_level: number;
  unit: string;
  minimum_stock_level: number;
  cost_per_unit?: number;
}

const Dashboard: React.FC = () => {
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard metrics
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [topProducts, setTopProducts] = useState<BestSellingProduct[]>([]);

  // Helper function to format current date
  function getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch today's sales data
      const today = getCurrentDate();
      console.log('Fetching daily sales report for:', today);
      
      try {
        const salesData = await ordersAPI.getDailySalesReport(today) as DailySalesReportItem[];
        console.log('Daily sales data:', salesData);
        
        if (salesData && Array.isArray(salesData)) {
          // Calculate totals
          const totalSales = salesData.reduce((sum, item) => {
            const salesValue = typeof item.total_sales === 'string' 
              ? parseFloat(item.total_sales) 
              : (item.total_sales || 0);
            return sum + salesValue;
          }, 0);
          
          const totalOrders = salesData.reduce((sum, item) => {
            const orderCount = typeof item.order_count === 'string'
              ? parseInt(item.order_count)
              : (item.order_count || 0);
            return sum + orderCount;
          }, 0);
          
          setTodaySales(totalSales);
          setTodayOrders(totalOrders);
        } else {
          console.log('No sales data available for today');
          setTodaySales(0);
          setTodayOrders(0);
        }
      } catch (salesError) {
        console.error('Error fetching sales data:', salesError);
        setTodaySales(0);
        setTodayOrders(0);
      }
      
      // Fetch all inventory items and filter low stock on client side
      try {
        console.log('Fetching low stock items');
        const lowStock = await inventoryAPI.getLowStock();
        console.log(`Found ${lowStock.length} low stock items`);
        setLowStockItems(lowStock);
      } catch (inventoryError) {
        console.error('Error fetching low stock items:', inventoryError);
        setLowStockItems([]);
      }
      
      // Fetch top selling products
      try {
        console.log('Fetching best selling products');
        const bestSelling = await ordersAPI.getBestSellingProducts(5) as BestSellingProduct[];
        console.log('Best selling products:', bestSelling);
        setTopProducts(bestSelling || []);
      } catch (productsError) {
        console.error('Error fetching best selling products:', productsError);
        setTopProducts([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to CoffeeMaster! Here's an overview of your business.
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6" component="div">
                  Today's Sales
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(todaySales)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6" component="div">
                  Today's Orders
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {todayOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalCafeIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6" component="div">
                  Top Products
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {topProducts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon color="error" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6" component="div">
                  Low Stock Items
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: lowStockItems.length > 0 ? 'error.main' : 'success.main' }}>
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dashboard Content */}
      <Grid container spacing={3}>
        {/* Low Stock Items */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Low Stock Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {lowStockItems.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography>All inventory items are well stocked!</Typography>
              </Box>
            ) : (
              <List>
                {lowStockItems.slice(0, 5).map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={item.name}
                      secondary={`Current: ${item.current_stock_level} ${item.unit} (Min: ${item.minimum_stock_level} ${item.unit})`}
                    />
                    <WarningIcon color="error" />
                  </ListItem>
                ))}
                {lowStockItems.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`${lowStockItems.length - 5} more items need attention`}
                      secondary="Visit Inventory page for details"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Top Selling Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Selling Products
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {topProducts.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography>No sales data available yet.</Typography>
              </Box>
            ) : (
              <List>
                {topProducts.map((product, index) => {
                  const salesValue = typeof product.total_sales === 'string'
                    ? parseFloat(product.total_sales)
                    : (product.total_sales || 0);
                    
                  return (
                    <ListItem key={product.id || index} divider={index < topProducts.length - 1}>
                      <ListItemText
                        primary={`${index + 1}. ${product.name}`}
                        secondary={`${product.total_quantity} sold - ${formatCurrency(salesValue)}`}
                      />
                      <TrendingUpIcon color="success" />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 