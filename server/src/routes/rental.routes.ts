import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import {
  listRentals,
  getRental,
  createRental,
  returnRental,
  updatePayment,
  resendAgreement,
} from '../controllers/rental.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(listRentals));
router.get('/:id', asyncHandler(getRental));
router.post('/', asyncHandler(createRental));
router.post('/:id/return', asyncHandler(returnRental));
router.patch('/:id/payment', asyncHandler(updatePayment));
router.post('/:id/resend-agreement', asyncHandler(resendAgreement));

export default router;
