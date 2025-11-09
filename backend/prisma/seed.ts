import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

import { DEFAULT_FARMER_ID } from '../src/constants/farmer';

const prisma = new PrismaClient();

async function main() {
  const farmers = [
    {
      phone: '18800000001',
      password: 'farmer123',
      name: '示例农户一号',
      farmerProfileId: 'farmer-self-operated',
      farmName: '绿野鲜果合作社',
      description: '自营示例账号，用于演示商品与订单流程。',
    },
    {
      phone: '18800000002',
      password: 'farmer123',
      name: '示例农户二号',
      farmName: '田园果蔬基地',
      description: '供测试上下架与库存逻辑使用。',
    },
    {
      phone: '18800000003',
      password: 'farmer123',
      name: '农技支持',
      farmName: '农技服务中心',
      description: '售后与物流体验账号。',
    },
  ] as const;

  for (const farmer of farmers) {
    const passwordHash = await bcrypt.hash(farmer.password, 10);

    await prisma.user.upsert({
      where: { phone: farmer.phone },
      update: {
        passwordHash,
        name: farmer.name,
      },
      create: {
        phone: farmer.phone,
        passwordHash,
        name: farmer.name,
        role: UserRole.farmer,
        farmerProfile: {
          create: {
            ...(farmer.farmerProfileId ? { id: farmer.farmerProfileId } : {}),
            farmName: farmer.farmName,
            description: farmer.description,
          },
        },
      },
      include: { farmerProfile: true },
    });
  }

  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  await prisma.user.upsert({
    where: { phone: '18900000001' },
    update: {
      passwordHash: customerPasswordHash,
      name: '示例用户',
      addresses: {
        deleteMany: {},
        create: [
          {
            contactName: '张三',
            contactPhone: '18900000001',
            province: '浙江省',
            city: '杭州市',
            district: '西湖区',
            street: '欧美中心',
            detail: '3号楼 1608 室',
            postalCode: '310000',
            tag: '公司',
            isDefault: true,
          },
          {
            contactName: '张三',
            contactPhone: '18900000001',
            province: '浙江省',
            city: '杭州市',
            district: '滨江区',
            street: '江南大道 123 号',
            detail: '江南星座 1-2-502',
            tag: '家',
            isDefault: false,
          },
        ],
      },
    },
    create: {
      phone: '18900000001',
      passwordHash: customerPasswordHash,
      name: '示例用户',
      role: UserRole.customer,
      addresses: {
        create: [
          {
            contactName: '张三',
            contactPhone: '18900000001',
            province: '浙江省',
            city: '杭州市',
            district: '西湖区',
            street: '欧美中心',
            detail: '3号楼 1608 室',
            postalCode: '310000',
            tag: '公司',
            isDefault: true,
          },
          {
            contactName: '张三',
            contactPhone: '18900000001',
            province: '浙江省',
            city: '杭州市',
            district: '滨江区',
            street: '江南大道 123 号',
            detail: '江南星座 1-2-502',
            tag: '家',
            isDefault: false,
          },
        ],
      },
    },
  });

  const farmerProfile = await prisma.farmerProfile.findUnique({ where: { id: DEFAULT_FARMER_ID } });

  if (farmerProfile) {
    const products = [
      {
        id: 'seed-prod-1',
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
        status: 'active' as const,
      },
      {
        id: 'seed-prod-2',
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
        status: 'active' as const,
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description ?? null,
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          unit: product.unit,
          origin: product.origin,
          categoryId: product.categoryId,
          seasonalTag: product.seasonalTag ?? null,
          isOrganic: product.isOrganic ?? null,
          stock: product.stock,
          status: product.status,
          images: {
            deleteMany: {},
            create: product.images.map((url, index) => ({
              url,
              sortOrder: index,
              isCover: index === 0,
            })),
          },
        },
        create: {
          id: product.id,
          farmerId: farmerProfile.id,
          name: product.name,
          description: product.description ?? null,
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          unit: product.unit,
          origin: product.origin,
          categoryId: product.categoryId,
          seasonalTag: product.seasonalTag ?? null,
          isOrganic: product.isOrganic ?? null,
          stock: product.stock,
          status: product.status,
          images: {
            create: product.images.map((url, index) => ({
              url,
              sortOrder: index,
              isCover: index === 0,
            })),
          },
        },
      });
    }

    console.log('✅ Seeded demo products');
  }

  console.log('✅ Seeded demo customer with addresses');
  console.log('✅ Seeded default farmer accounts');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
