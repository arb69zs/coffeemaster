import express, { Request, Response, NextFunction } from 'express';
import { ProductModel } from '../models/mysql/Product';
import { ProductRecipe } from '../models/mongo/ProductRecipe';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models/mysql/User';
import { LogCategory, LogLevel, createLog } from '../models/mongo/SystemLog';
import { mysqlPool } from '../config/database';

const router = express.Router();

// Get all products
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await ProductModel.findAll();
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products.' });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    
    // Get recipe if it exists
    const recipe = await ProductRecipe.findOne({ productId });
    
    res.json({ 
      product,
      recipe: recipe || null
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product.' });
  }
});

// Create new product (manager/admin only)
router.post('/', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, price, category, description, image_url, is_available, recipe } = req.body;
    
    // Validate required fields
    if (!name || !price || !category) {
      res.status(400).json({ message: 'Name, price, and category are required.' });
      return;
    }
    
    // Create product
    const product = await ProductModel.create({
      name,
      price,
      category,
      description: description || '',
      image_url: image_url || '',
      is_available: is_available !== undefined ? is_available : true
    });
    
    // Create recipe if provided
    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      await ProductRecipe.create({
        productId: product.id,
        name: product.name,
        ingredients: recipe.ingredients
      });
    }
    
    // Log product creation
    await createLog(
      LogLevel.INFO,
      LogCategory.PRODUCT,
      `Product ${name} created`,
      { productId: product.id },
      req.user?.id
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.PRODUCT,
      'Error creating product',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error creating product.' });
  }
});

// Update product (manager/admin only)
router.put('/:id', authenticateToken, authorize([UserRole.MANAGER, UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    const { name, price, category, description, image_url, is_available, recipe } = req.body;
    
    // Check if product exists
    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    
    // Update product
    const updatedProduct = await ProductModel.update(productId, {
      name,
      price,
      category,
      description,
      image_url,
      is_available
    });
    
    // Update or create recipe if provided
    if (recipe) {
      const existingRecipe = await ProductRecipe.findOne({ productId });
      
      if (existingRecipe) {
        // Update existing recipe
        existingRecipe.name = name || existingRecipe.name;
        existingRecipe.ingredients = recipe.ingredients || existingRecipe.ingredients;
        await existingRecipe.save();
      } else if (recipe.ingredients && recipe.ingredients.length > 0) {
        // Create new recipe
        await ProductRecipe.create({
          productId,
          name: name || existingProduct.name,
          ingredients: recipe.ingredients
        });
      }
    }
    
    // Log product update
    await createLog(
      LogLevel.INFO,
      LogCategory.PRODUCT,
      `Product ${existingProduct.name} updated`,
      { productId },
      req.user?.id
    );
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.PRODUCT,
      'Error updating product',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error updating product.' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const connection = await mysqlPool.getConnection();
  
  try {
    const productId = parseInt(req.params.id);
    
    // Check if product exists
    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    
    await connection.beginTransaction();
    
    try {
      // Delete recipe from MongoDB first
      await ProductRecipe.deleteOne({ productId });
      
      // Delete product from MySQL (this will cascade delete order_items due to ON DELETE CASCADE)
      const deleted = await ProductModel.delete(productId);
      if (!deleted) {
        throw new Error('Failed to delete product from MySQL');
      }
      
      await connection.commit();
      
      // Log product deletion
      await createLog(
        LogLevel.INFO,
        LogCategory.PRODUCT,
        `Product ${existingProduct.name} deleted`,
        { productId },
        req.user?.id
      );
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.PRODUCT,
      'Error deleting product',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error deleting product.' });
  } finally {
    connection.release();
  }
});

// Get products by category
router.get('/category/:category', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = req.params.category;
    const products = await ProductModel.findByCategory(category);
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products by category.' });
  }
});

// Get product recipe
router.get('/:id/recipe', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    
    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    
    // Get recipe
    const recipe = await ProductRecipe.findOne({ productId });
    if (!recipe) {
      res.status(404).json({ message: 'Recipe not found for this product.' });
      return;
    }
    
    res.json({ recipe });
  } catch (error) {
    console.error('Error fetching product recipe:', error);
    res.status(500).json({ message: 'Error fetching product recipe.' });
  }
});

export default router; 