import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Grid } from '../components/Grid';
import { useAuth } from '../contexts/AuthContext';
import { products as productsAPI, orders as ordersAPI } from '../services/config';
import { Product } from '../types';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import Receipt from '../components/Receipt';
import PaymentDialog from '../components/PaymentDialog';

// Product categories
const CATEGORIES = ['Coffee', 'Tea', 'Pastry', 'Sandwich', 'Other'];

const POS: React.FC = () => {
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState<boolean>(false);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsAPI.getAll();
        setProducts(data.filter(product => product.is_available));
        setFilteredProducts(data.filter(product => product.is_available));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products. Please try again.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category and search term
  useEffect(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  // Handle category selection
  const handleCategoryChange = (
    event: React.MouseEvent<HTMLElement>,
    newCategory: string | null
  ) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  // Handle quantity change in cart
  const handleQuantityChange = (productId: number, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  // Handle removing item from cart
  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  // Open payment dialog
  const handleOpenPaymentDialog = () => {
    if (cart.items.length === 0) {
      setError('Cannot submit an empty order.');
      return;
    }
    setError(null);
    setPaymentDialogOpen(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentMethod: 'cash' | 'card', cashReceived?: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const orderItems = cart.items.map((item: { product: Product; quantity: number }) => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      // Include cash received amount in the order if payment method is cash
      const paymentDetails = paymentMethod === 'cash' && cashReceived 
        ? { paymentMethod, cashReceived } 
        : { paymentMethod };

      const response = await ordersAPI.create(orderItems, paymentDetails);
      
      // Set order success and details for receipt
      setOrderSuccess(true);
      setOrderDetails(response.order);
      
      // Clear the cart
      clearCart();
      setIsSubmitting(false);
      setPaymentDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit order. Please try again.');
      setIsSubmitting(false);
      setPaymentDialogOpen(false);
    }
  };

  // Handle starting a new order after success
  const handleNewOrder = () => {
    setOrderSuccess(false);
    setOrderDetails(null);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  // Render order success receipt
  if (orderSuccess && orderDetails) {
    return (
      <Receipt 
        order={orderDetails} 
        onNewOrder={handleNewOrder}
        // Get these from settings in a real app
        storeName="Coffee Master"
        storeAddress="123 Kati i pare, UBT - Dukagjin"
        storePhone="+49 000 000"
        customMessage="Thank you for your purchase! Please come again."
        showLogo={true}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Products section */}
      <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0' }}>
        <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
          
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={handleCategoryChange}
            aria-label="category filter"
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="All" aria-label="all categories">
              All
            </ToggleButton>
            {CATEGORIES.map(category => (
              <ToggleButton key={category} value={category} aria-label={category}>
                {category}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          <Grid container spacing={2}>
            {filteredProducts.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No products found.</Typography>
                </Paper>
              </Grid>
            ) : (
              filteredProducts.map(product => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleAddToCart(product)}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 100,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <LocalCafeIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      )}
                    </CardMedia>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2" noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight={500}>
                        {formatCurrency(product.price)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      </Box>
      
      {/* Cart section */}
      <Box 
        sx={{ 
          flex: 1, 
          minWidth: 300, 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} elevation={1}>
          <Typography variant="h6">Current Order</Typography>
          {cart.items.length > 0 && (
            <Button 
              size="small" 
              color="error" 
              onClick={clearCart}
              variant="outlined"
            >
              Clear
            </Button>
          )}
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mx: 2 }}>
            {error}
          </Alert>
        )}
        
        {cart.items.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Typography color="text.secondary" align="center">
              Cart is empty. Add products to begin an order.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {cart.items.map((item: { product: Product; quantity: number }) => (
              <Paper
                key={item.product.id}
                sx={{
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                elevation={1}
              >
                <Box>
                  <Typography variant="subtitle2">{item.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(item.product.price)} each
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleQuantityChange(item.product.id, Math.max(1, item.quantity - 1))}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  
                  <Typography sx={{ mx: 1, minWidth: '24px', textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton 
                    size="small" 
                    color="error" 
                    sx={{ ml: 1 }}
                    onClick={() => handleRemoveItem(item.product.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
        
        <Paper sx={{ p: 2 }} elevation={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">{formatCurrency(cart.total)}</Typography>
          </Box>
          
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            disabled={cart.items.length === 0 || isSubmitting}
            onClick={handleOpenPaymentDialog}
            sx={{ py: 1.5 }}
          >
            {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </Paper>
      </Box>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onComplete={handlePaymentComplete}
        total={cart.total}
        isProcessing={isSubmitting}
      />
    </Box>
  );
};

export default POS; 