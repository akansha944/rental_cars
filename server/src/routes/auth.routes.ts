import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  signup,
  login,
  refresh,
  logout,
  me,
  changePassword,
  signupSchema,
  loginSchema,
} from '../controllers/auth.controller';

const router = Router();

router.post('/signup', validateBody(signupSchema), asyncHandler(signup));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));
router.post('/change-password', requireAuth, asyncHandler(changePassword));

export default router;
