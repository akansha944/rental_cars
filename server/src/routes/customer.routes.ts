import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import { UserRole } from '../models/types';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  uploadCustomerFile,
} from '../controllers/customer.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(listCustomers));
router.get('/:id', asyncHandler(getCustomer));
router.post('/', asyncHandler(createCustomer));
router.patch('/:id', asyncHandler(updateCustomer));
router.delete('/:id', requireRole(UserRole.Manager), asyncHandler(deleteCustomer));
router.post('/:id/files', upload.single('file'), asyncHandler(uploadCustomerFile));

export default router;
