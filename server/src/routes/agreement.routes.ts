import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import {
  getAgreement,
  getPublicAgreement,
  listAgreements,
  signPublicAgreement,
} from '../controllers/agreement.controller';

// Authenticated routes — mounted at /api/agreements
export const agreementRouter = Router();
agreementRouter.use(requireAuth);
agreementRouter.get('/', asyncHandler(listAgreements));
agreementRouter.get('/:id', asyncHandler(getAgreement));

// Public routes — mounted at /api/public/agreements (no auth, token-based)
export const publicAgreementRouter = Router();
publicAgreementRouter.get('/:token', asyncHandler(getPublicAgreement));
publicAgreementRouter.post('/:token/sign', asyncHandler(signPublicAgreement));
