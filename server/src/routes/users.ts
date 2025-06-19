import express, { Request, Response, NextFunction } from 'express';
import { UserModel, UserRole } from '../models/mysql/User';
import { authenticateToken, authorize } from '../middleware/auth';
import { LogCategory, LogLevel, createLog } from '../models/mongo/SystemLog';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    
    // Hide passwords in response
    const safeUsers = users.map(user => ({
      ...user,
      password: undefined
    }));
    
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const user = await UserModel.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    // Hide password in response
    const safeUser = { ...user, password: undefined };
    
    res.json({ user: safeUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user.' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, email, firstName, lastName, role, active } = req.body;
    
    // Validate required fields
    if (!username || !password || !email || !firstName || !lastName || !role) {
      res.status(400).json({ message: 'Username, password, email, firstName, lastName, and role are required.' });
      return;
    }
    
    // Check if username already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists.' });
      return;
    }
    
    // Create user
    const user = await UserModel.create({
      username,
      password,
      email,
      firstName,
      lastName,
      role: role as UserRole,
      active: active !== undefined ? active : true
    });
    
    // Log user creation
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `User ${username} created by admin`,
      { username },
      req.user?.id
    );
    
    // Hide password in response
    const safeUser = { ...user, password: undefined };
    
    res.status(201).json({
      message: 'User created successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error creating user',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error creating user.' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { username, password, email, firstName, lastName, role, active } = req.body;
    
    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    // Check if username is being changed and already exists
    if (username && username !== existingUser.username) {
      const userWithSameUsername = await UserModel.findByUsername(username);
      if (userWithSameUsername) {
        res.status(400).json({ message: 'Username already exists.' });
        return;
      }
    }
    
    // Update user
    const updatedUser = await UserModel.update(userId, {
      username,
      password,
      email,
      firstName,
      lastName,
      role: role as UserRole,
      active,
      updatedAt: new Date()
    });
    
    // Log user update
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `User ${existingUser.username} updated by admin`,
      { userId },
      req.user?.id
    );
    
    // Hide password in response
    const safeUser = updatedUser ? { ...updatedUser, password: undefined } : null;
    
    res.json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error updating user',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error updating user.' });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    // Validate required fields
    if (!newPassword) {
      res.status(400).json({ message: 'New password is required.' });
      return;
    }
    
    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    // Update user password
    const updatedUser = await UserModel.update(userId, {
      password: newPassword,
      updatedAt: new Date()
    });
    
    // Log password reset
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `Password reset for user ${existingUser.username} by admin`,
      { userId },
      req.user?.id
    );
    
    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error resetting password',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error resetting password.' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    // Prevent deleting self
    if (userId === req.user?.id) {
      res.status(400).json({ message: 'Cannot delete your own account.' });
      return;
    }
    
    // Delete user
    await UserModel.delete(userId);
    
    // Log user deletion
    await createLog(
      LogLevel.INFO,
      LogCategory.AUTH,
      `User ${existingUser.username} deleted by admin`,
      { userId },
      req.user?.id
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    await createLog(
      LogLevel.ERROR,
      LogCategory.AUTH,
      'Error deleting user',
      { error: (error as Error).message },
      req.user?.id
    );
    res.status(500).json({ message: 'Error deleting user.' });
  }
});

export default router; 