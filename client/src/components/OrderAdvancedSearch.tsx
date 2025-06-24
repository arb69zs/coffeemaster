import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  IconButton,
  InputAdornment,
  Autocomplete,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { productsAPI, usersAPI } from '../services/api';
import { Product, User } from '../types';

interface OrderAdvancedSearchProps {
  onSearch: (criteria: any) => void;
}

const OrderAdvancedSearch: React.FC<OrderAdvancedSearchProps> = ({ onSearch }) => {
  // Search criteria state
  const [expanded, setExpanded] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Options for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Load users and products for dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingUsers(true);
        setLoadingProducts(true);
        
        // Load users for the user filter
        const usersData = await usersAPI.getAll();
        setUsers(usersData);
        
        // Load products for the product filter
        const productsData = await productsAPI.getAll();
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading search options:', error);
      } finally {
        setLoadingUsers(false);
        setLoadingProducts(false);
      }
    };
    
    if (expanded) {
      loadOptions();
    }
  }, [expanded]);
  
  // Toggle expanded state
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  // Handle search submission
  const handleSearch = () => {
    const criteria: any = {};
    
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        alert('Start date cannot be after end date');
        return;
      }
      
      // Format dates to YYYY-MM-DD format
      criteria.startDate = start.toISOString().split('T')[0];
      criteria.endDate = end.toISOString().split('T')[0];
    } else {
      // Add individual dates if provided
      if (startDate) {
        const start = new Date(startDate);
        criteria.startDate = start.toISOString().split('T')[0];
      }
      
      if (endDate) {
        const end = new Date(endDate);
        criteria.endDate = end.toISOString().split('T')[0];
      }
    }
    
    // Validate amount range
    if (minAmount && maxAmount) {
      const min = parseFloat(minAmount);
      const max = parseFloat(maxAmount);
      
      if (min > max) {
        alert('Minimum amount cannot be greater than maximum amount');
        return;
      }
      
      criteria.minAmount = min;
      criteria.maxAmount = max;
    } else {
      // Add individual amounts if provided
      if (minAmount) {
        criteria.minAmount = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        criteria.maxAmount = parseFloat(maxAmount);
      }
    }
    
    if (paymentMethod) {
      criteria.paymentMethod = paymentMethod;
    }
    
    if (status) {
      criteria.status = status;
    }
    
    if (selectedUser) {
      criteria.userId = selectedUser.id;
    }
    
    if (selectedProduct) {
      criteria.productId = selectedProduct.id;
    }
    
    console.log('Searching with criteria:', criteria);
    onSearch(criteria);
  };
  
  // Clear all filters
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPaymentMethod('');
    setStatus('');
    setSelectedUser(null);
    setSelectedProduct(null);
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          Order Search
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleToggleExpand}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>
      
      <Collapse in={expanded}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ width: '100%' }}
          >
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Min Amount"
                type="number"
                size="small"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Max Amount"
                type="number"
                size="small"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
          </Stack>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ width: '100%' }}
          >
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                options={users}
                loading={loadingUsers}
                getOptionLabel={(option) => option.username}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                options={products}
                loading={loadingProducts}
                getOptionLabel={(option) => option.name}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Box>
          </Stack>
        </Stack>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default OrderAdvancedSearch; 