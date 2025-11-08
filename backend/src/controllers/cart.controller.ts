import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { CartService } from '../services/cart.service';

const cartService = new CartService();

const addSchema = z.object({
  body: z.object({
    productId: z.string(),
    quantity: z.coerce.number().optional(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    quantity: z.coerce.number().optional(),
    selected: z.boolean().optional(),
  }),
});

const selectAllSchema = z.object({
  body: z.object({
    selected: z.boolean(),
  }),
});

export const addValidators = validateRequest(addSchema);
export const updateValidators = validateRequest(updateSchema);
export const selectAllValidators = validateRequest(selectAllSchema);

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  const result = await cartService.getCart(userId);
  res.json({ success: true, data: result });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  const { productId, quantity = 1 } = req.body;
  await cartService.addItem(userId, productId, quantity);
  res.status(201).json({ success: true });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  const itemId = req.params.id as string;
  await cartService.updateItem(userId, itemId, req.body);
  res.json({ success: true });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  const itemId = req.params.id as string;
  await cartService.removeItem(userId, itemId);
  res.status(204).send();
});

export const setSelectAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  await cartService.selectAll(userId, req.body.selected);
  res.json({ success: true });
});

