import type { Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler';
import { validateRequest } from '../middleware/validate-request';
import { ProductService } from '../services/product.service';
import type { ProductListParams, ProductStatus } from '../types/product';

const productService = new ProductService();

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    categoryId: z.string().optional(),
    keyword: z.string().trim().optional(),
    sortBy: z.enum(['price', 'name', 'stock']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z.enum(['draft', 'active', 'inactive', 'all']).optional(),
  }),
});

export const listValidators = validateRequest(listSchema);
export const detailValidators = validateRequest(
  z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
);

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1, '请输入商品名称'),
    description: z.string().trim().optional(),
    images: z.array(z.string().url('请提供合法的图片地址')).min(1, '至少上传一张商品图片'),
    price: z.coerce.number().positive('售价必须大于 0'),
    originalPrice: z.coerce.number().positive('划线价必须大于 0').optional(),
    unit: z.string().min(1, '请输入计量单位'),
    origin: z.string().min(1, '请输入产地信息'),
    categoryId: z.string().min(1, '请选择商品类目'),
    seasonalTag: z.string().optional(),
    isOrganic: z.boolean().optional(),
    stock: z.coerce.number().int().min(0, '库存不能为负数'),
    status: z.enum(['draft', 'active', 'inactive']).optional(),
  }),
});

export const createProductValidators = validateRequest(createSchema);

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      images: z.array(z.string().url('请提供合法的图片地址')).min(1, '至少上传一张商品图片').optional(),
      price: z.coerce.number().positive('售价必须大于 0').optional(),
      originalPrice: z.coerce.number().positive('划线价必须大于 0').optional(),
      unit: z.string().min(1).optional(),
      origin: z.string().min(1).optional(),
      categoryId: z.string().optional(),
      seasonalTag: z.string().optional(),
      isOrganic: z.boolean().optional(),
      stock: z.coerce.number().int().min(0, '库存不能为负数').optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: '请输入需要更新的字段',
    }),
});

export const updateProductValidators = validateRequest(updateSchema);

const updateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['draft', 'active', 'inactive']),
  }),
});

export const updateProductStatusValidators = validateRequest(updateStatusSchema);

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listSchema.parse({ query: req.query });
  const sanitizedParams = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as ProductListParams;
  const result = await productService.listProducts(sanitizedParams);
  res.json({ success: true, data: result });
});

export const getProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id as string | undefined;
  if (!productId) {
    return res.status(400).json({ success: false, message: '商品编号缺失' });
  }
  const product = await productService.getProductDetail(productId);
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string; farmerProfileId?: string } | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (!['farmer', 'admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: '当前账号无权限上架商品' });
  }

  const { body } = createSchema.parse({ body: req.body });
  const farmerId = user.role === 'admin' ? user.id : user.farmerProfileId;
  const product = await productService.createProduct(body, farmerId);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string } | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (!['farmer', 'admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: '当前账号无权限编辑商品' });
  }

  const { params, body } = updateSchema.parse({ params: req.params, body: req.body });
  const product = await productService.updateProduct(params.id, body);
  res.json({ success: true, data: product });
});

export const updateProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string } | undefined;
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (!['farmer', 'admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: '当前账号无权限更新商品状态' });
  }

  const { params, body } = updateStatusSchema.parse({ params: req.params, body: req.body });
  const product = await productService.updateProductStatus(params.id, body.status as ProductStatus);
  res.json({ success: true, data: product });
});

