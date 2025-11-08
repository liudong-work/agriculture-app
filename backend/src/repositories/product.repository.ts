import { Product, ProductListParams, ProductListResult, ProductStatus, UpdateProductInput } from '../types/product';
import { randomUUID } from 'crypto';

const products: Product[] = [
  {
    id: 'prod-1',
    name: '赣南脐橙 5kg 装',
    description: '从赣南果园直采，汁多味甜，富含维 C。',
    images: [
      'https://images.unsplash.com/photo-1615485290382-aca3bd1ccae1?auto=format&fit=crop&w=1200&q=60',
      'https://images.unsplash.com/photo-1601000938259-9aa182b95b07?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 69.9,
    originalPrice: 89.9,
    unit: '箱',
    origin: '江西赣州',
    categoryId: 'cat-1',
    seasonalTag: '当季热卖',
    isOrganic: false,
    stock: 128,
    status: 'active',
  },
  {
    id: 'prod-2',
    name: '崂山有机芹菜 1.5kg',
    description: '通过有机认证，全程冷链配送。',
    images: [
      'https://images.unsplash.com/photo-1543248939-d74ff3d9d1b6?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 32.5,
    unit: '份',
    origin: '山东青岛',
    categoryId: 'cat-2',
    seasonalTag: '绿色有机',
    isOrganic: true,
    stock: 75,
    status: 'active',
  },
  {
    id: 'prod-3',
    name: '五常稻花香大米 5kg',
    description: '冷水浸种，稻花香 2 号，米香软糯。',
    images: [
      'https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 109.0,
    unit: '袋',
    origin: '黑龙江五常',
    categoryId: 'cat-3',
    stock: 54,
    status: 'active',
  },
  {
    id: 'prod-4',
    name: '散养土鸡蛋 30 枚',
    description: '农户散养，蛋香浓郁，营养丰富。',
    images: [
      'https://images.unsplash.com/photo-1517959105821-eaf2591984d5?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 52.9,
    unit: '盒',
    origin: '安徽黄山',
    categoryId: 'cat-4',
    stock: 210,
    status: 'active',
  },
  {
    id: 'prod-5',
    name: '阳澄湖大闸蟹 礼盒装',
    description: '鲜活直送，公蟹 3.0 两、母蟹 2.5 两，配姜茶。',
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 298.0,
    unit: '盒',
    origin: '江苏苏州',
    categoryId: 'cat-5',
    stock: 32,
    status: 'active',
  },
  {
    id: 'prod-6',
    name: '云南鲜花饼礼盒',
    description: '玫瑰花瓣内馅，香甜软糯，伴手礼首选。',
    images: [
      'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=1200&q=60',
    ],
    price: 58.0,
    unit: '盒',
    origin: '云南昆明',
    categoryId: 'cat-6',
    stock: 142,
    status: 'inactive',
  },
];

export class ProductRepository {
  async create(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const newProduct: Product = {
      id: product.id ?? randomUUID(),
      ...product,
      status: product.status ?? 'active',
    } as Product;
    products.unshift(newProduct);
    return newProduct;
  }

  async list(params: ProductListParams): Promise<ProductListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.toLowerCase();
    const categoryId = params.categoryId;
    const sortBy = params.sortBy;
    const sortOrder = params.sortOrder ?? 'asc';
    const statusFilter = params.status ?? 'active';

    let filtered = [...products];

    if (keyword) {
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(keyword));
    }

    if (categoryId) {
      filtered = filtered.filter((product) => product.categoryId === categoryId);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    if (sortBy) {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return (a.price - b.price) * multiplier;
          case 'name':
            return a.name.localeCompare(b.name, 'zh-CN') * multiplier;
          case 'stock':
            return (a.stock - b.stock) * multiplier;
          default:
            return 0;
        }
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map((product) => {
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        origin: product.origin,
        categoryId: product.categoryId,
        thumbnail:
          product.images[0] ??
          'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=60',
        stock: product.stock,
        status: product.status,
      } as ProductListResult['items'][number];

      if (product.seasonalTag) {
        item.seasonalTag = product.seasonalTag;
      }
      if (product.isOrganic !== undefined) {
        item.isOrganic = product.isOrganic;
      }

      return item;
    });

    return { items, total, page, pageSize };
  }

  async findById(productId: string): Promise<Product | undefined> {
    return products.find((product) => product.id === productId);
  }

  async adjustStock(productId: string, delta: number): Promise<Product> {
    const product = await this.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }

    const nextStock = product.stock + delta;
    if (nextStock < 0) {
      const error = new Error('库存不足');
      (error as any).status = 400;
      throw error;
    }

    product.stock = nextStock;
    return product;
  }

  async setStock(productId: string, stock: number): Promise<Product> {
    const product = await this.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }

    if (stock < 0) {
      const error = new Error('库存数量不合法');
      (error as any).status = 400;
      throw error;
    }

    product.stock = stock;
    return product;
  }

  async update(productId: string, payload: UpdateProductInput): Promise<Product> {
    const product = await this.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }

    Object.assign(product, Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)));
    return product;
  }

  async updateStatus(productId: string, status: ProductStatus): Promise<Product> {
    const product = await this.findById(productId);
    if (!product) {
      const error = new Error('商品不存在');
      (error as any).status = 404;
      throw error;
    }

    product.status = status;
    return product;
  }
}

