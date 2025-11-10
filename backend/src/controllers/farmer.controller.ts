import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { FarmerService } from '../services/farmer.service';
import type { AuthUser } from '../types/auth';
import type { CreateFarmerStoryEntryPayload, UpdateFarmerStoryPayload } from '../types/farmer';

const farmerService = new FarmerService();

const storyUpdateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    heroImage: z.string().url().optional(),
    region: z.string().trim().optional(),
    storyHeadline: z.string().trim().optional(),
    storyContent: z.string().optional(),
    storyHighlights: z.array(z.string()).optional(),
    storyGallery: z
      .array(
        z.object({
          type: z.enum(['image', 'video']).default('image'),
          url: z.string().url(),
          caption: z.string().optional(),
        }),
      )
      .optional(),
    certifications: z
      .array(
        z.object({
          title: z.string(),
          issuer: z.string().optional(),
          issuedAt: z.string().optional(),
          credentialUrl: z.string().url().optional(),
        }),
      )
      .optional(),
  }),
});

const storyCreateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().min(1, '请输入标题'),
    content: z.string().min(1, '请输入内容'),
    labels: z.array(z.string()).optional(),
    media: z
      .array(
        z.object({
          type: z.enum(['image', 'video', 'audio', 'link', 'text']).default('image'),
          url: z.string().optional(),
          cover: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
    publishedAt: z.string().datetime().optional(),
  }),
});

const farmerIdSchema = z.object({
  params: z.object({ id: z.string() }),
});

function removeUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export const updateFarmerStoryValidators = validateRequest(storyUpdateSchema);
export const createFarmerStoryValidators = validateRequest(storyCreateSchema);
export const getFarmerStoryValidators = validateRequest(farmerIdSchema);

function ensureFarmerOwnership(user: AuthUser | undefined, farmerId: string) {
  if (!user) {
    const error = new Error('未授权');
    (error as any).status = 401;
    throw error;
  }

  if (user.role === 'admin') {
    return;
  }

  if (user.role !== 'farmer' || !user.farmerProfileId || user.farmerProfileId !== farmerId) {
    const error = new Error('当前账号无权限操作该农户信息');
    (error as any).status = 403;
    throw error;
  }
}

export const getFarmerStory = asyncHandler(async (req: Request, res: Response) => {
  const { params } = farmerIdSchema.parse({ params: req.params });
  const overview = await farmerService.getStoryOverview(params.id);
  const stories = await farmerService.listStories(params.id, 50);

  res.json({ success: true, data: { overview, stories } });
});

export const updateFarmerStory = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  const { params, body } = storyUpdateSchema.parse({ params: req.params, body: req.body });

  ensureFarmerOwnership(user, params.id);

  const sanitizedBody = removeUndefined(body) as UpdateFarmerStoryPayload;
  const updated = await farmerService.updateStoryOverview(params.id, sanitizedBody);
  res.json({ success: true, data: updated });
});

export const createFarmerStoryEntry = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser | undefined;
  const { params, body } = storyCreateSchema.parse({ params: req.params, body: req.body });

  ensureFarmerOwnership(user, params.id);

  const payload = removeUndefined(body) as CreateFarmerStoryEntryPayload;
  const created = await farmerService.createStoryEntry(params.id, payload);
  res.status(201).json({ success: true, data: created });
});

export const listFarmerStoryEntries = asyncHandler(async (req: Request, res: Response) => {
  const { params } = farmerIdSchema.parse({ params: req.params });
  const entries = await farmerService.listStories(params.id, 100);
  res.json({ success: true, data: entries });
});
