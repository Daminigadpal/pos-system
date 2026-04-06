import { Response } from 'express';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'lastUpdated';
    const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;

    const query: any = { storeId: req.storeId };
    
    if (req.query.lowStock === 'true') {
      query.$expr = { $lte: ['$availableQuantity', '$reorderPoint'] };
    }
    
    if (req.query.category) {
      const products = await Product.find({ category: req.query.category }).select('_id');
      query.productId = { $in: products.map(p => p._id) };
    }

    const inventory = await Inventory.find(query)
      .populate('productId', 'name brand')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Inventory.countDocuments(query);

    res.json({
      inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;

    const inventory = await Inventory.findOne({
      storeId: req.storeId,
      variantSku: sku
    }).populate('productId');

    if (!inventory) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    res.json(inventory);
  } catch (error) {
    logger.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { sku } = req.params;
    const { quantity, cost, reorderPoint, reorderQuantity } = req.body;

    await session.withTransaction(async () => {
      const inventory = await Inventory.findOneAndUpdate(
        { storeId: req.storeId, variantSku: sku },
        {
          quantity,
          cost,
          averageCost: cost,
          reorderPoint,
          reorderQuantity
        },
        { 
          new: true, 
          runValidators: true, 
          session,
          upsert: true 
        }
      ).populate('productId');

      if (!inventory) {
        throw new Error('Failed to update inventory');
      }

      logger.info(`Inventory updated: ${sku} by user ${req.user._id}`);
      
      res.json(inventory);
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.endSession();
  }
};

export const adjustInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { sku } = req.params;
    const { adjustment, reason, cost } = req.body;

    if (!adjustment || adjustment === 0) {
      res.status(400).json({ error: 'Adjustment amount is required' });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: 'Adjustment reason is required' });
      return;
    }

    await session.withTransaction(async () => {
      const inventory = await Inventory.findOne({
        storeId: req.storeId,
        variantSku: sku
      }).session(session);

      if (!inventory) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }

      const newQuantity = inventory.quantity + adjustment;
      
      if (newQuantity < 0 && !req.user.store.settings?.allowNegativeInventory) {
        res.status(400).json({ error: 'Insufficient inventory for adjustment' });
        return;
      }

      inventory.quantity = newQuantity;
      
      if (cost) {
        inventory.cost = cost;
        inventory.averageCost = cost;
      }

      await inventory.save({ session });

      logger.info(`Inventory adjusted: ${sku} by ${adjustment} by user ${req.user._id}, reason: ${reason}`);
      
      res.json({
        message: 'Inventory adjusted successfully',
        inventory
      });
    });
  } catch (error) {
    logger.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.endSession();
  }
};

export const getLowStockItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inventory = await Inventory.find({
      storeId: req.storeId,
      $expr: { $lte: ['$availableQuantity', '$reorderPoint'] }
    }).populate('productId', 'name brand');

    res.json({
      lowStockItems: inventory,
      count: inventory.length
    });
  } catch (error) {
    logger.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
