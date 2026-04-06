import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }
    
    next();
  };
};

export const registerValidationSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('cashier', 'manager', 'administrator').default('cashier'),
  storeId: Joi.string().required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  phoneNumber: Joi.string().optional()
});

export const userValidationSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('cashier', 'manager', 'administrator').default('cashier'),
  storeId: Joi.string().required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  phoneNumber: Joi.string().optional()
});

export const loginValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const productValidationSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().required(),
  subcategory: Joi.string().optional(),
  brand: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  variants: Joi.array().items(
    Joi.object({
      sku: Joi.string().required(),
      barcode: Joi.string().optional(),
      size: Joi.string().optional(),
      color: Joi.string().optional(),
      price: Joi.number().min(0).required(),
      cost: Joi.number().min(0).required(),
      weight: Joi.number().optional(),
      dimensions: Joi.object({
        length: Joi.number().required(),
        width: Joi.number().required(),
        height: Joi.number().required()
      }).optional()
    })
  ).min(1).required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isTaxable: Joi.boolean().default(true),
  trackInventory: Joi.boolean().default(true),
  reorderPoint: Joi.number().min(0).default(0),
  reorderQuantity: Joi.number().min(0).default(0),
  supplier: Joi.string().optional()
});

export const orderValidationSchema = Joi.object({
  type: Joi.string().valid('in_store', 'online', 'phone').default('in_store'),
  customerId: Joi.string().optional(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      variantSku: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
      totalPrice: Joi.number().min(0).required(),
      discount: Joi.number().min(0).default(0),
      tax: Joi.number().min(0).default(0),
      taxRate: Joi.number().min(0).default(0)
    })
  ).min(1).required(),
  customerInfo: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required()
    }).optional()
  }).optional(),
  notes: Joi.string().optional()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const searchSchema = Joi.object({
  q: Joi.string().min(1).required(),
  category: Joi.string().optional(),
  brand: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional()
}).concat(paginationSchema);
