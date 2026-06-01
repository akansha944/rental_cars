import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { UserRole } from '../models/types';
import { ApiError } from '../utils/ApiError';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  parseDurationMs,
} from '../utils/token';
import { env } from '../config/env';

export const signupSchema = z.object({
  companyName: z.string().min(2),
  companyEmail: z.string().email(),
  companyPhone: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueTokens(user: {
  _id: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  role: UserRole;
  name: string;
}) {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    company: user.company.toString(),
    role: user.role,
    name: user.name,
  });
  const { raw, hash } = generateRefreshToken();
  return { accessToken, refreshRaw: raw, refreshHash: hash };
}

async function persistRefreshToken(
  userId: mongoose.Types.ObjectId,
  companyId: mongoose.Types.ObjectId,
  hash: string
) {
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshExpires));
  await RefreshToken.create({ user: userId, company: companyId, tokenHash: hash, expiresAt });
}

function setRefreshCookie(res: Response, raw: string) {
  res.cookie('refreshToken', raw, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: parseDurationMs(env.jwt.refreshExpires),
    path: '/api/auth',
  });
}

function publicUser(user: {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
}) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/signup — creates a company workspace and its owner.
export async function signup(req: Request, res: Response) {
  const data = signupSchema.parse(req.body);

  // One email = one account. Reject if this email is already registered
  // anywhere, so a duplicate signup can't silently create a second workspace.
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists. Please log in instead.');
  }

  const company = await Company.create({
    name: data.companyName,
    email: data.companyEmail.toLowerCase(),
    phone: data.companyPhone,
  });

  let user;
  try {
    user = await User.create({
      company: company._id,
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      role: UserRole.Owner,
    });
  } catch (err) {
    // Roll back company if user creation fails (e.g. duplicate email)
    await Company.deleteOne({ _id: company._id });
    throw err;
  }

  const { accessToken, refreshRaw, refreshHash } = issueTokens(user);
  await persistRefreshToken(user._id, company._id, refreshHash);
  setRefreshCookie(res, refreshRaw);

  res.status(201).json({
    accessToken,
    user: publicUser(user),
    company: { id: company._id.toString(), name: company.name },
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email.toLowerCase() })
    .select('+password')
    .populate<{ company: { _id: mongoose.Types.ObjectId; name: string; active: boolean } }>(
      'company',
      'name active'
    );

  if (!user || !(await user.comparePassword(data.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.active) throw ApiError.forbidden('Your account has been disabled');

  user.lastLoginAt = new Date();
  await user.save();

  const companyId = (user.company as unknown as { _id: mongoose.Types.ObjectId })._id;
  const { accessToken, refreshRaw, refreshHash } = issueTokens({
    _id: user._id,
    company: companyId,
    role: user.role,
    name: user.name,
  });
  await persistRefreshToken(user._id, companyId, refreshHash);
  setRefreshCookie(res, refreshRaw);

  res.json({
    accessToken,
    user: publicUser(user),
    company: {
      id: companyId.toString(),
      name: (user.company as unknown as { name: string }).name,
    },
  });
}

// POST /api/auth/refresh — rotates the refresh token.
export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!raw) throw ApiError.unauthorized('Missing refresh token');

  const tokenHash = hashToken(raw);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(existing.user);
  if (!user || !user.active) throw ApiError.unauthorized('User no longer active');

  // Rotate: revoke old, issue new
  const { accessToken, refreshRaw, refreshHash } = issueTokens(user);
  existing.revokedAt = new Date();
  existing.replacedBy = refreshHash;
  await existing.save();
  await persistRefreshToken(user._id, user.company, refreshHash);
  setRefreshCookie(res, refreshRaw);

  res.json({ accessToken, user: publicUser(user) });
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.refreshToken || req.body?.refreshToken;
  if (raw) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(raw) },
      { revokedAt: new Date() }
    );
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out' });
}

// POST /api/auth/change-password
export async function changePassword(req: Request, res: Response) {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  });
  const data = schema.parse(req.body);

  const user = await User.findById(req.auth!.userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');
  if (!(await user.comparePassword(data.currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }

  user.password = data.newPassword;
  await user.save();

  // Revoke other sessions for safety; the current access token stays valid
  // until it expires, then refresh will fail and prompt re-login elsewhere.
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );

  res.json({ message: 'Password updated successfully' });
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.auth!.userId).populate('company', 'name email phone address city country logo');
  if (!user) throw ApiError.notFound('User not found');
  res.json({
    user: publicUser(user),
    company: user.company,
  });
}
