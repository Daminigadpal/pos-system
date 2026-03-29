import { Router } from 'express';
import {
  createOrder,
  confirmOrder,
  getOrders,
  getOrder,
  cancelOrder
} from '../controllers/orderController';
import {
  authenticateToken,
  authorize
} from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  validateRequest,
  validateQuery,
  orderValidationSchema,
  paginationSchema
} from '../middleware/validation';
import Joi from 'joi';

const confirmOrderSchema = Joi.object({
  payments: Joi.array().items(
    Joi.object({
      method: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      transactionId: Joi.string().optional(),
      metadata: Joi.object().optional()
    })
  ).min(1).required()
});

const router = Router();

router.get('/', authenticateToken, validateQuery(paginationSchema), getOrders);
router.get('/:id', authenticateToken, getOrder);
router.post('/', 
  authenticateToken, 
  validateRequest(orderValidationSchema), 
  createOrder
);
router.post('/:id/confirm', 
  authenticateToken, 
  validateRequest(confirmOrderSchema), 
  confirmOrder
);
router.post('/:id/cancel', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  cancelOrder
);

export default router;
