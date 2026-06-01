import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { UserRole } from '../models/types';
import { ApiError } from '../utils/ApiError';

const publicUser = (u: {
  _id: unknown;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt?: Date;
}) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active,
  lastLoginAt: u.lastLoginAt,
});

// GET /api/users — list team members in the company.
export async function listUsers(req: Request, res: Response) {
  const users = await User.find({ company: req.auth!.companyId }).sort({ createdAt: 1 });
  res.json(users.map(publicUser));
}

// POST /api/users — invite/create a team member (owner/manager only).
export async function createUser(req: Request, res: Response) {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.nativeEnum(UserRole).default(UserRole.Staff),
  });
  const data = schema.parse(req.body);

  // Only an owner may create another owner.
  if (data.role === UserRole.Owner && req.auth!.role !== UserRole.Owner) {
    throw ApiError.forbidden('Only an owner can create another owner');
  }

  // Email is the global login key — it must be unique across all companies.
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists.');
  }

  const user = await User.create({
    company: req.auth!.companyId,
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: data.role,
  });
  res.status(201).json(publicUser(user));
}

// PATCH /api/users/:id — update role/active state.
export async function updateUser(req: Request, res: Response) {
  const schema = z.object({
    name: z.string().min(2).optional(),
    role: z.nativeEnum(UserRole).optional(),
    active: z.boolean().optional(),
  });
  const data = schema.parse(req.body);

  if (req.params.id === req.auth!.userId && data.active === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, company: req.auth!.companyId },
    data,
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json(publicUser(user));
}
