import OSS from 'ali-oss';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { env } from '../config/env';

const hasOssConfiguration = Boolean(
  env.OSS_ACCESS_KEY_ID && env.OSS_ACCESS_KEY_SECRET && env.OSS_BUCKET && env.OSS_REGION,
);

let client: OSS | null = null;

if (!hasOssConfiguration) {
  console.warn('[oss] 未检测到完整的 OSS 配置，上传接口将返回 503');
} else {
  console.log('[oss] 检测到 OSS 配置，bucket=%s, region=%s', env.OSS_BUCKET, env.OSS_REGION);
}

function ensureClient(): OSS {
  if (!hasOssConfiguration) {
    const error = new Error('OSS 未配置，请检查环境变量');
    (error as any).status = 500;
    throw error;
  }

  if (!client) {
    client = new OSS({
      accessKeyId: env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET!,
      bucket: env.OSS_BUCKET!,
      region: env.OSS_REGION!,
      endpoint: env.OSS_ENDPOINT,
      secure: true,
    });
    console.log('[oss] 已初始化 OSS 客户端');
  }

  return client;
}

function resolveFileExtension(fileName?: string | null, contentType?: string | null) {
  let extension = fileName ? extname(fileName) : '';
  if (!extension && contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg';
    } else if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('gif')) {
      extension = '.gif';
    } else if (contentType.includes('webp')) {
      extension = '.webp';
    } else if (contentType.includes('mp4')) {
      extension = '.mp4';
    } else if (contentType.includes('mp3')) {
      extension = '.mp3';
    }
  }
  if (!extension) {
    extension = '.jpg';
  }
  if (!extension.startsWith('.')) {
    extension = `.${extension}`;
  }
  return extension;
}

function buildObjectKey(userId: string, extension: string, directory = 'products') {
  const uid = randomUUID().slice(0, 8);
  return `farmer/${userId}/${directory}/${Date.now()}-${uid}${extension}`;
}

export type GenerateUploadCredentialOptions = {
  userId: string;
  fileName?: string | undefined;
  contentType?: string | undefined;
  expiresInSeconds?: number | undefined;
};

export function generateUploadCredential(options: GenerateUploadCredentialOptions) {
  const { userId, fileName, contentType, expiresInSeconds = 300 } = options;
  const ossClient = ensureClient();

  const extension = resolveFileExtension(fileName, contentType);
  const objectKey = buildObjectKey(userId, extension);
  const signatureOptions: OSS.SignatureUrlOptions & Record<string, string | number> = {
    method: 'PUT',
    expires: expiresInSeconds,
  };
  if (contentType) {
    signatureOptions['Content-Type'] = contentType;
  }

  const uploadUrl = ossClient.signatureUrl(objectKey, signatureOptions);

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const publicUrl = env.OSS_ENDPOINT
    ? `${env.OSS_ENDPOINT.replace(/\/$/, '')}/${objectKey}`
    : `https://${env.OSS_BUCKET}.oss-${env.OSS_REGION}.aliyuncs.com/${objectKey}`;

  const uploadHeaders: Record<string, string> = {};
  if (contentType) {
    uploadHeaders['Content-Type'] = contentType;
  }

  console.log('[oss] 生成上传签名 -> objectKey=%s, expires=%s', objectKey, expiresAt);

  return {
    uploadUrl,
    objectKey,
    expiresAt,
    headers: uploadHeaders,
    publicUrl,
  };
}

export async function uploadBuffer(params: {
  userId: string;
  buffer: Buffer;
  fileName?: string | undefined;
  contentType?: string | undefined;
  directory?: string | undefined;
}) {
  const { userId, buffer, fileName, contentType, directory } = params;
  const ossClient = ensureClient();
  const extension = resolveFileExtension(fileName, contentType);
  const objectKey = buildObjectKey(userId, extension, directory);

  try {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    console.log('[oss] 开始上传 Buffer -> %s (%s bytes)', objectKey, buffer.length);
    const result = await ossClient.put(objectKey, buffer, { headers });
    console.log('[oss] Buffer 上传成功 -> %s', result.url);

    return {
      success: true as const,
      url: result.url,
      objectKey,
      size: buffer.length,
    };
  } catch (error: any) {
    console.error('[oss] Buffer 上传失败:', error);
    return {
      success: false as const,
      error: error?.message ?? '上传失败',
      code: error?.code,
    };
  }
}

export const ossService = {
  isEnabled: hasOssConfiguration,
  generateUploadCredential,
  uploadBuffer,
};
