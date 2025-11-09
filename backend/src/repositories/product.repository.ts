import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type {
  CreateProductInput,
  Product,
  ProductListItem,
  ProductListParams,
  ProductListResult,
  ProductStatus,
  UpdateProductInput,
} from '../types/product';
import { DEFAULT_FARMER_ID } from '../constants/farmer';

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=60';

type PrismaProduct = Prisma.ProductGetPayload<{ include: { images: { orderBy: { sortOrder: 'asc' } } } }>;

function normalizeProduct(record: PrismaProduct): Product {
  const images = record.images
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.url);

  return {
    id: record.id,
    farmerId: record.farmerId,
    name: record.name,
    description: record.description ?? undefined,
    images,
    price: Number(record.price),
    originalPrice: record.originalPrice ? Number(record.originalPrice) : undefined,
    unit: record.unit,
    origin: record.origin,
    categoryId: record.categoryId,
    seasonalTag: record.seasonalTag ?? undefined,
    isOrganic: record.isOrganic ?? undefined,
    stock: record.stock,
    status: record.status,
  };
}

function toListItem(record: PrismaProduct): ProductListItem {
  const product = normalizeProduct(record);
  return {
    id: product.id,
    farmerId: product.farmerId,
    name: product.name,
    price: product.price,
    unit: product.unit,
    origin: product.origin,
    categoryId: product.categoryId,
    thumbnail: product.images[0] ?? FALLBACK_THUMBNAIL,
    stock: product.stock,
    status: product.status,
    ...(product.seasonalTag ? { seasonalTag: product.seasonalTag } : {}),
    ...(product.isOrganic !== undefined ? { isOrganic: product.isOrganic } : {}),
  };
}

export class ProductRepository {
  async create(farmerId: string | undefined, payload: CreateProductInput): Promise<Product> {
    const images = payload.images.map((url) => url.trim()).filter(Boolean);

    const record = await prisma.product.create({
      data: {
        farmerId: farmerId ?? DEFAULT_FARMER_ID,
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price,
        originalPrice: payload.originalPrice ?? null,
        unit: payload.unit,
        origin: payload.origin,
        categoryId: payload.categoryId,
        seasonalTag: payload.seasonalTag ?? null,
        isOrganic: payload.isOrganic ?? null,
        stock: payload.stock,
        status: payload.status ?? 'active',
        images: {
          create: images.map((url, index) => ({
            url,
            sortOrder: index,
            isCover: index === 0,
          })),
        },
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return normalizeProduct(record);
  }

  async list(params: ProductListParams): Promise<ProductListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.trim();
    const sortBy = params.sortBy;
    const sortOrder = params.sortOrder ?? 'asc';
    const statusFilter = params.status ?? 'active';

    const where: Prisma.ProductWhereInput = {};

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.farmerId) {
      where.farmerId = params.farmerId;
    }

    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];

    if (sortBy) {
      if (sortBy === 'price') {
        orderBy.push({ price: sortOrder });
      } else if (sortBy === 'name') {
        orderBy.push({ name: sortOrder });
      } else if (sortBy === 'stock') {
        orderBy.push({ stock: sortOrder });
      }
    }

    if (orderBy.length === 0) {
      orderBy.push({ createdAt: 'desc' });
    }

    const [records, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    const items = records.map(toListItem);

    return { items, total, page, pageSize };
  }

  async findById(productId: string): Promise<Product | undefined> {
    const record = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!record) {
      return undefined;
    }

    return normalizeProduct(record);
  }

  async adjustStock(productId: string, delta: number): Promise<Product> {
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id: productId },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      });

      if (!existing) {
        const error = new Error('商品不存在');
        (error as any).status = 404;
        throw error;
      }

      const nextStock = existing.stock + delta;
      if (nextStock < 0) {
        const error = new Error('库存不足');
        (error as any).status = 400;
        throw error;
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: nextStock },
      });

      return tx.product.findUnique({
        where: { id: productId },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return normalizeProduct(record!);
  }

  async setStock(productId: string, stock: number): Promise<Product> {
    if (stock < 0) {
      const error = new Error('库存数量不合法');
      (error as any).status = 400;
      throw error;
    }

    const record = await prisma.product.update({
      where: { id: productId },
      data: { stock },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    return normalizeProduct(record);
  }

  async update(productId: string, payload: UpdateProductInput): Promise<Product> {
    const sanitized: Prisma.ProductUpdateInput = {};

    if (payload.name !== undefined) {
      sanitized.name = payload.name;
    }
    if (payload.description !== undefined) {
      sanitized.description = payload.description ?? null;
    }
    if (payload.price !== undefined) {
      sanitized.price = payload.price;
    }
    if (payload.originalPrice !== undefined) {
      sanitized.originalPrice = payload.originalPrice ?? null;
    }
    if (payload.unit !== undefined) {
      sanitized.unit = payload.unit;
    }
    if (payload.origin !== undefined) {
      sanitized.origin = payload.origin;
    }
    if (payload.categoryId !== undefined) {
      sanitized.categoryId = payload.categoryId;
    }
    if (payload.seasonalTag !== undefined) {
      sanitized.seasonalTag = payload.seasonalTag ?? null;
    }
    if (payload.isOrganic !== undefined) {
      sanitized.isOrganic = payload.isOrganic;
    }
    if (payload.stock !== undefined) {
      sanitized.stock = payload.stock;
    }
    if (payload.status !== undefined) {
      sanitized.status = payload.status;
    }

    const record = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data: sanitized });

      if (payload.images !== undefined) {
        const images = payload.images.map((url) => url.trim()).filter(Boolean);
        await tx.productImage.deleteMany({ where: { productId } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((url, index) => ({
              productId,
              url,
              sortOrder: index,
              isCover: index === 0,
            })),
          });
        }
      }

      const refreshed = await tx.product.findUnique({
        where: { id: productId },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      });

      if (!refreshed) {
        const error = new Error('商品不存在');
        (error as any).status = 404;
        throw error;
      }

      return refreshed;
    });

    return normalizeProduct(record);
  }

  async updateStatus(productId: string, status: ProductStatus): Promise<Product> {
    const record = await prisma.product.update({
      where: { id: productId },
      data: { status },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    return normalizeProduct(record);
  }
}

