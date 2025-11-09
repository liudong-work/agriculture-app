import type { User, FarmerProfile, UserRole } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type { AuthUser } from '../types/auth';

export type StoredUser = AuthUser & {
  passwordHash: string;
  farmerProfileId?: string;
};

export type CreateUserInput = {
  phone: string;
  passwordHash: string;
  name?: string;
  role?: UserRole;
  farmerProfile?: {
    farmName: string;
    description?: string;
    id?: string;
  };
};

function mapUser(record: User & { farmerProfile: FarmerProfile | null }): StoredUser {
  const base: StoredUser = {
    id: record.id,
    phone: record.phone,
    role: record.role,
    passwordHash: record.passwordHash,
  };

  if (record.name) {
    base.name = record.name;
  }

  if (record.farmerProfile) {
    base.farmerProfileId = record.farmerProfile.id;
  }

  return base;
}

export class UserRepository {
  async create(input: CreateUserInput): Promise<StoredUser> {
    const created = await prisma.user.create({
      data: {
        phone: input.phone,
        passwordHash: input.passwordHash,
        ...(input.name ? { name: input.name } : {}),
        role: input.role ?? 'customer',
        ...(input.farmerProfile
          ? {
              farmerProfile: {
                create: {
                  ...(input.farmerProfile.id ? { id: input.farmerProfile.id } : {}),
                  farmName: input.farmerProfile.farmName,
                  ...(input.farmerProfile.description
                    ? { description: input.farmerProfile.description }
                    : {}),
                },
              },
            }
          : {}),
      },
      include: {
        farmerProfile: true,
      },
    });

    return mapUser(created);
  }

  async findByPhone(phone: string): Promise<StoredUser | undefined> {
    const record = await prisma.user.findUnique({
      where: { phone },
      include: { farmerProfile: true },
    });

    if (!record) {
      return undefined;
    }

    return mapUser(record);
  }
}

