import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const user = authService.verifyAccessToken(token);
    (req as any).user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录状态已过期，请重新登录' });
  }
}

