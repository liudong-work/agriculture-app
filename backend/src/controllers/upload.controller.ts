import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { ossService } from '../services/oss.service';
import { Buffer } from 'buffer';

const presignSchema = z.object({
  body: z.object({
    fileName: z.string().optional(),
    contentType: z.string().optional(),
  }),
});

export const presignUploadValidators = validateRequest(presignSchema);

export const createUploadCredential = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string } | undefined;

  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (!['farmer', 'admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: '当前账号无上传权限' });
  }

  if (!ossService.isEnabled) {
    return res.status(503).json({ success: false, message: 'OSS 未配置，暂不支持文件上传' });
  }

  const { body } = presignSchema.parse({ body: req.body });
  const credential = ossService.generateUploadCredential({
    userId: user.id,
    fileName: body.fileName,
    contentType: body.contentType,
  });

  res.status(201).json({ success: true, data: credential });
});

const base64UploadSchema = z.object({
  body: z.object({
    fileData: z.string().min(1, '缺少文件内容'),
    fileName: z.string().optional(),
    fileType: z.string().optional(),
    directory: z.string().optional(),
  }),
});

export const uploadBase64Validators = validateRequest(base64UploadSchema);

export const uploadBase64ToOss = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string } | undefined;

  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (!['farmer', 'admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: '当前账号无上传权限' });
  }

  if (!ossService.isEnabled) {
    return res.status(503).json({ success: false, message: 'OSS 未配置，暂不支持文件上传' });
  }

  const { body } = base64UploadSchema.parse({ body: req.body });

  let base64Data = body.fileData;
  let contentType = body.fileType;

  const dataUriMatch = base64Data.match(/^data:(.*?);base64,(.*)$/);
  if (dataUriMatch) {
    const [, matchedType, matchedData] = dataUriMatch;
    if (matchedType) {
      contentType = contentType ?? matchedType;
    }
    if (matchedData) {
      base64Data = matchedData;
    }
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await ossService.uploadBuffer({
      userId: user.id,
      buffer,
      fileName: body.fileName,
      contentType,
      directory: body.directory,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error ?? 'OSS 上传失败', code: result.code });
    }

    res.status(201).json({
      success: true,
      data: {
        url: result.url,
        objectKey: result.objectKey,
        size: result.size,
        type: 'oss',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: '文件解析失败' });
  }
});
