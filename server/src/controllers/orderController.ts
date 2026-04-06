import { Response } from 'express';
import { Order, OrderStatus } from '../models/Order';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import mongoose from 'mongoose';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { items, customerInfo, type, customerId, notes } = req.body;

    await session.withTransaction(async () => {
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} not found or inactive`);
        }

        const variant = product.variants.find(v => v.sku === item.variantSku);
        if (!variant) {
          throw new Error(`Variant ${item.variantSku} not found`);
        }

        if (item.unitPrice !== variant.price) {
          item.unitPrice = variant.price;
        }

        item.totalPrice = item.unitPrice * item.quantity;
        item.tax = item.totalPrice * (item.taxRate / 100);

        subtotal += item.totalPrice;
        taxAmount += item.tax;
        discountAmount += item.discount;
      }

      const totalAmount = subtotal + taxAmount - discountAmount;

      const order = new Order({
        storeId: req.storeId,
        customerId,
        cashierId: req.user._id,
        type,
        items,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        customerInfo,
        notes,
        status: OrderStatus.PENDING
      });

      await order.save({ session });

      for (const item of items) {
        const inventory = await Inventory.findOne({
          storeId: req.storeId,
          variantSku: item.variantSku
        }).session(session);

        if (!inventory) {
          throw new Error(`Inventory not found for SKU ${item.variantSku}`);
        }

        if (inventory.availableQuantity < item.quantity) {
          throw new Error(`Insufficient inventory for SKU ${item.variantSku}`);
        }

        inventory.reservedQuantity += item.quantity;
        await inventory.save({ session });
      }

      if (customerId) {
        const customer = await Customer.findById(customerId).session(session);
        if (customer) {
          customer.totalPurchases += totalAmount;
          customer.lastPurchaseDate = new Date();
          await customer.save({ session });
        }
      }

      await redisClient.delPattern(`inventory:*:${req.storeId}`);

      const populatedOrder = await Order.findById(order._id)
        .populate('customerId')
        .populate('cashierId', 'firstName lastName')
        .populate('items.productId', 'name brand')
        .session(session);

      logger.info(`Order created: ${order.orderNumber} by user ${req.user._id}`);

      res.status(201).json(populatedOrder);
    });
  } catch (error: any) {
    logger.error('Create order error:', error);
    
    if (error.message && (error.message.includes('not found') || error.message.includes('Insufficient inventory'))) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.endSession();
  }
};

export const confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { id } = req.params;
    const { payments } = req.body;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== OrderStatus.PENDING) {
        res.status(400).json({ error: 'Order cannot be confirmed' });
        return;
      }

      let totalPaid = 0;
      for (const payment of payments) {
        totalPaid += payment.amount;
        payment.status = 'paid';
        payment.processedAt = new Date();
      }

      if (totalPaid < order.totalAmount) {
        res.status(400).json({ error: 'Insufficient payment' });
        return;
      }

      order.payments = payments;
      order.paidAmount = totalPaid;
      order.status = OrderStatus.CONFIRMED;

      for (const item of order.items) {
        const inventory = await Inventory.findOne({
          storeId: req.storeId,
          variantSku: item.variantSku
        }).session(session);

        if (inventory) {
          inventory.quantity -= item.quantity;
          inventory.reservedQuantity -= item.quantity;
          await inventory.save({ session });
        }
      }

      await order.save({ session });

      await redisClient.delPattern(`inventory:*:${req.storeId}`);

      const populatedOrder = await Order.findById(order._id)
        .populate('customerId')
        .populate('cashierId', 'firstName lastName')
        .populate('items.productId', 'name brand');

      logger.info(`Order confirmed: ${order.orderNumber} by user ${req.user._id}`);

      res.json(populatedOrder);
    });
  } catch (error) {
    logger.error('Confirm order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.endSession();
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;

    const query: any = { storeId: req.storeId };
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.cashierId) {
      query.cashierId = req.query.cashierId;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('cashierId', 'firstName lastName')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, storeId: req.storeId })
      .populate('customerId')
      .populate('cashierId', 'firstName lastName')
      .populate('items.productId', 'name brand variants');

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  
  try {
    const { id } = req.params;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
        res.status(400).json({ error: 'Order cannot be cancelled' });
        return;
      }

      order.status = OrderStatus.CANCELLED;

      for (const item of order.items) {
        const inventory = await Inventory.findOne({
          storeId: req.storeId,
          variantSku: item.variantSku
        }).session(session);

        if (inventory && inventory.reservedQuantity >= item.quantity) {
          inventory.reservedQuantity -= item.quantity;
          await inventory.save({ session });
        }
      }

      await order.save({ session });

      await redisClient.delPattern(`inventory:*:${req.storeId}`);

      logger.info(`Order cancelled: ${order.orderNumber} by user ${req.user._id}`);

      res.json({ message: 'Order cancelled successfully' });
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.endSession();
  }
};
