import { Request, Response } from 'express';
import { z } from 'zod';
import { Customer } from '../models/Customer';
import { Rental } from '../models/Rental';
import { ApiError } from '../utils/ApiError';
import { uploadBuffer, deleteFile } from '../utils/storage';

const dateOpt = z.coerce.date().optional();

export const customerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  licenceNumber: z.string().optional(),
  licenceExpiry: dateOpt,
  dateOfBirth: dateOpt,
  notes: z.string().optional(),
});

export const customerUpdateSchema = customerSchema.partial();

// GET /api/customers
export async function listCustomers(req: Request, res: Response) {
  const filter: Record<string, unknown> = { company: req.auth!.companyId };
  const search = (req.query.search as string) || '';
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ fullName: rx }, { phone: rx }, { email: rx }, { licenceNumber: rx }];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json(customers);
}

// GET /api/customers/:id  (includes rental history)
export async function getCustomer(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const customer = await Customer.findOne({ _id: req.params.id, company: companyId });
  if (!customer) throw ApiError.notFound('Customer not found');

  const rentals = await Rental.find({ customer: customer._id, company: companyId })
    .populate('vehicle', 'plateNumber make model')
    .sort({ pickupDate: -1 });

  res.json({ customer, rentals });
}

// POST /api/customers
export async function createCustomer(req: Request, res: Response) {
  const data = customerSchema.parse(req.body);
  if (data.email === '') delete (data as Record<string, unknown>).email;
  const customer = await Customer.create({ ...data, company: req.auth!.companyId });
  res.status(201).json(customer);
}

// PATCH /api/customers/:id
export async function updateCustomer(req: Request, res: Response) {
  const data = customerUpdateSchema.parse(req.body);
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, company: req.auth!.companyId },
    data,
    { new: true, runValidators: true }
  );
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json(customer);
}

// DELETE /api/customers/:id
export async function deleteCustomer(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const activeRental = await Rental.findOne({
    customer: req.params.id,
    company: companyId,
    status: 'active',
  });
  if (activeRental) {
    throw ApiError.conflict('Cannot delete a customer with an active rental');
  }
  const customer = await Customer.findOne({ _id: req.params.id, company: companyId });
  if (!customer) throw ApiError.notFound('Customer not found');
  await Promise.all(customer.documents.map(deleteFile));
  await customer.deleteOne();
  res.json({ message: 'Customer deleted' });
}

// POST /api/customers/:id/files  (field: file)
export async function uploadCustomerFile(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const customer = await Customer.findOne({ _id: req.params.id, company: req.auth!.companyId });
  if (!customer) throw ApiError.notFound('Customer not found');

  const stored = await uploadBuffer(req.file.buffer, {
    folder: `customers/${customer._id}`,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
  });
  customer.documents.push(stored);
  await customer.save();
  res.status(201).json(customer);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
