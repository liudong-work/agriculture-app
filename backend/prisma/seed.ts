import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

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
