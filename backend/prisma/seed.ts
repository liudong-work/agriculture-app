import { PrismaClient, SubscriptionCycle, SubscriptionStatus, UserRole } from '@prisma/client';
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

  let primaryFarmerProfileId = DEFAULT_FARMER_ID;

  for (const farmer of farmers) {
    const passwordHash = await bcrypt.hash(farmer.password, 10);

    const created = await prisma.user.upsert({
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

    if (created.farmerProfile && farmer.farmerProfileId === DEFAULT_FARMER_ID) {
      primaryFarmerProfileId = created.farmerProfile.id;
    }
  }

  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
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
    include: {
      addresses: true,
    },
  });

  const farmerProfile = await prisma.farmerProfile.findUnique({ where: { id: primaryFarmerProfileId } });

  if (farmerProfile) {
    await prisma.farmerProfile.update({
      where: { id: farmerProfile.id },
      data: {
        heroImage: 'https://images.unsplash.com/photo-1604335399105-a0c6f3dd9915?auto=format&fit=crop&w=1400&q=80',
        region: '江西赣州·信丰县',
        storyHeadline: '三代果农坚守，溯源到每一颗果子',
        storyContent:
          '我们坚持“日采日发”，通过田间地头的物联网采集与冷链出仓，让订单可以溯源到采摘时间与责任农户。合作社采用统一的绿色防控标准，确保土壤与水源安全。',
        storyHighlights: ['下单后 12 小时内采摘', '全程冷链控温 5℃', '产地拥有绿色食品认证'],
        storyGallery: [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1506808547685-e2ba962dedf1?auto=format&fit=crop&w=1400&q=80',
            caption: '合作社早晨采摘的脐橙装车现场',
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80',
            caption: '品质检测中心抽检糖酸比',
          },
        ],
        certifications: [
          {
            title: '绿色食品（A级）认证',
            issuer: '中国绿色食品发展中心',
            issuedAt: '2024-03-20',
          },
          {
            title: '产地准出证明',
            issuer: '信丰县农业农村局',
            issuedAt: '2024-09-01',
          },
        ],
      },
    });

    const storyEntries = [
      {
        id: 'seed-story-1',
        title: '溯源第一站：凌晨 4 点的采摘记录',
        content:
          '凌晨 4 点，采摘队集合，按照订单明细分区采摘。每筐果子都会贴上溯源码，记录采摘人、果园地块和采摘时间。',
        labels: ['溯源', '采摘'],
        media: [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80',
            description: '凌晨采摘后的装筐',
          },
        ],
      },
      {
        id: 'seed-story-2',
        title: '冷链出库：从合作社到城市前置仓',
        content:
          '上午 9 点，经过初级分级与预冷处理后，统一装入 5℃ 控温冷链车，发往杭州前置仓，中午 12 点完成入仓。系统会自动通知订阅用户预计送达时间。',
        labels: ['冷链', '配送'],
        media: [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80',
            description: '冷链车辆装载现场',
          },
        ],
      },
    ];

    for (const entry of storyEntries) {
      await prisma.farmerStory.upsert({
        where: { id: entry.id },
        update: {
          title: entry.title,
          content: entry.content,
          labels: entry.labels,
          media: entry.media,
        },
        create: {
          id: entry.id,
          farmerId: farmerProfile.id,
          title: entry.title,
          content: entry.content,
          labels: entry.labels,
          media: entry.media,
        },
      });
    }

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

  const seasonalBoxPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'seed-plan-harvest-box' },
    update: {
      title: '丰收订阅箱（赣南产区）',
      subtitle: '每周一次，脐橙 + 有机叶菜 + 当季伴手礼',
      description:
        '适合 2-3 人家庭，包含当周现摘脐橙 3kg、有机绿叶菜 2 份、以及合作社精选伴手礼 1 份。下单即绑定农户，产地直送。',
      coverImage: 'https://images.unsplash.com/photo-1601000938259-9aa182b95b07?auto=format&fit=crop&w=1400&q=80',
      price: 109.0,
      originalPrice: 128.0,
      cycle: SubscriptionCycle.weekly,
      deliverWeekday: 5,
      items: [
        { name: '赣南脐橙', quantity: '3kg' },
        { name: '有机绿叶菜', quantity: '2 份', description: '萝卜缨/上海青等随机搭配' },
        { name: '伴手礼', quantity: '1 份', description: '农户自制果脯或蜂蜜' },
      ],
      benefits: ['下单即锁定产区配额', '可在前置仓自提或配送', '附带溯源故事更新'],
      farmerId: farmerProfile?.id ?? null,
      isActive: true,
    },
    create: {
      id: 'seed-plan-harvest-box',
      title: '丰收订阅箱（赣南产区）',
      subtitle: '每周一次，脐橙 + 有机叶菜 + 当季伴手礼',
      description:
        '适合 2-3 人家庭，包含当周现摘脐橙 3kg、有机绿叶菜 2 份、以及合作社精选伴手礼 1 份。下单即绑定农户，产地直送。',
      coverImage: 'https://images.unsplash.com/photo-1601000938259-9aa182b95b07?auto=format&fit=crop&w=1400&q=80',
      price: 109.0,
      originalPrice: 128.0,
      cycle: SubscriptionCycle.weekly,
      deliverWeekday: 5,
      items: [
        { name: '赣南脐橙', quantity: '3kg' },
        { name: '有机绿叶菜', quantity: '2 份', description: '萝卜缨/上海青等随机搭配' },
        { name: '伴手礼', quantity: '1 份', description: '农户自制果脯或蜂蜜' },
      ],
      benefits: ['下单即锁定产区配额', '可在前置仓自提或配送', '附带溯源故事更新'],
      farmerId: farmerProfile?.id ?? null,
    },
  });

  if (customer) {
    await prisma.userSubscription.upsert({
      where: { id: 'seed-user-subscription' },
      update: {
        planId: seasonalBoxPlan.id,
        quantity: 1,
        status: SubscriptionStatus.active,
      },
      create: {
        id: 'seed-user-subscription',
        userId: customer.id,
        planId: seasonalBoxPlan.id,
        quantity: 1,
        status: SubscriptionStatus.active,
      },
    });
  }

  console.log('✅ Seeded demo customer with addresses');
  console.log('✅ Seeded default farmer accounts');
  console.log('✅ Seeded farmer story + subscription plans');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
