import React, { useState, useEffect } from 'react';
import { orders as ordersAPI, reports as reportsAPI, inventory as inventoryAPI, products as productsAPI, users as usersAPI } from '../services/config';
import { 
  DailySalesReport, 
  SalesReportByDate,
  BestSellingProduct,
  User
} from '../types';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  DoughnutController
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Grid } from '../components/Grid';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  DoughnutController
);

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  // State for tab management
  const [tabValue, setTabValue] = useState(0);

  // State for date range report
  const [startDateStr, setStartDateStr] = useState<string>(getOneWeekAgoDate());
  const [endDateStr, setEndDateStr] = useState<string>(getCurrentDate());
  const [dateRangeReports, setDateRangeReports] = useState<SalesReportByDate[]>([]);

  // State for daily report
  const [dailyReportDateStr, setDailyReportDateStr] = useState<string>(getCurrentDate());
  const [dailyReport, setDailyReport] = useState<DailySalesReport[]>([]);

  // State for best selling products
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [productLimit, setProductLimit] = useState<number>(5);

  // State for inventory report
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  
  // State for product categories report
  const [productCategoriesReport, setProductCategoriesReport] = useState<any[]>([]);
  
  // State for user activity report
  const [userActivityReport, setUserActivityReport] = useState<any[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for dates
  function getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getOneWeekAgoDate(): string {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const year = oneWeekAgo.getFullYear();
    const month = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
    const day = String(oneWeekAgo.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch date range reports
  const fetchDateRangeReports = async () => {
    if (!startDateStr || !endDateStr) {
      setError('Please select valid start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ordersAPI.getSalesReportByDateRange(
        startDateStr,
        endDateStr
      );
      
      setDateRangeReports(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch sales report. Please try again.');
      setLoading(false);
    }
  };

  // Fetch daily report
  const fetchDailyReport = async () => {
    if (!dailyReportDateStr) {
      setError('Please select a valid date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ordersAPI.getDailySalesReport(dailyReportDateStr);
      setDailyReport(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch daily report. Please try again.');
      setLoading(false);
    }
  };

  // Fetch best selling products
  const fetchBestSellingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ordersAPI.getBestSellingProducts(productLimit);
      setBestSellingProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch best selling products. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch inventory report
  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!reportsAPI) {
        setError('Reports API is not available');
        setLoading(false);
        return;
      }
      
      const data = await reportsAPI.getInventoryValueReport();
      setInventoryReport(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch inventory report. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch product categories report
  const fetchProductCategoriesReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!reportsAPI) {
        setError('Reports API is not available');
        setLoading(false);
        return;
      }
      
      const data = await reportsAPI.getProductCategoriesReport();
      setProductCategoriesReport(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch product categories report. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch user activity report
  const fetchUserActivityReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!reportsAPI) {
        setError('Reports API is not available');
        setLoading(false);
        return;
      }
      
      const data = await reportsAPI.getUserActivityReport();
      setUserActivityReport(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user activity report. Please try again.');
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (tabValue === 0) {
      fetchDateRangeReports();
    } else if (tabValue === 1) {
      fetchDailyReport();
    } else if (tabValue === 2) {
      fetchBestSellingProducts();
    } else if (tabValue === 3) {
      fetchInventoryReport();
    } else if (tabValue === 4) {
      fetchProductCategoriesReport();
    } else if (tabValue === 5) {
      fetchUserActivityReport();
    }
  }, [tabValue]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Prepare chart data for sales by date range
  const salesByDateChartData = {
    labels: dateRangeReports.map(item => item.date),
    datasets: [
      {
        label: 'Sales Amount',
        data: dateRangeReports.map(item => item.total_sales),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Order Count',
        data: dateRangeReports.map(item => item.order_count),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  // Prepare chart data for best selling products
  const bestSellingChartData = {
    labels: bestSellingProducts.map(item => item.name),
    datasets: [
      {
        label: 'Sales Amount',
        data: bestSellingProducts.map(item => item.total_sales),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(210, 199, 199, 0.6)',
        ],
        borderWidth: 1,
      }
    ],
  };

  // Prepare chart data for payment methods (from daily report)
  const paymentMethodChartData = {
    labels: ['Cash', 'Card'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [
          dailyReport.filter(item => item.payment_method === 'cash')
            .reduce((sum, item) => {
              const salesValue = typeof item.total_sales === 'string' 
                ? parseFloat(item.total_sales) 
                : (item.total_sales || 0);
              return sum + salesValue;
            }, 0),
          dailyReport.filter(item => item.payment_method === 'card')
            .reduce((sum, item) => {
              const salesValue = typeof item.total_sales === 'string' 
                ? parseFloat(item.total_sales) 
                : (item.total_sales || 0);
              return sum + salesValue;
            }, 0)
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      }
    ],
  };
  
  // Prepare chart data for product categories
  const productCategoriesChartData = {
    labels: productCategoriesReport.map(item => item.category),
    datasets: [
      {
        label: 'Product Count',
        data: productCategoriesReport.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      }
    ],
  };
  
  // Prepare chart data for inventory status
  const inventoryStatusChartData = inventoryReport ? {
    labels: ['Normal Stock', 'Low Stock'],
    datasets: [
      {
        label: 'Inventory Status',
        data: [
          inventoryReport.summary.total_items - inventoryReport.summary.low_stock_items,
          inventoryReport.summary.low_stock_items
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderWidth: 1,
      }
    ],
  } : null;
  
  // Prepare chart data for user activity
  const userActivityChartData = {
    labels: userActivityReport.map(item => item.username),
    datasets: [
      {
        label: 'Orders Processed',
        data: userActivityReport.map(item => item.orders_count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ],
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View sales reports, analyze trends, and track performance metrics.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="report tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Sales by Date Range" />
          <Tab label="Daily Report" />
          <Tab label="Best Selling Products" />
          <Tab label="Inventory Value" />
          <Tab label="Product Categories" />
          <Tab label="User Activity" />
        </Tabs>

        {/* Sales by Date Range Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchDateRangeReports}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {dateRangeReports.length > 0 && (
              <>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Sales Trend
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line 
                        data={salesByDateChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" gutterBottom>
                        Total Sales:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {formatCurrency(dateRangeReports.reduce((sum, item) => {
                            const salesValue = typeof item.total_sales === 'string' 
                              ? parseFloat(item.total_sales) 
                              : (item.total_sales || 0);
                            return sum + salesValue;
                          }, 0))}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Total Orders:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {dateRangeReports.reduce((sum, item) => sum + item.order_count, 0)}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Average Order Value:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {formatCurrency(
                            dateRangeReports.reduce((sum, item) => sum + item.total_sales, 0) / 
                            dateRangeReports.reduce((sum, item) => sum + item.order_count, 0) || 0
                          )}
                        </Typography>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Sales</TableCell>
                          <TableCell align="right">Average Order</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dateRangeReports.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell component="th" scope="row">
                              {row.date}
                            </TableCell>
                            <TableCell align="right">{row.order_count}</TableCell>
                            <TableCell align="right">{formatCurrency(
                              typeof row.total_sales === 'string' 
                                ? parseFloat(row.total_sales) 
                                : (row.total_sales || 0)
                            )}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                (typeof row.total_sales === 'string' 
                                  ? parseFloat(row.total_sales) 
                                  : (row.total_sales || 0)) / 
                                (typeof row.order_count === 'string'
                                  ? parseInt(row.order_count)
                                  : (row.order_count || 1))
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Daily Report Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Select Date"
                      type="date"
                      value={dailyReportDateStr}
                      onChange={(e) => setDailyReportDateStr(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchDailyReport}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {dailyReport.length > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Payment Methods
                    </Typography>
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '80%', maxWidth: 300 }}>
                        <Pie 
                          data={paymentMethodChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Summary
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" gutterBottom>
                        Total Sales:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {formatCurrency(dailyReport.reduce((sum, item) => {
                            const salesValue = typeof item.total_sales === 'string' 
                              ? parseFloat(item.total_sales) 
                              : (item.total_sales || 0);
                            return sum + salesValue;
                          }, 0))}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Total Orders:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {dailyReport.reduce((sum, item) => sum + item.order_count, 0)}
                        </Typography>
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Completed Orders:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'success.main' }}>
                          {dailyReport.reduce((sum, item) => sum + item.completed_orders, 0)}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Cancelled Orders:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'error.main' }}>
                          {dailyReport.reduce((sum, item) => sum + item.cancelled_orders, 0)}
                        </Typography>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Payment Method</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Sales</TableCell>
                          <TableCell align="right">Completed</TableCell>
                          <TableCell align="right">Cancelled</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dailyReport.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {row.payment_method === 'cash' ? 'Cash' : 'Card'}
                            </TableCell>
                            <TableCell align="right">{row.order_count}</TableCell>
                            <TableCell align="right">{formatCurrency(row.total_sales)}</TableCell>
                            <TableCell align="right">{row.completed_orders}</TableCell>
                            <TableCell align="right">{row.cancelled_orders}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Best Selling Products Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Number of Products"
                      type="number"
                      value={productLimit}
                      onChange={(e) => setProductLimit(Number(e.target.value))}
                      inputProps={{ min: 1, max: 20 }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchBestSellingProducts}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {bestSellingProducts.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Top {bestSellingProducts.length} Best Selling Products
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <Bar 
                        data={bestSellingChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Quantity Sold</TableCell>
                          <TableCell align="right">Total Sales</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bestSellingProducts.map((product, index) => (
                          <TableRow key={product.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell align="right">{product.total_quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(product.total_sales)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
        
        {/* Inventory Value Report Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6">
                      Inventory Value Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View the current value of your inventory items
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchInventoryReport}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Grid>
            ) : inventoryReport ? (
              <>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Inventory Items by Value
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Current Stock</TableCell>
                            <TableCell align="right">Cost Per Unit</TableCell>
                            <TableCell align="right">Total Value</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inventoryReport.items?.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">{item.current_stock} {item.unit}</TableCell>
                              <TableCell align="right">{formatCurrency(item.cost_per_unit)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total_value)}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={item.status === 'low' ? 'Low Stock' : 'Normal'} 
                                  color={item.status === 'low' ? 'error' : 'success'} 
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Inventory Summary
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {inventoryStatusChartData && (
                        <Doughnut 
                          data={inventoryStatusChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body1" gutterBottom>
                        Total Inventory Value:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {formatCurrency(inventoryReport.summary?.total_value || 0)}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Total Items:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
                          {inventoryReport.summary?.total_items || 0}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Low Stock Items:
                        <Typography component="span" variant="h6" sx={{ ml: 1, color: 'error.main' }}>
                          {inventoryReport.summary?.low_stock_items || 0}
                        </Typography>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Click "Generate Report" to view inventory value report
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Product Categories Report Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6">
                      Product Categories Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View product distribution by category
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchProductCategoriesReport}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {productCategoriesReport.length > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Products by Category
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Pie 
                        data={productCategoriesChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Category Details
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Products</TableCell>
                            <TableCell align="right">Available</TableCell>
                            <TableCell align="right">Avg. Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productCategoriesReport.map((category) => (
                            <TableRow key={category.category}>
                              <TableCell>{category.category}</TableCell>
                              <TableCell align="right">{category.count}</TableCell>
                              <TableCell align="right">{category.available_count}</TableCell>
                              <TableCell align="right">{formatCurrency(category.avg_price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
        
        {/* User Activity Report Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6">
                      User Activity Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View user activity and performance metrics
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      onClick={fetchUserActivityReport}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {userActivityReport.length > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Orders Processed by User
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar 
                        data={userActivityChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      User Performance
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell align="right">Orders</TableCell>
                            <TableCell align="right">Sales</TableCell>
                            <TableCell>Last Active</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userActivityReport.map((user) => (
                            <TableRow key={user.user_id}>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell align="right">{user.orders_count}</TableCell>
                              <TableCell align="right">{formatCurrency(
                                typeof user.total_sales === 'string' 
                                  ? parseFloat(user.total_sales) 
                                  : (user.total_sales || 0)
                              )}</TableCell>
                              <TableCell>{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Reports; 