import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/types';
import { listUsers, createUser, updateUser } from '../controllers/user.controller';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole(UserRole.Manager), asyncHandler(listUsers));
router.post('/', requireRole(UserRole.Manager), asyncHandler(createUser));
router.patch('/:id', requireRole(UserRole.Manager), asyncHandler(updateUser));

export default router;
