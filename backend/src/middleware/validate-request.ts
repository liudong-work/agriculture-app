import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: '请求参数不合法',
        details: result.error.flatten(),
      });
    }

    next();
  };
}

