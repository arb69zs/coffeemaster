import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';
import OrderAdvancedSearch from '../components/OrderAdvancedSearch';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Define order item interface
interface OrderItem {
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

// Define order interface
interface Order {
  id: number;
  user_id: number;
  user_name: string;
  total_amount: number;
  payment_method: 'cash' | 'card';
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// Define search criteria interface
interface SearchCriteria {
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
}

// Row component for orders table with expandable details
const OrderRow = ({ order, onStatusChange }: { order: Order; onStatusChange: (id: number, status: 'pending' | 'completed' | 'cancelled') => void }) => {
  const [open, setOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load order details when expanded
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (open && !orderDetails) {
        try {
          setLoadingDetails(true);
          setError(null);
          const response = await ordersAPI.getById(order.id);
          if (response) {
            setOrderDetails(response);
          } else {
            setError('Failed to load order details. Please try again.');
          }
        } catch (err: any) {
          console.error('Error loading order details:', err);
          setError(err.message || 'Failed to load order details. Please try again.');
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    
    loadOrderDetails();
  }, [open, order.id, orderDetails]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get status chip color
  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'pending':
        return <PendingIcon fontSize="small" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" />;
      default:
        return <ReceiptIcon fontSize="small" />;
    }
  };
  
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{order.id}</TableCell>
        <TableCell>{order.user_name}</TableCell>
        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
        <TableCell>{order.payment_method}</TableCell>
        <TableCell>
          <Chip
            icon={getStatusIcon(order.status)}
            label={order.status}
            color={getStatusColor(order.status)}
            size="small"
          />
        </TableCell>
        <TableCell>{formatDate(order.created_at)}</TableCell>
        <TableCell>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => onStatusChange(order.id, 'completed')}
              >
                Complete
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => onStatusChange(order.id, 'cancelled')}
              >
                Cancel
              </Button>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order Details
              </Typography>
              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : orderDetails ? (
                <Table size="small" aria-label="order items">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderDetails.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || `Product #${item.product_id}`}</TableCell>
                        <TableCell>{item.product?.category || 'Unknown'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <strong>Total</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(orderDetails.total_amount)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Alert severity="info">
                  No order details available.
                </Alert>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const Orders: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  
  // Fetch orders based on search criteria and pagination
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching orders with criteria:', searchCriteria);
        console.log('Page:', page + 1, 'Limit:', rowsPerPage);
        
        let response;
        
        // For initial load or when no search criteria is set, use getAll instead of advancedSearch
        if (Object.keys(searchCriteria).length === 0) {
          console.log('No search criteria, using getAll...');
          try {
            response = await ordersAPI.getAll(page + 1, rowsPerPage);
            console.log('GetAll response:', response);
            
            if (response && response.orders) {
              setOrders(response.orders);
              setTotalOrders(response.pagination?.total || 0);
            } else {
              console.error('Unexpected response structure from getAll:', response);
              setError('Received unexpected data format from the server. Please try again.');
              setOrders([]);
              setTotalOrders(0);
            }
          } catch (getAllError: any) {
            console.error('Error in getAll:', getAllError);
            setError(getAllError.message || 'Error fetching orders. Please try again.');
            setOrders([]);
            setTotalOrders(0);
          }
          return;
        }
        
        // Perform the search with all criteria
        console.log('Performing search with criteria:', searchCriteria);
        try {
          response = await ordersAPI.advancedSearch({
            ...searchCriteria,
            page: page + 1,
            limit: rowsPerPage
          });
          
          console.log('API Response:', response);
          
          if (response && response.orders) {
            setOrders(response.orders);
            setTotalOrders(response.pagination?.total || 0);
          } else {
            console.error('Unexpected response structure:', response);
            setError('Received unexpected data format from the server. Please try again.');
            setOrders([]);
            setTotalOrders(0);
          }
        } catch (searchError: any) {
          console.error('Error in advanced search:', searchError);
          setError(searchError.message || 'Error fetching orders. Please try again.');
          setOrders([]);
          setTotalOrders(0);
        }
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.message || 'Error fetching orders. Please try again.');
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [page, rowsPerPage, searchCriteria]);
  
  // Handle search form submission
  const handleSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setPage(0); // Reset to first page when searching
  };
  
  // Handle page change
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle order status change
  const handleStatusChange = async (orderId: number, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      setStatusUpdateLoading(true);
      await ordersAPI.updateStatus(orderId, newStatus);
      
      // Update order in the state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as 'pending' | 'completed' | 'cancelled' } : order
      ));
      
      // Show success message
      setDialogMessage(`Order #${orderId} status updated to ${newStatus}`);
      setDialogOpen(true);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setDialogMessage(`Failed to update order status: ${err.message || 'Unknown error'}`);
      setDialogOpen(true);
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Check if user has permission to view this page
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.MANAGER) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You do not have permission to view this page.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Orders Management
        </Typography>
        
        <OrderAdvancedSearch onSearch={handleSearch} />
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No orders found matching the criteria.
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="orders table">
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <OrderRow 
                        key={order.id} 
                        order={order} 
                        onStatusChange={handleStatusChange} 
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalOrders}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Paper>
      
      {/* Status update dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Order Status Update</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Loading overlay */}
      {statusUpdateLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default Orders; 