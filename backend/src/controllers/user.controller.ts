import type { Request, Response } from 'express';

import { asyncHandler } from '../middleware/async-handler';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id ?? 'mock-user-id';
  const profile = await userService.getProfile(userId);
  res.json({ success: true, data: profile });
});

