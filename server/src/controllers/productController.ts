import { Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;

    const cacheKey = `products:${JSON.stringify(req.query)}:${req.storeId}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      res.json(JSON.parse(cachedResult));
      return;
    }

    const query: any = { isActive: true };
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      query['variants.price'] = {};
      if (req.query.minPrice) {
        query['variants.price'].$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        query['variants.price'].$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    const products = await Product.find(query)
      .populate('category subcategory')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    await redisClient.set(cacheKey, JSON.stringify(result), 300); // 5 minutes

    res.json(result);
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, category, brand, minPrice, maxPrice, inStock } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `search:${JSON.stringify(req.query)}:${req.storeId}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      res.json(JSON.parse(cachedResult));
      return;
    }

    const query: any = {
      $text: { $search: q as string },
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = brand;
    }

    const products = await Product.find(query)
      .populate('category subcategory')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    await redisClient.set(cacheKey, JSON.stringify(result), 600); // 10 minutes

    res.json(result);
  } catch (error) {
    logger.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const cacheKey = `product:${id}:${req.storeId}`;
    const cachedProduct = await redisClient.get(cacheKey);
    
    if (cachedProduct) {
      res.json(JSON.parse(cachedProduct));
      return;
    }

    const product = await Product.findById(id).populate('category subcategory');
    
    if (!product || !product.isActive) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await redisClient.set(cacheKey, JSON.stringify(product), 1800); // 30 minutes

    res.json(product);
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productData = req.body;
    
    const category = await Category.findById(productData.category);
    if (!category) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    const product = new Product(productData);
    await product.save();

    await redisClient.delPattern(`products:*:${req.storeId}`);
    await redisClient.delPattern(`search:*:${req.storeId}`);

    const populatedProduct = await Product.findById(product._id).populate('category subcategory');
    
    logger.info(`Product created: ${product._id} by user ${req.user._id}`);
    
    res.status(201).json(populatedProduct);
  } catch (error: any) {
    logger.error('Create product error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category subcategory');

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await redisClient.del(`product:${id}:${req.storeId}`);
    await redisClient.delPattern(`products:*:${req.storeId}`);
    await redisClient.delPattern(`search:*:${req.storeId}`);

    logger.info(`Product updated: ${product._id} by user ${req.user._id}`);

    res.json(product);
  } catch (error: any) {
    logger.error('Update product error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await redisClient.del(`product:${id}:${req.storeId}`);
    await redisClient.delPattern(`products:*:${req.storeId}`);
    await redisClient.delPattern(`search:*:${req.storeId}`);

    logger.info(`Product deactivated: ${product._id} by user ${req.user._id}`);

    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
