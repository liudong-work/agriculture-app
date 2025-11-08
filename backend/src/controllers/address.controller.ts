import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { AddressService } from '../services/address.service';
import type { AddressPayload } from '../types/address';

const addressService = new AddressService();

const baseSchema = z.object({
  contactName: z.string().trim().min(1, '请填写收货人姓名'),
  contactPhone: z
    .string()
    .trim()
    .regex(/^1\d{10}$/, '请输入正确的手机号'),
  province: z.string().trim().min(1, '请选择省份'),
  city: z.string().trim().min(1, '请选择城市'),
  district: z.string().trim().min(1, '请选择区县'),
  street: z.string().trim().min(1, '请填写街道地址'),
  detail: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
  tag: z.string().trim().optional(),
});

const createSchema = z.object({
  body: baseSchema,
});

const updateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: baseSchema,
});

const deleteSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const createAddressValidators = validateRequest(createSchema);
export const updateAddressValidators = validateRequest(updateSchema);
export const deleteAddressValidators = validateRequest(deleteSchema);

function sanitizePayload(payload: Record<string, unknown>): AddressPayload {
  const sanitized = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<AddressPayload>;

  const result: AddressPayload = {
    contactName: sanitized.contactName ?? '',
    contactPhone: sanitized.contactPhone ?? '',
    province: sanitized.province ?? '',
    city: sanitized.city ?? '',
    district: sanitized.district ?? '',
    street: sanitized.street ?? '',
    isDefault: sanitized.isDefault ?? false,
  };

  if (sanitized.detail !== undefined) {
    result.detail = sanitized.detail;
  }
  if (sanitized.postalCode !== undefined) {
    result.postalCode = sanitized.postalCode;
  }
  if (sanitized.tag !== undefined) {
    result.tag = sanitized.tag;
  }

  return result;
}

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const addresses = await addressService.listAddresses(userId);
  res.json({ success: true, data: addresses });
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { body } = createSchema.parse({ body: req.body });
  const payload = sanitizePayload(body);
  const created = await addressService.createAddress(userId, payload);
  res.status(201).json({ success: true, data: created });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params, body } = updateSchema.parse({ params: req.params, body: req.body });
  const payload = sanitizePayload(body);
  const updated = await addressService.updateAddress(userId, params.id, payload);
  res.json({ success: true, data: updated });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { params } = deleteSchema.parse({ params: req.params });
  await addressService.deleteAddress(userId, params.id);
  res.status(204).send();
});


