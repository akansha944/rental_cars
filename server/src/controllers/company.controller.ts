import { Request, Response } from 'express';
import { z } from 'zod';
import { Company } from '../models/Company';
import { ApiError } from '../utils/ApiError';
import { uploadBuffer } from '../utils/storage';

// GET /api/company
export async function getCompany(req: Request, res: Response) {
  const company = await Company.findById(req.auth!.companyId);
  if (!company) throw ApiError.notFound('Company not found');
  res.json(company);
}

// PATCH /api/company
export async function updateCompany(req: Request, res: Response) {
  const schema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    termsAndConditions: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const company = await Company.findByIdAndUpdate(req.auth!.companyId, data, { new: true });
  if (!company) throw ApiError.notFound('Company not found');
  res.json(company);
}

// POST /api/company/logo  (field: file)
export async function uploadLogo(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const stored = await uploadBuffer(req.file.buffer, {
    folder: `company/${req.auth!.companyId}`,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
  });
  const company = await Company.findByIdAndUpdate(
    req.auth!.companyId,
    { logo: stored.url },
    { new: true }
  );
  if (!company) throw ApiError.notFound('Company not found');
  res.json(company);
}
