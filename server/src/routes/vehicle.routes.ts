import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import { UserRole } from '../models/types';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleFile,
} from '../controllers/vehicle.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(listVehicles));
router.get('/:id', asyncHandler(getVehicle));
router.post('/', asyncHandler(createVehicle));
router.patch('/:id', asyncHandler(updateVehicle));
router.delete('/:id', requireRole(UserRole.Manager), asyncHandler(deleteVehicle));
router.post('/:id/files', upload.single('file'), asyncHandler(uploadVehicleFile));

export default router;
