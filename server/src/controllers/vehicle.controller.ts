import { Request, Response } from 'express';
import { z } from 'zod';
import { Vehicle } from '../models/Vehicle';
import { VehicleStatus } from '../models/types';
import { ApiError } from '../utils/ApiError';
import { uploadBuffer, deleteFile } from '../utils/storage';

const dateOpt = z.coerce.date().optional();

export const vehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  vin: z.string().optional(),
  colour: z.string().optional(),
  odometer: z.coerce.number().min(0).optional(),
  dailyRate: z.coerce.number().min(0).optional(),
  wofExpiry: dateOpt,
  registrationExpiry: dateOpt,
  insuranceExpiry: dateOpt,
  serviceDueDate: dateOpt,
  status: z.nativeEnum(VehicleStatus).optional(),
  notes: z.string().optional(),
});

export const vehicleUpdateSchema = vehicleSchema.partial();

// GET /api/vehicles
export async function listVehicles(req: Request, res: Response) {
  const companyId = req.auth!.companyId;
  const { status, search } = req.query as { status?: string; search?: string };

  const filter: Record<string, unknown> = { company: companyId };
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ plateNumber: rx }, { make: rx }, { model: rx }, { vin: rx }];
  }

  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.json(vehicles);
}

// GET /api/vehicles/:id
export async function getVehicle(req: Request, res: Response) {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, company: req.auth!.companyId });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  res.json(vehicle);
}

// POST /api/vehicles
export async function createVehicle(req: Request, res: Response) {
  const data = vehicleSchema.parse(req.body);
  const vehicle = await Vehicle.create({ ...data, company: req.auth!.companyId });
  res.status(201).json(vehicle);
}

// PATCH /api/vehicles/:id
export async function updateVehicle(req: Request, res: Response) {
  const data = vehicleUpdateSchema.parse(req.body);
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, company: req.auth!.companyId },
    data,
    { new: true, runValidators: true }
  );
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  res.json(vehicle);
}

// DELETE /api/vehicles/:id
export async function deleteVehicle(req: Request, res: Response) {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, company: req.auth!.companyId });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.status === VehicleStatus.Rented) {
    throw ApiError.conflict('Cannot delete a vehicle that is currently rented');
  }
  await Promise.all([...vehicle.photos, ...vehicle.documents].map(deleteFile));
  await vehicle.deleteOne();
  res.json({ message: 'Vehicle deleted' });
}

// POST /api/vehicles/:id/files  (field: file, query: type=photo|document)
export async function uploadVehicleFile(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const type = (req.query.type as string) === 'document' ? 'documents' : 'photos';

  const vehicle = await Vehicle.findOne({ _id: req.params.id, company: req.auth!.companyId });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const stored = await uploadBuffer(req.file.buffer, {
    folder: `vehicles/${vehicle._id}`,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
  });

  vehicle[type].push(stored);
  await vehicle.save();
  res.status(201).json(vehicle);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
