import { apiClient } from './apiClient';

export type UploadOssResponse = {
  url: string;
  objectKey: string;
  size: number;
  type: 'oss';
};

export async function uploadImageBase64(params: {
  fileData: string;
  fileName?: string;
  fileType?: string;
  directory?: string;
}) {
  console.log('[upload] 准备上传到后端 OSS', {
    fileName: params.fileName,
    fileType: params.fileType,
    directory: params.directory,
    dataLength: params.fileData.length,
  });
  const response = await apiClient.post<{ success: boolean; data: UploadOssResponse }>(
    '/uploads/oss',
    params,
  );
  console.log('[upload] 后端响应', response.status);
  return response.data.data;
}

async function convertImageToBase64(uri: string) {
  try {
    console.log('[upload] fetch 文件', uri);
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('[upload] 文件 blob 大小', blob.size);

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        console.log('[upload] Base64 长度', base64.length);
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('[upload] FileReader 失败', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[upload] 转换 Base64 失败', error);
    throw error;
  }
}

export async function uploadImageFromUri(
  uri: string,
  options: { fileName?: string; fileType?: string; directory?: string } = {},
) {
  const base64 = await convertImageToBase64(uri);
  return uploadImageBase64({
    fileData: base64,
    fileName: options.fileName,
    fileType: options.fileType,
    directory: options.directory,
  });
}
