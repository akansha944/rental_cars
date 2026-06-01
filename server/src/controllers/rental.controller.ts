import { Request, Response } from 'express';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { Rental } from '../models/Rental';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { Company } from '../models/Company';
import { Agreement } from '../models/Agreement';
import {
  VehicleStatus,
  RentalStatus,
  PaymentStatus,
  FuelLevel,
  AgreementStatus,
} from '../models/types';
import { ApiError } from '../utils/ApiError';
import {
  createAgreementForRental,
  sendAgreement,
  buildSigningLink,
} from '../services/agreement.service';

const refId = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

export const createRentalSchema = z.object({
  customer: z.string().min(1),
  vehicle: z.string().min(1),
  pickupDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  dailyRate: z.coerce.number().min(0).optional(),
  totalPrice: z.coerce.number().min(0).optional(),
  bondAmount: z.coerce.number().min(0).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  pickupOdometer: z.coerce.number().min(0).optional(),
  pickupFuelLevel: z.nativeEnum(FuelLevel).optional(),
  pickupDamageNotes: z.string().optional(),
  sendAgreement: z.boolean().optional().default(true),
});

export const returnRentalSchema = z.object({
  actualReturnDate: z.coerce.date().optional(),
  returnOdometer: z.coerce.number().min(0).optional(),
  returnFuelLevel: z.nativeEnum(FuelLevel).optional(),
  returnDamageNotes: z.string().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  vehicleStatus: z.nativeEnum(VehicleStatus).optional(),
});

function daysBetween(a: Date, b: Date): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// GET /api/rentals
export async function listRentals(req: Request, res: Response) {
  const filter: Record<string, unknown> = { company: req.auth!.companyId };
  if (req.query.status) filter.status = req.query.status;
  const rentals = await Rental.find(filter)
    .populate('customer', 'fullName phone email')
    .populate('vehicle', 'plateNumber make model')
    .sort({ createdAt: -1 });
  res.json(rentals);
}

// GET /api/rentals/:id
export async function getRental(req: Request, res: Response) {
  const rental = await Rental.findOne({ _id: req.params.id, company: req.auth!.companyId })
    .populate('customer')
    .populate('vehicle')
    .populate('agreement');
  if (!rental) throw ApiError.notFound('Rental not found');
  res.json(rental);
}

// POST /api/rentals
export async function createRental(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const data = createRentalSchema.parse(req.body);

  if (data.returnDate <= data.pickupDate) {
    throw ApiError.badRequest('Return date must be after pickup date');
  }

  const [vehicle, customer, company] = await Promise.all([
    Vehicle.findOne({ _id: data.vehicle, company: companyId }),
    Customer.findOne({ _id: data.customer, company: companyId }),
    Company.findById(companyId),
  ]);

  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!customer) throw ApiError.notFound('Customer not found');
  if (!company) throw ApiError.notFound('Company not found');
  if (vehicle.status !== VehicleStatus.Available) {
    throw ApiError.conflict(`Vehicle is not available (status: ${vehicle.status})`);
  }

  const dailyRate = data.dailyRate ?? vehicle.dailyRate ?? 0;
  const days = daysBetween(data.pickupDate, data.returnDate);
  const totalPrice = data.totalPrice ?? dailyRate * days;
  const amountPaid = data.amountPaid ?? 0;
  const paymentStatus =
    amountPaid <= 0
      ? PaymentStatus.Pending
      : amountPaid >= totalPrice
      ? PaymentStatus.Paid
      : PaymentStatus.PartiallyPaid;

  const reference = `R-${new Date().getFullYear()}-${refId()}`;

  const rental = await Rental.create({
    company: companyId,
    customer: customer._id,
    vehicle: vehicle._id,
    reference,
    status: RentalStatus.Active,
    pickupDate: data.pickupDate,
    returnDate: data.returnDate,
    dailyRate,
    totalPrice,
    bondAmount: data.bondAmount ?? 0,
    amountPaid,
    paymentStatus,
    pickupOdometer: data.pickupOdometer ?? vehicle.odometer,
    pickupFuelLevel: data.pickupFuelLevel,
    pickupDamageNotes: data.pickupDamageNotes,
    createdBy: req.auth!.userId,
  });

  // Mark vehicle rented and sync odometer if provided
  vehicle.status = VehicleStatus.Rented;
  if (data.pickupOdometer !== undefined) vehicle.odometer = data.pickupOdometer;
  await vehicle.save();

  // Generate the rental agreement + signing link
  const { agreement, rawToken } = await createAgreementForRental(
    rental,
    company,
    customer,
    vehicle
  );
  rental.agreement = agreement._id;
  await rental.save();

  let signingLink: string | undefined;
  if (data.sendAgreement) {
    const result = await sendAgreement(agreement._id, rawToken, customer, company, rental);
    signingLink = result.link;
  } else {
    signingLink = buildSigningLink(rawToken);
  }

  const populated = await rental.populate([
    { path: 'customer' },
    { path: 'vehicle' },
    { path: 'agreement' },
  ]);

  res.status(201).json({ rental: populated, signingLink });
}

