import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

const registerSchema = z.object({
  body: z.object({
    phone: z.string().min(8),
    password: z.string().min(6),
    name: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(8),
    password: z.string().min(6),
  }),
});

export const registerValidators = validateRequest(registerSchema);
export const loginValidators = validateRequest(loginSchema);

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('[auth] login attempt', req.body?.phone);
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

