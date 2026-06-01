import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import { UserRole } from '../models/types';
import { getCompany, updateCompany, uploadLogo } from '../controllers/company.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(getCompany));
router.patch('/', requireRole(UserRole.Manager), asyncHandler(updateCompany));
router.post('/logo', requireRole(UserRole.Manager), upload.single('file'), asyncHandler(uploadLogo));

export default router;