// POST /api/rentals/:id/return
export async function returnRental(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const data = returnRentalSchema.parse(req.body);

  const rental = await Rental.findOne({ _id: req.params.id, company: companyId });
  if (!rental) throw ApiError.notFound('Rental not found');
  if (rental.status === RentalStatus.Returned) {
    throw ApiError.conflict('This rental has already been returned');
  }

  rental.status = RentalStatus.Returned;
  rental.actualReturnDate = data.actualReturnDate ?? new Date();
  if (data.returnOdometer !== undefined) rental.returnOdometer = data.returnOdometer;
  if (data.returnFuelLevel) rental.returnFuelLevel = data.returnFuelLevel;
  if (data.returnDamageNotes !== undefined) rental.returnDamageNotes = data.returnDamageNotes;
  if (data.paymentStatus) rental.paymentStatus = data.paymentStatus;
  if (data.amountPaid !== undefined) rental.amountPaid = data.amountPaid;
  await rental.save();

  // Free up the vehicle and update its odometer
  const vehicle = await Vehicle.findOne({ _id: rental.vehicle, company: companyId });
  if (vehicle) {
    vehicle.status = data.vehicleStatus ?? VehicleStatus.Available;
    if (data.returnOdometer !== undefined) vehicle.odometer = data.returnOdometer;
    await vehicle.save();
  }

  res.json(rental);
}

// PATCH /api/rentals/:id/payment
export async function updatePayment(req: Request, res: Response) {
  const schema = z.object({
    amountPaid: z.coerce.number().min(0).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  });
  const data = schema.parse(req.body);
  const rental = await Rental.findOneAndUpdate(
    { _id: req.params.id, company: req.auth!.companyId },
    data,
    { new: true }
  );
  if (!rental) throw ApiError.notFound('Rental not found');
  res.json(rental);
}

// GET /api/rentals/:id/signing-link — copyable link for staff (does not send email).
export async function getSigningLink(req: Request, res: Response) {
  const rental = await Rental.findOne({ _id: req.params.id, company: req.auth!.companyId });
  if (!rental?.agreement) throw ApiError.notFound('Rental or agreement not found');

  const agreement = await Agreement.findOne({
    _id: rental.agreement,
    company: req.auth!.companyId,
  }).select('+signTokenRaw');

  if (!agreement) throw ApiError.notFound('Agreement not found');
  if (agreement.status === AgreementStatus.Signed) {
    throw ApiError.badRequest('This agreement has already been signed');
  }

  let raw = agreement.signTokenRaw;
  if (!raw) {
    throw ApiError.badRequest(
      'This agreement has no copyable link yet. Use "Resend signing link" to email a fresh link.'
    );
  }

  res.json({ link: buildSigningLink(raw) });
}

// POST /api/rentals/:id/resend-agreement — re-email the SAME link (does not invalidate old emails).
export async function resendAgreement(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const rental = await Rental.findOne({ _id: req.params.id, company: companyId });
  if (!rental) throw ApiError.notFound('Rental not found');

  const [company, customer, vehicle] = await Promise.all([
    Company.findById(companyId),
    Customer.findById(rental.customer),
    Vehicle.findById(rental.vehicle),
  ]);
  if (!company || !customer || !vehicle) throw ApiError.notFound('Related record missing');

  let agreement = rental.agreement
    ? await Agreement.findOne({ _id: rental.agreement, company: companyId }).select('+signTokenRaw')
    : null;

  let rawToken: string;

  if (agreement && agreement.status !== AgreementStatus.Signed && agreement.signTokenRaw) {
    // Keep the same token so links already emailed still work.
    rawToken = agreement.signTokenRaw;
    agreement.tokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await agreement.save();
  } else {
    if (agreement) await Agreement.deleteOne({ _id: agreement._id });
    const created = await createAgreementForRental(rental, company, customer, vehicle);
    agreement = created.agreement;
    rawToken = created.rawToken;
    rental.agreement = agreement._id;
    await rental.save();
  }

  const result = await sendAgreement(agreement._id, rawToken, customer, company, rental);
  res.json({ message: 'Agreement re-sent', channels: result.channels, link: result.link });
}
