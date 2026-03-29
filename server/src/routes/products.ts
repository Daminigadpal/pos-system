import { Router } from 'express';
import {
  getProducts,
  searchProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import {
  authenticateToken,
  authorize
} from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  validateRequest,
  validateQuery,
  productValidationSchema,
  paginationSchema,
  searchSchema
} from '../middleware/validation';

const router = Router();

router.get('/', authenticateToken, validateQuery(paginationSchema), getProducts);
router.get('/search', authenticateToken, validateQuery(searchSchema), searchProducts);
router.get('/:id', authenticateToken, getProduct);
router.post('/', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  validateRequest(productValidationSchema), 
  createProduct
);
router.put('/:id', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  validateRequest(productValidationSchema), 
  updateProduct
);
router.delete('/:id', 
  authenticateToken, 
  authorize([UserRole.MANAGER, UserRole.ADMINISTRATOR]), 
  deleteProduct
);

export default router;
