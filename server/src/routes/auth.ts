import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel, UserRole } from '../models/mysql/User';
import { authenticateToken, authorize } from '../middleware/auth';
import { LogCategory, LogLevel, createLog } from '../models/mongo/SystemLog';

const router = express.Router();

// Register a new user
router.post('/register', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, email, firstName, lastName, role } = req.body;
    
    // Validate input
    if (!username || !password || !email || !firstName || !lastName || !role) {
      res.status(400).json({ message: 'Username, password, email, firstName, lastName, and role are required.' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists.' });
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await UserModel.create({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      role: role as UserRole,
      active: true
    });
    
    // Log user creation
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `User ${username} registered by admin`,
      { username },
      req.user?.id
    );
    
    // Create JWT token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error registering user',
      { error: (error as Error).message },
      req.user?.id
    );
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required.' });
      return;
    }
    
    // Check if user exists
    const user = await UserModel.findByUsername(username);
    if (!user) {
      await createLog(
        LogLevel.WARNING,
        LogCategory.AUTH,
        `Failed login attempt for non-existent user: ${username}`,
        { username }
      );
      res.status(400).json({ message: 'Invalid username or password.' });
      return;
    }
    
    // Check if user is active
    if (!user.active) {
      res.status(403).json({ message: 'Account is disabled' });
      return;
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await createLog(
        LogLevel.WARNING,
        LogCategory.AUTH,
        `Failed login attempt for user: ${username}`,
        { username }
      );
      res.status(400).json({ message: 'Invalid username or password.' });
      return;
    }
    
    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: '24h' }
    );
    
    // Update last login
    if (user.id) {
      await UserModel.update(user.id, { lastLogin: new Date() });
    }
    
    // Log successful login
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `User ${username} logged in`,
      { username }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error logging in',
      { error: (error as Error).message }
    );
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    if (user.id) {
      await UserModel.update(user.id, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
    }
    
    // Log password change
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `Password changed for user: ${user.username}`,
      { userId: user.id }
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error changing password',
      { error: (error as Error).message },
      req.user?.id
    );
    next(error);
  }
});

export default router; 