import { Router } from 'express';
import {
  getInventory,
  getInventoryItem,
  updateInventory,
  adjustInventory,
  getLowStockItems
} from '../controllers/inventoryController';
import {
  authenticateToken,
  authorize
} from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  validateRequest,
  validateQuery,
  paginationSchema
} from '../middleware/validation';
import Joi from 'joi';

const inventoryUpdateSchema = Joi.object({
  quantity: Joi.number().min(0).required(),
  cost: Joi.number().min(0).required(),
  reorderPoint: Joi.number().min(0).optional(),
  reorderQuantity: Joi.number().min(0).optional()
});

const inventoryAdjustSchema = Joi.object({
  adjustment: Joi.number().integer().required(),
  reason: Joi.string().required(),
  cost: Joi.number().min(0).optional()
});

const router = Router();

router.get('/', authenticateToken, validateQuery(paginationSchema), getInventory);
router.get('/low-stock', authenticateToken, getLowStockItems);
router.get('/:sku', authenticateToken, getInventoryItem);
router.put('/:sku', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  validateRequest(inventoryUpdateSchema), 
  updateInventory
);
router.post('/:sku/adjust', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  validateRequest(inventoryAdjustSchema), 
  adjustInventory
);

export default router;
