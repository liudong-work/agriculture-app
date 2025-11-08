import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductInput,
  ProductListParams,
  ProductListResult,
  Product,
  ProductStatus,
  UpdateProductInput,
} from '../types/product';

const productRepository = new ProductRepository();

export class ProductService {
  async listProducts(params: ProductListParams): Promise<ProductListResult> {
    return productRepository.list(params);
  }

  async getProductDetail(productId: string): Promise<Product> {
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }
    return product;
  }

  async createProduct(payload: CreateProductInput): Promise<Product> {
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      const error = new Error('商品名称不能为空');
      (error as any).status = 400;
      throw error;
    }

    if (!payload.images || payload.images.length === 0) {
      const error = new Error('请至少上传一张商品图片');
      (error as any).status = 400;
      throw error;
    }

    return productRepository.create({
      ...payload,
      name: trimmedName,
      images: payload.images.map((url) => url.trim()).filter(Boolean),
      status: payload.status ?? 'active',
    });
  }

  async updateProduct(productId: string, payload: UpdateProductInput): Promise<Product> {
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      const error = new Error('商品名称不能为空');
      (error as any).status = 400;
      throw error;
    }

    if (payload.images && payload.images.length === 0) {
      const error = new Error('请至少保留一张商品图片');
      (error as any).status = 400;
      throw error;
    }

    const sanitized: UpdateProductInput = { ...payload };
    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }
    if (sanitized.images) {
      sanitized.images = sanitized.images.map((url) => url.trim()).filter(Boolean);
    }

    return productRepository.update(productId, sanitized);
  }

  async updateProductStatus(productId: string, status: ProductStatus): Promise<Product> {
    return productRepository.updateStatus(productId, status);
  }
}

