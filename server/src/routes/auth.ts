import { Router } from 'express';
import { 
  login, 
  register,
  refreshToken, 
  logout, 
  getProfile 
} from '../controllers/authController';
import { 
  authenticateToken, 
  AuthRequest 
} from '../middleware/auth';
import { 
  validateRequest, 
  loginValidationSchema,
  registerValidationSchema 
} from '../middleware/validation';

const router = Router();

router.post('/register', validateRequest(registerValidationSchema), register);
router.post('/login', validateRequest(loginValidationSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
