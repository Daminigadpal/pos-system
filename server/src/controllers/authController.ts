import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateTokens, verifyRefreshToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role, storeId, firstName, lastName, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'cashier',
      storeId,
      firstName,
      lastName,
      phoneNumber
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    try {
      await redisClient.set(
        `refresh_token:${user._id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );
    } catch (redisError) {
      logger.warn('Failed to store refresh token in Redis:', redisError);
    }

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        firstName: user.firstName,
        lastName: user.lastName
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('storeId');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    try {
      await redisClient.set(
        `refresh_token:${user._id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );
    } catch (redisError) {
      logger.warn('Failed to store refresh token in Redis:', redisError);
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        firstName: user.firstName,
        lastName: user.lastName
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    let storedToken: string | null = null;
    try {
      storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
    } catch (redisError) {
      logger.warn('Failed to get refresh token from Redis:', redisError);
    }

    // Skip Redis validation if Redis is not available
    if (storedToken !== null && storedToken !== refreshToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password').populate('storeId');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid user' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());

    try {
      await redisClient.set(
        `refresh_token:${user._id}`,
        newRefreshToken,
        7 * 24 * 60 * 60
      );
    } catch (redisError) {
      logger.warn('Failed to store refresh token in Redis:', redisError);
    }

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      try {
        await redisClient.del(`refresh_token:${req.user._id}`);
      } catch (redisError) {
        logger.warn('Failed to delete refresh token from Redis:', redisError);
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('storeId');
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
