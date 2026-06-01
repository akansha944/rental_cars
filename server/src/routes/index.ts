import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import customerRoutes from './customer.routes';
import rentalRoutes from './rental.routes';
import dashboardRoutes from './dashboard.routes';
import cronRoutes from './cron.routes';
import { agreementRouter, publicAgreementRouter } from './agreement.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/customers', customerRoutes);
router.use('/rentals', rentalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cron', cronRoutes);
router.use('/agreements', agreementRouter);
router.use('/public/agreements', publicAgreementRouter);

export default router;
