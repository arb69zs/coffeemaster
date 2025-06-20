import express, { Request, Response, NextFunction } from 'express';
import { InventoryModel } from '../models/mysql/Inventory';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models/mysql/User';
import { LogCategory, LogLevel, createLog } from '../models/mongo/SystemLog';
import { initializeDatabase } from '../utils/initDb';

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await InventoryModel.findAll();
    res.json({ items });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Error fetching inventory items.' });
  }
});

// Get inventory item by ID
router.get('/:id', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await InventoryModel.findById(itemId);
    
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found.' });
      return;
    }
    
    res.json({ item });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Error fetching inventory item.' });
  }
});

// Create new inventory item (manager/admin only)
router.post('/', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, current_stock_level, unit, minimum_stock_level, cost_per_unit } = req.body;
    
    // Validate required fields
    if (!name || current_stock_level === undefined || !unit || minimum_stock_level === undefined) {
      res.status(400).json({ 
        message: 'Name, current stock level, unit, and minimum stock level are required.' 
      });
      return;
    }
    
    // Create inventory item
    const item = await InventoryModel.create({
      name,
      current_stock_level,
      unit,
      minimum_stock_level,
      cost_per_unit
    });
    
    // Log inventory item creation
    await createLog(
      LogLevel.INFO,
      LogCategory.INVENTORY,
      `Inventory item ${name} created`,
      { itemId: item.id },
      req.user?.id
    );
    
    res.status(201).json({
      message: 'Inventory item created successfully',
      item
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.INVENTORY,
      'Error creating inventory item',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error creating inventory item.' });
  }
});

// Update inventory item (manager/admin only)
router.put('/:id', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    const { name, current_stock_level, unit, minimum_stock_level, cost_per_unit } = req.body;
    
    // Check if item exists
    const existingItem = await InventoryModel.findById(itemId);
    if (!existingItem) {
      res.status(404).json({ message: 'Inventory item not found.' });
      return;
    }
    
    // Update item
    const updatedItem = await InventoryModel.update(itemId, {
      name,
      current_stock_level,
      unit,
      minimum_stock_level,
      cost_per_unit
    });
    
    // Log inventory item update
    await createLog(
      LogLevel.INFO,
      LogCategory.INVENTORY,
      `Inventory item ${existingItem.name} updated`,
      { itemId },
      req.user?.id
    );
    
    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.INVENTORY,
      'Error updating inventory item',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error updating inventory item.' });
  }
});

// Update inventory stock level (manager/admin only)
router.patch('/:id/stock', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      res.status(400).json({ message: 'Quantity is required.' });
      return;
    }
    
    // Check if item exists
    const existingItem = await InventoryModel.findById(itemId);
    if (!existingItem) {
      res.status(404).json({ message: 'Inventory item not found.' });
      return;
    }
    
    // Update stock
    const updatedItem = await InventoryModel.updateStock(itemId, quantity);
    
    // Log stock update
    await createLog(
      LogLevel.INFO,
      LogCategory.INVENTORY,
      `Stock level for ${existingItem.name} ${quantity >= 0 ? 'increased' : 'decreased'} by ${Math.abs(quantity)} ${existingItem.unit}`,
      { 
        itemId,
        previousLevel: existingItem.current_stock_level,
        newLevel: updatedItem?.current_stock_level,
        change: quantity
      },
      req.user?.id
    );
    
    res.json({
      message: 'Stock level updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.INVENTORY,
      'Error updating stock level',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error updating stock level.' });
  }
});

// Delete inventory item (admin only)
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Check if item exists
    const existingItem = await InventoryModel.findById(itemId);
    if (!existingItem) {
      res.status(404).json({ message: 'Inventory item not found.' });
      return;
    }
    
    // Delete item
    await InventoryModel.delete(itemId);
    
    // Log inventory item deletion
    await createLog(
      LogLevel.INFO,
      LogCategory.INVENTORY,
      `Inventory item ${existingItem.name} deleted`,
      { itemId },
      req.user?.id
    );
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.INVENTORY,
      'Error deleting inventory item',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error deleting inventory item.' });
  }
});

// Get low stock items
router.get('/status/low', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Fetching low stock items...');
    const lowStockItems = await InventoryModel.findLowStock();
    console.log(`Found ${lowStockItems.length} low stock items:`, lowStockItems.map(item => ({
      name: item.name,
      current: item.current_stock_level,
      min: item.minimum_stock_level,
      unit: item.unit
    })));
    res.json({ items: lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items.' });
  }
});

// Reset inventory data (admin only)
router.post('/reset', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Drop and recreate the inventory table
    await InventoryModel.resetTable();
    
    // Reinitialize the database to populate with fresh data
    await initializeDatabase();
    
    // Get all inventory items to verify
    const items = await InventoryModel.findAll();
    console.log('Current inventory items:', items.length);
    
    res.json({ 
      message: 'Inventory data reset successfully',
      itemsCount: items.length
    });
  } catch (error) {
    console.error('Error resetting inventory data:', error);
    res.status(500).json({ message: 'Error resetting inventory data.' });
  }
});

export default router; 