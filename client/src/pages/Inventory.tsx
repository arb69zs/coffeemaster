import React, { useState, useEffect } from 'react';
import { inventory as inventoryAPI } from '../services/config';
import { Grid } from '../components/Grid';
import { InventoryItem } from '../types';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ErrorOutline as ErrorOutlineIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';

const Inventory: React.FC = () => {
  // State for inventory items
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlertOpen, setLowStockAlertOpen] = useState(true);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for item dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);

  // State for stock adjustment dialog
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  // State for form fields
  const [formName, setFormName] = useState('');
  const [formCurrentStock, setFormCurrentStock] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formMinimumStock, setFormMinimumStock] = useState('');
  const [formCostPerUnit, setFormCostPerUnit] = useState('');

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch inventory items on component mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);

  // Fetch inventory items from API
  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAll();
      setItems(data);
      setFilteredItems(data);
      
      // Fetch low stock items from server
      const lowStock = await inventoryAPI.getLowStock();
      setLowStockItems(lowStock);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch inventory items. Please try again.');
      setLoading(false);
    }
  };

  // Handle dialog open for adding new item
  const handleAddItem = () => {
    setIsEditing(false);
    setCurrentItem(null);
    resetForm();
    setDialogOpen(true);
  };

  // Handle dialog open for editing item
  const handleEditItem = (item: InventoryItem) => {
    setIsEditing(true);
    setCurrentItem(item);
    setFormName(item.name);
    setFormCurrentStock(item.current_stock_level.toString());
    setFormUnit(item.unit);
    setFormMinimumStock(item.minimum_stock_level.toString());
    setFormCostPerUnit(item.cost_per_unit?.toString() || '');
    setDialogOpen(true);
  };

  // Handle dialog open for stock adjustment
  const handleStockAdjustment = (item: InventoryItem) => {
    setStockItem(item);
    setStockAdjustment('');
    setAdjustmentType('add');
    setStockDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Handle stock dialog close
  const handleStockDialogClose = () => {
    setStockDialogOpen(false);
  };

  // Reset form fields
  const resetForm = () => {
    setFormName('');
    setFormCurrentStock('');
    setFormUnit('');
    setFormMinimumStock('');
    setFormCostPerUnit('');
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!formName || !formCurrentStock || !formUnit || !formMinimumStock) {
      setSnackbarMessage('Please fill in all required fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const itemData = {
        name: formName,
        current_stock_level: parseFloat(formCurrentStock),
        unit: formUnit,
        minimum_stock_level: parseFloat(formMinimumStock),
        cost_per_unit: formCostPerUnit ? parseFloat(formCostPerUnit) : undefined
      };

      if (isEditing && currentItem) {
        // Update existing item
        await inventoryAPI.update(currentItem.id!, itemData);
        setSnackbarMessage(`${formName} updated successfully.`);
      } else {
        // Create new item
        await inventoryAPI.create(itemData);
        setSnackbarMessage(`${formName} added to inventory.`);
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDialogOpen(false);
      fetchInventoryItems(); // Refresh the list
    } catch (err) {
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle stock adjustment submission
  const handleStockSubmit = async () => {
    if (!stockItem || !stockAdjustment || parseFloat(stockAdjustment) <= 0) {
      setSnackbarMessage('Please enter a valid quantity.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Calculate the adjustment value
      const quantity = adjustmentType === 'add' 
        ? parseFloat(stockAdjustment) 
        : -parseFloat(stockAdjustment);
      
      await inventoryAPI.updateStock(stockItem.id!, quantity);
      
      setSnackbarMessage(
        `${adjustmentType === 'add' ? 'Added' : 'Removed'} ${stockAdjustment} ${stockItem.unit} ${
          adjustmentType === 'add' ? 'to' : 'from'
        } ${stockItem.name}.`
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setStockDialogOpen(false);
      fetchInventoryItems(); // Refresh the list
    } catch (err) {
      setSnackbarMessage('An error occurred while updating stock level.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        await inventoryAPI.delete(item.id!);
        setSnackbarMessage(`${item.name} deleted successfully.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchInventoryItems(); // Refresh the list
      } catch (err) {
        setSnackbarMessage('An error occurred while deleting the item.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Toggle low stock alert
  const toggleLowStockAlert = () => {
    setLowStockAlertOpen(!lowStockAlertOpen);
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Check if item is low on stock
  const isLowStock = (item: InventoryItem) => {
    return lowStockItems.some(lowItem => lowItem.id === item.id);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading inventory...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your inventory items, track stock levels, and get alerts when items are running low.
        </Typography>
      </Box>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Paper 
          sx={{ 
            mb: 3, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            overflow: 'hidden'
          }} 
          elevation={3}
        >
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={toggleLowStockAlert}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ErrorOutlineIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Low Stock Alert: {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} below minimum stock level
              </Typography>
            </Box>
            {lowStockAlertOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={lowStockAlertOpen}>
            <Divider />
            <List component="div" disablePadding>
              {lowStockItems.map((item) => (
                <ListItemButton
                  key={item.id}
                  sx={{ pl: 4 }}
                  onClick={() => handleStockAdjustment(item)}
                >
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={`Current: ${item.current_stock_level} ${item.unit} / Minimum: ${item.minimum_stock_level} ${item.unit}`}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Paper>
      )}

      <Paper sx={{ mb: 3, p: 2 }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search inventory..."
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
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchInventoryItems}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No inventory items found.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm ? 'Try a different search term or' : 'Get started by'} adding your first inventory item.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            sx={{ mt: 2 }}
          >
            Add Item
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="inventory items table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell align="right">Minimum Stock</TableCell>
                  <TableCell align="right">Cost Per Unit</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: isLowStock(item) ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {item.name}
                      </TableCell>
                      <TableCell align="right">
                        {item.current_stock_level} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {item.minimum_stock_level} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.cost_per_unit)}
                      </TableCell>
                      <TableCell align="center">
                        {isLowStock(item) ? (
                          <Chip
                            icon={<WarningIcon />}
                            label="Low Stock"
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip label="In Stock" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Adjust Stock">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleStockAdjustment(item)}
                            >
                              <InventoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditItem(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? `Edit ${currentItem?.name}` : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Current Stock Level"
                type="number"
                fullWidth
                required
                value={formCurrentStock}
                onChange={(e) => setFormCurrentStock(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Unit (e.g., kg, liters, pcs)"
                fullWidth
                required
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Minimum Stock Level"
                type="number"
                fullWidth
                required
                value={formMinimumStock}
                onChange={(e) => setFormMinimumStock(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Cost Per Unit"
                type="number"
                fullWidth
                value={formCostPerUnit}
                onChange={(e) => setFormCostPerUnit(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onClose={handleStockDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock Level</DialogTitle>
        <DialogContent>
          {stockItem && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {stockItem.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current stock: {stockItem.current_stock_level} {stockItem.unit}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <FormControl fullWidth margin="dense">
                <InputLabel id="adjustment-type-label">Adjustment Type</InputLabel>
                <Select
                  labelId="adjustment-type-label"
                  value={adjustmentType}
                  label="Adjustment Type"
                  onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')}
                >
                  <MenuItem value="add">Add Stock</MenuItem>
                  <MenuItem value="remove">Remove Stock</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label={`Quantity to ${adjustmentType === 'add' ? 'Add' : 'Remove'}`}
                type="number"
                fullWidth
                required
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{stockItem.unit}</InputAdornment>,
                }}
              />
              {adjustmentType === 'remove' && parseFloat(stockAdjustment) > stockItem.current_stock_level && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Warning: You are attempting to remove more than the current stock level.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStockDialogClose}>Cancel</Button>
          <Button 
            onClick={handleStockSubmit} 
            variant="contained"
            color={adjustmentType === 'add' ? 'primary' : 'secondary'}
          >
            {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Inventory; 